"""
Model Evaluation & Comparison Script
=====================================
Evaluate a trained model and optionally compare with Roboflow API results.

Usage:
    python evaluate.py --model_path outputs/best_model.pth --test_dir data/plantvillage
"""

import argparse
import os
import json
import time

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, accuracy_score
import numpy as np
from tqdm import tqdm


def build_model(arch: str, num_classes: int):
    """Rebuild model architecture for loading weights."""
    if arch == 'mobilenetv2':
        model = models.mobilenet_v2(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
    elif arch == 'resnet50':
        model = models.resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
    return model


def main():
    parser = argparse.ArgumentParser(description='Evaluate trained model')
    parser.add_argument('--model_path', type=str, required=True, help='Path to best_model.pth')
    parser.add_argument('--test_dir', type=str, required=True, help='Path to test dataset')
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--img_size', type=int, default=224)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()

    device = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    print(f'Using device: {device}')

    # Load checkpoint
    checkpoint = torch.load(args.model_path, map_location=device, weights_only=False)
    arch = checkpoint.get('arch', 'mobilenetv2')
    num_classes = checkpoint.get('num_classes', 38)
    class_names = checkpoint.get('class_names', [f'class_{i}' for i in range(num_classes)])

    # Build and load model
    model = build_model(arch, num_classes).to(device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    # Data loading
    transform = transforms.Compose([
        transforms.Resize(int(args.img_size * 1.14)),
        transforms.CenterCrop(args.img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    test_dataset = datasets.ImageFolder(args.test_dir, transform=transform)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=args.workers)

    print(f'\n📊 Evaluating on {len(test_dataset)} images...\n')

    all_preds = []
    all_labels = []
    total_time = 0

    with torch.no_grad():
        for images, labels in tqdm(test_loader, desc='Evaluating'):
            images = images.to(device)

            start = time.time()
            outputs = model(images)
            total_time += time.time() - start

            _, predicted = outputs.max(1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    accuracy = accuracy_score(all_labels, all_preds)
    avg_inference_ms = (total_time / len(test_dataset)) * 1000
    model_size_mb = os.path.getsize(args.model_path) / 1024 / 1024

    print(f'\n{"=" * 60}')
    print(f'  EVALUATION RESULTS')
    print(f'{"=" * 60}')
    print(f'  Model:            {arch}')
    print(f'  Accuracy:         {accuracy:.4f} ({accuracy * 100:.2f}%)')
    print(f'  Avg Inference:    {avg_inference_ms:.2f} ms/image')
    print(f'  Model Size:       {model_size_mb:.1f} MB')
    print(f'  Test Images:      {len(test_dataset)}')
    print(f'  Classes:          {num_classes}')
    print(f'{"=" * 60}')

    # Comparison table for report
    print(f'\n📋 Comparison Table (for report/paper):')
    print(f'{"─" * 60}')
    print(f'  {"Metric":<25} {"Self-Trained":<18} {"Roboflow (API)"}')
    print(f'{"─" * 60}')
    print(f'  {"Architecture":<25} {arch:<18} {"Unknown (hosted)"}')
    print(f'  {"Accuracy":<25} {accuracy*100:.2f}%{"":>12} {"(measure manually)"}')
    print(f'  {"Inference Time":<25} {avg_inference_ms:.2f} ms{"":>10} {"~200-500 ms (network)"}')
    print(f'  {"Model Size":<25} {model_size_mb:.1f} MB{"":>12} {"N/A (cloud)"}')
    print(f'  {"Training Data":<25} {"PlantVillage":<18} {"Roboflow labeled"}')
    print(f'  {"Explainability":<25} {"Full (open)":<18} {"None (black box)"}')
    print(f'{"─" * 60}')

    # Detailed report
    report = classification_report(all_labels, all_preds, target_names=class_names, digits=4)
    print(f'\n📄 Per-Class Report:\n')
    print(report)

    # Save results
    output_dir = os.path.dirname(args.model_path)
    results = {
        'accuracy': float(accuracy),
        'avg_inference_ms': float(avg_inference_ms),
        'model_size_mb': float(model_size_mb),
        'num_test_images': len(test_dataset),
        'num_classes': num_classes,
        'architecture': arch,
    }
    with open(os.path.join(output_dir, 'evaluation_results.json'), 'w') as f:
        json.dump(results, f, indent=2)
    print(f'\n✅ Results saved to {output_dir}/evaluation_results.json')


if __name__ == '__main__':
    main()
