import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/server/db";
import { SESSION_COOKIE } from "@/lib/server/session";

export function POST(req: NextRequest) {
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  if (sid) mutate((db) => { db.sessions = db.sessions.filter((s) => s.id !== sid); });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
