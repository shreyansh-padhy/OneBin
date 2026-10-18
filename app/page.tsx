import Sorter from "@/components/Sorter";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 py-8 sm:px-6">
      <header className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">♻️ OneBin</h1>
        <p className="text-sm text-slate-600">Compost, recycling, or trash? Multi-item sorting.</p>
      </header>

      <Sorter />

      <footer className="space-y-2 pt-4 text-center text-xs text-slate-500">
        <p>Runs entirely in your browser. Automatic edge waste sorting.</p>
      </footer>
    </main>
  );
}
