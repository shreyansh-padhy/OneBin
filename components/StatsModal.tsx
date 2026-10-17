"use client";

import { BarChart3, CheckCircle2, Leaf, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { computeImpactStats, getLocalScanHistory, type ImpactStats, type ScanEvent } from "@/lib/supabase";
import { itemLabel } from "@/components/VerdictCard";

const BIN_BADGE: Record<string, string> = {
  compost: "bg-emerald-100 text-emerald-800 border-emerald-300",
  recycling: "bg-blue-100 text-blue-800 border-blue-300",
  trash: "bg-slate-200 text-slate-800 border-slate-300",
};

export default function StatsModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<ScanEvent[]>([]);
  const [stats, setStats] = useState<ImpactStats>({
    totalScans: 0,
    compostCount: 0,
    recyclingCount: 0,
    trashCount: 0,
    diversionRate: 0,
    co2SavedKg: 0,
  });

  useEffect(() => {
    const data = getLocalScanHistory();
    setHistory(data);
    setStats(computeImpactStats(data));
  }, []);

  function clearHistory() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("onebin_scan_history");
      setHistory([]);
      setStats(computeImpactStats([]));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-lg">Impact & Scan History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Scans</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.totalScans}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <div className="flex items-center justify-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold uppercase tracking-wide">Diverted</p>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-emerald-800">{stats.diversionRate}%</p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
              <div className="flex items-center justify-center gap-1 text-teal-700">
                <Leaf className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold uppercase tracking-wide">CO₂ Saved</p>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-teal-800">{stats.co2SavedKg} <span className="text-xs font-normal">kg</span></p>
            </div>
          </div>

          {/* Stream Bars */}
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Stream Breakdown</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>🟢 Compost</span>
                <span className="font-semibold">{stats.compostCount} items</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>🔵 Recycling</span>
                <span className="font-semibold">{stats.recyclingCount} items</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>⚫ Trash</span>
                <span className="font-semibold">{stats.trashCount} items</span>
              </div>
            </div>
          </div>

          {/* History List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recent Scans</p>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                No scans recorded yet. Scan your first item to see your impact!
              </p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {history.slice(0, 15).map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{itemLabel(ev.item)}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {ev.ms ? ` · ${Math.round(ev.ms)}ms` : ""}
                      </p>
                    </div>
                    <span className={`capitalize px-2 py-0.5 rounded-full border text-[11px] font-semibold ${BIN_BADGE[ev.bin] || BIN_BADGE.trash}`}>
                      {ev.bin}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
