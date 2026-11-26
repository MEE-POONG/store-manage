import { NextRequest, NextResponse } from "next/server";
import { hashPassword, isSlugTaken, mutate, newId } from "@/lib/server/db";
import { getPlan, priceFor, type BillingCycle } from "@/lib/saas/plans";
import { normalizeSlug, validateSlugFormat } from "@/lib/saas/slug";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body.plan);
  const cycle: BillingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";
  const slug = normalizeSlug(String(body.slug || ""));
  const shopName = String(body.shopName || "").trim();
  const ownerName = String(body.ownerName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const password = String(body.password || "");

  const errors: Record<string, string> = {};
  if (!plan) errors.plan = "กรุณาเลือกแพ็กเกจ";
  if (!shopName) errors.shopName = "กรุณากรอกชื่อร้าน";
  const slugErr = validateSlugFormat(slug);
  if (slugErr) errors.slug = slugErr;
  if (!ownerName) errors.ownerName = "กรุณากรอกชื่อเจ้าของร้าน";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "อีเมลไม่ถูกต้อง";
  if (phone.replace(/\D/g, "").length < 9) errors.phone = "เบอร์โทรไม่ถูกต้อง";
  if (password.length < 6) errors.password = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const result = mutate((db) => {
    if (isSlugTaken(db, slug)) return { error: "ชื่อนี้มีร้านใช้แล้ว ลองชื่ออื่น" };
    const now = new Date().toISOString();
    const id = newId("ord");
    db.orders.unshift({
      id,
      plan: plan!.id,
      billingCycle: cycle,
      amount: priceFor(plan!, cycle),
      currency: "THB",
      slug,
      shopName,
      ownerName,
      email,
      phone,
      passwordHash: hashPassword(password),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  });

  if ("error" in result) return NextResponse.json({ errors: { slug: result.error } }, { status: 409 });
  return NextResponse.json({ orderId: result.id });
}
