"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (frame: HTMLCanvasElement) => void;
  onClose: () => void;
};

/** Live camera preview (rear camera on phones) with a shutter button. */
export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    onCapture(canvas);
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900">
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
          {/* the model sees the center square, so frame the item inside it */}
          <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/60" />
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            aria-label="Take photo"
            className="absolute bottom-4 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/30 text-white backdrop-blur transition hover:bg-white/50 disabled:opacity-40"
          >
            <Camera className="h-7 w-7" />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
