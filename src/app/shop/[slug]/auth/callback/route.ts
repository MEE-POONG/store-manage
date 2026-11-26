import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/server/db";
import { createSessionResponse, originFromHeaders } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** ลิงก์เข้าร้านครั้งแรกหลังชำระเงิน (token ใช้ได้ครั้งเดียว) */
export function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const origin = originFromHeaders(req.headers);
  const found = mutate((db) => {
    const order = db.orders.find((o) => o.loginToken && o.loginToken === token);
    if (!order || !order.tenantId) return null;
    const tenant = db.tenants.find((t) => t.id === order.tenantId);
    if (!tenant || tenant.slug !== params.slug) return null;
    order.loginToken = undefined;
    return { userId: tenant.ownerUserId, tenantId: tenant.id };
  });
  if (!found) return NextResponse.redirect(`${origin}/login?expired=1`);
  return createSessionResponse(`${origin}/?welcome=1`, found.userId, found.tenantId);
}
