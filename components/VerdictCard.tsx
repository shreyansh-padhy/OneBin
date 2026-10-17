"use client";

import { AlertTriangle, Cpu, Info, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ModelMeta, Verdict } from "@/lib/classifier";
import { isSerialConnected, sendBinCommand } from "@/lib/serial";

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
}: {
  verdict: Verdict;
  meta: ModelMeta;
  photo?: string | null;
}) {
  const style = BIN_STYLE[verdict.bin] ?? BIN_STYLE.trash;
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [iotFired, setIotFired] = useState(false);

  // Native Web Speech synthesis readout (zero external API keys)
  const speakVerdict = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech

    const binName = verdict.bin.charAt(0).toUpperCase() + verdict.bin.slice(1);
    const itemName = itemLabel(verdict.item);
    let speechText = `${binName}! Looks like ${itemName}.`;

    if (verdict.warnings.length > 0) {
      speechText += ` Warning: ${verdict.warnings[0]}`;
    } else if (verdict.lowConfidence) {
      speechText += ` Low confidence. When in doubt, put it in the trash.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [verdict]);

  // Trigger speech on new verdict if enabled
  useEffect(() => {
    if (voiceEnabled) {
      speakVerdict();
    }
  }, [verdict, voiceEnabled, speakVerdict]);

  // IoT Web Serial actuation: automatically send command if serial port is open
  useEffect(() => {
    if (isSerialConnected()) {
      sendBinCommand(verdict.bin).then((success) => {
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Put it in</p>
          <h2 className={`text-3xl font-extrabold ${style.text}`}>{meta.binDisplay[verdict.bin] ?? verdict.bin}</h2>
          <p className="mt-1 text-sm text-slate-700">
            Looks like: <span className="font-semibold">{itemLabel(verdict.item)}</span> · {pct(verdict.confidence)} sure
          </p>
        </div>

        {/* Audio Speech Controls */}
        <div className="flex items-center gap-1.5">
          {iotFired && (
            <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white animate-pulse">
              <Cpu className="h-3 w-3" /> Lid Opened
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (speaking) {
                window.speechSynthesis?.cancel();
                setSpeaking(false);
              } else {
                speakVerdict();
              }
            }}
            title={speaking ? "Stop voice" : "Speak verdict"}
            className="rounded-full bg-white/80 p-2 text-slate-700 shadow-sm hover:bg-white hover:text-slate-900 transition-colors"
          >
            <Volume2 className={`h-4 w-4 ${speaking ? "text-emerald-600 animate-bounce" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (voiceEnabled) window.speechSynthesis?.cancel();
              setVoiceEnabled(!voiceEnabled);
            }}
            title={voiceEnabled ? "Mute automatic voice" : "Enable automatic voice"}
            className="rounded-full bg-white/80 p-2 text-slate-500 shadow-sm hover:bg-white hover:text-slate-900 transition-colors"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
          </button>
        </div>
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
    </section>
  );
}
