import { NextRequest, NextResponse } from "next/server";
import { read } from "@/lib/server/db";
import { shopOrigin } from "@/lib/saas/hosts";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const order = read((db) => db.orders.find((o) => o.id === params.id));
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  const redirectUrl =
    order.status === "completed" && order.loginToken
      ? `${shopOrigin(order.slug, req.headers.get("host"), req.headers.get("x-forwarded-proto"))}/auth/callback?token=${order.loginToken}`
      : null;
  return NextResponse.json({
    status: order.status,
    failureMessage: order.failureMessage ?? null,
    chargeId: order.chargeId ?? null,
    slug: order.slug,
    redirectUrl,
  });
}
