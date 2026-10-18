"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Verdict } from "@/lib/classifier";
import type { ClassificationResult } from "@/lib/types";

interface GeminiSecondOpinionProps {
  verdict: Verdict;
  photo?: string | null;
}

export default function GeminiSecondOpinion({ verdict, photo }: GeminiSecondOpinionProps) {
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const activeReq = useRef<AbortController | null>(null);

  const fetchSecondOpinion = useCallback(async () => {
    if (!photo) return;

    // Abort any ongoing request
    if (activeReq.current) {
      activeReq.current.abort();
    }

    const controller = new AbortController();
    activeReq.current = controller;
    setLoading(true);

    try {
      // 8-second timeout guard to ensure verdict UI is never blocked
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, mimeType: "image/jpeg" }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.ok) {
        const data: ClassificationResult = await res.json();
        setResult(data);
      }
    } catch {
      // Fail silently per specification: ONNX result stands alone without disruption
    } finally {
      setLoading(false);
    }
  }, [photo]);

  // Trigger automatically when ONNX is low-confidence or unsure
  useEffect(() => {
    setResult(null);
    if (!photo) return;

    const isUncertain = verdict.lowConfidence || verdict.confidence < 0.6;
    if (isUncertain) {
      fetchSecondOpinion();
    }

    return () => {
      if (activeReq.current) {
        activeReq.current.abort();
      }
    };
  }, [verdict, photo, fetchSecondOpinion]);

  if (!photo) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3 text-xs text-indigo-900 shadow-sm animate-pulse">
        <Sparkles className="h-4 w-4 text-indigo-600 animate-spin" />
        <span>Consulting Gemini Vision for a second opinion on this ambiguous item…</span>
      </div>
    );
  }

  if (result) {
    const binColor =
      result.bin === "compost"
        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
        : result.bin === "recycling"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : "bg-slate-800 text-white border-slate-900";

    return (
      <section
        aria-label="Gemini Second Opinion"
        className="rounded-xl border border-indigo-200 bg-white/95 p-3.5 shadow-sm space-y-2 text-slate-800"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-indigo-700">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Gemini Second Opinion</span>
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800">
              gemini-3.8-flash
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {Math.round(result.confidence * 100)}% confident
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${binColor}`}>
            {result.bin}
          </span>
          <span className="font-semibold text-sm text-slate-900">{result.itemName}</span>
          {result.material && <span className="text-xs text-slate-500">· {result.material}</span>}
        </div>

        <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          {result.rationale}
        </p>

        {result.warnings && result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <p
                key={i}
                className="text-[11px] font-medium text-amber-800 bg-amber-50 rounded px-2 py-1 flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}
      </section>
    );
  }

  // If high-confidence, offer on-demand second opinion button for judges / testers
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => fetchSecondOpinion()}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-white hover:text-indigo-600 transition-colors shadow-2xs"
      >
        <Sparkles className="h-3 w-3 text-indigo-500" />
        <span>Ask Gemini Second Opinion</span>
      </button>
    </div>
  );
}
