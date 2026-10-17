import Sorter from "@/components/Sorter";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 py-8">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">♻️ OneBin</h1>
        <p className="text-sm text-slate-600">Compost, recycling, or trash? Show it one item.</p>
      </header>

      <Sorter />

      <footer className="space-y-1 pt-4 text-center text-xs text-slate-400">
        <p>Runs entirely in your browser. Your photos never leave your device.</p>
        <p>Sorting follows Seattle rules. Check your local guidelines.</p>
      </footer>
    </main>
  );
}
