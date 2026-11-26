"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  RotateCcw,
  Store,
} from "lucide-react";
import { formatBaht } from "@/lib/saas/plans";

interface OrderView {
  id: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  shopName: string;
  slug: string;
  email: string;
  status: string;
}

type Phase = "form" | "processing" | "done" | "failed";

const STEPS = [
  "ส่งคำสั่งชำระเงินไปยัง Payment Gateway",
  "รอยืนยันผลจากธนาคาร (webhook)",
  "สร้างร้านและพื้นที่ข้อมูลแยกของร้าน",
  "สร้างบัญชีเจ้าของร้าน",
  "พร้อมใช้งาน",
];

const FAIL_CARD = "4000 0000 0000 0002";
const OK_CARD = "4242 4242 4242 4242";

function FakeQR({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const n = 25;
    const out: boolean[] = [];
    for (let i = 0; i < n * n; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      out.push((h >> 16) % 2 === 0);
    }
    return { n, out };
  }, [seed]);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#0f172a" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0f172a" />
    </g>
  );
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
  return (
    <svg viewBox="0 0 25 25" className="h-48 w-48" shapeRendering="crispEdges">
      <rect width={25} height={25} fill="#fff" />
      {cells.out.map((on, i) => {
        const x = i % cells.n;
        const y = Math.floor(i / cells.n);
        return on && !inFinder(x, y) ? <rect key={i} x={x} y={y} width={1} height={1} fill="#0f172a" /> : null;
      })}
      {finder(0, 0)}
      {finder(18, 0)}
      {finder(0, 18)}
    </svg>
  );
}

