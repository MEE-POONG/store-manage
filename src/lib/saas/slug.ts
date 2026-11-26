export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "store-management", "mail", "static",
  "assets", "billing", "support", "help", "login", "signup", "dashboard", "pos",
]);

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/** คืนข้อความผิดพลาด หรือ null ถ้ารูปแบบถูกต้อง */
export function validateSlugFormat(slug: string): string | null {
  if (slug.length < 3) return "ต้องมีอย่างน้อย 3 ตัวอักษร";
  if (slug.length > 30) return "ยาวได้ไม่เกิน 30 ตัวอักษร";
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug))
    return "ใช้ได้เฉพาะ a-z, 0-9 และขีด (-) และห้ามขึ้นต้น/ลงท้ายด้วยขีด";
  if (RESERVED_SLUGS.has(slug)) return "ชื่อนี้สงวนไว้สำหรับระบบ";
  return null;
}
