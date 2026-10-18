"""Fine-tune EfficientNetV2-S and sort into compost / recycling / trash.

Trains on data/combined (built by import_data.py: the Garbage Dataset from
arXiv:2602.10500 plus extra public datasets). The model learns the fine classes;
at eval/inference their probabilities are summed into the 3 bins in bins.py.

    python import_data.py
    python train.py

Later, fine-tune with your own photos (folders named after the 10 classes,
e.g. real/plastic/*.jpg, real/biological/*.jpg):
    python train.py --extra real --init checkpoints/best.pt --epochs 4 --lr 1e-4
"""
import argparse
import random
from collections import Counter
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import ConcatDataset, DataLoader, Subset, WeightedRandomSampler
from torchvision import datasets, models, transforms

from bins import BIN_OF, BINS

DEFAULT_DATA = Path(__file__).parent / "data/combined"
MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]


def make_transforms(size):
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(size, scale=(0.6, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(0.3, 0.3, 0.3, 0.05),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize(size),
        transforms.CenterCrop(size),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    return train_tf, eval_tf


def build_model(num_classes, pretrained=False):
    weights = models.EfficientNet_V2_S_Weights.IMAGENET1K_V1 if pretrained else None
    model = models.efficientnet_v2_s(weights=weights)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


def bin_matrix(classes):
    """(num_classes, 3) 0/1 matrix: fine probs @ M -> bin probs."""
    M = torch.zeros(len(classes), len(BINS))
    for i, c in enumerate(classes):
        M[i, BINS.index(BIN_OF[c])] = 1
    return M


def source_of(path):
    """import_data.py names files <source>__<name>; anything else is 'own'."""
    name = Path(path).name
    return name.split("__")[0] if "__" in name else "own"


# Sources whose files carry their own split (<source>__<split>_...): TACO crops keep the
# split of the photo they came from, so the detector's test photos stay unseen here too.
FIXED_SPLIT_SOURCES = {"taco"}


def split_indices(keys, seed=0, val=0.1, test=0.1, paths=None):
    """Train/val/test split stratified by key (here: (source, class)), fixed seed."""
    rng = random.Random(seed)
    by_key = {}
    tr, va, te = [], [], []
    fixed = {"train": tr, "val": va, "test": te}
    for i, k in enumerate(keys):
        if paths and source_of(paths[i]) in FIXED_SPLIT_SOURCES:
            fixed[Path(paths[i]).name.split("__")[1].split("_")[0]].append(i)
        else:
            by_key.setdefault(k, []).append(i)
    for idxs in by_key.values():
        rng.shuffle(idxs)
        n_te, n_va = int(len(idxs) * test), int(len(idxs) * val)
        te += idxs[:n_te]
        va += idxs[n_te:n_te + n_va]
        tr += idxs[n_te + n_va:]
    return tr, va, te


@torch.no_grad()
def evaluate(model, loader, classes, device, sources=None):
    """Returns fine-class acc, 3-bin acc, a 3x3 bin confusion matrix (rows = true),
    and, if `sources` (one per sample, in loader order) is given, 3-bin acc per source."""
    model.eval()
    M = bin_matrix(classes).to(device)
    fine_to_bin = M.argmax(1)
    conf = torch.zeros(len(BINS), len(BINS), dtype=torch.long)
    fine_ok = n = 0
    src_ok, src_n = Counter(), Counter()
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        with torch.autocast(device.type, enabled=device.type == "cuda"):
            probs = model(x).float().softmax(1)
        fine_ok += (probs.argmax(1) == y).sum().item()
        pred_bin = (probs @ M).argmax(1)
        true_bin = fine_to_bin[y]
        for t, p in zip(true_bin.tolist(), pred_bin.tolist()):
            conf[t, p] += 1
            if sources:
                src_n[sources[n]] += 1
                src_ok[sources[n]] += t == p
            n += 1
    per_source = {s: src_ok[s] / src_n[s] for s in sorted(src_n)}
    return fine_ok / n, conf.diag().sum().item() / n, conf, per_source


def print_confusion(conf):
    print(f"{'true \\ pred':>12s}" + "".join(f"{b:>11s}" for b in BINS) + "     recall")
    for i, b in enumerate(BINS):
        row = conf[i]
        print(f"{b:>12s}" + "".join(f"{v:>11d}" for v in row.tolist()) + f"     {row[i] / row.sum():.3f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA)
    ap.add_argument("--extra", type=Path, help="folder of your own photos, same class subfolders")
    ap.add_argument("--init", type=Path, help="checkpoint to start from")
    ap.add_argument("--epochs", type=int, default=10)
    ap.add_argument("--epoch-size", type=int, default=12000, help="images sampled per epoch")
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--size", type=int, default=320)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--out", type=Path, default=Path("checkpoints/best.pt"))
    args = ap.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("device:", device)
    train_tf, eval_tf = make_transforms(args.size)

    if not args.data.exists():
        raise SystemExit(f"{args.data} not found -- run: python import_data.py")
    base_train = datasets.ImageFolder(args.data, transform=train_tf)
    base_eval = datasets.ImageFolder(args.data, transform=eval_tf)
    classes = base_train.classes
    sources = [source_of(p) for p, _ in base_train.samples]
    tr, va, te = split_indices(list(zip(sources, base_train.targets)), paths=[p for p, _ in base_train.samples])
    print(f"train {len(tr)}  val {len(va)}  test {len(te)}  classes {classes}")

    train_sets = [Subset(base_train, tr)]
    train_targets = [base_train.targets[i] for i in tr]
    if args.extra:
        extra = datasets.ImageFolder(args.extra, transform=train_tf)
        # remap extra's class indices onto the base dataset's
        unknown = set(extra.classes) - set(classes)
        if unknown:
            raise SystemExit(f"{args.extra} has folders {unknown} not in {classes}")
        remap = {i: classes.index(c) for i, c in enumerate(extra.classes)}
        extra.target_transform = remap.get
        train_sets.append(extra)
        train_targets += [remap[t] for t in extra.targets]
        print(f"added {len(extra)} extra images from {args.extra}")
    train_ds = ConcatDataset(train_sets)

    # Balance classes so the model doesn't ignore small ones (biological = all of compost, trash)
    counts = Counter(train_targets)
    weights = [1.0 / counts[t] for t in train_targets]
    sampler = WeightedRandomSampler(weights, num_samples=args.epoch_size, replacement=True)

    dl = dict(batch_size=args.batch, num_workers=args.workers, pin_memory=True, persistent_workers=True)
    train_dl = DataLoader(train_ds, sampler=sampler, drop_last=True, **dl)
    val_dl = DataLoader(Subset(base_eval, va), **dl)
    test_dl = DataLoader(Subset(base_eval, te), **dl)

    model = build_model(len(classes), pretrained=True)
    if args.init:
        model.load_state_dict(torch.load(args.init, map_location="cpu")["model"])
    model.to(device)

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=args.lr, total_steps=args.epochs * len(train_dl))
    scaler = torch.amp.GradScaler(enabled=device.type == "cuda")
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    best = 0.0
    for epoch in range(1, args.epochs + 1):
        model.train()
        total = 0.0
        for x, y in train_dl:
            x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
            opt.zero_grad(set_to_none=True)
            with torch.autocast(device.type, enabled=device.type == "cuda"):
                loss = loss_fn(model(x), y)
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
            sched.step()
            total += loss.item()
        fine, bin_acc, _, _ = evaluate(model, val_dl, classes, device)
        print(f"epoch {epoch}: loss {total / len(train_dl):.3f}  val fine {fine:.3f}  val 3-bin {bin_acc:.3f}", flush=True)
        if bin_acc >= best:
            best = bin_acc
            torch.save({"model": model.state_dict(), "classes": classes, "size": args.size}, args.out)

    model.load_state_dict(torch.load(args.out, map_location=device)["model"])
    fine, bin_acc, conf, per_source = evaluate(model, test_dl, classes, device, [sources[i] for i in te])
    print(f"\nTEST  {len(classes)}-class acc {fine:.3f}   3-bin acc {bin_acc:.3f}\n")
    print_confusion(conf)
    print("\n3-bin acc by source: " + "  ".join(f"{s} {a:.3f}" for s, a in per_source.items()))
    print(f"saved {args.out}")


if __name__ == "__main__":
    main()
