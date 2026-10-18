// Two-stage multi-item sorter running 100% in-browser via onnxruntime-web (WASM).
// Stage 1: TACO YOLO detector finds all waste items on conveyor / in bin.
// Stage 2: 12-class EfficientNet classifier classifies each cropped item into Compost, Recycling, or Trash.
// Matches Python sorter.py (PAD=10%, det_conf=0.35, fallback to single-item).

import type * as Ort from "onnxruntime-web";
import { Classifier, type ModelMeta, type Verdict, loadClassifier } from "@/lib/classifier";

export type BoundingBox = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence: number;
};

export type SortedItem = {
  box: BoundingBox | null;
  verdict: Verdict;
};

export type DetectorMeta = {
  source: string;
  architecture: string;
  size: number;
  confidenceThreshold: number;
  iouThreshold: number;
  classes: string[];
  pad: number;
};

const DETECTOR_URL = "/models/detector.onnx";
const DETECTOR_META_URL = "/models/detector.json";

function iou(a: BoundingBox, b: BoundingBox): number {
  const x0 = Math.max(a.x0, b.x0);
  const y0 = Math.max(a.y0, b.y0);
  const x1 = Math.min(a.x1, b.x1);
  const y1 = Math.min(a.y1, b.y1);
  const inter = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  const areaA = (a.x1 - a.x0) * (a.y1 - a.y0);
  const areaB = (b.x1 - b.x0) * (b.y1 - b.y0);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

function nonMaxSuppression(boxes: BoundingBox[], iouThreshold: number): BoundingBox[] {
  boxes.sort((a, b) => b.confidence - a.confidence);
  const kept: BoundingBox[] = [];
  for (const b of boxes) {
    if (kept.every((k) => iou(k, b) < iouThreshold)) {
      kept.push(b);
    }
  }
  return kept;
}

export class TwoStageSorter {
  constructor(
    private ort: typeof Ort,
    private detectorSession: Ort.InferenceSession | null,
    readonly detectorMeta: DetectorMeta,
    readonly classifier: Classifier,
  ) {}

  /** Run two-stage sorting: returns one SortedItem per detected object, or 1 item for whole image. */
  async sort(source: CanvasImageSource, width: number, height: number): Promise<SortedItem[]> {
    const boxes = await this.detect(source, width, height);

    // If no items detected, fallback to single-item classification on the whole image
    if (boxes.length === 0) {
      const verdict = await this.classifier.classify(source, width, height);
      return [{ box: null, verdict }];
    }

    // Crop each detected item with 10% context padding and classify
    const pad = this.detectorMeta.pad ?? 0.1;
    const sorted: SortedItem[] = [];

    for (const box of boxes) {
      const bw = box.x1 - box.x0;
      const bh = box.y1 - box.y0;
      const px = bw * pad;
      const py = bh * pad;

      const cropX = Math.max(0, box.x0 - px);
      const cropY = Math.max(0, box.y0 - py);
      const cropW = Math.min(width, box.x1 + px) - cropX;
      const cropH = Math.min(height, box.y1 + py) - cropY;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = Math.max(1, Math.round(cropW));
      cropCanvas.height = Math.max(1, Math.round(cropH));
      const ctx = cropCanvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropCanvas.width, cropCanvas.height);
        const verdict = await this.classifier.classify(cropCanvas, cropCanvas.width, cropCanvas.height);
        sorted.push({ box, verdict });
      }
    }

    return sorted.length > 0 ? sorted : [{ box: null, verdict: await this.classifier.classify(source, width, height) }];
  }

  /** Run object detection stage only. */
  async detect(source: CanvasImageSource, width: number, height: number): Promise<BoundingBox[]> {
    if (!this.detectorSession) return [];

    const detSize = this.detectorMeta.size || 640;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = detSize;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(source, 0, 0, width, height, 0, 0, detSize, detSize);
    const rgba = ctx.getImageData(0, 0, detSize, detSize).data;
    const plane = detSize * detSize;
    const chw = new Float32Array(3 * plane);

    // Normalize 0..1 RGB BCHW
    for (let i = 0; i < plane; i++) {
      chw[i] = rgba[4 * i] / 255;
      chw[plane + i] = rgba[4 * i + 1] / 255;
      chw[2 * plane + i] = rgba[4 * i + 2] / 255;
    }

    const inputTensor = new this.ort.Tensor("float32", chw, [1, 3, detSize, detSize]);
    const out = await this.detectorSession.run({ images: inputTensor });
    inputTensor.dispose();

    const outputData = out.output0.data as Float32Array;
    // Output shape: [1, 5, 8400]
    // row 0: cx, row 1: cy, row 2: w, row 3: h, row 4: conf
    const numAnchors = 8400;
    const confThresh = this.detectorMeta.confidenceThreshold || 0.35;
    const candidates: BoundingBox[] = [];

    const scaleX = width / detSize;
    const scaleY = height / detSize;

    for (let i = 0; i < numAnchors; i++) {
      const conf = outputData[4 * numAnchors + i];
      if (conf >= confThresh) {
        const cx = outputData[i] * scaleX;
        const cy = outputData[numAnchors + i] * scaleY;
        const w = outputData[2 * numAnchors + i] * scaleX;
        const h = outputData[3 * numAnchors + i] * scaleY;

        candidates.push({
          x0: Math.max(0, cx - w / 2),
          y0: Math.max(0, cy - h / 2),
          x1: Math.min(width, cx + w / 2),
          y1: Math.min(height, cy + h / 2),
          confidence: conf,
        });
      }
    }

    return nonMaxSuppression(candidates, this.detectorMeta.iouThreshold || 0.45);
  }
}

let sorterInstance: Promise<TwoStageSorter> | null = null;

export function loadSorter(onProgress?: (progress: number | null) => void): Promise<TwoStageSorter> {
  sorterInstance ??= loadSorterInternal(onProgress).catch((err) => {
    sorterInstance = null;
    throw err;
  });
  return sorterInstance;
}

async function loadSorterInternal(onProgress?: (progress: number | null) => void): Promise<TwoStageSorter> {
  const classifier = await loadClassifier(onProgress);
  const ort = (await import("onnxruntime-web/wasm")) as typeof Ort;

  let detectorSession: Ort.InferenceSession | null = null;
  let detectorMeta: DetectorMeta = {
    source: "detector.pt",
    architecture: "YOLO26-s",
    size: 640,
    confidenceThreshold: 0.35,
    iouThreshold: 0.45,
    classes: ["item"],
    pad: 0.1,
  };

  try {
    const [metaRes, modelBytes] = await Promise.all([
      fetch(DETECTOR_META_URL).catch(() => null),
      fetch(DETECTOR_URL).then(async (r) => {
        if (!r.ok) throw new Error(`Could not load ${DETECTOR_URL} (HTTP ${r.status})`);
        return new Uint8Array(await r.arrayBuffer());
      }),
    ]);

    if (metaRes && metaRes.ok) {
      detectorMeta = await metaRes.json();
    }

    detectorSession = await ort.InferenceSession.create(modelBytes, { executionProviders: ["wasm"] });
  } catch (err) {
    console.warn("Could not load detector.onnx, falling back to single-item mode:", err);
  }

  return new TwoStageSorter(ort, detectorSession, detectorMeta, classifier);
}
