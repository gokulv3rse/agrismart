"""
Plant Disease Classification — Training Pipeline
=================================================
Transfer learning with MobileNetV2 / ResNet50 on PlantVillage dataset.

Features:
    - Weighted random sampling to handle severe class imbalance
    - Class-weighted CrossEntropyLoss
    - 2-phase training: frozen backbone → unfrozen fine-tuning
    - Early stopping with patience
    - Proper train/val transform separation

Usage:
    python train.py --data_dir data/plantvillage --epochs 30 --batch_size 32

Outputs (saved to --output_dir):
    - best_model.pth           — Best model weights
    - training_curves.png      — Loss/accuracy training curves
    - confusion_matrix.png     — Test set confusion matrix
    - classification_report.txt — Per-class P/R/F1
    - training_log.csv         — Epoch-by-epoch log
    - class_mapping.json       — Index-to-class-name mapping
"""

import argparse
import os
import csv
import json
import copy
from pathlib import Path
from collections import Counter

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler, Subset
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from tqdm import tqdm


def get_transforms(img_size: int):
    """Data augmentation designed for real-world generalization.

    Strategy: force the model to learn disease texture, NOT background.
      1. Aggressive crop scale (0.4-1.0): partial leaves, locality learning
      2. RandomPerspective: different camera angles
      3. Heavy ColorJitter (hue=0.2): breaks background colour cues
      4. RandomGrayscale: removes colour, forces texture learning
      5. GaussianBlur: robustness to camera phone shake/blur
      6. RandomErasing: occludes background patches after ToTensor
    """
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(img_size, scale=(0.4, 1.0), ratio=(0.75, 1.33)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(30),
        transforms.RandomPerspective(distortion_scale=0.3, p=0.4),
        transforms.ColorJitter(
            brightness=0.4, contrast=0.4, saturation=0.4, hue=0.2,
        ),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.3, scale=(0.02, 0.15), ratio=(0.3, 3.3), value='random'),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(int(img_size * 1.14)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform



def build_model(arch: str, num_classes: int):
    """Build a model with pretrained backbone + custom classifier head.
    Backbone is always initially frozen — unfreezing happens during Phase 2."""
    if arch == 'mobilenetv2':
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        # Freeze backbone
        for param in model.features.parameters():
            param.requires_grad = False
        # Replace classifier
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
    elif arch == 'resnet50':
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        # Freeze all except fc
        for name, param in model.named_parameters():
            if 'fc' not in name:
                param.requires_grad = False
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
    else:
        raise ValueError(f'Unknown architecture: {arch}')

    return model


def unfreeze_backbone(model, arch: str):
    """Unfreeze the backbone for fine-tuning (Phase 2).
    For MobileNetV2, unfreeze last 4 feature blocks.
    For ResNet50, unfreeze layer3 and layer4."""
    if arch == 'mobilenetv2':
        # features has 19 blocks (0-18). Unfreeze blocks 14-18.
        for i, block in enumerate(model.features):
            if i >= 14:
                for param in block.parameters():
                    param.requires_grad = True
    elif arch == 'resnet50':
        for name, param in model.named_parameters():
            if 'layer3' in name or 'layer4' in name or 'fc' in name:
                param.requires_grad = True
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f'  Unfroze backbone — trainable params now: {trainable:,}')
    return model


def train_one_epoch(model, loader, criterion, optimizer, device):
    """Train for one epoch, return average loss and accuracy."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in tqdm(loader, desc='Training', leave=False):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    return running_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    """Evaluate model, return loss, accuracy, all predictions and labels."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    for images, labels in tqdm(loader, desc='Evaluating', leave=False):
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    return running_loss / total, correct / total, np.array(all_preds), np.array(all_labels)


