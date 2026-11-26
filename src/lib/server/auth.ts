import { NextResponse } from "next/server";
import { mutate, newId } from "./db";
import { SESSION_COOKIE } from "./session";

export function createSessionResponse(
  redirectTo: string | null,
  userId: string,
  tenantId: string
): NextResponse {
  const sid = newId("ses");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  mutate((db) => {
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
    db.sessions.push({ id: sid, userId, tenantId, expiresAt: expires.toISOString() });
  });
  const res = redirectTo ? NextResponse.redirect(redirectTo) : NextResponse.json({ ok: true });
  // cookie ผูกกับ host ของร้านนั้นเท่านั้น (slug.localhost) — ร้านอื่นมองไม่เห็น
  res.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return res;
}

export function originFromHeaders(headers: Headers): string {
  const proto = headers.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${headers.get("host")}`;
}
