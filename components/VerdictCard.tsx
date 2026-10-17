import { AlertTriangle, Info } from "lucide-react";
import type { ModelMeta, Verdict } from "@/lib/classifier";

// Full class names so Tailwind keeps them (colors are defined in tailwind.config.ts).
const BIN_STYLE: Record<string, { card: string; bar: string; text: string }> = {
  compost: { card: "border-compost bg-compost-light", bar: "bg-compost", text: "text-compost-dark" },
  recycling: { card: "border-recycling bg-recycling-light", bar: "bg-recycling", text: "text-recycling-dark" },
  trash: { card: "border-trash bg-trash-light", bar: "bg-trash", text: "text-trash-dark" },
};

const ITEM_LABEL: Record<string, string> = {
  battery: "Battery",
  biological: "Food / organic waste",
  cardboard: "Cardboard",
  clothes: "Clothing",
  glass: "Glass",
  metal: "Metal",
  paper: "Paper",
  plastic: "Plastic",
  plastic_bag: "Plastic bag / film",
  shoes: "Shoes",
  styrofoam: "Styrofoam",
  trash: "General trash",
};

export const itemLabel = (c: string) => ITEM_LABEL[c] ?? c.replace(/_/g, " ");
const pct = (p: number) => `${Math.round(p * 100)}%`;

export default function VerdictCard({ verdict, meta }: { verdict: Verdict; meta: ModelMeta }) {
  const style = BIN_STYLE[verdict.bin] ?? BIN_STYLE.trash;
  return (
    <section aria-live="polite" className={`space-y-4 rounded-2xl border-2 p-5 ${style.card}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Put it in</p>
        <h2 className={`text-3xl font-extrabold ${style.text}`}>{meta.binDisplay[verdict.bin] ?? verdict.bin}</h2>
        <p className="mt-1 text-sm text-slate-700">
          Looks like: <span className="font-semibold">{itemLabel(verdict.item)}</span> · {pct(verdict.confidence)} sure
        </p>
      </div>

      {verdict.warnings.map((w) => (
        <p key={w} className="flex gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
        </p>
      ))}
      {verdict.lowConfidence && (
        <p className="flex gap-2 rounded-lg bg-white/70 p-3 text-sm text-slate-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> Not sure. Try another angle with the item filling the frame.
          When in doubt, put it in the trash.
        </p>
      )}

      <div className="space-y-1.5">
        {verdict.binProbs.map(({ bin, p }) => (
          <div key={bin} className="flex items-center gap-2 text-xs text-slate-700">
            <span className="w-20 capitalize">{bin}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
              <div className={`h-full rounded-full ${(BIN_STYLE[bin] ?? BIN_STYLE.trash).bar}`} style={{ width: pct(p) }} />
            </div>
            <span className="w-10 text-right tabular-nums">{pct(p)}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Top guesses: {verdict.topItems.map((t) => `${itemLabel(t.item)} ${pct(t.p)}`).join(" · ")} ·{" "}
        {Math.round(verdict.ms)} ms
      </p>
    </section>
  );
}
