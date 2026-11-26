import { NextRequest, NextResponse } from "next/server";
import { read, verifyPassword } from "@/lib/server/db";
import { classifyHost } from "@/lib/saas/hosts";
import { createSessionResponse } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  const info = classifyHost(req.headers.get("host"));
  if (info.kind !== "shop") return NextResponse.json({ error: "ไม่ใช่หน้าร้าน" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const match = read((db) => {
    const tenant = db.tenants.find((t) => t.slug === info.slug);
    if (!tenant) return null;
    const user = db.users.find((u) => u.tenantId === tenant.id && u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    return { userId: user.id, tenantId: tenant.id };
  });
  if (!match) return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  return createSessionResponse(null, match.userId, match.tenantId);
}
