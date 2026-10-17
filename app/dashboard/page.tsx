"use client";

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  Globe2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  TreePine,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  computeImpactStats,
  fetchRecentScans,
  type ImpactStats,
  type ScanEvent,
  subscribeToLiveScans,
} from "@/lib/supabase";

export default function PresentationDashboard() {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [stats, setStats] = useState<ImpactStats>({
    totalScans: 0,
    compostCount: 0,
    recyclingCount: 0,
    trashCount: 0,
    diversionRate: 0,
    co2SavedKg: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastPing, setLastPing] = useState<string>("Connecting…");

  useEffect(() => {
    // Initial fetch of recent scans
    fetchRecentScans().then((history) => {
      setScans(history);
      setStats(computeImpactStats(history));
      setLastPing("Live sync active");
    });

    // Realtime subscription
    const unsubscribe = subscribeToLiveScans((newScan) => {
      setScans((prev) => {
        // Prevent duplicate IDs
        if (prev.some((s) => s.id === newScan.id)) return prev;
        const updated = [newScan, ...prev].slice(0, 50);
        setStats(computeImpactStats(updated));
        return updated;
      });
      setLastPing(`Latest scan: ${new Date().toLocaleTimeString()}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // Calculate top items
  const itemCounts: Record<string, number> = {};
  for (const s of scans) {
    itemCounts[s.item] = (itemCounts[s.item] || 0) + 1;
  }
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Presentation Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Scanner
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">OneBin Stage Telemetry</h1>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SCOREBOARD
              </span>
            </div>
            <p className="text-xs text-slate-400">Real-time waste diversion metrics for hackathon live pitch</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs text-slate-400 sm:inline-block">
            {lastPing}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Hero Scoreboard Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Diversion Rate Big Card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Landfill Diversion Rate
              </span>
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-black text-white">{stats.diversionRate}%</span>
              <span className="text-xs text-slate-400">diverted</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${stats.diversionRate}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Compost & Recycling diverted from King County Cedar Hills landfill
            </p>
          </div>

          {/* Total Items Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Items Sorted
              </span>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-black text-white">{stats.totalScans}</span>
              <span className="text-xs text-slate-400">items</span>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              Scanned across mobile devices and edge cameras
            </p>
          </div>

          {/* Estimated CO2 Prevented */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                CO₂ GHG Avoided
              </span>
              <TreePine className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-black text-emerald-300">
                {stats.co2SavedKg}
              </span>
              <span className="text-xs text-slate-400">kg CO₂e</span>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              EPA WARM model: ~0.8kg CO₂/kg compost, ~0.5kg/kg recycling
            </p>
          </div>

          {/* Average Latency */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Inference Latency
              </span>
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-black text-amber-300">~28</span>
              <span className="text-xs text-slate-400">ms / item</span>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              100% on-device WebAssembly with SIMD acceleration
            </p>
          </div>
        </div>

        {/* Stream Breakdown Bar */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Compost */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                🟢
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Compost Stream</div>
                <div className="text-xs text-slate-400">Organics & BPI compostables</div>
              </div>
            </div>
            <span className="font-mono text-2xl font-bold text-white">{stats.compostCount}</span>
          </div>

          {/* Recycling */}
          <div className="flex items-center justify-between rounded-2xl border border-blue-900/60 bg-blue-950/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                🔵
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Recycling Stream</div>
                <div className="text-xs text-slate-400">Cardboard, metal, clean plastic</div>
              </div>
            </div>
            <span className="font-mono text-2xl font-bold text-white">{stats.recyclingCount}</span>
          </div>

          {/* Trash */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white font-bold">
                ⚫
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Trash Stream</div>
                <div className="text-xs text-slate-400">Plastic bags, styrofoam, waste</div>
              </div>
            </div>
            <span className="font-mono text-2xl font-bold text-white">{stats.trashCount}</span>
          </div>
        </div>

        {/* Live Stream Table & Top Items */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Live Incoming Feed */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold text-white">Live Classification Stream</h2>
              </div>
              <span className="font-mono text-xs text-slate-500">
                Showing last {scans.length} events
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-800/60 overflow-hidden">
              {scans.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No scan events recorded yet. Open the scanner on your phone to see events appear live!
                </div>
              ) : (
                scans.slice(0, 10).map((s, idx) => {
                  const isCompost = s.bin === "compost";
                  const isRecycling = s.bin === "recycling";
                  return (
                    <div
                      key={s.id ?? idx}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                            isCompost
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isRecycling
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-slate-700/40 text-slate-300"
                          }`}
                        >
                          {isCompost ? "🟢" : isRecycling ? "🔵" : "⚫"}
                        </span>
                        <div>
                          <div className="text-sm font-semibold capitalize text-white">{s.item}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(s.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          {Math.round(s.confidence * 100)}% conf
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            isCompost
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isRecycling
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {s.bin}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Items & Pitch Highlights */}
          <div className="space-y-6">
            {/* Top Items */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" /> Most Frequent Items
              </h2>
              <div className="mt-4 space-y-3">
                {topItems.length === 0 ? (
                  <p className="text-xs text-slate-500">Awaiting items…</p>
                ) : (
                  topItems.map(([item, count]) => {
                    const pct = Math.round((count / stats.totalScans) * 100);
                    return (
                      <div key={item} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize text-slate-200">{item}</span>
                          <span className="font-mono text-slate-400">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Architecture Card */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-emerald-400" /> Zero-Cost Free Tier Stack
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Vercel CDN:</strong> 100 GB/mo bandwidth serving 41.7MB ONNX model.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Vercel Edge Config:</strong> Dynamic municipality sorting rule toggling.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Supabase Free:</strong> 500 MB PostgreSQL + Realtime WebSockets.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
