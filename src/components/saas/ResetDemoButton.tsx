"use client";

import { RotateCcw } from "lucide-react";

export default function ResetDemoButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/demo/reset", { method: "POST" });
        window.location.reload();
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
    >
      <RotateCcw className="h-4 w-4" /> ล้างข้อมูลเดโม
    </button>
  );
}
