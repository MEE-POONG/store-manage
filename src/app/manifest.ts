import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SabaiPOS | ระบบขายหน้าร้านและจัดการสต็อก",
    short_name: "SabaiPOS",
    description:
      "ระบบ POS สำหรับร้านค้าปลีกและมินิมาร์ท รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#059669",
    orientation: "any",
  };
}
