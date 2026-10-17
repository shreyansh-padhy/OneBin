import Link from "next/link";
import MunicipalitySelector from "@/components/MunicipalitySelector";
import Sorter from "@/components/Sorter";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 py-8">
      <header className="space-y-3 text-center">
        <div className="flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-slate-900">♻️ OneBin</span>
          <MunicipalitySelector />
        </div>
        <p className="text-sm text-slate-600">Compost, recycling, or trash? Show it one item.</p>
      </header>

      <Sorter />

      <footer className="space-y-2 pt-4 text-center text-xs text-slate-400">
        <p>Runs entirely in your browser. Your photos never leave your device.</p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span>📺 Live Stage Scoreboard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
