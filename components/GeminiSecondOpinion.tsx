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
    let debounceTimer: NodeJS.Timeout | null = null;

    if (isUncertain) {
      // Debounce by 1200ms: prevents continuous cancellation storms during live 900ms Auto-Scan pulses.
      // Fires only when the camera holds steady on an object or when user pauses/freezes.
      debounceTimer = setTimeout(() => {
        fetchSecondOpinion();
      }, 1200);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
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
    const isUnidentified =
      result.confidence < 0.35 ||
      result.itemName.toLowerCase().includes("unidentified") ||
      result.itemName.toLowerCase().includes("no identifiable") ||
      result.itemName.toLowerCase().includes("unknown");

    const binColor = isUnidentified
      ? "bg-slate-100 text-slate-700 border-slate-300"
      : result.bin === "compost"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : result.bin === "recycling"
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : "bg-slate-800 text-white border-slate-900";

    const displayBadge = isUnidentified ? "AMBIGUOUS / UNKNOWN" : result.bin;

    return (
      <section
        aria-label="Gemini Second Opinion"
        className="rounded-xl border border-indigo-200 bg-white/95 p-3.5 shadow-sm space-y-2 text-slate-800"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-indigo-700">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Gemini Second Opinion</span>
            <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 whitespace-nowrap">
              gemini-3.7-flash
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {Math.round(result.confidence * 100)}% confident
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-2 pt-1">
          <span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${binColor}`}>
            {displayBadge}
          </span>
          <span className="font-bold text-base text-slate-900">{result.itemName}</span>
          {result.material && <span className="text-xs font-medium text-slate-500">· {result.material}</span>}
        </div>

        <p className="text-sm leading-relaxed text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-2xs">
          {result.rationale}
        </p>

        {result.warnings && result.warnings.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {result.warnings.map((w, i) => (
              <p
                key={i}
                className="text-xs font-medium text-amber-900 bg-amber-50/90 border border-amber-200/80 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
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
        className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-white hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1"
      >
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
        <span>Ask Gemini Second Opinion</span>
      </button>
    </div>
  );
}
