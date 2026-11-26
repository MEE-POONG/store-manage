import { Store } from "lucide-react";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
        <Store className="h-5 w-5" />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        Sabai<span className="text-emerald-500">POS</span>
      </span>
    </span>
  );
}
