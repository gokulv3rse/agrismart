# ML Training Pipeline: Plant Disease Classification

This directory contains a **self-trained** PyTorch model for plant disease detection using transfer learning with MobileNetV2.

## Architecture

- **Base Model**: MobileNetV2 (pretrained on ImageNet)
- **Transfer Learning**: Frozen feature extractor + custom classifier head
- **Dataset**: PlantVillage (38 classes, ~54,000 images) + optional Roboflow rice images
- **Training**: Fine-tuning with data augmentation, learning rate scheduling

## Setup

```bash
cd ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Dataset

Download the PlantVillage dataset:
```bash
# Option 1: Kaggle
pip install kaggle
kaggle datasets download -d abdallahalidev/plantvillage-dataset
unzip plantvillage-dataset.zip -d data/

# Option 2: Direct download
# https://github.com/spMohanty/PlantVillage-Dataset
```

Expected directory structure:
```
ml/data/
  plantvillage/
    Apple___Apple_scab/
    Apple___Black_rot/
    ...
    Tomato___healthy/
```

## Training

```bash
python train.py --data_dir data/plantvillage --epochs 25 --batch_size 32 --lr 0.001
```

### Key Arguments
| Argument | Default | Description |
|----------|---------|-------------|
| `--data_dir` | `data/plantvillage` | Path to dataset |
| `--epochs` | `25` | Training epochs |
| `--batch_size` | `32` | Batch size |
| `--lr` | `0.001` | Learning rate |
| `--model` | `mobilenetv2` | Architecture (`mobilenetv2` or `resnet50`) |
| `--img_size` | `224` | Input image size |
| `--output_dir` | `outputs` | Where to save model + metrics |

## Outputs

After training, the following are saved in `outputs/`:
- `best_model.pth` — Best model weights
- `training_curves.png` — Loss/accuracy plots
- `confusion_matrix.png` — Confusion matrix visualization
- `classification_report.txt` — Precision, recall, F1 per class
- `training_log.csv` — Epoch-by-epoch metrics

## Comparison Study

To compare self-trained model vs Roboflow hosted model:
```bash
python evaluate.py --model_path outputs/best_model.pth --test_dir data/plantvillage
```

This generates a comparison table showing accuracy, inference time, and model size differences.

## Model Details for Report/Viva

| Metric | Value |
|--------|-------|
| Architecture | MobileNetV2 + Custom Head |
| Parameters | ~3.4M (2.2M frozen + 1.2M trainable) |
| Input Size | 224×224 RGB |
| Augmentation | RandomFlip, RandomRotation, ColorJitter, RandomResizedCrop |
| Optimizer | Adam with weight decay |
| Scheduler | ReduceLROnPlateau |
| Loss | CrossEntropyLoss |
