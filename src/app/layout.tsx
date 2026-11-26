import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "SabaiPOS | ระบบ POS ให้เช่า สำหรับร้านค้าปลีกและมินิมาร์ท",
  description:
    "ระบบ POS สำหรับร้านค้าปลีกและมินิมาร์ท พัฒนาด้วย Next.js รองรับมือถือ แท็บเล็ต สแกนบาร์โค้ด ตัดสต็อก พักบิล พร้อมเพย์ QR และสรุปยอดขาย",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SabaiPOS",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
