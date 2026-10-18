import Link from "next/link";
import Sorter from "@/components/Sorter";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/60 overflow-hidden">
      {/* Ambient background soft glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <main className="relative mx-auto min-h-screen w-full max-w-md space-y-6 px-4 py-8">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-slate-700">WASM ONNX · Zero Cloud Latency</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>♻️ OneBin</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Multi-item optical sorting for compost, recycling, and trash
          </p>
        </header>

      <Sorter />

      <footer className="space-y-2 pt-4 text-center text-xs text-slate-400">
        <p>Runs entirely in your browser. Automatic edge waste sorting.</p>
        {/* Presentation Scoreboard preserved on /dashboard route and branch feat/hackathon-presentation-dashboard-and-rules */}
        {/*
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span>📺 Live Stage Scoreboard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </Link>
        </div>
        */}
      </footer>
    </main>
  </div>
);
}
