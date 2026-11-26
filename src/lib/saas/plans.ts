// แพ็กเกจที่เปิดให้เช่า (ใช้ทั้งฝั่ง client และ server)
export type PlanId = "starter" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number; // บาท/เดือน
  yearlyPrice: number; // บาท/ปี (จ่ายรายปี)
  highlight?: boolean;
  limits: { branches: string; employees: string; products: string };
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "ร้านเล็ก เริ่มขายได้ทันที",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    limits: { branches: "1 สาขา", employees: "2 คน", products: "500 รายการ" },
    features: [
      "หน้าขาย POS + สแกนบาร์โค้ด",
      "จัดการสต็อกพื้นฐาน",
      "ใบเสร็จอย่างย่อ",
      "รับชำระเงินสด / พร้อมเพย์",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "ยอดนิยมสำหรับมินิมาร์ท",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    highlight: true,
    limits: { branches: "1 สาขา", employees: "10 คน", products: "ไม่จำกัด" },
    features: [
      "ทุกอย่างใน Starter",
      "แดชบอร์ดยอดขาย & กำไร",
      "สิทธิ์พนักงาน + PIN",
      "ลิ้นชักเงินสด เปิด-ปิดกะ",
      "พักบิล / ยกเลิกบิล",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "หลายสาขา ดูภาพรวมที่เดียว",
    monthlyPrice: 1290,
    yearlyPrice: 12900,
    limits: { branches: "สูงสุด 5 สาขา", employees: "ไม่จำกัด", products: "ไม่จำกัด" },
    features: [
      "ทุกอย่างใน Pro",
      "รายงานรวมหลายสาขา",
      "ส่งออกข้อมูล / API",
      "ผู้ดูแลบัญชีส่วนตัว",
    ],
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceFor(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function formatBaht(n: number): string {
  return "฿" + n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export const TRIAL_DAYS = 14;
