export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 text-3xl font-bold shadow-sm mx-auto">
          ♻️
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          OneBin
        </h1>
        <p className="text-sm text-slate-600">
          Zero-shot multimodal waste classification powered by Gemini &amp; Next.js.
        </p>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm text-xs text-slate-500">
          Scaffolding initialized. Ready for Gemini API route and Camera UI.
        </div>
      </div>
    </main>
  );
}
