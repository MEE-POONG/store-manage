import { headers } from "next/headers";
import { SearchX } from "lucide-react";
import { marketingOrigin } from "@/lib/saas/hosts";
import Logo from "./Logo";

export default function ShopNotFound({ slug }: { slug: string }) {
  const site = marketingOrigin(headers().get("host"), headers().get("x-forwarded-proto"));
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <Logo />
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <SearchX className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">ไม่พบร้าน “{slug}”</h1>
        <p className="mt-2 text-sm text-slate-500">
          ยังไม่มีร้านที่ใช้ที่อยู่นี้ ถ้าเป็นชื่อร้านของคุณ สามารถจองชื่อนี้ได้เลย
        </p>
        <a
          href={`${site}/signup?slug=${encodeURIComponent(slug)}`}
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          เปิดร้านชื่อนี้
        </a>
      </div>
    </div>
  );
}
