// การแยก host: store-management.<root> = เว็บเช่าแพ็กเกจ, <slug>.<root> = POS ของร้าน
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
export const MARKETING_SUBDOMAIN =
  process.env.NEXT_PUBLIC_MARKETING_SUBDOMAIN || "store-management";

export type HostKind =
  | { kind: "marketing" }
  | { kind: "shop"; slug: string }
  | { kind: "unknown" };

export function classifyHost(hostHeader: string | null | undefined): HostKind {
  const host = (hostHeader || "").split(":")[0].toLowerCase();
  if (!host || host === ROOT_DOMAIN || host === "127.0.0.1" || host === `www.${ROOT_DOMAIN}`)
    return { kind: "marketing" };
  if (host === `${MARKETING_SUBDOMAIN}.${ROOT_DOMAIN}`) return { kind: "marketing" };
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1));
    if (sub && !sub.includes(".")) return { kind: "shop", slug: sub };
  }
  return { kind: "unknown" };
}

function portOf(hostHeader: string | null | undefined): string {
  const parts = (hostHeader || "").split(":");
  return parts.length > 1 ? `:${parts[1]}` : "";
}

function protoOf(proto: string | null | undefined): string {
  return proto === "https" ? "https" : "http";
}

export function shopOrigin(slug: string, hostHeader?: string | null, proto?: string | null) {
  return `${protoOf(proto)}://${slug}.${ROOT_DOMAIN}${portOf(hostHeader)}`;
}

export function marketingOrigin(hostHeader?: string | null, proto?: string | null) {
  return `${protoOf(proto)}://${MARKETING_SUBDOMAIN}.${ROOT_DOMAIN}${portOf(hostHeader)}`;
}
