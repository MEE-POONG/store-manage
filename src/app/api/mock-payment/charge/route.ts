import { NextRequest, NextResponse } from "next/server";
import { mutate, newId } from "@/lib/server/db";
import { buildChargeEvent, processChargeEvent, sign } from "@/lib/server/payments";

/**
 * จำลอง "Payment Gateway" รับคำสั่งตัดเงิน แล้วยิง webhook กลับมาที่ระบบเรา
 * (ในระบบจริง ขั้นนี้คือการเรียก Omise/Stripe API และ gateway จะยิง webhook เอง)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || "");
  const method = body.method === "promptpay" ? "promptpay" : "card";
  const outcome: "success" | "fail" = body.outcome === "fail" ? "fail" : "success";

  const order = mutate((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o || o.status === "completed") return o ?? null;
    o.status = "processing";
    o.paymentMethod = method;
    o.failureMessage = undefined;
    o.chargeId = newId("chrg");
    o.updatedAt = new Date().toISOString();
    return { ...o };
  });
  if (!order) return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  if (order.status === "completed") return NextResponse.json({ ok: true, chargeId: order.chargeId });

  const event = buildChargeEvent(order, order.chargeId!, outcome);
  const raw = JSON.stringify(event);

  // ยิง webhook แบบ async เหมือน gateway จริง (หน่วงเล็กน้อยให้เห็นสถานะ "กำลังตรวจสอบ")
  const port = (req.headers.get("host") || "").split(":")[1] || process.env.PORT || "3000";
  setTimeout(async () => {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/webhooks/payment`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mock-signature": sign(raw) },
        body: raw,
      });
      if (!res.ok) throw new Error(`webhook HTTP ${res.status}`);
    } catch (err) {
      console.warn("[mock-gateway] ส่ง webhook ผ่าน HTTP ไม่ได้ ประมวลผลตรงแทน:", err);
      processChargeEvent(event, true);
    }
  }, 1200);

  return NextResponse.json({ ok: true, chargeId: order.chargeId });
}
