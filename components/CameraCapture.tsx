"use client";

import { Camera, RefreshCw, X, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (frame: HTMLCanvasElement, isAuto?: boolean) => void;
  onClose: () => void;
};

/** Live camera preview with manual shutter and continuous auto-scan mode. */
export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [scanningPulse, setScanningPulse] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err: Error) =>
        setError(
          err.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access, or upload a photo instead."
            : `Could not open the camera (${err.message}). Try uploading a photo instead.`,
        ),
      );
    if (!navigator.mediaDevices) setError("This browser can't open the camera here. Try uploading a photo instead.");
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const grabFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }, []);

  // Manual snap
  function captureManual() {
    const canvas = grabFrame();
    if (canvas) {
      onCapture(canvas, false);
    }
  }

  // Continuous auto-scan loop (runs every 900ms when autoScan is enabled)
  useEffect(() => {
    if (!ready || !autoScan) return;

    const interval = setInterval(() => {
      const canvas = grabFrame();
      if (canvas) {
        setScanningPulse(true);
        setTimeout(() => setScanningPulse(false), 300);
        onCapture(canvas, true);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [ready, autoScan, grabFrame, onCapture]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-inner">
      {error ? (
        <p className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-200">{error}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setReady(true)}
            className="h-full w-full object-cover"
          />

          {/* Target Reticle (model sees center square) */}
          <div
            className={`pointer-events-none absolute inset-6 rounded-xl border-2 transition-all duration-300 ${
              autoScan
                ? scanningPulse
                  ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                  : "border-emerald-500/70"
                : "border-dashed border-white/60"
            }`}
          >
            {autoScan && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-sm">
                <RefreshCw className="h-3 w-3 animate-spin" /> Live Auto-Scanning
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoScan(!autoScan)}
              aria-pressed={autoScan}
              className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                autoScan
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-black/60 text-white hover:bg-black/80"
              }`}
            >
              {autoScan ? <Zap className="h-3.5 w-3.5 fill-current" /> : <ZapOff className="h-3.5 w-3.5" />}
              Auto-Scan: {autoScan ? "ON" : "OFF"}
            </button>
          </div>

          {/* Shutter Button (manual snapshot) */}
          {!autoScan && (
            <button
              type="button"
              onClick={captureManual}
              disabled={!ready}
              aria-label="Take photo"
              className="absolute bottom-4 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/30 text-white backdrop-blur transition hover:bg-white/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40"
            >
              <Camera className="h-7 w-7" />
            </button>
          )}
        </>
      )}

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        className="absolute right-3 top-3 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
