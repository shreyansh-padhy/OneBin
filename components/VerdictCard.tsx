"use client";

import { AlertTriangle, Cpu, Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { ModelMeta, Verdict } from "@/lib/classifier";
import { isSerialConnected, sendGatedBinCommand } from "@/lib/serial";
import DatasetFeedbackWidget from "@/components/DatasetFeedbackWidget";
import GeminiSecondOpinion from "@/components/GeminiSecondOpinion";

// Spatial theme tokens aligned with antigravity-design-expert & tailwind-design-system
const BIN_STYLE: Record<string, { card: string; bar: string; text: string; badge: string }> = {
  compost: {
    card: "border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/30 shadow-[0_12px_36px_rgba(16,185,129,0.14)] ring-1 ring-emerald-500/20",
    bar: "bg-emerald-500",
    text: "text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  recycling: {
    card: "border-blue-200/90 bg-gradient-to-b from-blue-50/90 via-white to-blue-50/30 shadow-[0_12px_36px_rgba(37,99,235,0.14)] ring-1 ring-blue-500/20",
    bar: "bg-blue-500",
    text: "text-blue-900",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  trash: {
    card: "border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/30 shadow-[0_12px_36px_rgba(71,85,105,0.14)] ring-1 ring-slate-500/20",
    bar: "bg-slate-500",
    text: "text-slate-900",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
  },
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
  const [iotFired, setIotFired] = useState(false);

  // IoT Web Serial actuation: gated command preventing flapping and low-confidence triggers
  useEffect(() => {
    if (isSerialConnected()) {
      sendGatedBinCommand(verdict.bin, verdict.confidence, verdict.lowConfidence).then((success) => {
        if (success) {
          setIotFired(true);
          setTimeout(() => setIotFired(false), 2000);
        }
      });
    }
  }, [verdict]);

  return (
    <section aria-live="polite" className={`space-y-4 rounded-2xl border-2 p-5 ${style.card}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Destination Stream</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${verdict.lowConfidence ? "bg-amber-100 text-amber-900 border-amber-300" : style.badge}`}>
              {verdict.lowConfidence ? "UNSURE / AMBIGUOUS" : verdict.bin.toUpperCase()}
            </span>
          </div>
          <h2 className={`mt-0.5 text-3xl font-black tracking-tight ${verdict.lowConfidence ? "text-slate-700" : style.text}`}>
            {verdict.lowConfidence ? "Needs Clearer View" : (meta.binDisplay[verdict.bin] ?? verdict.bin)}
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            {verdict.lowConfidence
              ? `Uncertain guess: ${itemLabel(verdict.item)} (${pct(verdict.confidence)})`
              : <>Identified: <span className="font-semibold text-slate-900">{itemLabel(verdict.item)}</span> · <span className="font-semibold">{pct(verdict.confidence)}</span> confidence</>}
          </p>
        </div>

        {iotFired && (
          <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white animate-pulse">
            <Cpu className="h-3.5 w-3.5" /> Lid Diverter Opened
          </span>
        )}
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

      {/* Gemini Multimodal Second Opinion (active on low confidence / on-demand) */}
      <GeminiSecondOpinion verdict={verdict} photo={photo} />

      {/* Human-in-the-Loop Dataset Collection & User Verification */}
      <DatasetFeedbackWidget
        photo={photo}
        predictedBin={verdict.bin}
        predictedItem={verdict.item}
        confidence={verdict.confidence}
      />
    </section>
  );
}
