#!/usr/bin/env python3
"""OneBin Active Learning Ingestion Pipeline (Task 3.5).

Connects to Supabase, pulls all user-consented images and labels from the
`scans` table and the `waste-dataset` storage bucket, and organizes them
into `real/<fine_class>/<id>.jpg` for seamless model fine-tuning with train.py.

Usage:
    python scripts/sync_training_data.py
    python scripts/sync_training_data.py --output-dir real --limit 200
    python scripts/sync_training_data.py --dry-run

Then fine-tune the classifier:
    python train.py --extra real --init checkpoints/best.pt --epochs 4 --lr 1e-4
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path to import bins.py
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from bins import BIN_OF, BINS
except ImportError:
    BIN_OF = {
        "plastic_bag": "trash",
        "styrofoam": "trash",
        "biological": "compost",
        "cardboard": "recycling",
        "glass": "recycling",
        "metal": "recycling",
        "paper": "recycling",
        "plastic": "recycling",
        "clothes": "trash",
        "shoes": "trash",
        "trash": "trash",
        "battery": "trash",
    }
    BINS = ["compost", "recycling", "trash"]

VALID_CLASSES = set(BIN_OF.keys())


def load_env_file(filepath: Path) -> dict:
    """Parses key-value pairs from an env file without external dependencies."""
    env = {}
    if not filepath.is_file():
        return env
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip()
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                env[key] = val
    return env


def resolve_credentials() -> tuple[str, str]:
    """Retrieves Supabase URL and anon key from environment or local .env files."""
    env = {}
    env.update(load_env_file(ROOT_DIR / ".env"))
    env.update(load_env_file(ROOT_DIR / ".env.local"))
    env.update(os.environ)

    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "") or env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        print("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.")
        print("   Please check your .env.local file or set them in the environment.")
        sys.exit(1)

    return url.rstrip("/"), key


def normalize_class(item_label: str, bin_name: str) -> str:
    """Maps a user or detector item label to one of the 12 fine-grained classes."""
    item_clean = item_label.lower().replace("-", "_").replace(" ", "_")

    if item_clean in VALID_CLASSES:
        return item_clean

    # Substring / keyword heuristics
    if any(k in item_clean for k in ["plastic_bag", "grocery_bag", "plastic_film", "poly_bag"]):
        return "plastic_bag"
    if any(k in item_clean for k in ["styrofoam", "foam", "polystyrene"]):
        return "styrofoam"
    if any(k in item_clean for k in ["battery", "batteries"]):
        return "battery"
    if any(k in item_clean for k in ["apple", "banana", "food", "organic", "peel", "bread", "vegetable", "fruit", "compost"]):
        return "biological"
    if any(k in item_clean for k in ["cardboard", "box", "shipping_box", "corrugated"]):
        return "cardboard"
    if any(k in item_clean for k in ["glass", "jar", "wine_bottle"]):
        return "glass"
    if any(k in item_clean for k in ["can", "aluminum", "tin", "metal", "foil"]):
        return "metal"
    if any(k in item_clean for k in ["paper", "newspaper", "magazine", "receipt", "envelope"]):
        return "paper"
    if any(k in item_clean for k in ["plastic", "jug", "cup_plastic"]):
        return "plastic"
    if any(k in item_clean for k in ["shoe", "sneaker", "boot", "sandal"]):
        return "shoes"
    if any(k in item_clean for k in ["shirt", "cloth", "textile", "fabric", "jacket"]):
        return "clothes"

    # Fallback based on bin
    bin_clean = bin_name.lower().strip()
    if bin_clean == "compost":
        return "biological"
    if bin_clean == "recycling":
        return "plastic"
    return "trash"


def fetch_scans_with_images(supabase_url: str, anon_key: str, limit: int = 500) -> list[dict]:
    """Queries scans table for rows with image_url."""
    endpoint = f"{supabase_url}/rest/v1/scans?image_url=not.is.null&select=id,bin,item,image_url,created_at&limit={limit}"
    req = urllib.request.Request(
        endpoint,
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except Exception as e:
        print(f"⚠️ Notice: Scans query returned: {e}")
        return []


def fetch_storage_objects(supabase_url: str, anon_key: str, bucket: str = "waste-dataset", prefix: str = "", limit: int = 500) -> list[dict]:
    """Recursively lists image files from the public storage bucket."""
    endpoint = f"{supabase_url}/storage/v1/object/list/{bucket}"
    payload = json.dumps({"prefix": prefix, "limit": limit, "offset": 0}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    all_objs = []
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list):
                for item in data:
                    name = item.get("name", "")
                    full_name = f"{prefix}/{name}" if prefix else name
                    if item.get("id") is None:
                        # Directory: recurse into subfolder
                        all_objs.extend(fetch_storage_objects(supabase_url, anon_key, bucket, prefix=full_name, limit=limit))
                    else:
                        item["full_path"] = full_name
                        all_objs.append(item)
    except Exception as e:
        pass
    return all_objs


def download_image(url: str, target_path: Path) -> bool:
    """Downloads an image file to target_path."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OneBin-ActiveLearning/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                target_path.write_bytes(resp.read())
                return True
    except Exception as e:
        print(f"[!] Notice: Skipped non-image or inaccessible URL {url}: {e}")
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Sync active learning training samples from Supabase into real/<class>/<id>.jpg"
    )
    parser.add_argument("--output-dir", type=str, default="real", help="Target training directory (default: real)")
    parser.add_argument("--limit", type=int, default=500, help="Maximum samples to fetch (default: 500)")
    parser.add_argument("--dry-run", action="store_true", help="Inspect available samples without downloading")
    args = parser.parse_args()

    supabase_url, anon_key = resolve_credentials()
    output_dir = ROOT_DIR / args.output_dir

    print("==================================================================")
    print("      OneBin: Active Learning Training Ingestion Pipeline         ")
    print("==================================================================")
    print(f"Connected to: {supabase_url}")
    print(f"Destination:  {output_dir}")
    print(f"Mode:         {'DRY RUN (Simulated)' if args.dry_run else 'ACTIVE INGESTION'}\n")

    # 1. Fetch rows from scans table
    print("Fetching scans with image_url from Supabase...")
    scans = fetch_scans_with_images(supabase_url, anon_key, limit=args.limit)
    print(f"Found {len(scans)} records with images in `scans` table.")

    # 2. Fetch objects from waste-dataset storage bucket
    print("Fetching files from `waste-dataset` storage bucket...")
    storage_objs = fetch_storage_objects(supabase_url, anon_key, bucket="waste-dataset", limit=args.limit)
    print(f"Found {len(storage_objs)} objects in `waste-dataset` bucket.")

    # 3. Ensure destination subdirectories exist
    existing_counts = defaultdict(int)
    for c in VALID_CLASSES:
        class_folder = output_dir / c
        if not args.dry_run:
            class_folder.mkdir(parents=True, exist_ok=True)
        if class_folder.exists():
            existing_counts[c] = len(list(class_folder.glob("*.jpg")) + list(class_folder.glob("*.jpeg")) + list(class_folder.glob("*.png")))

    downloaded_counts = defaultdict(int)
    skipped_count = 0
    covered_storage_paths = set()

    # 4. Ingest from scans table (primary ground-truth source)
    for scan in scans:
        img_url = scan.get("image_url")
        if not img_url:
            continue

        # Track relative bucket path to prevent duplicate downloads from storage
        if "waste-dataset/" in img_url:
            rel_path = img_url.split("waste-dataset/", 1)[1].lstrip("/")
            covered_storage_paths.add(rel_path)
            covered_storage_paths.add(Path(rel_path).name)

        scan_id = str(scan.get("id", ""))
        fine_class = normalize_class(scan.get("item", ""), scan.get("bin", ""))
        target_file = output_dir / fine_class / f"scan_{scan_id}.jpg"

        if target_file.exists():
            skipped_count += 1
            continue

        if args.dry_run:
            downloaded_counts[fine_class] += 1
        else:
            if download_image(img_url, target_file):
                downloaded_counts[fine_class] += 1

    # 5. Ingest from storage bucket (only for orphaned uploads not covered by scans table)
    for obj in storage_objs:
        full_path = obj.get("full_path") or obj.get("name", "")
        if not full_path or full_path.startswith("."):
            continue

        # Filter strictly for image files
        if not full_path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue

        # Skip if this image was already downloaded via scans table
        rel_clean = full_path.lstrip("/")
        if rel_clean in covered_storage_paths or Path(full_path).name in covered_storage_paths:
            skipped_count += 1
            continue

        parts = full_path.split("/")
        # Folder determines the municipal stream (compost / recycling / trash)
        bin_name = parts[-2] if len(parts) > 1 else "recycling"

        # Filename format: <timestamp>-<item>.jpg (e.g. 1792287403845-metal.jpg)
        filename_stem = Path(full_path).stem
        if "-" in filename_stem:
            candidate_item = filename_stem.rsplit("-", 1)[-1]
        else:
            candidate_item = filename_stem

        fine_class = normalize_class(candidate_item, bin_name)
        clean_filename = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", Path(full_path).name)

        target_file = output_dir / fine_class / f"bucket_{clean_filename}"

        if target_file.exists():
            skipped_count += 1
            continue

        public_url = f"{supabase_url}/storage/v1/object/public/waste-dataset/{full_path}"
        if args.dry_run:
            downloaded_counts[fine_class] += 1
        else:
            if download_image(public_url, target_file):
                downloaded_counts[fine_class] += 1

    # 6. Display Summary Matrix
    print("\n==================================================================")
    print("                   TRAINING DATASET SUMMARY                       ")
    print("==================================================================")
    header = f"{'Fine Class':<16} | {'Bin':<10} | {'Existing':<10} | {'New Download':<14} | {'Total':<8}"
    print(header)
    print("-" * len(header))

    total_existing = 0
    total_new = 0

    for c in sorted(VALID_CLASSES):
        bin_name = BIN_OF[c]
        exist = existing_counts[c]
        new_dl = downloaded_counts[c]
        tot = exist + (new_dl if not args.dry_run else 0)
        total_existing += exist
        total_new += new_dl
        print(f"{c:<16} | {bin_name:<10} | {exist:<10} | {new_dl:<14} | {tot:<8}")

    print("=" * len(header))
    print(f"{'TOTAL':<16} | {'ALL':<10} | {total_existing:<10} | {total_new:<14} | {total_existing + total_new:<8}")
    print(f"Deduplicated (already on disk): {skipped_count} files.")
    print("==================================================================\n")

    print(">> Model Fine-Tuning Command:")
    print(f"    python train.py --extra {args.output_dir} --init checkpoints/best.pt --epochs 4 --lr 1e-4\n")


if __name__ == "__main__":
    main()
