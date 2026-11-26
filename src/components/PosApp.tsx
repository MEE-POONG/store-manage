"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getTodayDateKey, ROLE_LABELS, usePOS } from "@/context/POSContext";
import PosTerminalView from "@/components/PosTerminalView";
import InventoryView from "@/components/InventoryView";
import SalesHistoryView from "@/components/SalesHistoryView";
import DashboardView from "@/components/DashboardView";
import EmployeesView from "@/components/EmployeesView";
import SettingsView from "@/components/SettingsView";
import CashDrawerModal from "@/components/CashDrawerModal";
import SwitchEmployeeModal from "@/components/SwitchEmployeeModal";
import {
  BarChart3,
  LogOut,
  PartyPopper,
  X,
  Boxes,
  Lock,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";

type ActiveTab =
  | "pos"
  | "inventory"
  | "sales"
  | "dashboard"
  | "employees"
  | "settings";

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface PosTenantInfo {
  name: string;
  slug: string;
  planName: string;
  ownerEmail: string;
  periodEnd: string;
}

export default function PosApp({
  tenant,
  welcome = false,
}: {
  tenant?: PosTenantInfo;
  welcome?: boolean;
}) {
  const {
    isHydrated,
    settings,
    products,
    cart,
    sales,
    currentEmployee,
    getCashDrawerForDate,
    openCashDrawerModal,
    openSwitchEmployeeModal,
  } = usePOS();
  const [activeTab, setActiveTab] = useState<ActiveTab>("pos");
  const [showWelcome, setShowWelcome] = useState(welcome);
  useEffect(() => {
    if (welcome) window.history.replaceState(null, "", "/");
  }, [welcome]);

  const handleLogout = async () => {
    await fetch("/api/shop/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const lowStockCount = products.filter(
    (p) => p.isActive && p.stock <= p.minStock
  ).length;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const todayKey = getTodayDateKey();
  const todayDrawer = getCashDrawerForDate(todayKey);

  const todayExpectedCash = useMemo(() => {
    const todayCashSales = sales
      .filter(
        (s) =>
          s.status === "completed" &&
          s.paymentMethod === "cash" &&
          toDateKey(s.createdAt) === todayKey
      )
      .reduce((acc, s) => acc + s.total, 0);

    const cashIn = todayDrawer.movements
      .filter((m) => m.type === "in")
      .reduce((acc, m) => acc + m.amount, 0);
    const cashOut = todayDrawer.movements
      .filter((m) => m.type === "out")
      .reduce((acc, m) => acc + m.amount, 0);

    return Number(
      (todayDrawer.openingCash + todayCashSales + cashIn - cashOut).toFixed(2)
    );
  }, [sales, todayDrawer, todayKey]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-md">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-sm font-semibold text-slate-700">
            กำลังโหลดระบบ POS...
          </span>
        </div>
      </div>
    );
  }

  const navItems: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badge?: number;
    badgeStyle?: string;
  }[] = [
    {
      id: "pos",
      label: "ขายหน้าร้าน (POS)",
      shortLabel: "ขายสินค้า",
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
      badgeStyle: "bg-emerald-500 text-white",
    },
    {
      id: "inventory",
      label: "สินค้า & สต็อก",
      shortLabel: "สต็อก",
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeStyle: "bg-amber-500 text-slate-950",
    },
    {
      id: "sales",
      label: "ประวัติบิลขาย",
      shortLabel: "บิลขาย",
      icon: Receipt,
    },
    {
      id: "dashboard",
      label: "แดชบอร์ดสรุปยอด",
      shortLabel: "สรุปยอด",
      icon: BarChart3,
    },
    {
      id: "employees",
      label: "พนักงาน & สิทธิ์",
      shortLabel: "พนักงาน",
      icon: Users,
    },
    {
      id: "settings",
      label: "ตั้งค่าร้าน",
      shortLabel: "ตั้งค่า",
      icon: Settings,
    },
  ];

  const roleBadge = ROLE_LABELS[currentEmployee.role];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm print:hidden sm:h-16 sm:px-6">
        {/* Brand & Store Name */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 sm:h-10 sm:w-10">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                {settings.storeName}
              </span>
              <span className="hidden whitespace-nowrap rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 xl:inline-block">
                {tenant ? tenant.planName : "Retail POS"}
              </span>
            </div>
            <p className="truncate text-[10px] text-slate-400 sm:text-[11px]">
              {settings.branchName}
              {tenant && (
                <span className="hidden sm:inline"> · {tenant.slug}.localhost</span>
              )}
            </p>
          </div>
        </div>

        {/* Center Navigation Pills (Desktop Only: lg+) */}
        <nav className="hidden items-center gap-1 overflow-x-auto py-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${item.badgeStyle}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Cash Drawer Status Button & Interactive Employee Switcher */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => openCashDrawerModal(todayKey)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition sm:px-3 ${
              todayDrawer.status === "open"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100"
                : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
            title="จัดการเงินทอนตั้งต้น & นับเงินสดในลิ้นชัก (เปิด-ปิดกะ)"
          >
            {todayDrawer.status === "open" ? (
              <Wallet className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
            )}
            <span className="hidden md:inline">ลิ้นชัก:</span>
            <span className="font-extrabold">
              ฿
              {todayExpectedCash.toLocaleString("th-TH", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={openSwitchEmployeeModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs transition hover:border-emerald-400 hover:bg-emerald-50/40 sm:px-3"
            title="คลิกเพื่อสลับพนักงานแคชเชียร์ / กดรหัส PIN 4 หลัก"
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white ${currentEmployee.avatarColor}`}
            >
              {currentEmployee.name.slice(0, 2)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="max-w-[72px] truncate text-[11px] font-bold text-slate-900 sm:max-w-[130px] sm:text-xs">
                  {currentEmployee.name.split(" ")[0]}
                </span>
                <span
                  className={`hidden rounded border px-1.5 py-0.2 text-[9px] font-bold sm:inline-block ${roleBadge.badgeStyle}`}
                >
                  {currentEmployee.role === "owner"
                    ? "เจ้าของร้าน"
                    : currentEmployee.role === "manager"
                    ? "ผู้จัดการ"
                    : "แคชเชียร์"}
                </span>
              </div>
            </div>
          </button>

          {tenant && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              title={`ออกจากระบบ (${tenant.ownerEmail})`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {tenant && showWelcome && (
        <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-3 text-white print:hidden sm:px-6">
          <div className="mx-auto flex max-w-6xl items-start gap-3">
            <PartyPopper className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-extrabold">ยินดีต้อนรับสู่ {tenant.name}! ร้านของคุณพร้อมใช้งานแล้ว</p>
              <p className="text-emerald-50">
                แพ็กเกจ {tenant.planName} · ใช้งานได้ถึง{" "}
                {new Date(tenant.periodEnd).toLocaleDateString("th-TH", { dateStyle: "long" })} ·
                ระบบใส่สินค้าตัวอย่างไว้ให้ทดลองขายได้ทันที (แก้ไข/ลบได้ในเมนูสต็อก)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="rounded-lg p-1 hover:bg-white/15"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area (padded at bottom on mobile for bottom nav) */}
      <main className="pb-20 lg:pb-0">
        {activeTab === "pos" && <PosTerminalView />}
        {activeTab === "inventory" && <InventoryView />}
        {activeTab === "sales" && <SalesHistoryView />}
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "employees" && <EmployeesView />}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation Bar (Shown on screens < lg) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-1 backdrop-blur-md print:hidden lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-bold transition ${
                isActive ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <div
                className={`relative flex h-7 w-11 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-emerald-50 text-emerald-600" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold shadow ${item.badgeStyle}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Modals */}
      <CashDrawerModal />
      <SwitchEmployeeModal />
    </div>
  );
}
