import { NextResponse } from "next/server";
import { mutate } from "@/lib/server/db";

/** ล้างข้อมูลเดโมทั้งหมด (ใช้เฉพาะตอน dev) */
export function POST() {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  mutate((db) => {
    db.tenants = []; db.users = []; db.orders = []; db.webhookEvents = []; db.sessions = [];
  });
  return NextResponse.json({ ok: true });
}
