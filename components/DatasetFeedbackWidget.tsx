"use client";

import { Check, CheckCircle2, ChevronRight, HelpCircle, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { type DatasetFeedback, submitDatasetFeedback } from "@/lib/supabase";

interface DatasetFeedbackWidgetProps {
  photo?: string | null;
  predictedBin: string;
  predictedItem: string;
  confidence: number;
}

const CONSENT_STORAGE_KEY = "onebin_dataset_consent_opt_in";

export default function DatasetFeedbackWidget({
  photo,
  predictedBin,
  predictedItem,
  confidence,
}: DatasetFeedbackWidgetProps) {
  const [consent, setConsent] = useState<boolean>(true);
  const [step, setStep] = useState<"initial" | "correction" | "submitted">("initial");
  const [selectedBin, setSelectedBin] = useState<string>("recycling");
  const [customItem, setCustomItem] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored !== null) {
        setConsent(stored === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleConsentToggle = (checked: boolean) => {
    setConsent(checked);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, String(checked));
    } catch {
      // ignore
    }
  };

  const handleConfirmCorrect = async () => {
    if (!consent) {
      setSubmitMessage("Thank you for your feedback!");
      setStep("submitted");
      return;
    }

    setSubmitting(true);
    const result = await submitDatasetFeedback({
      photoBase64: photo || undefined,
      predictedBin,
      predictedItem,
      confidence,
      userConfirmed: true,
      consentGranted: consent,
    });
    setSubmitting(false);
    setSubmitMessage(result.message || "Confirmed! Added to verified dataset.");
    setStep("submitted");
  };

  const handleStartCorrection = () => {
    // Default corrected bin to something other than the predicted bin if possible
    const altBin = predictedBin === "recycling" ? "trash" : "recycling";
    setSelectedBin(altBin);
    setStep("correction");
  };

  const handleSubmitCorrection = async () => {
    setSubmitting(true);
    const result = await submitDatasetFeedback({
      photoBase64: photo || undefined,
      predictedBin,
      predictedItem,
      confidence,
      userConfirmed: false,
      correctedBin: selectedBin,
      correctedItem: customItem.trim() || predictedItem,
      consentGranted: consent,
    });
    setSubmitting(false);
    setSubmitMessage(result.message || `Correction recorded: Marked as ${selectedBin.toUpperCase()}.`);
    setStep("submitted");
  };

  if (step === "submitted") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 animate-fadeIn">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="font-medium">{submitMessage}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white/90 p-3.5 shadow-sm text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          Did OneBin categorize this correctly?
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-slate-500">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => handleConsentToggle(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
          />
          <span>Consent to training dataset</span>
        </label>
      </div>

      {step === "initial" && (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleConfirmCorrect}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 font-medium text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Yes, looks right</span>
          </button>
          <button
            type="button"
            onClick={handleStartCorrection}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>No, wrong bin</span>
          </button>
        </div>
      )}

      {step === "correction" && (
        <div className="space-y-2.5 pt-1 border-t border-slate-100">
          <p className="text-slate-600 font-medium">Which category does it belong to?</p>
          
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "compost", label: "🟢 Compost" },
              { id: "recycling", label: "🔵 Recycling" },
              { id: "trash", label: "⚫ Trash" },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBin(b.id)}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                  selectedBin === b.id
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Material Selection */}
          <div className="space-y-1.5 pt-1">
            <p className="text-slate-600 font-medium">What is it made out of?</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "metal", label: "🥫 Metal" },
                { id: "paper", label: "📄 Paper" },
                { id: "cardboard", label: "📦 Cardboard" },
                { id: "plastic", label: "🧴 Plastic" },
                { id: "glass", label: "🍾 Glass" },
                { id: "biological", label: "🍎 Food / Organic" },
                { id: "styrofoam", label: "🥡 Styrofoam" },
                { id: "battery", label: "🔋 Battery" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setCustomItem(m.label.split(" ")[1]);
                    // Auto-suggest appropriate bin for common materials (Seattle rules)
                    if (m.id === "biological") setSelectedBin("compost");
                    else if (["metal", "paper", "cardboard", "glass", "plastic"].includes(m.id)) setSelectedBin("recycling");
                    else if (["styrofoam", "battery"].includes(m.id)) setSelectedBin("trash");
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    customItem.toLowerCase().includes(m.id) || customItem.toLowerCase().includes(m.label.split(" ")[1].toLowerCase())
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="custom-item-input" className="text-[11px] text-slate-500">
              What is it made out of? (optional description):
            </label>
            <input
              id="custom-item-input"
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="e.g. metal soda can, greasy paper, cardboard box, plastic pouch"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmitCorrection}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-1.5 font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{submitting ? "Submitting..." : "Submit Ground-Truth"}</span>
            </button>
            <button
              type="button"
              onClick={() => setStep("initial")}
              disabled={submitting}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {consent && (
        <p className="text-[10px] text-slate-400 leading-tight">
          Photo (JPEG) &amp; confirmed labels will be uploaded to Supabase to train future model iterations.
        </p>
      )}
    </div>
  );
}
