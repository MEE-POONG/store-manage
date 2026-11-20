"use client";

import React, { useMemo, useState } from "react";
import { usePOS } from "@/context/POSContext";
import ProductImage from "@/components/ProductImage";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  Calculator,
  CalendarDays,
  Landmark,
  Lock,
  PackagePlus,
  QrCode,
  Receipt,
  TrendingUp,
  Trophy,
  Unlock,
  Wallet,
} from "lucide-react";

interface DailySalesGroup {
  dateKey: string; // YYYY-MM-DD (local time)
  displayDate: string;
  relativeLabel?: string;
  totalRevenue: number;
  totalProfit: number;
  billCount: number;
  cashAmount: number;
  cashCount: number;
  transferAmount: number; // promptpay + transfer + card
  transferCount: number;
  promptpayAmount: number;
  bankTransferAmount: number;
  cardAmount: number;
}

function getLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatThaiDate(dateKey: string): {
  displayDate: string;
  relativeLabel?: string;
} {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const displayDate = dateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const todayKey = getLocalDateKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterdayDate.toISOString());

  let relativeLabel: string | undefined;
  if (dateKey === todayKey) relativeLabel = "วันนี้";
  else if (dateKey === yesterdayKey) relativeLabel = "เมื่อวาน";

  return { displayDate, relativeLabel };
}

