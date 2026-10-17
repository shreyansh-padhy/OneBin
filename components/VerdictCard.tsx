"use client";

import { AlertTriangle, Info, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { ModelMeta, Verdict } from "@/lib/classifier";
import type { ClassificationResult } from "@/lib/types";

// Full class names so Tailwind keeps them (colors are defined in tailwind.config.ts).
const BIN_STYLE: Record<string, { card: string; bar: string; text: string }> = {
  compost: { card: "border-compost bg-compost-light", bar: "bg-compost", text: "text-compost-dark" },
  recycling: { card: "border-recycling bg-recycling-light", bar: "bg-recycling", text: "text-recycling-dark" },
  trash: { card: "border-trash bg-trash-light", bar: "bg-trash", text: "text-trash-dark" },
};

const ITEM_LABEL: Record<string, string> = {
  battery: "Battery",
  biological: "Food / organic waste",
  cardboard: "Cardboard",
  clothes: "Clothing",
  glass: "Glass",
  metal: "Metal",
  paper: "Paper",
  plastic: "Plastic",
  plastic_bag: "Plastic bag / film",
  shoes: "Shoes",
  styrofoam: "Styrofoam",
  trash: "General trash",
};

export const itemLabel = (c: string) => ITEM_LABEL[c] ?? c.replace(/_/g, " ");
const pct = (p: number) => `${Math.round(p * 100)}%`;

export default function VerdictCard({
  verdict,
  meta,
  photo,
}: {
  verdict: Verdict;
  meta: ModelMeta;
  photo?: string | null;
}) {
  const style = BIN_STYLE[verdict.bin] ?? BIN_STYLE.trash;
  const [geminiResult, setGeminiResult] = useState<ClassificationResult | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Reset Gemini state when photo/verdict changes
  useEffect(() => {
    setGeminiResult(null);
    setGeminiError(null);
    setLoadingGemini(false);
  }, [photo, verdict]);

  async function fetchGeminiExplanation() {
    if (!photo) return;
    setLoadingGemini(true);
    setGeminiError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || "Gemini classification failed.");
      }
      setGeminiResult(data);
    } catch (err) {
      setGeminiError(err instanceof Error ? err.message : "Failed to obtain Gemini explanation.");
    } finally {
      setLoadingGemini(false);
    }
  }

  return (
    <section aria-live="polite" className={`space-y-4 rounded-2xl border-2 p-5 ${style.card}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Put it in</p>
        <h2 className={`text-3xl font-extrabold ${style.text}`}>{meta.binDisplay[verdict.bin] ?? verdict.bin}</h2>
        <p className="mt-1 text-sm text-slate-700">
          Looks like: <span className="font-semibold">{itemLabel(verdict.item)}</span> · {pct(verdict.confidence)} sure
        </p>
      </div>

      {verdict.warnings.map((w) => (
        <p key={w} className="flex gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
        </p>
      ))}
      {verdict.lowConfidence && (
        <p className="flex gap-2 rounded-lg bg-white/70 p-3 text-sm text-slate-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> Not sure. Try another angle with the item filling the frame.
          When in doubt, put it in the trash.
        </p>
      )}

      <div className="space-y-1.5">
        {verdict.binProbs.map(({ bin, p }) => (
          <div key={bin} className="flex items-center gap-2 text-xs text-slate-700">
            <span className="w-20 capitalize">{bin}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
              <div className={`h-full rounded-full ${(BIN_STYLE[bin] ?? BIN_STYLE.trash).bar}`} style={{ width: pct(p) }} />
            </div>
            <span className="w-10 text-right tabular-nums">{pct(p)}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Top guesses: {verdict.topItems.map((t) => `${itemLabel(t.item)} ${pct(t.p)}`).join(" · ")} ·{" "}
        {Math.round(verdict.ms)} ms (on-device)
      </p>

      {/* Hybrid AI Deep Rationale Integration */}
      {photo && !geminiResult && (
        <button
          type="button"
          onClick={fetchGeminiExplanation}
          disabled={loadingGemini}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {loadingGemini ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Analyzing with Gemini 2.5 Flash…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Explain with Gemini AI</span>
            </>
          )}
        </button>
      )}

      {geminiResult && (
        <div className="rounded-xl border border-indigo-200 bg-white/95 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-900">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Gemini AI Sorting Rationale</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {geminiResult.material}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-600">
            Identified: <span className="text-slate-900 font-semibold">{geminiResult.itemName}</span> ({pct(geminiResult.confidence)} confidence)
          </p>
          <p className="text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-2">
            {geminiResult.rationale}
          </p>
          {geminiResult.warnings && geminiResult.warnings.length > 0 && (
            <div className="space-y-1 pt-1">
              {geminiResult.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-900 bg-amber-50 rounded-lg p-2 flex items-start gap-1.5 border border-amber-200/60">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {geminiError && (
        <p className="text-xs text-slate-600 bg-white/70 rounded-lg p-2.5 border border-slate-200">
          ℹ️ Gemini AI explanation: {geminiError}
        </p>
      )}
    </section>
  );
}
