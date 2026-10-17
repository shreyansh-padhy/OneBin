"use client";

import { Check, ChevronDown, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSelectedMunicipality,
  MUNICIPALITIES,
  type Municipality,
  setSelectedMunicipality,
} from "@/lib/rules";

export default function MunicipalitySelector() {
  const [current, setCurrent] = useState<Municipality>("seattle");
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setCurrent(getSelectedMunicipality());
  }, []);

  function handleSelect(mun: Municipality) {
    setSelectedMunicipality(mun);
    setCurrent(mun);
    setOpen(false);
  }

  const activeRules = MUNICIPALITIES[current];

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-slate-50"
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          <span>Rules: {activeRules.name}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
          title="View active sorting guidelines"
        >
          {showDetails ? "Hide Rules" : "Details"}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Select Municipality
          </div>
          {(Object.keys(MUNICIPALITIES) as Municipality[]).map((key) => {
            const m = MUNICIPALITIES[key];
            const isSelected = key === current;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  isSelected ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div>{m.name}</div>
                  <div className="text-[10px] text-slate-400">{m.tagline}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}

      {showDetails && (
        <div className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {activeRules.name} Policies
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
              Edge Config
            </span>
          </div>

          <ul className="mt-2.5 space-y-2 text-[11px] text-slate-600">
            <li>
              <strong className="text-slate-800">Plastic Bags:</strong> {activeRules.keyPolicies.plasticBags}
            </li>
            <li>
              <strong className="text-slate-800">Styrofoam:</strong> {activeRules.keyPolicies.styrofoam}
            </li>
            <li>
              <strong className="text-slate-800">Soiled Paper:</strong> {activeRules.keyPolicies.foodSoiledPaper}
            </li>
            <li>
              <strong className="text-slate-800">Coffee Cups:</strong> {activeRules.keyPolicies.coffeeCups}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
