import { cookies } from "next/headers";
import { read, type Tenant, type User } from "./db";

export const SESSION_COOKIE = "sp_session";

export function getShopSession(slug: string): { tenant: Tenant; user: User } | null {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  return read((db) => {
    const s = db.sessions.find((x) => x.id === sid);
    if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
    const tenant = db.tenants.find((t) => t.id === s.tenantId);
    const user = db.users.find((u) => u.id === s.userId);
    if (!tenant || !user || tenant.slug !== slug) return null;
    return { tenant, user };
  });
}
