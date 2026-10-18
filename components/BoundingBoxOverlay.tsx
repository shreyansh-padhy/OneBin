"use client";

import type { SortedItem } from "@/lib/sorter";

const BIN_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  compost: {
    border: "border-emerald-500",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-600 text-white",
  },
  recycling: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    badge: "bg-blue-600 text-white",
  },
  trash: {
    border: "border-slate-700",
    bg: "bg-slate-700/10",
    badge: "bg-slate-800 text-white",
  },
};

interface BoundingBoxOverlayProps {
  items: SortedItem[];
  imageWidth: number;
  imageHeight: number;
  selectedIdx: number;
  onSelect: (index: number) => void;
}

export default function BoundingBoxOverlay({
  items,
  imageWidth,
  imageHeight,
  selectedIdx,
  onSelect,
}: BoundingBoxOverlayProps) {
  if (items.length === 0 || !imageWidth || !imageHeight) return null;

  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full">
      {items.map((it, idx) => {
        if (!it.box) return null;
        const { x0, y0, x1, y1 } = it.box;
        const left = `${(x0 / imageWidth) * 100}%`;
        const top = `${(y0 / imageHeight) * 100}%`;
        const width = `${((x1 - x0) / imageWidth) * 100}%`;
        const height = `${((y1 - y0) / imageHeight) * 100}%`;

        const bin = it.verdict.bin.toLowerCase();
        const colors = BIN_COLORS[bin] ?? BIN_COLORS.trash;
        const isSelected = idx === selectedIdx;

        return (
          <div
            key={idx}
            style={{ left, top, width, height }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(idx);
            }}
            className={`pointer-events-auto absolute cursor-pointer rounded-lg border-2 transition-all ${
              colors.border
            } ${colors.bg} ${
              isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg scale-[1.01]" : "opacity-85 hover:opacity-100"
            }`}
          >
            <div className="absolute -top-6 left-0 flex items-center gap-1">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow ${colors.badge}`}
              >
                {it.verdict.bin} {Math.round(it.verdict.confidence * 100)}%
              </span>
              <span className="rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
                {it.verdict.item}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
