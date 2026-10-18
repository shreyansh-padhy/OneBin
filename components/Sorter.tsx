"use client";

import { Camera, Cpu, Layers, Loader2, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";
import CameraCapture from "@/components/CameraCapture";
import SerialActuatorModal from "@/components/SerialActuatorModal";
import VerdictCard from "@/components/VerdictCard";
import type { Classifier, Verdict } from "@/lib/classifier";
import { isSerialConnected } from "@/lib/serial";
import { loadSorter, type SortedItem, type TwoStageSorter } from "@/lib/sorter";
import { logScanEvent } from "@/lib/supabase";

type ModelState = { status: "loading"; progress: number | null } | { status: "ready" } | { status: "error"; message: string };

/** Camera / upload -> in-browser model -> verdict with Auto-Scan, Multi-Item Bounding Boxes, Telemetry & IoT. */
export default function Sorter() {
  const sorter = useRef<TwoStageSorter | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [model, setModel] = useState<ModelState>({ status: "loading", progress: 0 });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [sortedItems, setSortedItems] = useState<SortedItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialActive, setSerialActive] = useState(false);

  function startLoading() {
    setModel({ status: "loading", progress: 0 });
    loadSorter((progress) => setModel({ status: "loading", progress }))
      .then((s) => {
        sorter.current = s;
        setModel({ status: "ready" });
      })
      .catch((err: Error) => setModel({ status: "error", message: err.message }));
  }
  useEffect(startLoading, []);

  async function classify(frame: HTMLCanvasElement, isAuto = false) {
    if (!isAuto) {
      setCameraOpen(false);
      setPhoto(frame.toDataURL("image/jpeg", 0.85));
      setVerdict(null);
    }
    setError(null);
    setBusy(true);

    try {
      const s = sorter.current ?? (await loadSorter());
      const items = await s.sort(frame, frame.width, frame.height);
      setSortedItems(items);
      setSelectedIdx(0);
      setImageDims({ width: frame.width, height: frame.height });

      const activeVerdict = items[0]?.verdict ?? null;
      setVerdict(activeVerdict);

      // Log telemetry events for all detected items (manual mode only to prevent auto-scan spam)
      if (!isAuto) {
        for (const it of items) {
          logScanEvent({
            bin: it.verdict.bin,
            item: it.verdict.item,
            confidence: it.verdict.confidence,
            ms: it.verdict.ms,
          });
        }
      }
    } catch (err) {
      if (!isAuto) {
        setError(`Classification failed: ${(err as Error).message}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function classifyFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That file isn't an image. Try a .jpg, .png or .webp photo.");
    try {
      const bitmap = await createImageBitmap(file); // applies EXIF rotation
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      await classify(canvas, false);
    } catch {
      setError("Couldn't read that image. Try a .jpg, .png or .webp photo.");
    }
  }

  function reset() {
    setPhoto(null);
    setVerdict(null);
    setSortedItems([]);
    setSelectedIdx(0);
    setImageDims(null);
    setError(null);
  }

  const ready = model.status === "ready";

  return (
    <div className="space-y-4">

      {model.status === "loading" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the multi-item sorting models
            {model.progress !== null && ` · ${Math.round(model.progress * 100)}%`}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-slate-400 transition-all" style={{ width: `${(model.progress ?? 0) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">Two-stage edge models (YOLO detector + classifier), cached locally.</p>
        </div>
      )}
      {model.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Couldn&apos;t load the model: {model.message}{" "}
          <button type="button" onClick={startLoading} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {cameraOpen ? (
        <CameraCapture onCapture={classify} onClose={() => setCameraOpen(false)} />
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            classifyFile(e.dataTransfer.files[0]);
          }}
          // Square drop zone until a photo is loaded, then the photo's own shape (capped for tall photos)
          className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white ${
            photo && imageDims ? "max-h-[75vh]" : "aspect-square"
          } ${dragging ? "border-recycling bg-recycling-light" : "border-slate-300"}`}
          style={photo && imageDims ? { aspectRatio: `${imageDims.width} / ${imageDims.height}` } : undefined}
        >
          {photo ? (
            // Size this box to the photo's exact aspect ratio (whole photo visible, no cropping)
            // so BoundingBoxOverlay's percentage positions land on the right pixels.
            <div
              className={`relative ${!imageDims ? "h-full w-full" : imageDims.width >= imageDims.height ? "w-full" : "h-full"}`}
              style={imageDims ? { aspectRatio: `${imageDims.width} / ${imageDims.height}` } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, nothing to optimize */}
              <img src={photo} alt="Item being sorted" className="h-full w-full object-contain" />
              {imageDims && sortedItems.length > 0 && sortedItems[0].box && (
                <BoundingBoxOverlay
                  items={sortedItems}
                  imageWidth={imageDims.width}
                  imageHeight={imageDims.height}
                  selectedIdx={selectedIdx}
                  onSelect={(idx) => {
                    setSelectedIdx(idx);
                    setVerdict(sortedItems[idx].verdict);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center p-6 text-center">
              {/* Optical scanner corner reticles */}
              <div className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-slate-400 rounded-tl" />
              <div className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-slate-400 rounded-tr" />
              <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-slate-400 rounded-bl" />
              <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-slate-400 rounded-br" />

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 text-slate-600 shadow-sm">
                <Camera className="h-6 w-6 text-slate-500" />
              </div>

              <p className="text-sm font-semibold text-slate-800">
                Drop item photo or open camera
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-[240px]">
                TACO multi-object detector identifies items on the belt in real-time
              </p>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            </div>
          )}
        </div>
      )}

      {!cameraOpen && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Camera className="h-5 w-5 text-emerald-400" /> {photo ? "Retake" : "Open Camera"}
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Upload className="h-5 w-5 text-slate-500" /> Upload Image
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              classifyFile(e.target.files?.[0]);
              e.target.value = ""; // allow picking the same file again
            }}
          />
        </div>
      )}

      {busy && !ready && <p className="text-center text-sm text-slate-500">Waiting for models to finish loading…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {/* Multi-Item Detected Selector Pill Bar */}
      {sortedItems.length > 1 && sortedItems[0].box && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Layers className="h-4 w-4" /> Multi-Item Stream Detected
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
              {sortedItems.length} items
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortedItems.map((it, idx) => {
              const isSelected = idx === selectedIdx;
              const binStyle =
                it.verdict.bin === "compost"
                  ? isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : it.verdict.bin === "recycling"
                  ? isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                  : isSelected
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedIdx(idx);
                    setVerdict(it.verdict);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${binStyle}`}
                >
                  <span>#{idx + 1} {it.verdict.bin.toUpperCase()}</span>
                  <span className="text-[10px] opacity-80">({it.verdict.item})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Live Verdict Display for currently active item */}
      {verdict && sorter.current && (
        <VerdictCard verdict={verdict} meta={sorter.current.classifier.meta} photo={photo} />
      )}

      {(verdict || error) && !cameraOpen && (
        <button
          type="button"
          onClick={reset}
          className="mx-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="h-4 w-4" /> Sort another item
        </button>
      )}

      {/* Optional Physical Smart Bin Connection (Hardware) */}
      <div className="flex items-center justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowSerialModal(true)}
          className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
            serialActive ? "font-semibold text-emerald-700" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Cpu className={`h-3.5 w-3.5 ${serialActive ? "text-emerald-600 animate-pulse" : "text-slate-400"}`} />
          <span>{serialActive ? "Smart Bin Connected (9600 baud)" : "Connect Physical Smart Bin (USB)"}</span>
        </button>
      </div>

      {/* Physical IoT Smart Bin Actuation Modal */}
      {showSerialModal && (
        <SerialActuatorModal
          onClose={() => {
            setShowSerialModal(false);
            setSerialActive(isSerialConnected());
          }}
        />
      )}
    </div>
  );
}
