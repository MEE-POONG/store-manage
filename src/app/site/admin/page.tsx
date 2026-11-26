import { headers } from "next/headers";
import { read } from "@/lib/server/db";
import { formatBaht, getPlan } from "@/lib/saas/plans";
import { shopOrigin } from "@/lib/saas/hosts";
import ResetDemoButton from "@/components/saas/ResetDemoButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "หลังบ้าน | SabaiPOS" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  processing: "bg-amber-100 text-amber-700",
  paid: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  active: "bg-emerald-100 text-emerald-700",
};

function Badge({ s }: { s: string }) {
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[s] || "bg-slate-100"}`}>{s}</span>;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

export default function AdminPage() {
  const db = read((d) => d);
  const host = headers().get("host");
  const revenue = db.orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const mrr = db.tenants.reduce((s, t) => {
    const p = getPlan(t.plan);
    if (!p) return s;
    return s + (t.billingCycle === "yearly" ? p.yearlyPrice / 12 : p.monthlyPrice);
  }, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-600">สำหรับทีมงาน</p>
          <h1 className="text-3xl font-extrabold tracking-tight">หลังบ้านระบบเช่า</h1>
        </div>
        <ResetDemoButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["ร้านที่เปิดใช้งาน", String(db.tenants.length)],
          ["รายได้ประจำ/เดือน (MRR)", formatBaht(Math.round(mrr))],
          ["ยอดรับชำระทั้งหมด", formatBaht(revenue)],
          ["Webhook ที่ได้รับ", String(db.webhookEvents.length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs font-bold text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-extrabold">{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">ร้านค้า (Tenants)</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr><th className="p-3">ร้าน</th><th className="p-3">ที่อยู่</th><th className="p-3">แพ็กเกจ</th><th className="p-3">เจ้าของ</th><th className="p-3">สถานะ</th><th className="p-3">หมดรอบ</th></tr>
            </thead>
            <tbody>
              {db.tenants.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">ยังไม่มีร้าน ลองสมัครจากหน้าแรก</td></tr>
              )}
              {db.tenants.map((t) => {
                const owner = db.users.find((u) => u.id === t.ownerUserId);
                return (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="p-3 font-bold">{t.name}</td>
                    <td className="p-3"><a className="font-mono text-emerald-700 hover:underline" href={shopOrigin(t.slug, host)} target="_blank">{t.slug}</a></td>
                    <td className="p-3">{getPlan(t.plan)?.name} · {t.billingCycle === "yearly" ? "ปี" : "เดือน"}</td>
                    <td className="p-3">{owner?.name}<br /><span className="text-xs text-slate-400">{owner?.email}</span></td>
                    <td className="p-3"><Badge s={t.status} /></td>
                    <td className="p-3 text-xs">{fmt(t.currentPeriodEnd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-extrabold">คำสั่งซื้อ / การชำระเงิน</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">เวลา</th><th className="p-3">slug</th><th className="p-3">ยอด</th><th className="p-3">สถานะ</th></tr></thead>
              <tbody>
                {db.orders.slice(0, 20).map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="p-3 text-xs">{fmt(o.createdAt)}</td>
                    <td className="p-3 font-mono">{o.slug}</td>
                    <td className="p-3">{formatBaht(o.amount)}</td>
                    <td className="p-3"><Badge s={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-lg font-extrabold">Webhook log</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">เวลา</th><th className="p-3">event</th><th className="p-3">ผล</th></tr></thead>
              <tbody>
                {db.webhookEvents.slice(0, 20).map((e) => (
                  <tr key={e.id + e.receivedAt} className="border-t border-slate-100">
                    <td className="p-3 text-xs">{fmt(e.receivedAt)}</td>
                    <td className="p-3"><span className="font-mono text-xs">{e.type}</span><br /><Badge s={e.status === "successful" ? "completed" : "failed"} /></td>
                    <td className="p-3 text-xs">{e.result}{!e.signatureValid && " ⚠️"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