def plot_training_curves(log, output_dir):
    """Plot and save training/validation loss and accuracy curves."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    epochs = [r['epoch'] for r in log]

    ax1.plot(epochs, [r['train_loss'] for r in log], 'b-o', markersize=3, label='Train Loss')
    ax1.plot(epochs, [r['val_loss'] for r in log], 'r-o', markersize=3, label='Val Loss')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training & Validation Loss')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(epochs, [r['train_acc'] for r in log], 'b-o', markersize=3, label='Train Acc')
    ax2.plot(epochs, [r['val_acc'] for r in log], 'r-o', markersize=3, label='Val Acc')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy')
    ax2.set_title('Training & Validation Accuracy')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'training_curves.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ Saved training_curves.png')


def plot_confusion_matrix(y_true, y_pred, class_names, output_dir):
    """Plot and save the confusion matrix."""
    cm = confusion_matrix(y_true, y_pred)

    # If too many classes, only show top-N by frequency
    if len(class_names) > 20:
        fig, ax = plt.subplots(figsize=(20, 18))
    else:
        fig, ax = plt.subplots(figsize=(12, 10))

    sns.heatmap(
        cm, annot=len(class_names) <= 20, fmt='d',
        xticklabels=class_names, yticklabels=class_names,
        cmap='Greens', ax=ax, linewidths=0.5
    )
    ax.set_xlabel('Predicted')
    ax.set_ylabel('True')
    ax.set_title('Confusion Matrix')
    plt.xticks(rotation=45, ha='right', fontsize=7)
    plt.yticks(fontsize=7)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ Saved confusion_matrix.png')


def main():
    parser = argparse.ArgumentParser(description='Train plant disease classifier')
    parser.add_argument('--data_dir', type=str, default='data/plantvillage', help='Path to dataset')
    parser.add_argument('--output_dir', type=str, default='outputs', help='Where to save results')
    parser.add_argument('--model', type=str, default='mobilenetv2', choices=['mobilenetv2', 'resnet50'])
    parser.add_argument('--epochs', type=int, default=30, help='Total epochs (Phase 1 + Phase 2)')
    parser.add_argument('--phase1_epochs', type=int, default=15, help='Epochs with frozen backbone')
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--lr', type=float, default=0.001, help='Phase 1 learning rate')
    parser.add_argument('--lr_finetune', type=float, default=0.0001, help='Phase 2 fine-tune learning rate')
    parser.add_argument('--img_size', type=int, default=224)
    parser.add_argument('--val_split', type=float, default=0.2, help='Validation split ratio')
    parser.add_argument('--patience', type=int, default=7, help='Early stopping patience')
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument(
        '--exclude_classes', type=str, default='',
        help='Comma-separated class name prefixes to exclude (e.g. "Rice" to skip all Rice___ classes)'
    )
    args = parser.parse_args()

    # Build set of excluded prefixes (lower-cased for case-insensitive match)
    exclude_prefixes = tuple(
        p.strip().lower() for p in args.exclude_classes.split(',') if p.strip()
    )

    os.makedirs(args.output_dir, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    print(f'Using device: {device}')

    # ─── Data loading ───────────────────────────────────────────────
    print(f'\n📂 Loading dataset from {args.data_dir}...')
    train_transform, val_transform = get_transforms(args.img_size)

    # ─── Class exclusion filter ──────────────────────────────────────
    def class_filter(class_name: str) -> bool:
        """Return False if this class should be excluded from training."""
        if not exclude_prefixes:
            return True
        return not class_name.lower().startswith(exclude_prefixes)

    # Create two separate dataset objects so train/val have different transforms
    train_dataset_full = datasets.ImageFolder(
        args.data_dir,
        transform=train_transform,
        is_valid_file=None,
    )
    val_dataset_full = datasets.ImageFolder(
        args.data_dir,
        transform=val_transform,
        is_valid_file=None,
    )

    # Filter classes BEFORE building indices so indices stay consistent
    if exclude_prefixes:
        kept_class_to_old_idx = {
            name: old_idx
            for name, old_idx in train_dataset_full.class_to_idx.items()
            if class_filter(name)
        }
        kept_classes_sorted = sorted(kept_class_to_old_idx.keys())
        old_to_new_idx = {kept_class_to_old_idx[name]: new_idx for new_idx, name in enumerate(kept_classes_sorted)}

        def filter_samples(dataset):
            kept = [(path, old_to_new_idx[old_lbl])
                    for path, old_lbl in dataset.samples
                    if old_lbl in old_to_new_idx]
            dataset.samples = kept
            dataset.targets = [lbl for _, lbl in kept]
            dataset.classes = kept_classes_sorted
            dataset.class_to_idx = {name: new_idx for new_idx, name in enumerate(kept_classes_sorted)}
            return dataset

        train_dataset_full = filter_samples(train_dataset_full)
        val_dataset_full   = filter_samples(val_dataset_full)
        print(f'  ⚠️  Excluding classes matching: {list(exclude_prefixes)}')

    class_names = train_dataset_full.classes
    num_classes = len(class_names)
    print(f'  Found {len(train_dataset_full)} images across {num_classes} classes')

    # Print per-class distribution
    class_counts = Counter(train_dataset_full.targets)
    print(f'  Per-class distribution:')
    for idx, name in enumerate(class_names):
        print(f'    {name}: {class_counts[idx]:,}')

    # Save class mapping
    with open(os.path.join(args.output_dir, 'class_mapping.json'), 'w') as f:
        json.dump({i: name for i, name in enumerate(class_names)}, f, indent=2)

    # ─── Train/Val split (stratified-like via random_split + shared seed) ───
    val_size = int(len(train_dataset_full) * args.val_split)
    train_size = len(train_dataset_full) - val_size
    generator = torch.Generator().manual_seed(42)
    train_indices, val_indices = torch.utils.data.random_split(
        range(len(train_dataset_full)), [train_size, val_size], generator=generator
    )
    train_indices = list(train_indices)
    val_indices = list(val_indices)

    train_dataset = Subset(train_dataset_full, train_indices)
    val_dataset = Subset(val_dataset_full, val_indices)

    # ─── Weighted random sampling for class imbalance ───────────────
    train_targets = [train_dataset_full.targets[i] for i in train_indices]
    train_class_counts = Counter(train_targets)
    class_weights = {cls: 1.0 / count for cls, count in train_class_counts.items()}
    sample_weights = [class_weights[t] for t in train_targets]
    sampler = WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)

    print(f'  Train: {train_size} | Val: {val_size}')
    print(f'  ✅ Using weighted random sampling for class balance')

    # ─── Class-weighted loss ────────────────────────────────────────
    total_samples = sum(class_counts.values())
    loss_weights = torch.tensor(
        [total_samples / (num_classes * class_counts[i]) for i in range(num_classes)],
        dtype=torch.float32
    ).to(device)
    # Cap weights to prevent extreme values
    loss_weights = torch.clamp(loss_weights, max=10.0)
    print(f'  ✅ Using class-weighted CrossEntropyLoss')

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, sampler=sampler, num_workers=args.workers, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=args.workers, pin_memory=True)

    # ─── Model ──────────────────────────────────────────────────────
    print(f'\n🧠 Building {args.model} model ({num_classes} classes)...')
    model = build_model(args.model, num_classes).to(device)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f'  Total params: {total_params:,} | Trainable: {trainable:,} (backbone frozen)')

    # ─── Training setup ─────────────────────────────────────────────
    criterion = nn.CrossEntropyLoss(weight=loss_weights)
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)

    best_val_acc = 0.0
    epochs_without_improvement = 0
    training_log = []

    print(f'\n🚀 Phase 1: Training classifier head (frozen backbone) for up to {args.phase1_epochs} epochs...\n')

    for epoch in range(1, args.epochs + 1):
        # ─── Phase 2 transition: unfreeze backbone ──────────────────
        if epoch == args.phase1_epochs + 1:
            print(f'\n🔓 Phase 2: Unfreezing backbone for fine-tuning...\n')
            model = unfreeze_backbone(model, args.model)
            # Reset optimizer with lower LR for fine-tuning
            optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr_finetune, weight_decay=1e-4)
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
            epochs_without_improvement = 0  # Reset early stopping for Phase 2
            print()
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, val_preds, val_labels = evaluate(model, val_loader, criterion, device)
        scheduler.step(val_loss)

        current_lr = optimizer.param_groups[0]['lr']
        phase = 1 if epoch <= args.phase1_epochs else 2

        log_entry = {
            'epoch': epoch,
            'train_loss': round(train_loss, 4),
            'train_acc': round(train_acc, 4),
            'val_loss': round(val_loss, 4),
            'val_acc': round(val_acc, 4),
            'lr': current_lr,
            'phase': phase,
        }
        training_log.append(log_entry)

        is_best = val_acc > best_val_acc
        if is_best:
            best_val_acc = val_acc
            epochs_without_improvement = 0
            torch.save({
                'epoch': epoch,
                'phase': phase,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'class_names': class_names,
                'arch': args.model,
                'num_classes': num_classes,
            }, os.path.join(args.output_dir, 'best_model.pth'))
        else:
            epochs_without_improvement += 1

        marker = ' ★ BEST' if is_best else ''
        print(f'  [P{phase}] Epoch {epoch:3d}/{args.epochs} | '
              f'Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | '
              f'Val Loss: {val_loss:.4f} Acc: {val_acc:.4f} | '
              f'LR: {current_lr:.6f}{marker}')

        # Early stopping (only stops within current phase)
        if epochs_without_improvement >= args.patience:
            print(f'\n  ⏹️  Early stopping triggered (no improvement for {args.patience} epochs)')
            if epoch <= args.phase1_epochs:
                # Skip to Phase 2
                print(f'  Advancing to Phase 2...')
                # Adjust phase1_epochs so Phase 2 starts next iteration
                args.phase1_epochs = epoch
                epochs_without_improvement = 0
            else:
                # Phase 2 early stop — done
                break

    # Save training log
    with open(os.path.join(args.output_dir, 'training_log.csv'), 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['epoch', 'train_loss', 'train_acc', 'val_loss', 'val_acc', 'lr', 'phase'])
        writer.writeheader()
        writer.writerows(training_log)

    print(f'\n📊 Best validation accuracy: {best_val_acc:.4f}')

    # Final evaluation with best model
    print('\n📈 Generating evaluation metrics...')
    checkpoint = torch.load(os.path.join(args.output_dir, 'best_model.pth'), map_location=device, weights_only=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    _, _, final_preds, final_labels = evaluate(model, val_loader, criterion, device)

    # Classification report
    report = classification_report(final_labels, final_preds, target_names=class_names, digits=4)
    with open(os.path.join(args.output_dir, 'classification_report.txt'), 'w') as f:
        f.write(f'Plant Disease Classification Report\n')
        f.write(f'{"=" * 60}\n')
        f.write(f'Model: {args.model}\n')
        f.write(f'Dataset: {args.data_dir}\n')
        f.write(f'Best Epoch: {checkpoint["epoch"]}\n')
        f.write(f'Validation Accuracy: {best_val_acc:.4f}\n')
        f.write(f'Total Parameters: {total_params:,}\n')
        f.write(f'Trainable Parameters: {trainable:,}\n')
        f.write(f'{"=" * 60}\n\n')
        f.write(report)
    print(f'  ✓ Saved classification_report.txt')

    # Plots
    plot_training_curves(training_log, args.output_dir)
    plot_confusion_matrix(final_labels, final_preds, class_names, args.output_dir)

    print(f'\n✅ Training complete! All outputs saved to {args.output_dir}/')
    print(f'   Model size: {os.path.getsize(os.path.join(args.output_dir, "best_model.pth")) / 1024 / 1024:.1f} MB')


if __name__ == '__main__':
    main()
