import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { BillingCycle, PlanId } from "@/lib/saas/plans";

/**
 * ที่เก็บข้อมูลแบบไฟล์ JSON สำหรับเดโมบนเครื่อง (data/db.json)
 * โครงสร้างตารางออกแบบให้ย้ายไป PostgreSQL/Prisma ได้ตรง ๆ ในภายหลัง
 */

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  status: "trialing" | "active" | "past_due" | "canceled";
  ownerUserId: string;
  phone: string;
  createdAt: string;
  currentPeriodEnd: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "owner";
  createdAt: string;
}

export interface CheckoutOrder {
  id: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  amount: number;
  currency: "THB";
  slug: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  passwordHash: string;
  status: "pending" | "processing" | "paid" | "failed" | "completed";
  paymentMethod?: "card" | "promptpay";
  chargeId?: string;
  failureMessage?: string;
  tenantId?: string;
  loginToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  chargeId: string;
  orderId: string;
  status: string;
  signatureValid: boolean;
  receivedAt: string;
  result: string;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  expiresAt: string;
}

interface DB {
  tenants: Tenant[];
  users: User[];
  orders: CheckoutOrder[];
  webhookEvents: WebhookEvent[];
  sessions: Session[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const EMPTY: DB = { tenants: [], users: [], orders: [], webhookEvents: [], sessions: [] };

function load(): DB {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY);
  }
}

function save(db: DB) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}

/** อ่านข้อมูล (read-only snapshot) */
export function read<T>(fn: (db: DB) => T): T {
  return fn(load());
}

/** อ่าน-แก้-บันทึก แบบ synchronous (ปลอดภัยใน dev server process เดียว) */
export function mutate<T>(fn: (db: DB) => T): T {
  const db = load();
  const result = fn(db);
  save(db);
  return result;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return expected.length === test.length && crypto.timingSafeEqual(expected, test);
}

/** slug ถูกใช้แล้ว (มีร้านจริง หรือมีคำสั่งซื้อค้างอยู่ใน 30 นาทีล่าสุด) */
export function isSlugTaken(db: DB, slug: string, exceptOrderId?: string): boolean {
  if (db.tenants.some((t) => t.slug === slug)) return true;
  const cutoff = Date.now() - 30 * 60 * 1000;
  return db.orders.some(
    (o) =>
      o.slug === slug &&
      o.id !== exceptOrderId &&
      (o.status === "pending" || o.status === "processing" || o.status === "paid") &&
      new Date(o.createdAt).getTime() > cutoff
  );
}

export type { DB };
