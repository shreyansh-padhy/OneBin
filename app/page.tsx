import Link from "next/link";
import Sorter from "@/components/Sorter";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 py-8">
      <header className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">♻️ OneBin</h1>
        <p className="text-sm text-slate-600">Compost, recycling, or trash? Multi-item sorting.</p>
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
  );
}
