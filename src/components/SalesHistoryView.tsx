"use client";

import React, { useMemo, useState } from "react";
import { usePOS } from "@/context/POSContext";
import { SaleOrder } from "@/types/pos";
import ReceiptModal from "@/components/ReceiptModal";
import {
  AlertTriangle,
  Ban,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Eye,
  KeyRound,
  QrCode,
  Receipt,
  Search,
  UserCheck,
  X,
} from "lucide-react";

const PAYMENT_BADGES: Record<string, { label: string; style: string }> = {
  cash: { label: "เงินสด", style: "bg-emerald-100 text-emerald-800" },
  promptpay: { label: "QR พร้อมเพย์", style: "bg-indigo-100 text-indigo-800" },
  transfer: { label: "โอนเงิน", style: "bg-sky-100 text-sky-800" },
  card: { label: "บัตรเครดิต", style: "bg-purple-100 text-purple-800" },
};

function getLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatThaiDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SalesHistoryView() {
  const {
    sales,
    settings,
    employees,
    permissions,
    voidSale,
    verifyManagerOrOwnerPin,
  } = usePOS();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all" or "YYYY-MM-DD"
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "voided"
  >("all");
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);

  // Manager/Owner PIN Approval Modal for Voiding Bill when logged in as Cashier
  const [voidTargetSale, setVoidTargetSale] = useState<SaleOrder | null>(null);
  const [approverPin, setApproverPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const todayKey = useMemo(() => getLocalDateKey(new Date().toISOString()), []);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateKey(d.toISOString());
  }, []);

  // Unique cashiers from sales + employee list
  const cashierOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => set.add(e.name));
    sales.forEach((s) => {
      if (s.cashierName) set.add(s.cashierName);
    });
    return Array.from(set);
  }, [employees, sales]);

  // List of unique dates present in sales history for quick filter pills
  const availableDates = useMemo(() => {
    const countMap = new Map<string, number>();
    sales.forEach((s) => {
      const k = getLocalDateKey(s.createdAt);
      countMap.set(k, (countMap.get(k) || 0) + 1);
    });
    return Array.from(countMap.entries())
      .map(([dateKey, count]) => ({
        dateKey,
        count,
        label: formatThaiDateLabel(dateKey),
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (dateFilter !== "all") {
        const saleDateKey = getLocalDateKey(s.createdAt);
        if (saleDateKey !== dateFilter) return false;
      }
      if (paymentFilter !== "all" && s.paymentMethod !== paymentFilter) {
        return false;
      }
      if (cashierFilter !== "all" && s.cashierName !== cashierFilter) {
        return false;
      }
      if (statusFilter !== "all" && s.status !== statusFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        s.receiptNo.toLowerCase().includes(q) ||
        (s.customerPhone && s.customerPhone.includes(q)) ||
        s.cashierName.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [sales, dateFilter, paymentFilter, cashierFilter, statusFilter, search]);

  const filteredSummary = useMemo(() => {
    const completed = filteredSales.filter((s) => s.status === "completed");
    const totalRevenue = completed.reduce((acc, s) => acc + s.total, 0);
    const cashRevenue = completed
      .filter((s) => s.paymentMethod === "cash")
      .reduce((acc, s) => acc + s.total, 0);
    const transferRevenue = completed
      .filter((s) => s.paymentMethod !== "cash")
      .reduce((acc, s) => acc + s.total, 0);

    return {
      completedCount: completed.length,
      totalRevenue,
      cashRevenue,
      transferRevenue,
    };
  }, [filteredSales]);

  const handleVoidClick = (sale: SaleOrder) => {
    if (permissions.canVoidSales) {
      voidSale(sale.id);
    } else {
      setVoidTargetSale(sale);
      setApproverPin("");
      setPinError(null);
    }
  };

  const handleApproveVoidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTargetSale) return;
    const res = verifyManagerOrOwnerPin(approverPin);
    if (res.ok && res.approver) {
      voidSale(voidTargetSale.id, res.approver.name);
      setVoidTargetSale(null);
      setApproverPin("");
      setPinError(null);
    } else {
      setPinError(
        res.message || "รหัส PIN ไม่ถูกต้อง (ทดสอบใช้ 1111 หรือ 2222)"
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      {/* Header & Filtered Summary Strip */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ประวัติบิลขายและใบเสร็จ (Sales History)
          </h1>
          <p className="text-xs text-slate-500">
            เลือกกรองดูบิลเฉพาะวันที่หรือตามพนักงานแคชเชียร์ พิมพ์ใบเสร็จซ้ำ หรือยกเลิกบิลเพื่อคืนสต็อกสินค้า
          </p>
        </div>

        {/* Summary badges of currently filtered rows */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-emerald-900">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <span>เงินสด:</span>
            <strong className="font-bold text-emerald-700">
              ฿
              {filteredSummary.cashRevenue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-indigo-900">
            <QrCode className="h-4 w-4 text-indigo-600" />
            <span>เงินโอน/QR:</span>
            <strong className="font-bold text-indigo-700">
              ฿
              {filteredSummary.transferRevenue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-slate-500">
              รวมสุทธิ ({filteredSummary.completedCount} บิล):{" "}
            </span>
            <strong className="text-sm font-extrabold text-slate-900">
              ฿
              {filteredSummary.totalRevenue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Top Row: Quick Date Pills + Calendar Date Picker */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="mr-1 flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              เลือกวันที่:
            </span>

            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                dateFilter === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              ทุกวัน ({sales.length})
            </button>

            <button
              type="button"
              onClick={() => setDateFilter(todayKey)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                dateFilter === todayKey
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              วันนี้
            </button>

            <button
              type="button"
              onClick={() => setDateFilter(yesterdayKey)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                dateFilter === yesterdayKey
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              เมื่อวาน
            </button>

            {availableDates
              .filter(
                (d) => d.dateKey !== todayKey && d.dateKey !== yesterdayKey
              )
              .map((d) => (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => setDateFilter(d.dateKey)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    dateFilter === d.dateKey
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {d.label} ({d.count})
                </button>
              ))}
          </div>

          {/* Native Calendar Date Picker Input */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter === "all" ? "" : dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value ? e.target.value : "all")
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
            {dateFilter !== "all" && (
              <button
                type="button"
                onClick={() => setDateFilter("all")}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-200/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300/80"
                title="ล้างตัวกรองวันที่"
              >
                <X className="h-3.5 w-3.5" />
                <span>ดูทุกวัน</span>
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Search, Cashier Filter, Payment Filter, Status Filter */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่ใบเสร็จ (INV-...), ชื่อสินค้า, พนักงาน..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="all">พนักงานทุกคน</option>
              {cashierOptions.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="all">ทุกช่องทางชำระเงิน</option>
              <option value="cash">เงินสด</option>
              <option value="promptpay">QR พร้อมเพย์</option>
              <option value="transfer">โอนเงิน</option>
              <option value="card">บัตรเครดิต</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="all">ทุกสถานะบิล</option>
              <option value="completed">สำเร็จ (Completed)</option>
              <option value="voided">ยกเลิกบิล (Voided)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">เลขที่ใบเสร็จ</th>
                <th className="px-4 py-3">วัน-เวลา / แคชเชียร์</th>
                <th className="px-4 py-3">รายการสินค้า</th>
                <th className="px-4 py-3">ชำระโดย</th>
                <th className="px-4 py-3 text-right">ส่วนลด</th>
                <th className="px-4 py-3 text-right">ยอดสุทธิ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-slate-400"
                  >
                    ไม่พบรายการใบเสร็จในวันที่หรือเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const badge = PAYMENT_BADGES[sale.paymentMethod] || {
                    label: sale.paymentMethod,
                    style: "bg-slate-100 text-slate-700",
                  };
                  const itemCount = sale.items.reduce(
                    (s, i) => s + i.quantity,
                    0
                  );

                  return (
                    <tr
                      key={sale.id}
                      className={`transition hover:bg-slate-50 ${
                        sale.status === "voided" ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="h-4 w-4 text-emerald-600" />
                          {sale.receiptNo}
                        </div>
                        {sale.customerPhone && (
                          <span className="text-[11px] font-normal text-slate-400">
                            ลูกค้า: {sale.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>
                          {new Date(sale.createdAt).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <UserCheck className="h-3 w-3 text-emerald-600" />
                          <span>{sale.cashierName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate font-medium text-slate-800">
                          {sale.items
                            .map((i) => `${i.name} (${i.quantity})`)
                            .join(", ")}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          รวม {itemCount} ชิ้น
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        {sale.discount > 0
                          ? `-฿${sale.discount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          ฿{sale.total.toFixed(2)}
                        </div>
                        {permissions.canViewCostAndProfit && (
                          <div className="text-[10px] text-emerald-600">
                            กำไร ฿{sale.profit.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sale.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            สำเร็จ
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                              <Ban className="h-3 w-3" />
                              ยกเลิกแล้ว
                            </span>
                            {sale.voidedBy && (
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                โดย {sale.voidedBy}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>ดูใบเสร็จ</span>
                          </button>
                          {sale.status === "completed" && (
                            <button
                              onClick={() => handleVoidClick(sale)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                              title={
                                permissions.canVoidSales
                                  ? "ยกเลิกบิลและคืนสต็อกสินค้า"
                                  : "ขออนุมัติผู้จัดการ/เจ้าของร้านเพื่อยกเลิกบิล"
                              }
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>ยกเลิกบิล</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manager/Owner PIN Approval Modal for Cashier Void Request */}
      {voidTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleApproveVoidSubmit}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    ขออนุมัติยกเลิกบิล (Manager / Owner PIN)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    บิลเลขที่ {voidTargetSale.receiptNo} (ยอด ฿
                    {voidTargetSale.total.toFixed(2)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoidTargetSale(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              <p className="text-slate-600">
                เนื่องจากบัญชีปัจจุบันเป็น{" "}
                <strong>พนักงานแคชเชียร์ (Cashier)</strong>{" "}
                การยกเลิกบิลเพื่อคืนสต็อกต้องใส่รหัส PIN 4 หลักของ{" "}
                <strong>เจ้าของร้าน (1111)</strong> หรือ{" "}
                <strong>ผู้จัดการร้าน (2222)</strong> เพื่อยืนยัน
              </p>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  รหัส PIN ผู้อนุมัติ (4 หลัก)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={approverPin}
                  onChange={(e) => {
                    setPinError(null);
                    setApproverPin(
                      e.target.value.replace(/\D/g, "").slice(0, 4)
                    );
                  }}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-center font-mono text-lg font-extrabold tracking-widest text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-2 font-bold text-rose-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setVoidTargetSale(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                ยืนยันอนุมัติยกเลิกบิล
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Receipt Preview Modal */}
      <ReceiptModal
        sale={selectedSale}
        settings={settings}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}