export default function CheckoutClient({ order }: { order: OrderView }) {
  const [method, setMethod] = useState<"card" | "promptpay">("card");
  const [card, setCard] = useState(OK_CARD);
  const [name, setName] = useState("SOMCHAI JAIDEE");
  const [exp, setExp] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [phase, setPhase] = useState<Phase>(order.status === "completed" ? "done" : "form");
  const [step, setStep] = useState(0);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(4);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pay = async (outcome: "success" | "fail") => {
    setPhase("processing");
    setStep(0);
    setFailure(null);
    const res = await fetch("/api/mock-payment/charge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: order.id, method, outcome }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPhase("failed");
      setFailure(data.error || "ไม่สามารถชำระเงินได้");
      return;
    }
    setChargeId(data.chargeId);
    setStep(1);
    startPolling();
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/checkout/${order.id}`, { cache: "no-store" });
      const s = await r.json();
      if (s.status === "failed") {
        clearInterval(pollRef.current!);
        setPhase("failed");
        setFailure(s.failureMessage);
      } else if (s.status === "completed") {
        clearInterval(pollRef.current!);
        // แสดงขั้นตอนให้เห็นทีละขั้น
        setStep(2);
        setTimeout(() => setStep(3), 600);
        setTimeout(() => setStep(4), 1200);
        setTimeout(() => {
          setRedirectUrl(s.redirectUrl);
          setPhase("done");
        }, 1700);
      }
    }, 600);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ถ้าเปิดหน้านี้ซ้ำหลังจ่ายแล้ว
  useEffect(() => {
    if (order.status === "completed" || order.status === "processing") startPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "done" || !redirectUrl) return;
    if (countdown <= 0) {
      window.location.href = redirectUrl;
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, redirectUrl, countdown]);

  const cardDigits = card.replace(/\D/g, "");
  const willFail = cardDigits === FAIL_CARD.replace(/\s/g, "");

  const input =
    "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_340px]">
      <div>
        <p className="text-sm font-bold text-emerald-600">ขั้นตอนที่ 2 จาก 2</p>
        <h1 className="text-3xl font-extrabold tracking-tight">ชำระเงิน</h1>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {phase === "form" && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold">
                <button onClick={() => setMethod("card")} className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 ${method === "card" ? "bg-white shadow-sm" : "text-slate-500"}`}>
                  <CreditCard className="h-4 w-4" /> บัตรเครดิต/เดบิต
                </button>
                <button onClick={() => setMethod("promptpay")} className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 ${method === "promptpay" ? "bg-white shadow-sm" : "text-slate-500"}`}>
                  <QrCode className="h-4 w-4" /> พร้อมเพย์
                </button>
              </div>

              {method === "card" ? (
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-600">หมายเลขบัตร</label>
                  <input className={input} value={card} onChange={(e) => setCard(e.target.value)} />
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <button type="button" onClick={() => setCard(OK_CARD)} className="rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                      บัตรทดสอบ: ผ่าน
                    </button>
                    <button type="button" onClick={() => setCard(FAIL_CARD)} className="rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-700">
                      บัตรทดสอบ: ถูกปฏิเสธ
                    </button>
                  </div>
                  <label className="mt-4 block text-xs font-bold text-slate-600">ชื่อบนบัตร</label>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600">วันหมดอายุ</label>
                      <input className={input} value={exp} onChange={(e) => setExp(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600">CVC</label>
                      <input className={input} value={cvc} onChange={(e) => setCvc(e.target.value)} />
                    </div>
                  </div>
                  <button
                    onClick={() => pay(willFail ? "fail" : "success")}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
                  >
                    <Lock className="h-4 w-4" /> ชำระเงิน {formatBaht(order.amount)}
                  </button>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center text-center">
                  <div className="rounded-2xl border-2 border-sky-900 p-3">
                    <p className="mb-2 rounded bg-sky-900 py-1 text-xs font-extrabold tracking-widest text-white">PromptPay</p>
                    <FakeQR seed={order.id} />
                  </div>
                  <p className="mt-3 text-2xl font-extrabold">{formatBaht(order.amount)}</p>
                  <p className="text-sm text-slate-500">สแกนด้วยแอปธนาคารใดก็ได้ · QR หมดอายุใน 15 นาที</p>
                  <button
                    onClick={() => pay("success")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white hover:bg-sky-800"
                  >
                    <CheckCircle2 className="h-4 w-4" /> จำลอง: ลูกค้าสแกนจ่ายแล้ว
                  </button>
                </div>
              )}
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" /> Mock Gateway · ไม่มีการตัดเงินจริง (ภายหลังเปลี่ยนเป็น Omise/Stripe)
              </p>
            </>
          )}

          {phase === "processing" && (
            <div className="py-4">
              <h2 className="text-lg font-extrabold">กำลังดำเนินการ...</h2>
              {chargeId && <p className="font-mono text-xs text-slate-400">charge: {chargeId}</p>}
              <ol className="mt-5 space-y-3">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    {i < step ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : i === step ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    ) : (
                      <span className="h-5 w-5 rounded-full border-2 border-slate-200" />
                    )}
                    <span className={i <= step ? "font-semibold text-slate-900" : "text-slate-400"}>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {phase === "done" && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold">ชำระเงินสำเร็จ!</h2>
              <p className="mt-1 text-slate-500">ร้าน “{order.shopName}” พร้อมใช้งานแล้ว</p>
              {redirectUrl ? (
                <>
                  <a href={redirectUrl} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
                    <Store className="h-4 w-4" /> เข้าสู่ร้านของฉัน
                  </a>
                  <p className="mt-3 text-xs text-slate-400">กำลังพาไปที่ร้านใน {countdown} วินาที...</p>
                </>
              ) : (
                <p className="mt-6 text-sm text-slate-500">
                  เข้าร้านได้ที่ <span className="font-mono font-bold">{order.slug}.localhost</span> ด้วยอีเมล {order.email}
                </p>
              )}
            </div>
          )}

          {phase === "failed" && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold">ชำระเงินไม่สำเร็จ</h2>
              <p className="mt-1 text-slate-500">{failure}</p>
              <button
                onClick={() => { setPhase("form"); setCard(OK_CARD); }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" /> ลองอีกครั้ง
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-bold text-slate-500">สรุปคำสั่งซื้อ</p>
          <p className="mt-3 text-lg font-extrabold">{order.shopName}</p>
          <p className="font-mono text-sm text-emerald-700">{order.slug}.localhost</p>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">แพ็กเกจ</span><span className="font-bold">{order.planName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">รอบบิล</span><span className="font-bold">{order.billingCycle === "yearly" ? "รายปี" : "รายเดือน"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">อีเมล</span><span className="truncate pl-4 font-bold">{order.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">เลขที่คำสั่งซื้อ</span><span className="font-mono text-xs">{order.id}</span></div>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">ยอดชำระ</span>
            <span className="text-2xl font-extrabold">{formatBaht(order.amount)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
