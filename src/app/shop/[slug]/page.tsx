import { redirect } from "next/navigation";
import { read } from "@/lib/server/db";
import { getShopSession } from "@/lib/server/session";
import { getPlan } from "@/lib/saas/plans";
import { POSProvider } from "@/context/POSContext";
import PosApp from "@/components/PosApp";
import ShopNotFound from "@/components/saas/ShopNotFound";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }) {
  const tenant = read((db) => db.tenants.find((t) => t.slug === params.slug));
  return { title: tenant ? `${tenant.name} | SabaiPOS` : "ไม่พบร้าน | SabaiPOS" };
}

export default function ShopPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { welcome?: string };
}) {
  const tenant = read((db) => db.tenants.find((t) => t.slug === params.slug));
  if (!tenant) return <ShopNotFound slug={params.slug} />;

  const session = getShopSession(params.slug);
  if (!session) redirect("/login");

  const plan = getPlan(tenant.plan);
  return (
    <POSProvider
      tenant={{ storeName: tenant.name, phone: tenant.phone, ownerName: session.user.name }}
    >
      <PosApp
        welcome={searchParams.welcome === "1"}
        tenant={{
          name: tenant.name,
          slug: tenant.slug,
          planName: plan?.name ?? tenant.plan,
          ownerEmail: session.user.email,
          periodEnd: tenant.currentPeriodEnd,
        }}
      />
    </POSProvider>
  );
}
