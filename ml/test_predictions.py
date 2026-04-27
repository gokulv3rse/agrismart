"""
AgriSmart — Full Prediction Test Suite
=======================================
Tests every class by picking N random images from the dataset,
running them through the local inference server, and reporting
per-class accuracy with a clear pass/fail summary.

Usage:
    cd ml
    source venv/bin/activate
    python test_predictions.py
    python test_predictions.py --samples 5   # test 5 images per class
"""

import argparse
import random
import requests
import json
from pathlib import Path
from collections import defaultdict

SERVER_URL  = "http://localhost:5001"
DATA_DIR    = Path(__file__).parent / "data" / "plantvillage"
IMG_EXTS    = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}

# ── ANSI colour codes ──────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


def check_server() -> dict:
    try:
        r = requests.get(f"{SERVER_URL}/health", timeout=5)
        return r.json()
    except Exception as e:
        print(f"{RED}❌ Server not reachable at {SERVER_URL}: {e}{RESET}")
        raise SystemExit(1)


def get_class_dirs(data_dir: Path) -> list[Path]:
    return sorted([d for d in data_dir.iterdir() if d.is_dir()])


def sample_images(class_dir: Path, n: int) -> list[Path]:
    images = [f for f in class_dir.rglob("*") if f.suffix in IMG_EXTS]
    return random.sample(images, min(n, len(images)))


def predict(image_path: Path) -> dict | None:
    try:
        with open(image_path, "rb") as f:
            resp = requests.post(
                f"{SERVER_URL}/predict-upload",
                files={"file": (image_path.name, f, "image/jpeg")},
                timeout=30
            )
        if resp.ok:
            return resp.json()
        return None
    except Exception:
        return None


def run_tests(samples_per_class: int = 3):
    print(f"\n{BOLD}{CYAN}{'='*65}{RESET}")
    print(f"{BOLD}{CYAN}  AgriSmart — Full Class Prediction Test Suite{RESET}")
    print(f"{BOLD}{CYAN}{'='*65}{RESET}\n")

    info = check_server()
    print(f"  Server: {SERVER_URL}  |  Classes: {info['classes']}  |  Arch: {info['arch']}\n")

    class_dirs    = get_class_dirs(DATA_DIR)
    results       = {}
    overall_pass  = 0
    overall_total = 0

    for class_dir in class_dirs:
        class_name = class_dir.name
        images     = sample_images(class_dir, samples_per_class)

        if not images:
            print(f"{YELLOW}  ⚠️  {class_name}: no images found, skipping{RESET}")
            continue

        correct = 0
        details = []

        for img_path in images:
            result = predict(img_path)
            if result is None:
                details.append(("ERROR", "server error", 0.0))
                continue

            pred_label = result.get("top_label", "unknown")
            pred_conf  = result.get("top_confidence", 0.0)
            is_correct = pred_label == class_name

            if is_correct:
                correct += 1

            details.append((
                "✅" if is_correct else "❌",
                pred_label,
                pred_conf,
            ))

        acc = correct / len(images)
        results[class_name] = {"correct": correct, "total": len(images), "acc": acc}
        overall_pass  += correct
        overall_total += len(images)

        # ── Print per-class block ──────────────────────────────────────────
        status_icon = "✅" if acc >= 0.7 else ("🟡" if acc >= 0.4 else "❌")
        crop, *rest = class_name.split("___")
        disease     = " ".join(rest).replace("_", " ") if rest else class_name

        print(f"  {BOLD}[{crop}] {disease}{RESET}")
        print(f"    Accuracy: {status_icon} {correct}/{len(images)} ({acc*100:.0f}%)")

        for icon, pred, conf in details:
            pred_display = pred.replace("___", " → ").replace("_", " ")
            conf_pct     = f"{conf*100:.1f}%"
            print(f"    {icon}  Predicted: {pred_display:<40}  Conf: {conf_pct}")
        print()

    # ── Overall summary ────────────────────────────────────────────────────────
    overall_acc = overall_pass / overall_total if overall_total else 0
    print(f"{BOLD}{CYAN}{'='*65}{RESET}")
    print(f"{BOLD}  OVERALL: {overall_pass}/{overall_total} correct  ({overall_acc*100:.1f}%){RESET}")
    print(f"{BOLD}{CYAN}{'='*65}{RESET}\n")

    # Per-class summary table
    print(f"  {'Class':<40} {'Result':>8}  {'Acc':>6}")
    print(f"  {'-'*56}")
    for cls, r in results.items():
        acc  = r["acc"]
        bar  = "█" * int(acc * 10) + "░" * (10 - int(acc * 10))
        col  = GREEN if acc >= 0.7 else (YELLOW if acc >= 0.4 else RED)
        display = cls.replace("___", " — ").replace("_", " ")
        print(f"  {col}{display:<40} {bar}  {acc*100:>5.1f}%{RESET}")

    print()

    # Failed classes
    failed = [cls for cls, r in results.items() if r["acc"] < 0.7]
    if failed:
        print(f"{YELLOW}{BOLD}  ⚠️  Classes needing attention ({len(failed)}):{RESET}")
        for cls in failed:
            r = results[cls]
            display = cls.replace("___", " — ").replace("_", " ")
            print(f"  {YELLOW}   • {display}: {r['correct']}/{r['total']}{RESET}")
    else:
        print(f"{GREEN}{BOLD}  🎉 All classes passing! System is ready.{RESET}")

    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=int, default=3,
                        help="Images to test per class (default: 3)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    run_tests(samples_per_class=args.samples)
