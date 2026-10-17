"use client";

import { Camera, Loader2, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import VerdictCard from "@/components/VerdictCard";
import { type Classifier, loadClassifier, type Verdict } from "@/lib/classifier";

type ModelState = { status: "loading"; progress: number | null } | { status: "ready" } | { status: "error"; message: string };

/** Camera / upload -> in-browser model -> verdict. */
export default function Sorter() {
  const classifier = useRef<Classifier | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [model, setModel] = useState<ModelState>({ status: "loading", progress: 0 });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function startLoading() {
    setModel({ status: "loading", progress: 0 });
    loadClassifier((progress) => setModel({ status: "loading", progress }))
      .then((c) => {
        classifier.current = c;
        setModel({ status: "ready" });
      })
      .catch((err: Error) => setModel({ status: "error", message: err.message }));
  }
  useEffect(startLoading, []);

  async function classify(frame: HTMLCanvasElement) {
    setCameraOpen(false);
    setPhoto(frame.toDataURL("image/jpeg", 0.85));
    setVerdict(null);
    setError(null);
    setBusy(true);
    try {
      const c = classifier.current ?? (await loadClassifier());
      setVerdict(await c.classify(frame, frame.width, frame.height));
    } catch (err) {
      setError(`Classification failed: ${(err as Error).message}`);
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
      await classify(canvas);
    } catch {
      setError("Couldn't read that image. Try a .jpg, .png or .webp photo.");
    }
  }

  function reset() {
    setPhoto(null);
    setVerdict(null);
    setError(null);
  }

  const ready = model.status === "ready";

  return (
    <div className="space-y-4">
      {model.status === "loading" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the sorting model
            {model.progress !== null && ` · ${Math.round(model.progress * 100)}%`}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-slate-400 transition-all" style={{ width: `${(model.progress ?? 0) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">About 42 MB, downloaded once, then cached.</p>
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
          className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white ${
            dragging ? "border-recycling bg-recycling-light" : "border-slate-300"
          }`}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL, nothing to optimize
            <img src={photo} alt="Item being sorted" className="h-full w-full object-cover" />
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              Take a photo of one item, or drop an image here.
              <br />
              Fill the frame with the item for the best result.
            </p>
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
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <Camera className="h-5 w-5" /> {photo ? "Retake" : "Camera"}
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
          >
            <Upload className="h-5 w-5" /> Upload
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

      {busy && !ready && <p className="text-center text-sm text-slate-500">Waiting for the model to finish loading…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {verdict && classifier.current && <VerdictCard verdict={verdict} meta={classifier.current.meta} />}
      {(verdict || error) && (
        <button
          type="button"
          onClick={reset}
          className="mx-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="h-4 w-4" /> Sort another item
        </button>
      )}
    </div>
  );
}
