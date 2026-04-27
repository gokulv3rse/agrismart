"""
AgriSmart — Local PyTorch Inference Server
==========================================
Loads best_model.pth and serves predictions on port 5001.
The Node.js backend calls POST /predict with { imageUrl } and receives
{ predictions: [{ label, confidence }], top_label, top_confidence }.

Usage:
    cd ml
    source venv/bin/activate   # or: python3 -m venv venv && pip install -r requirements.txt
    python serve.py
"""

import io
import json
import os
import sys
from pathlib import Path

import requests
import torch
import torch.nn.functional as F
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from torchvision import models, transforms
import torch.nn as nn

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_PATH       = Path(__file__).parent / 'outputs' / 'best_model.pth'
CLASS_MAP_PATH   = Path(__file__).parent / 'outputs' / 'class_mapping.json'
PORT             = int(os.environ.get('INFER_PORT', 5001))
IMG_SIZE         = 224
DEVICE           = (
    torch.device('cuda')  if torch.cuda.is_available()  else
    torch.device('mps')   if torch.backends.mps.is_available() else
    torch.device('cpu')
)

# ── Load class mapping ────────────────────────────────────────────────────────
with open(CLASS_MAP_PATH) as f:
    CLASS_MAPPING: dict[str, str] = json.load(f)   # {"0": "Potato___Early_blight", ...}
NUM_CLASSES = len(CLASS_MAPPING)

# ── Build model skeleton ──────────────────────────────────────────────────────
def build_model(arch: str, num_classes: int):
    if arch == 'mobilenetv2':
        m = models.mobilenet_v2(weights=None)
        in_features = m.classifier[1].in_features
        m.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
    elif arch == 'resnet50':
        m = models.resnet50(weights=None)
        in_features = m.fc.in_features
        m.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
    else:
        raise ValueError(f'Unknown arch: {arch}')
    return m

# ── Load checkpoint ───────────────────────────────────────────────────────────
print(f'[serve] Loading model from {MODEL_PATH} …')
checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
arch        = checkpoint.get('arch', 'mobilenetv2')
saved_classes = checkpoint.get('class_names', list(CLASS_MAPPING.values()))
num_classes   = len(saved_classes)

model = build_model(arch, num_classes)
model.load_state_dict(checkpoint['model_state_dict'])
model.to(DEVICE)
model.eval()
print(f'[serve] ✅ Model loaded — arch={arch}, classes={num_classes}, device={DEVICE}')
print(f'[serve] Classes: {saved_classes}')

# ── Preprocessing ─────────────────────────────────────────────────────────────
preprocess = transforms.Compose([
    transforms.Resize(int(IMG_SIZE * 1.14)),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

def predict_from_image(img: Image.Image) -> dict:
    """Run inference on a PIL image and return sorted predictions.

    Temperature scaling (T=1.8) is applied to logits before softmax to
    calibrate overconfident predictions into a realistic 75–95% range.
    """
    TEMPERATURE = 1.8   # higher → softer probabilities

    tensor = preprocess(img.convert('RGB')).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = model(tensor)
        scaled_logits = logits / TEMPERATURE          # temperature scaling
        probs  = F.softmax(scaled_logits, dim=1).squeeze(0).cpu().tolist()

    predictions = [
        {'label': saved_classes[i], 'confidence': round(probs[i], 6)}
        for i in range(len(saved_classes))
    ]
    predictions.sort(key=lambda x: x['confidence'], reverse=True)

    top = predictions[0]
    return {
        'top_label':      top['label'],
        'top_confidence': top['confidence'],
        'predictions':    predictions,
    }

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'classes': num_classes, 'arch': arch})

@app.post('/predict')
def predict():
    body = request.get_json(force=True, silent=True) or {}
    image_url = body.get('imageUrl', '').strip()

    if not image_url:
        return jsonify({'error': 'imageUrl is required'}), 400

    # Download image
    try:
        resp = requests.get(image_url, timeout=15)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content))
    except Exception as exc:
        return jsonify({'error': f'Failed to fetch image: {exc}'}), 502

    # Run inference
    try:
        result = predict_from_image(img)
    except Exception as exc:
        return jsonify({'error': f'Inference failed: {exc}'}), 500

    return jsonify({'success': True, **result})

@app.post('/predict-upload')
def predict_upload():
    """Alternative endpoint: accepts a multipart file upload."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    try:
        img = Image.open(file.stream)
    except Exception as exc:
        return jsonify({'error': f'Invalid image: {exc}'}), 400

    try:
        result = predict_from_image(img)
    except Exception as exc:
        return jsonify({'error': f'Inference failed: {exc}'}), 500

    return jsonify({'success': True, **result})

if __name__ == '__main__':
    print(f'[serve] 🚀 Starting inference server on http://localhost:{PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)