export default function DashboardView() {
  const {
    sales,
    products,
    permissions,
    adjustStock,
    getCashDrawerForDate,
    openCashDrawerModal,
  } = usePOS();

  const completedSales = useMemo(
    () => sales.filter((s) => s.status === "completed"),
    [sales]
  );

  // Group sales by Local Date (YYYY-MM-DD), separating Cash vs Transfer/QR
  const dailySalesList = useMemo<DailySalesGroup[]>(() => {
    const map = new Map<string, DailySalesGroup>();

    // Always ensure "Today" exists in the list even if 0 sales so far today
    const todayKey = getLocalDateKey(new Date().toISOString());
    const todayFormatted = formatThaiDate(todayKey);
    map.set(todayKey, {
      dateKey: todayKey,
      displayDate: todayFormatted.displayDate,
      relativeLabel: todayFormatted.relativeLabel,
      totalRevenue: 0,
      totalProfit: 0,
      billCount: 0,
      cashAmount: 0,
      cashCount: 0,
      transferAmount: 0,
      transferCount: 0,
      promptpayAmount: 0,
      bankTransferAmount: 0,
      cardAmount: 0,
    });

    completedSales.forEach((sale) => {
      const key = getLocalDateKey(sale.createdAt);
      if (!map.has(key)) {
        const { displayDate, relativeLabel } = formatThaiDate(key);
        map.set(key, {
          dateKey: key,
          displayDate,
          relativeLabel,
          totalRevenue: 0,
          totalProfit: 0,
          billCount: 0,
          cashAmount: 0,
          cashCount: 0,
          transferAmount: 0,
          transferCount: 0,
          promptpayAmount: 0,
          bankTransferAmount: 0,
          cardAmount: 0,
        });
      }

      const group = map.get(key)!;
      group.totalRevenue = Number((group.totalRevenue + sale.total).toFixed(2));
      group.totalProfit = Number((group.totalProfit + sale.profit).toFixed(2));
      group.billCount += 1;

      if (sale.paymentMethod === "cash") {
        group.cashAmount = Number((group.cashAmount + sale.total).toFixed(2));
        group.cashCount += 1;
      } else {
        // Group promptpay, bank transfer, and card under "เงินโอน / QR"
        group.transferAmount = Number(
          (group.transferAmount + sale.total).toFixed(2)
        );
        group.transferCount += 1;

        if (sale.paymentMethod === "promptpay") {
          group.promptpayAmount = Number(
            (group.promptpayAmount + sale.total).toFixed(2)
          );
        } else if (sale.paymentMethod === "transfer") {
          group.bankTransferAmount = Number(
            (group.bankTransferAmount + sale.total).toFixed(2)
          );
        } else if (sale.paymentMethod === "card") {
          group.cardAmount = Number((group.cardAmount + sale.total).toFixed(2));
        }
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey)
    );
  }, [completedSales]);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    getLocalDateKey(new Date().toISOString())
  );

  const selectedDayData = useMemo(() => {
    return (
      dailySalesList.find((d) => d.dateKey === selectedDateKey) ||
      dailySalesList[0]
    );
  }, [dailySalesList, selectedDateKey]);

  const selectedDayDrawer = useMemo(() => {
    const key =
      selectedDayData?.dateKey || getLocalDateKey(new Date().toISOString());
    const d = getCashDrawerForDate(key);
    const cashIn = d.movements
      .filter((m) => m.type === "in")
      .reduce((acc, m) => acc + m.amount, 0);
    const cashOut = d.movements
      .filter((m) => m.type === "out")
      .reduce((acc, m) => acc + m.amount, 0);
    const expectedCash = Number(
      (
        d.openingCash +
        (selectedDayData?.cashAmount || 0) +
        cashIn -
        cashOut
      ).toFixed(2)
    );
    const diff =
      d.actualClosingCash !== undefined
        ? Number((d.actualClosingCash - expectedCash).toFixed(2))
        : undefined;

    return {
      drawer: d,
      cashIn,
      cashOut,
      expectedCash,
      diff,
    };
  }, [selectedDayData, getCashDrawerForDate]);

  const metrics = useMemo(() => {
    const totalRevenue = completedSales.reduce((s, o) => s + o.total, 0);
    const totalProfit = completedSales.reduce((s, o) => s + o.profit, 0);
    const totalCash = completedSales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((s, o) => s + o.total, 0);
    const totalTransfer = completedSales
      .filter((s) => s.paymentMethod !== "cash")
      .reduce((s, o) => s + o.total, 0);
    const totalItemsSold = completedSales.reduce(
      (s, o) => s + o.items.reduce((acc, i) => acc + i.quantity, 0),
      0
    );
    const billCount = completedSales.length;
    const avgBill = billCount > 0 ? totalRevenue / billCount : 0;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalProfit,
      totalCash,
      totalTransfer,
      totalItemsSold,
      billCount,
      avgBill,
      profitMargin,
    };
  }, [completedSales]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        name: string;
        qty: number;
        revenue: number;
        unit: string;
      }
    >();

    completedSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const cur = map.get(item.productId) || {
          productId: item.productId,
          name: item.name,
          qty: 0,
          revenue: 0,
          unit: item.unit,
        };
        cur.qty += item.quantity;
        cur.revenue += item.subtotal;
        map.set(item.productId, cur);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [completedSales]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<
      string,
      { label: string; amount: number; count: number; color: string }
    > = {
      cash: {
        label: "เงินสด (Cash)",
        amount: 0,
        count: 0,
        color: "bg-emerald-500",
      },
      promptpay: {
        label: "สแกน QR พร้อมเพย์",
        amount: 0,
        count: 0,
        color: "bg-indigo-500",
      },
      transfer: {
        label: "โอนเงินธนาคาร",
        amount: 0,
        count: 0,
        color: "bg-sky-500",
      },
      card: {
        label: "บัตรเครดิต/เดบิต",
        amount: 0,
        count: 0,
        color: "bg-purple-500",
      },
    };

    completedSales.forEach((s) => {
      if (counts[s.paymentMethod]) {
        counts[s.paymentMethod].amount += s.total;
        counts[s.paymentMethod].count += 1;
      }
    });

    return Object.values(counts);
  }, [completedSales]);

  // Low stock items
  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.isActive && p.stock <= p.minStock)
        .sort((a, b) => a.stock - b.stock),
    [products]
  );

  const selectedDayCashPct =
    selectedDayData && selectedDayData.totalRevenue > 0
      ? (selectedDayData.cashAmount / selectedDayData.totalRevenue) * 100
      : 0;
  const selectedDayTransferPct =
    selectedDayData && selectedDayData.totalRevenue > 0
      ? (selectedDayData.transferAmount / selectedDayData.totalRevenue) * 100
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Page Title */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            แดชบอร์ดสรุปภาพรวมร้านค้า (Sales & Inventory Analytics)
          </h1>
          <p className="text-xs text-slate-500">
            สรุปยอดขายรายวันแยกตามเงินสดและเงินโอน เงินทอนตั้งต้นในลิ้นชัก กำไรขั้นต้น และแจ้งเตือนสต็อกต่ำ
          </p>
        </div>

        {/* Date Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {dailySalesList.map((day) => {
            const isSelected = selectedDayData?.dateKey === day.dateKey;
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {day.relativeLabel
                    ? `${day.relativeLabel} (${day.displayDate})`
                    : day.displayDate}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: DAILY SALES & CASH DRAWER BREAKDOWN */}
      {selectedDayData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                <CalendarDays className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    สรุปยอดขายและลิ้นชักเงินสด ประจำวันที่{" "}
                    {selectedDayData.displayDate}
                  </h2>
                  {selectedDayData.relativeLabel && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {selectedDayData.relativeLabel}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      selectedDayDrawer.drawer.status === "open"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedDayDrawer.drawer.status === "open" ? (
                      <>
                        <Unlock className="h-3 w-3" /> กำลังเปิดกะ
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> ปิดกะแล้ว
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  แยกยอดรับชำระด้วยเงินสด เงินโอน/QR และคำนวณยอดเงินสดในลิ้นชัก (เงินทอนตั้งต้น + ขายสด)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {permissions.canViewCostAndProfit && (
                <div className="text-xs text-slate-500">
                  กำไรขั้นต้น:{" "}
                  <strong className="font-bold text-emerald-700">
                    ฿
                    {selectedDayData.totalProfit.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              )}
              <button
                type="button"
                onClick={() => openCashDrawerModal(selectedDayData.dateKey)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Calculator className="h-3.5 w-3.5 text-emerald-400" />
                <span>ตั้งค่าเงินทอนตั้งต้น / เปิด-ปิดกะ</span>
              </button>
            </div>
          </div>

          {/* 4 Daily Cards: Daily Total, Cash Sales, Transfer/QR Sales, Cash Drawer Summary */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Total Daily Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  1. ยอดขายรวมประจำวัน
                </span>
                <span className="rounded-lg bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  รวม {selectedDayData.billCount} บิล
                </span>
              </div>
              <p className="mt-2.5 text-2xl font-extrabold text-slate-900">
                ฿
                {selectedDayData.totalRevenue.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${selectedDayCashPct}%` }}
                  title={`เงินสด ${selectedDayCashPct.toFixed(1)}%`}
                />
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${selectedDayTransferPct}%` }}
                  title={`เงินโอน/QR ${selectedDayTransferPct.toFixed(1)}%`}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  สด {selectedDayCashPct.toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  โอน/QR {selectedDayTransferPct.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* 2. Daily Cash Sales Card (เงินสด) */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-emerald-950">
                    2. ยอดขายรับเงินสด
                  </span>
                </div>
                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {selectedDayData.cashCount} บิล
                </span>
              </div>
              <p className="mt-2.5 text-2xl font-extrabold text-emerald-700">
                ฿
                {selectedDayData.cashAmount.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="mt-2 text-[11px] text-emerald-800/80">
                คิดเป็น <strong>{selectedDayCashPct.toFixed(1)}%</strong>{" "}
                ของยอดขาย • เงินสดที่เพิ่มเข้าลิ้นชัก
              </p>
            </div>

            {/* 3. Daily Transfer / QR Card (เงินโอน) */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-indigo-950">
                    3. ยอดขายรับเงินโอน / QR
                  </span>
                </div>
                <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                  {selectedDayData.transferCount} บิล
                </span>
              </div>
              <p className="mt-2.5 text-2xl font-extrabold text-indigo-700">
                ฿
                {selectedDayData.transferAmount.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-indigo-900/80">
                <span>
                  พร้อมเพย์:{" "}
                  <strong>฿{selectedDayData.promptpayAmount.toFixed(2)}</strong>
                </span>
                <span>
                  โอนบัญชี:{" "}
                  <strong>
                    ฿{selectedDayData.bankTransferAmount.toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>

            {/* 4. Cash Drawer Summary Card (เงินทอนตั้งต้น + ขายสด = เงินสดในลิ้นชัก) */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-amber-950">
                    4. เงินสดที่ต้องมีในลิ้นชัก
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openCashDrawerModal(selectedDayData.dateKey)}
                  className="rounded-lg bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-900 hover:bg-amber-300"
                >
                  แก้ไข/นับเงิน
                </button>
              </div>
              <p className="mt-2.5 text-2xl font-extrabold text-slate-900">
                ฿
                {selectedDayDrawer.expectedCash.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>เงินทอนตั้งต้น:</span>
                  <strong>
                    ฿{selectedDayDrawer.drawer.openingCash.toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>+ ขายเงินสด (±นำเข้า/ออก):</span>
                  <strong className="text-emerald-700">
                    +฿
                    {(
                      selectedDayData.cashAmount +
                      selectedDayDrawer.cashIn -
                      selectedDayDrawer.cashOut
                    ).toFixed(2)}
                  </strong>
                </div>
                {selectedDayDrawer.drawer.status === "closed" &&
                  selectedDayDrawer.drawer.actualClosingCash !== undefined && (
                    <div className="flex justify-between border-t border-amber-200/80 pt-0.5 font-bold">
                      <span>นับจริงปิดกะ:</span>
                      <span
                        className={
                          selectedDayDrawer.diff === 0
                            ? "text-emerald-700"
                            : "text-rose-600"
                        }
                      >
                        ฿
                        {selectedDayDrawer.drawer.actualClosingCash.toFixed(2)}{" "}
                        (
                        {selectedDayDrawer.diff === 0
                          ? "ครบพอดี"
                          : selectedDayDrawer.diff! > 0
                          ? `เกิน +${selectedDayDrawer.diff}`
                          : `ขาด ${selectedDayDrawer.diff}`}
                        )
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Daily Breakdown Table (ตารางสรุปยอดขายรายวัน แยกเงินสด เงินโอน และลิ้นชัก) */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h3 className="text-xs font-bold text-slate-700">
                ตารางสรุปยอดขายและลิ้นชักเงินสดรายวัน (คลิกที่แถวเพื่อดูรายละเอียดหรือจัดการกะ)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/60 font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">วันที่</th>
                    <th className="px-4 py-2.5 text-center">จำนวนบิล</th>
                    <th className="px-4 py-2.5 text-right">เงินทอนตั้งต้น</th>
                    <th className="px-4 py-2.5 text-right text-emerald-700">
                      ขายรับเงินสด (Cash)
                    </th>
                    <th className="px-4 py-2.5 text-right text-amber-800">
                      รวมเงินสดในลิ้นชัก
                    </th>
                    <th className="px-4 py-2.5 text-right text-indigo-700">
                      ขายรับเงินโอน / QR
                    </th>
                    <th className="px-4 py-2.5 text-right">ยอดขายสุทธิรวม</th>
                    <th className="px-4 py-2.5 text-center">สถานะกะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailySalesList.map((day) => {
                    const isActiveRow =
                      selectedDayData?.dateKey === day.dateKey;
                    const dayDrawer = getCashDrawerForDate(day.dateKey);
                    const cIn = dayDrawer.movements
                      .filter((m) => m.type === "in")
                      .reduce((s, m) => s + m.amount, 0);
                    const cOut = dayDrawer.movements
                      .filter((m) => m.type === "out")
                      .reduce((s, m) => s + m.amount, 0);
                    const expectedInDrawer = Number(
                      (
                        dayDrawer.openingCash +
                        day.cashAmount +
                        cIn -
                        cOut
                      ).toFixed(2)
                    );

                    return (
                      <tr
                        key={day.dateKey}
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        className={`cursor-pointer transition ${
                          isActiveRow
                            ? "bg-emerald-50/40 font-medium"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{day.displayDate}</span>
                            {day.relativeLabel && (
                              <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                {day.relativeLabel}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {day.billCount} บิล
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          ฿
                          {dayDrawer.openingCash.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-700">
                            +฿
                            {day.cashAmount.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span className="ml-1 text-[11px] text-slate-400">
                            ({day.cashCount})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-amber-800">
                          ฿
                          {expectedInDrawer.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-indigo-700">
                            ฿
                            {day.transferAmount.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span className="ml-1 text-[11px] text-slate-400">
                            ({day.transferCount})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                          ฿
                          {day.totalRevenue.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCashDrawerModal(day.dateKey);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                              dayDrawer.status === "open"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            {dayDrawer.status === "open" ? (
                              <>
                                <Unlock className="h-3 w-3" /> เปิดกะอยู่
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" /> ปิดกะแล้ว
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: OVERALL KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              ยอดขายสะสมรวมทั้งหมด
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            ฿
            {metrics.totalRevenue.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            เงินสด ฿{metrics.totalCash.toLocaleString("th-TH")} • เงินโอน ฿
            {metrics.totalTransfer.toLocaleString("th-TH")}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              กำไรขั้นต้นสะสม (Gross Profit)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          {permissions.canViewCostAndProfit ? (
            <>
              <p className="mt-3 text-2xl font-extrabold text-indigo-700">
                ฿
                {metrics.totalProfit.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-600">
                อัตรากำไรเฉลี่ย {metrics.profitMargin.toFixed(1)}%
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-base font-bold text-slate-400">
                🔒 จำกัดสิทธิ์เจ้าของร้าน
              </p>
              <p className="mt-1 text-xs text-slate-400">
                ซ่อนข้อมูลต้นทุนและกำไร
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              ยอดซื้อเฉลี่ยต่อบิล
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            ฿{metrics.avgBill.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            ขายออกรวม {metrics.totalItemsSold} ชิ้น ({metrics.billCount} บิล)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              แจ้งเตือนสต็อกต่ำ/หมด
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-amber-700">
            {lowStockProducts.length} รายการ
          </p>
          <p className="mt-1 text-xs text-slate-500">
            จากสินค้าทั้งหมด {products.length} รายการ
          </p>
        </div>
      </div>

      {/* SECTION 3: TOP PRODUCTS & PAYMENT BREAKDOWN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">
              สินค้าขายดี (Top Selling Products)
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีข้อมูลการขาย
              </p>
            ) : (
              topProducts.map((item, idx) => {
                const maxRev = topProducts[0]?.revenue || 1;
                const widthPct = Math.max(8, (item.revenue / maxRev) * 100);
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.productId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <ProductImage
                          src={prod?.imageUrl}
                          alt={item.name}
                          className="h-8 w-8 shrink-0 rounded-lg border border-slate-200/80"
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">
                          ฿{item.revenue.toFixed(2)}
                        </span>
                        <span className="ml-2 text-slate-400">
                          ({item.qty} {item.unit})
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
            <Wallet className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">
              สัดส่วนช่องทางการชำระเงินทั้งหมด
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            {paymentBreakdown.map((pm) => {
              const pct =
                metrics.totalRevenue > 0
                  ? (pm.amount / metrics.totalRevenue) * 100
                  : 0;
              return (
                <div key={pm.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {pm.label}{" "}
                      <span className="text-slate-400">({pm.count} บิล)</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      ฿{pm.amount.toFixed(2)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${pm.color}`}
                      style={{
                        width: `${Math.max(pct, pm.count > 0 ? 5 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Summary Box: Cash vs Transfer Total */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3.5 text-xs">
              <div className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <Banknote className="h-3.5 w-3.5" />
                  <span>รวมเงินสดทั้งหมด</span>
                </div>
                <p className="mt-1 text-base font-extrabold text-emerald-700">
                  ฿
                  {metrics.totalCash.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-800">
                  <Landmark className="h-3.5 w-3.5" />
                  <span>รวมเงินโอน/QR ทั้งหมด</span>
                </div>
                <p className="mt-1 text-base font-extrabold text-indigo-700">
                  ฿
                  {metrics.totalTransfer.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: LOW STOCK ALERT & QUICK RESTOCK */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                รายการสินค้าใกล้หมด / ต้องสั่งซื้อเพิ่ม ({lowStockProducts.length})
              </h2>
              <p className="text-xs text-slate-500">
                สามารถกดปุ่ม &ldquo;+ เติมสต็อกด่วน&rdquo; เพื่อรับสินค้าเข้าคลังได้ทันที
              </p>
            </div>
          </div>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-emerald-700">
            🎉 สต็อกสินค้าทุกรายการอยู่ในเกณฑ์ปกติ
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <ProductImage
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-11 w-11 shrink-0 rounded-xl border border-amber-200/80"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.name}</p>
                    <p className="text-[11px] font-semibold text-rose-600">
                      เหลือ {p.stock} {p.unit} (เกณฑ์ขั้นต่ำ {p.minStock})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    adjustStock(
                      p.id,
                      "in",
                      24,
                      "เติมสต็อกด่วนจากหน้า Dashboard (+24)"
                    )
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  <span>+24 {p.unit}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
