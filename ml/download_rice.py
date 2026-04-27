"""
Download Rice disease dataset from Roboflow and merge into the
existing plantvillage data directory.

Usage:
    cd ml
    source venv/bin/activate
    python download_rice.py \
        --workspace YOUR_WORKSPACE \
        --project  YOUR_PROJECT_NAME \
        --version  1 \
        --api_key  YOUR_API_KEY

The script will:
  1. Download the dataset in ImageFolder (folder-per-class) format
  2. Rename each class folder to Rice___<ClassName> to match our convention
  3. Copy all images into data/plantvillage/Rice___<ClassName>/
  4. Print a final class distribution summary
"""

import argparse
import os
import shutil
from pathlib import Path
from collections import Counter


def download_and_merge(workspace: str, project: str, version: int, api_key: str):
    from roboflow import Roboflow

    DEST_BASE = Path(__file__).parent / 'data' / 'plantvillage'
    DEST_BASE.mkdir(parents=True, exist_ok=True)

    print(f'\n📥 Connecting to Roboflow …')
    rf = Roboflow(api_key=api_key)
    proj = rf.workspace(workspace).project(project)
    ds   = proj.version(version)

    # Download as folder classification format
    download_dir = Path(__file__).parent / '_rice_download'
    download_dir.mkdir(exist_ok=True)

    print(f'📦 Downloading {project} v{version} …')
    ds.download('folder', location=str(download_dir), overwrite=True)

    # Walk all split dirs (train / valid / test) and collect class folders
    print(f'\n🔀 Merging into {DEST_BASE} …')
    moved = Counter()

    for split in ['train', 'valid', 'test']:
        split_dir = download_dir / split
        if not split_dir.exists():
            continue
        for class_dir in sorted(split_dir.iterdir()):
            if not class_dir.is_dir():
                continue
            raw_name  = class_dir.name          # e.g. "Blast_Disease" or "Bacterial_Blight"
            # Build canonical name: Rice___<ClassName> with spaces → underscores
            canonical = 'Rice___' + raw_name.replace(' ', '_')
            dest      = DEST_BASE / canonical
            dest.mkdir(exist_ok=True)

            for img in class_dir.glob('*'):
                if img.suffix.lower() in {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}:
                    # Avoid name collisions with a split prefix
                    out_name = f'{split}_{img.name}'
                    shutil.copy2(img, dest / out_name)
                    moved[canonical] += 1

    print('\n✅ Merge complete. Images added per class:')
    for cls, count in sorted(moved.items()):
        print(f'   {cls}: {count}')

    # Full distribution summary
    print('\n📊 Full plantvillage distribution now:')
    total = 0
    for d in sorted(DEST_BASE.iterdir()):
        if d.is_dir():
            n = sum(1 for f in d.glob('*') if f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.bmp', '.webp'})
            print(f'   {d.name}: {n}')
            total += n
    print(f'\n   TOTAL: {total} images')

    # Optionally clean up download dir
    shutil.rmtree(download_dir, ignore_errors=True)
    print('\n🧹 Cleaned up temp download directory.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Download & merge Rice dataset from Roboflow')
    parser.add_argument('--workspace', required=True, help='Roboflow workspace slug')
    parser.add_argument('--project',   required=True, help='Roboflow project name')
    parser.add_argument('--version',   type=int, default=1, help='Dataset version number')
    parser.add_argument('--api_key',   default=os.environ.get('ROBOFLOW_API_KEY', ''), help='Roboflow API key')
    args = parser.parse_args()

    if not args.api_key:
        raise ValueError('Provide --api_key or set ROBOFLOW_API_KEY env var')

    download_and_merge(args.workspace, args.project, args.version, args.api_key)
