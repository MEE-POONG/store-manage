import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  Globe2,
  ScanBarcode,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import PricingSection from "@/components/saas/PricingSection";
import { TRIAL_DAYS } from "@/lib/saas/plans";

const FEATURES = [
  { icon: ScanBarcode, title: "ขายไว สแกนบาร์โค้ด", desc: "ยิงบาร์โค้ดหรือใช้กล้องมือถือ ตัดสต็อกอัตโนมัติทุกบิล" },
  { icon: Boxes, title: "สต็อกแม่นยำ", desc: "รับของเข้า ตัดของเสีย แจ้งเตือนสินค้าใกล้หมด" },
  { icon: BarChart3, title: "รู้กำไรทุกวัน", desc: "แดชบอร์ดยอดขาย กำไรขั้นต้น สินค้าขายดี" },
  { icon: Users, title: "พนักงาน & สิทธิ์", desc: "PIN 4 หลัก แยกสิทธิ์เจ้าของ ผู้จัดการ แคชเชียร์" },
  { icon: Smartphone, title: "ใช้ได้ทุกอุปกรณ์", desc: "คอม แท็บเล็ต มือถือ ไม่ต้องลงโปรแกรม" },
  { icon: Globe2, title: "ที่อยู่ร้านของคุณเอง", desc: "ได้ลิงก์ร้านเฉพาะ เช่น yourshop.sabaipos.com" },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> ทดลองใช้ฟรี {TRIAL_DAYS} วัน · ยกเลิกได้ทุกเมื่อ
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              เปิดร้านออนไลน์บนระบบ POS
              <br />
              <span className="text-emerald-400">พร้อมขายใน 1 นาที</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              เลือกแพ็กเกจ ตั้งชื่อร้าน ชำระเงิน แล้วเข้าหน้าร้านของคุณได้ทันที ไม่ต้องติดตั้ง ไม่ต้องมีเซิร์ฟเวอร์
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup?plan=pro"
                className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
              >
                เริ่มเปิดร้าน
              </Link>
              <Link href="#pricing" className="rounded-xl border border-white/20 px-6 py-3 font-bold hover:bg-white/10">
                ดูราคา
              </Link>
            </div>
          </div>

          {/* Steps card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-bold text-emerald-300">ขั้นตอนเปิดร้าน</p>
            <ol className="mt-4 space-y-4">
              {[
                ["เลือกแพ็กเกจ", "รายเดือนหรือรายปี (ประหยัด 2 เดือน)"],
                ["ตั้งชื่อร้าน + ที่อยู่ร้าน", "เช่น somchai.localhost เช็คชื่อว่างได้ทันที"],
                ["ชำระเงิน", "บัตรเครดิต / พร้อมเพย์"],
                ["เข้าหน้าร้านอัตโนมัติ", "ระบบสร้างร้านและบัญชีเจ้าของให้ทันที"],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-slate-950">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-sm text-slate-400">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">ครบทุกอย่างที่ร้านค้าต้องใช้</h2>
        <p className="mt-3 text-center text-slate-500">ออกแบบมาสำหรับร้านค้าปลีกและมินิมาร์ทในไทย</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
              <f.icon className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-4 font-extrabold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <PricingSection />

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">คำถามที่พบบ่อย</h2>
        <div className="mt-10 space-y-3">
          {[
            ["เปลี่ยนแพ็กเกจภายหลังได้ไหม?", "ได้ทุกเมื่อ ระบบคิดส่วนต่างตามจำนวนวันที่เหลือ"],
            ["ข้อมูลร้านเก็บที่ไหน?", "แต่ละร้านมีพื้นที่ข้อมูลแยกกัน ร้านอื่นมองไม่เห็นข้อมูลของคุณ"],
            ["ชำระเงินช่องทางไหนได้บ้าง?", "บัตรเครดิต/เดบิต และพร้อมเพย์ (ผ่านผู้ให้บริการชำระเงินที่ได้มาตรฐาน)"],
            ["ยกเลิกได้ไหม?", "ยกเลิกได้ทุกเมื่อ ไม่มีสัญญาผูกมัด"],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-slate-200 p-5 open:bg-slate-50">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                {q}
                <CheckCircle2 className="h-5 w-5 text-slate-300 group-open:text-emerald-500" />
              </summary>
              <p className="mt-3 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
