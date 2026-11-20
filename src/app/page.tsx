"use client";

import React, { useMemo, useState } from "react";
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
  Boxes,
  Lock,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  UserCheck,
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

export default function HomePage() {
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
    icon: React.ElementType;
    badge?: number;
    badgeStyle?: string;
  }[] = [
    {
      id: "pos",
      label: "ขายหน้าร้าน (POS)",
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
      badgeStyle: "bg-emerald-500 text-white",
    },
    {
      id: "inventory",
      label: "สินค้า & สต็อก",
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeStyle: "bg-amber-500 text-slate-950",
    },
    {
      id: "sales",
      label: "ประวัติบิลขาย",
      icon: Receipt,
    },
    {
      id: "dashboard",
      label: "แดชบอร์ดสรุปยอด",
      icon: BarChart3,
    },
    {
      id: "employees",
      label: "พนักงาน & สิทธิ์",
      icon: Users,
    },
    {
      id: "settings",
      label: "ตั้งค่าร้าน",
      icon: Settings,
    },
  ];

  const roleBadge = ROLE_LABELS[currentEmployee.role];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm print:hidden sm:px-6">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                {settings.storeName}
              </span>
              <span className="hidden rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 sm:inline-block">
                Retail POS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{settings.branchName}</p>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCashDrawerModal(todayKey)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              todayDrawer.status === "open"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100"
                : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
            title="จัดการเงินทอนตั้งต้น & นับเงินสดในลิ้นชัก (เปิด-ปิดกะ)"
          >
            {todayDrawer.status === "open" ? (
              <Wallet className="h-4 w-4 text-emerald-600" />
            ) : (
              <Lock className="h-4 w-4 text-amber-600" />
            )}
            <span className="hidden md:inline">ลิ้นชัก:</span>
            <span className="font-extrabold">
              ฿
              {todayExpectedCash.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={openSwitchEmployeeModal}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs transition hover:border-emerald-400 hover:bg-emerald-50/40"
            title="คลิกเพื่อสลับพนักงานแคชเชียร์ / กดรหัส PIN 4 หลัก"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-extrabold text-white ${currentEmployee.avatarColor}`}
            >
              {currentEmployee.name.slice(0, 2)}
            </div>
            <div className="hidden text-left lg:block">
              <div className="flex items-center gap-1.5">
                <span className="max-w-[130px] truncate font-bold text-slate-900">
                  {currentEmployee.name}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.2 text-[9px] font-bold ${roleBadge.badgeStyle}`}
                >
                  {currentEmployee.role === "owner"
                    ? "เจ้าของร้าน"
                    : currentEmployee.role === "manager"
                    ? "ผู้จัดการ"
                    : "แคชเชียร์"}
                </span>
              </div>
            </div>
            <UserCheck className="h-3.5 w-3.5 text-emerald-600 lg:hidden" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === "pos" && <PosTerminalView />}
        {activeTab === "inventory" && <InventoryView />}
        {activeTab === "sales" && <SalesHistoryView />}
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "employees" && <EmployeesView />}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Global Modals */}
      <CashDrawerModal />
      <SwitchEmployeeModal />
    </div>
  );
}
