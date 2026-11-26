import Link from "next/link";
import Logo from "@/components/saas/Logo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-bold text-amber-950">
        โหมดเดโม · ระบบชำระเงินเป็นการจำลอง ไม่มีการตัดเงินจริง
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold text-slate-600 sm:gap-4">
            <Link href="/#features" className="hidden rounded-lg px-3 py-2 hover:text-slate-900 sm:inline">
              ฟีเจอร์
            </Link>
            <Link href="/#pricing" className="rounded-lg px-3 py-2 hover:text-slate-900">
              ราคา
            </Link>
            <Link href="/admin" className="hidden rounded-lg px-3 py-2 hover:text-slate-900 sm:inline">
              หลังบ้าน
            </Link>
            <Link
              href="/signup?plan=pro"
              className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700"
            >
              เปิดร้านเลย
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} SabaiPOS · ระบบ POS ให้เช่าสำหรับร้านค้าไทย</p>
        </div>
      </footer>
    </div>
  );
}
