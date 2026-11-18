import type { Metadata } from "next";
import "./globals.css";
import { POSProvider } from "@/context/POSContext";

export const metadata: Metadata = {
  title: "SabaiPOS | ระบบขายหน้าร้านและจัดการสต็อก (Retail & Minimart POS)",
  description:
    "ระบบ POS สำหรับร้านค้าปลีกและมินิมาร์ท พัฒนาด้วย Next.js รองรับสแกนบาร์โค้ด ตัดสต็อก พักบิล พร้อมเพย์ QR และสรุปยอดขาย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="font-sans">
        <POSProvider>{children}</POSProvider>
      </body>
    </html>
  );
}
