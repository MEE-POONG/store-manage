import crypto from "node:crypto";
import { mutate, newId, type CheckoutOrder } from "./db";
import { TRIAL_DAYS } from "@/lib/saas/plans";

/**
 * Mock Payment Gateway — จำลองพฤติกรรมแบบ Omise/Stripe:
 * 1) สร้าง charge  2) gateway ยิง webhook กลับมาที่ /api/webhooks/payment (มีลายเซ็น HMAC)
 * 3) webhook handler เป็นคนสร้างร้าน + บัญชีเจ้าของ (เหมือนระบบจริง)
 * เมื่อต่อของจริง ให้แทนที่ createMockCharge ด้วย SDK ของ Omise/Stripe และตรวจลายเซ็นตามเอกสารผู้ให้บริการ
 */

export const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "mock_whsec_dev_only";

export function sign(body: string): string {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

export function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = Buffer.from(sign(body));
  const got = Buffer.from(signature);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

export interface MockWebhookPayload {
  id: string; // event id
  key: "charge.complete";
  created_at: string;
  data: {
    object: "charge";
    id: string;
    amount: number; // สตางค์ (แบบ Omise)
    currency: "thb";
    status: "successful" | "failed";
    failure_message?: string;
    metadata: { order_id: string };
  };
}

export function buildChargeEvent(
  order: CheckoutOrder,
  chargeId: string,
  outcome: "success" | "fail"
): MockWebhookPayload {
  return {
    id: newId("evnt"),
    key: "charge.complete",
    created_at: new Date().toISOString(),
    data: {
      object: "charge",
      id: chargeId,
      amount: order.amount * 100,
      currency: "thb",
      status: outcome === "success" ? "successful" : "failed",
      failure_message: outcome === "fail" ? "บัตรถูกปฏิเสธโดยธนาคารผู้ออกบัตร (จำลอง)" : undefined,
      metadata: { order_id: order.id },
    },
  };
}

/** ประมวลผล webhook — idempotent (event ซ้ำจะไม่สร้างร้านซ้ำ) */
export function processChargeEvent(payload: MockWebhookPayload, signatureValid: boolean) {
  return mutate((db) => {
    const orderId = payload.data.metadata.order_id;
    const log = (result: string) => {
      db.webhookEvents.unshift({
        id: payload.id,
        type: payload.key,
        chargeId: payload.data.id,
        orderId,
        status: payload.data.status,
        signatureValid,
        receivedAt: new Date().toISOString(),
        result,
      });
      return result;
    };

    if (!signatureValid) return log("rejected: invalid signature");
    if (db.webhookEvents.some((e) => e.id === payload.id && e.result.startsWith("ok")))
      return "duplicate";

    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return log("ignored: order not found");
    if (order.status === "completed") return log("ok: already provisioned");

    const now = new Date();
    order.updatedAt = now.toISOString();
    order.chargeId = payload.data.id;

    if (payload.data.status !== "successful") {
      order.status = "failed";
      order.failureMessage = payload.data.failure_message || "การชำระเงินไม่สำเร็จ";
      return log("ok: marked failed");
    }

    order.status = "paid";

    if (db.tenants.some((t) => t.slug === order.slug)) {
      order.status = "failed";
      order.failureMessage = "ชื่อร้าน (slug) นี้ถูกใช้ไปแล้ว — ระบบจะคืนเงินอัตโนมัติ (จำลอง)";
      return log("ok: slug conflict, refund");
    }

    // สร้าง tenant + owner
    const tenantId = newId("ten");
    const userId = newId("usr");
    const periodEnd = new Date(now);
    if (order.billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() + TRIAL_DAYS);

    db.tenants.push({
      id: tenantId,
      slug: order.slug,
      name: order.shopName,
      plan: order.plan,
      billingCycle: order.billingCycle,
      status: "active",
      ownerUserId: userId,
      phone: order.phone,
      createdAt: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
    });
    db.users.push({
      id: userId,
      tenantId,
      name: order.ownerName,
      email: order.email,
      phone: order.phone,
      passwordHash: order.passwordHash,
      role: "owner",
      createdAt: now.toISOString(),
    });

    order.status = "completed";
    order.tenantId = tenantId;
    order.loginToken = newId("lt");
    return log("ok: tenant provisioned");
  });
}
