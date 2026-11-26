import { NextRequest, NextResponse } from "next/server";
import { read, isSlugTaken } from "@/lib/server/db";
import { normalizeSlug, validateSlugFormat } from "@/lib/saas/slug";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("slug") || "";
  const slug = normalizeSlug(raw);
  const formatError = validateSlugFormat(slug);
  if (formatError) return NextResponse.json({ slug, available: false, reason: formatError });
  const taken = read((db) => isSlugTaken(db, slug));
  return NextResponse.json({
    slug,
    available: !taken,
    reason: taken ? "ชื่อนี้มีร้านใช้แล้ว ลองชื่ออื่น" : null,
  });
}
