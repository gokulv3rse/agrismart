"""
Dataset Preparation Script
===========================
Restructures the PlantVillage dataset from the archive folder into a clean
training-ready format. Handles naming differences between archive and target classes.

Also handles Rice disease data (from a separate dataset) which has fewer images.
"""

import os
import shutil
from pathlib import Path
from collections import defaultdict

# Mapping from archive folder names -> our target class names
ARCHIVE_TO_CLASS = {
    "Potato___Early_blight": "Potato___Early_blight",
    "Potato___Late_blight": "Potato___Late_blight",
    "Potato___healthy": "Potato___Healthy",
    "Tomato_Bacterial_spot": "Tomato___Bacterial_spot",
    "Tomato_Early_blight": "Tomato___Early_blight",
    "Tomato_Late_blight": "Tomato___Late_blight",
    "Tomato_healthy": "Tomato___Healthy",
}

# Rice classes (already in place with 40 images each — separate dataset)
RICE_CLASSES = [
    "Rice___Bacterial_Blight",
    "Rice___Blast_Disease",
    "Rice___Brown_Spot",
    "Rice___False_Smut",
    "Rice___Healthy",
]

def main():
    base = Path("data/plantvillage")
    archive_pv = base / "archive" / "PlantVillage"
    
    # Also check nested PlantVillage/PlantVillage
    archive_pv2 = archive_pv / "PlantVillage"
    
    if not archive_pv.exists():
        print("❌ Archive folder not found at", archive_pv)
        return
    
    print("📂 Dataset Preparation")
    print("=" * 60)
    
    # Step 1: Copy images from archive into class folders
    print("\n🔄 Step 1: Copying images from archive to class folders...\n")
    
    for archive_name, target_name in ARCHIVE_TO_CLASS.items():
        # Try both archive levels
        src = archive_pv / archive_name
        if not src.exists():
            src = archive_pv2 / archive_name
        if not src.exists():
            print(f"  ⚠️  Skipping {archive_name} — not found in archive")
            continue
        
        dst = base / target_name
        dst.mkdir(exist_ok=True)
        
        # Count existing images
        existing = set(f.name for f in dst.iterdir() if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png'))
        
        # Copy new images
        copied = 0
        for img in src.iterdir():
            if img.is_file() and img.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                if img.name not in existing:
                    shutil.copy2(img, dst / img.name)
                    copied += 1
        
        total = len(list(f for f in dst.iterdir() if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png')))
        print(f"  ✅ {target_name}: {copied} new images copied ({total} total)")
    
    # Step 2: Report on Rice classes
    print("\n📊 Step 2: Rice class status (separate dataset)...\n")
    for cls in RICE_CLASSES:
        cls_dir = base / cls
        if cls_dir.exists():
            count = len(list(f for f in cls_dir.iterdir() if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png')))
            print(f"  {'✅' if count >= 100 else '⚠️'} {cls}: {count} images")
        else:
            print(f"  ❌ {cls}: NOT FOUND")
    
    # Step 3: Remove archive folder from dataset path (so ImageFolder doesn't pick it up)
    print("\n🗑️  Step 3: Moving archive out of dataset path...")
    archive_dir = base / "archive"
    archive_moved = base.parent / "plantvillage_archive_backup"
    if archive_dir.exists():
        if archive_moved.exists():
            shutil.rmtree(archive_moved)
        shutil.move(str(archive_dir), str(archive_moved))
        print(f"  ✅ Moved archive/ → {archive_moved}")
    
    # Step 4: Remove .DS_Store files
    for ds in base.rglob(".DS_Store"):
        ds.unlink()
        print(f"  🗑️  Removed {ds}")
    
    # Step 5: Final summary
    print("\n" + "=" * 60)
    print("📊 Final Dataset Summary:\n")
    
    total_images = 0
    class_counts = {}
    for cls_dir in sorted(base.iterdir()):
        if cls_dir.is_dir() and not cls_dir.name.startswith('.'):
            count = len(list(f for f in cls_dir.iterdir() if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png')))
            class_counts[cls_dir.name] = count
            total_images += count
            status = "✅" if count >= 100 else "⚠️"
            print(f"  {status} {cls_dir.name}: {count:,} images")
    
    print(f"\n  Total: {total_images:,} images across {len(class_counts)} classes")
    print("=" * 60)
    
    # Warn about class imbalance
    if class_counts:
        max_count = max(class_counts.values())
        min_count = min(class_counts.values())
        if max_count / max(min_count, 1) > 10:
            print("\n⚠️  WARNING: Severe class imbalance detected!")
            print(f"   Largest class: {max_count:,} | Smallest class: {min_count:,}")
            print("   The training script will use weighted sampling to handle this.")


if __name__ == "__main__":
    main()
