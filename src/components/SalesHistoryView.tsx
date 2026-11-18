"use client";

import React, { useMemo, useState } from "react";
import { usePOS } from "@/context/POSContext";
import { SaleOrder } from "@/types/pos";
import ReceiptModal from "@/components/ReceiptModal";
import {
  Ban,
  CheckCircle2,
  Eye,
  Receipt,
  Search,
} from "lucide-react";
const PAYMENT_BADGES: Record<string, { label: string; style: string }> = {
  cash: { label: "เงินสด", style: "bg-emerald-100 text-emerald-800" },
  promptpay: { label: "QR พร้อมเพย์", style: "bg-indigo-100 text-indigo-800" },
  transfer: { label: "โอนเงิน", style: "bg-sky-100 text-sky-800" },
  card: { label: "บัตรเครดิต", style: "bg-purple-100 text-purple-800" },
};

export default function SalesHistoryView() {
  const { sales, settings, voidSale } = usePOS();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "voided">("all");
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (paymentFilter !== "all" && s.paymentMethod !== paymentFilter) {
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
        s.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [sales, paymentFilter, statusFilter, search]);

  const totalCompletedRevenue = useMemo(
    () =>
      filteredSales
        .filter((s) => s.status === "completed")
        .reduce((acc, s) => acc + s.total, 0),
    [filteredSales]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ประวัติบิลขายและใบเสร็จ (Sales History)
          </h1>
          <p className="text-xs text-slate-500">
            ค้นหาใบเสร็จย้อนหลัง พิมพ์ใบเสร็จซ้ำ หรือยกเลิกบิลเพื่อคืนสต็อกสินค้า
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-sm">
          <span className="text-slate-500">ยอดขายสุทธิ (จากรายการที่แสดง): </span>
          <strong className="text-sm font-extrabold text-emerald-700">
            ฿{totalCompletedRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่ใบเสร็จ (INV-...), ชื่อสินค้า, เบอร์โทร..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                <th className="px-4 py-3">วัน-เวลา</th>
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
                    ไม่พบรายการใบเสร็จ
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
                      className={`transition hover:bg-slate-50 ${sale.status === "voided" ? "opacity-60" : ""
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
                        {new Date(sale.createdAt).toLocaleString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate font-medium text-slate-800">
                          {sale.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
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
                        <div className="text-[10px] text-emerald-600">
                          กำไร ฿{sale.profit.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sale.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                            <Ban className="h-3 w-3" />
                            ยกเลิกแล้ว
                          </span>
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
                              onClick={() => voidSale(sale.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                              title="ยกเลิกบิลและคืนสต็อกสินค้า"
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

      {/* Receipt Preview Modal */}
      <ReceiptModal
        sale={selectedSale}
        settings={settings}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}

