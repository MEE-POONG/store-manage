"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PLANS, formatBaht, priceFor, type BillingCycle, type PlanId } from "@/lib/saas/plans";
import { normalizeSlug } from "@/lib/saas/slug";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

type SlugState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok"; slug: string }
  | { state: "bad"; reason: string };

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

export default function SignupForm({
  initialPlan,
  initialCycle,
  initialSlug,
}: {
  initialPlan: PlanId;
  initialCycle: BillingCycle;
  initialSlug: string;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState(normalizeSlug(initialSlug));
  const [slugTouched, setSlugTouched] = useState(!!initialSlug);
  const [slugState, setSlugState] = useState<SlugState>({ state: "idle" });
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [port, setPort] = useState("");
  const reqId = useRef(0);

  useEffect(() => setPort(window.location.port ? `:${window.location.port}` : ""), []);

  // ชื่อร้านภาษาอังกฤษ -> เดา slug ให้อัตโนมัติ
  useEffect(() => {
    if (!slugTouched) setSlug(normalizeSlug(shopName));
  }, [shopName, slugTouched]);

  // เช็คชื่อว่าง (debounce)
  useEffect(() => {
    if (!slug) {
      setSlugState({ state: "idle" });
      return;
    }
    setSlugState({ state: "checking" });
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/slug-check?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (id !== reqId.current) return;
      setSlugState(data.available ? { state: "ok", slug: data.slug } : { state: "bad", reason: data.reason });
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  const selected = PLANS.find((p) => p.id === plan)!;
  const amount = priceFor(selected, cycle);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, billingCycle: cycle, shopName, slug, ownerName, email, phone, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.errors || { form: "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" });
      setSubmitting(false);
      return;
    }
    router.push(`/checkout/${data.orderId}`);
  };

  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs font-semibold text-rose-600">{errors[k]}</p> : null;

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold text-emerald-600">ขั้นตอนที่ 1 จาก 2</p>
          <h1 className="text-3xl font-extrabold tracking-tight">ตั้งค่าร้านของคุณ</h1>
        </div>

        {/* Plan picker */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold">แพ็กเกจ</h2>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {(["monthly", "yearly"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`rounded-lg px-3 py-1.5 ${cycle === c ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  {c === "monthly" ? "รายเดือน" : "รายปี (-2 เดือน)"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PLANS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  plan === p.id ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-extrabold">{p.name}</p>
                <p className="text-lg font-extrabold text-slate-900">
                  {formatBaht(priceFor(p, cycle))}
                  <span className="text-xs font-semibold text-slate-500">/{cycle === "yearly" ? "ปี" : "เดือน"}</span>
                </p>
                <p className="text-xs text-slate-500">{p.tagline}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Shop */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-extrabold">ข้อมูลร้าน</h2>
          <label className="mt-4 block text-xs font-bold text-slate-600">ชื่อร้าน</label>
          <input className={inputCls} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="เช่น Somchai Mart" required />
          {err("shopName")}

          <label className="mt-4 block text-xs font-bold text-slate-600">ที่อยู่ร้าน (ลิงก์เข้าระบบ)</label>
          <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <span className="flex items-center bg-slate-50 pl-3 text-sm text-slate-400">http://</span>
            <input
              className="min-w-0 flex-1 bg-slate-50 px-1 py-2.5 text-sm font-bold outline-none"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(normalizeSlug(e.target.value));
              }}
              placeholder="somchai-mart"
              required
            />
            <span className="flex items-center bg-slate-50 pr-3 text-sm text-slate-400">.{ROOT}{port}</span>
          </div>
          <div className="mt-1.5 min-h-[20px] text-xs font-semibold">
            {slugState.state === "checking" && (
              <span className="inline-flex items-center gap-1 text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> กำลังตรวจสอบ...</span>
            )}
            {slugState.state === "ok" && (
              <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> ว่าง ใช้ชื่อนี้ได้</span>
            )}
            {slugState.state === "bad" && (
              <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="h-3.5 w-3.5" /> {slugState.reason}</span>
            )}
          </div>
          {err("slug")}
        </section>

        {/* Owner */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-extrabold">บัญชีเจ้าของร้าน</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600">ชื่อ-นามสกุล</label>
              <input className={inputCls} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
              {err("ownerName")}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">เบอร์โทร</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" required />
              {err("phone")}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">อีเมล (ใช้เข้าสู่ระบบ)</label>
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
              {err("email")}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">รหัสผ่าน</label>
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              {err("password")}
            </div>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <p className="text-sm font-bold text-emerald-300">สรุปคำสั่งซื้อ</p>
          <div className="mt-4 flex justify-between text-sm">
            <span>แพ็กเกจ {selected.name} ({cycle === "yearly" ? "รายปี" : "รายเดือน"})</span>
            <span className="font-bold">{formatBaht(amount)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-slate-400">
            <span>ทดลองใช้ฟรี</span>
            <span>+14 วัน</span>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs text-slate-400">ร้านของคุณจะอยู่ที่</p>
            <p className="truncate font-mono text-sm text-emerald-300">{slug || "your-shop"}.{ROOT}{port}</p>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
            <span className="text-sm">ยอดชำระวันนี้</span>
            <span className="text-3xl font-extrabold">{formatBaht(amount)}</span>
          </div>
          {errors.form && <p className="mt-3 text-sm text-rose-300">{errors.form}</p>}
          <button
            disabled={submitting || slugState.state !== "ok"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            ไปหน้าชำระเงิน <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </form>
  );
}
