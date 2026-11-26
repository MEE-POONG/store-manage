import { NextRequest, NextResponse } from "next/server";
import { classifyHost } from "@/lib/saas/hosts";

/**
 * แยกเว็บตาม hostname (แอป Next.js เดียว):
 *   store-management.localhost:3000/*  ->  /site/*        (เว็บเช่าแพ็กเกจ)
 *   <slug>.localhost:3000/*            ->  /shop/<slug>/* (POS ของแต่ละร้าน)
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host");
  const info = classifyHost(host);
  const path = url.pathname === "/" ? "" : url.pathname;

  // กันไม่ให้เข้าถึง path ภายในตรง ๆ
  if (url.pathname.startsWith("/site") || url.pathname.startsWith("/shop")) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (info.kind === "shop") {
    url.pathname = `/shop/${info.slug}${path}`;
    return NextResponse.rewrite(url);
  }
  url.pathname = `/site${path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // ไม่ยุ่งกับ API, ไฟล์ของ Next และไฟล์ static
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\..*).*)"],
};
