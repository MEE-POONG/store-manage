import SignupForm from "@/components/saas/SignupForm";
import type { BillingCycle, PlanId } from "@/lib/saas/plans";

export const metadata = { title: "เปิดร้านใหม่ | SabaiPOS" };

export default function SignupPage({
  searchParams,
}: {
  searchParams: { plan?: string; cycle?: string; slug?: string };
}) {
  const plan = (["starter", "pro", "business"].includes(searchParams.plan || "")
    ? searchParams.plan
    : "pro") as PlanId;
  const cycle: BillingCycle = searchParams.cycle === "yearly" ? "yearly" : "monthly";
  return (
    <main className="bg-slate-50 py-12">
      <SignupForm initialPlan={plan} initialCycle={cycle} initialSlug={searchParams.slug || ""} />
    </main>
  );
}
