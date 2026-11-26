"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { PLANS, formatBaht, type BillingCycle } from "@/lib/saas/plans";

export default function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  return (
    <section id="pricing" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">เลือกแพ็กเกจที่ใช่สำหรับร้านคุณ</h2>
        <p className="mt-3 text-center text-slate-500">ราคารวม VAT แล้ว · ทุกแพ็กเกจทดลองใช้ฟรี 14 วัน</p>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                  cycle === c ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {c === "monthly" ? "รายเดือน" : "รายปี"}
                {c === "yearly" && (
                  <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                    ประหยัด 2 เดือน
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => {
            const price = cycle === "yearly" ? p.yearlyPrice : p.monthlyPrice;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-3xl bg-white p-7 ${
                  p.highlight ? "shadow-xl ring-2 ring-emerald-500" : "shadow-sm ring-1 ring-slate-200"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                    ยอดนิยม
                  </span>
                )}
                <h3 className="text-lg font-extrabold">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.tagline}</p>
                <p className="mt-5">
                  <span className="text-4xl font-extrabold tracking-tight">{formatBaht(price)}</span>
                  <span className="text-sm text-slate-500"> / {cycle === "yearly" ? "ปี" : "เดือน"}</span>
                </p>
                {cycle === "yearly" && (
                  <p className="text-xs font-semibold text-emerald-600">
                    เฉลี่ย {formatBaht(Math.round(p.yearlyPrice / 12))} / เดือน
                  </p>
                )}
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center text-[11px] text-slate-500">
                  <div><p className="font-extrabold text-slate-800">{p.limits.branches}</p>สาขา</div>
                  <div><p className="font-extrabold text-slate-800">{p.limits.employees}</p>พนักงาน</div>
                  <div><p className="font-extrabold text-slate-800">{p.limits.products}</p>สินค้า</div>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/signup?plan=${p.id}&cycle=${cycle}`}
                  className={`mt-7 rounded-xl py-3 text-center text-sm font-bold transition ${
                    p.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  เลือก {p.name}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
