"use client";

import React, { useMemo } from "react";
import { usePOS } from "@/context/POSContext";
import ProductImage from "@/components/ProductImage";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  PackagePlus,
  Receipt,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";

export default function DashboardView() {
  const { sales, products, adjustStock } = usePOS();

  const completedSales = useMemo(
    () => sales.filter((s) => s.status === "completed"),
    [sales]
  );

  const metrics = useMemo(() => {
    const totalRevenue = completedSales.reduce((s, o) => s + o.total, 0);
    const totalProfit = completedSales.reduce((s, o) => s + o.profit, 0);
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
    const counts: Record<string, { label: string; amount: number; count: number; color: string }> = {
      cash: { label: "เงินสด (Cash)", amount: 0, count: 0, color: "bg-emerald-500" },
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          แดชบอร์ดสรุปภาพรวมร้านค้า (Sales & Inventory Analytics)
        </h1>
        <p className="text-xs text-slate-500">
          สรุปยอดขาย กำไรขั้นต้น ช่องทางการรับชำระเงิน สินค้าขายดี และแจ้งเตือนสต็อกสินค้าใกล้หมด
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              ยอดขายสุทธิรวม
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
            จากทั้งหมด {metrics.billCount} บิลสำเร็จ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              กำไรขั้นต้น (Gross Profit)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-indigo-700">
            ฿
            {metrics.totalProfit.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            อัตรากำไรเฉลี่ย {metrics.profitMargin.toFixed(1)}%
          </p>
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
            ขายออกรวม {metrics.totalItemsSold} ชิ้น
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

      {/* Middle Row: Top Products & Payment Breakdown */}
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
              สัดส่วนช่องทางการชำระเงิน
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
                      style={{ width: `${Math.max(pct, pm.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Low Stock Alert & Quick Restock */}
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

