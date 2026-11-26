import { NextRequest, NextResponse } from "next/server";
import { processChargeEvent, verifySignature, type MockWebhookPayload } from "@/lib/server/payments";

/** Webhook endpoint — ตำแหน่งเดียวกับที่ Omise/Stripe จะยิงมาในระบบจริง */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const valid = verifySignature(raw, req.headers.get("x-mock-signature"));
  let payload: MockWebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const result = processChargeEvent(payload, valid);
  console.log(`[webhook] ${payload.key} ${payload.data?.id} -> ${result}`);
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  return NextResponse.json({ received: true, result });
}
