"""Score a checkpoint's 3-bin accuracy on the data/combined test split, per source.

    python evaluate.py checkpoints/best.pt checkpoints/gd_only.pt

Works for checkpoints trained on a different class list: true bins come from the
dataset's folders, predicted bins from the checkpoint's own classes.
"""
import sys
from collections import Counter
from pathlib import Path

import torch
from torch.utils.data import DataLoader, Subset
from torchvision import datasets

from bins import BIN_OF, BINS
from train import DEFAULT_DATA, bin_matrix, build_model, make_transforms, source_of, split_indices


@torch.no_grad()
def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    for path in sys.argv[1:] or ["checkpoints/best.pt"]:
        ckpt = torch.load(path, map_location=device)
        model = build_model(len(ckpt["classes"]))
        model.load_state_dict(ckpt["model"])
        model.eval().to(device)
        M = bin_matrix(ckpt["classes"]).to(device)

        ds = datasets.ImageFolder(DEFAULT_DATA, transform=make_transforms(ckpt["size"])[1])
        sources = [source_of(p) for p, _ in ds.samples]
        _, _, te = split_indices(list(zip(sources, ds.targets)), paths=[p for p, _ in ds.samples])
        true_bin = torch.tensor([BINS.index(BIN_OF[c]) for c in ds.classes])

        ok, n = Counter(), Counter()
        conf = torch.zeros(len(BINS), len(BINS), dtype=torch.long)
        i = 0
        for x, y in DataLoader(Subset(ds, te), batch_size=64, num_workers=6):
            with torch.autocast(device.type, enabled=device.type == "cuda"):
                pred = (model(x.to(device)).float().softmax(1) @ M).argmax(1).cpu()
            for t, p in zip(true_bin[y].tolist(), pred.tolist()):
                conf[t, p] += 1
                ok[sources[te[i]]] += t == p
                n[sources[te[i]]] += 1
                i += 1
        print(f"\n{path}: 3-bin acc {conf.diag().sum().item() / i:.3f}   "
              + "  ".join(f"{s} {ok[s] / n[s]:.3f}" for s in sorted(n)))
        print("  recall " + "  ".join(f"{b} {conf[k, k] / conf[k].sum():.3f}" for k, b in enumerate(BINS)))


if __name__ == "__main__":
    main()
