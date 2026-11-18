"use client";

import React, { useState } from "react";
import { usePOS } from "@/context/POSContext";
import PosTerminalView from "@/components/PosTerminalView";
import InventoryView from "@/components/InventoryView";
import SalesHistoryView from "@/components/SalesHistoryView";
import DashboardView from "@/components/DashboardView";
import SettingsView from "@/components/SettingsView";
import {
  BarChart3,
  Boxes,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  UserCheck,
} from "lucide-react";

type ActiveTab = "pos" | "inventory" | "sales" | "dashboard" | "settings";

export default function HomePage() {
  const { isHydrated, settings, products, cart } = usePOS();
  const [activeTab, setActiveTab] = useState<ActiveTab>("pos");

  const lowStockCount = products.filter(
    (p) => p.isActive && p.stock <= p.minStock
  ).length;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

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
      id: "settings",
      label: "ตั้งค่าร้าน",
      icon: Settings,
    },
  ];

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
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
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

        {/* Cashier Status */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 xl:flex">
          <UserCheck className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">
            {settings.cashierName}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === "pos" && <PosTerminalView />}
        {activeTab === "inventory" && <InventoryView />}
        {activeTab === "sales" && <SalesHistoryView />}
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

