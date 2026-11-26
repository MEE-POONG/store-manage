import { redirect } from "next/navigation";
import { read } from "@/lib/server/db";
import { getShopSession } from "@/lib/server/session";
import ShopLoginForm from "@/components/saas/ShopLoginForm";
import ShopNotFound from "@/components/saas/ShopNotFound";

export const dynamic = "force-dynamic";

export default function ShopLoginPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { expired?: string };
}) {
  const tenant = read((db) => db.tenants.find((t) => t.slug === params.slug));
  if (!tenant) return <ShopNotFound slug={params.slug} />;
  if (getShopSession(params.slug)) redirect("/");
  return (
    <ShopLoginForm shopName={tenant.name} slug={tenant.slug} expired={searchParams.expired === "1"} />
  );
}
