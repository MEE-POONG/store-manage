import { notFound } from "next/navigation";
import { read } from "@/lib/server/db";
import { getPlan } from "@/lib/saas/plans";
import CheckoutClient from "@/components/saas/CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "ชำระเงิน | SabaiPOS" };

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const order = read((db) => db.orders.find((o) => o.id === params.id));
  if (!order) notFound();
  const plan = getPlan(order.plan)!;
  return (
    <main className="bg-slate-50 py-12">
      <CheckoutClient
        order={{
          id: order.id,
          planName: plan.name,
          billingCycle: order.billingCycle,
          amount: order.amount,
          shopName: order.shopName,
          slug: order.slug,
          email: order.email,
          status: order.status,
        }}
      />
    </main>
  );
}
