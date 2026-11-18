"use client";

import React from "react";
import { SaleOrder, StoreSettings } from "@/types/pos";
import { CheckCircle2, Printer, X } from "lucide-react";

interface ReceiptModalProps {
  sale: SaleOrder | null;
  settings: StoreSettings;
  onClose: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "เงินสด (Cash)",
  promptpay: "สแกน QR พร้อมเพย์",
  transfer: "โอนเงินธนาคาร",
  card: "บัตรเครดิต/เดบิต",
};

export default function ReceiptModal({
  sale,
  settings,
  onClose,
}: ReceiptModalProps) {
  if (!sale) return null;

  const formattedDate = new Date(sale.createdAt).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50/70 px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">ทำรายการสำเร็จ • ใบเสร็จรับเงิน</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Body */}
        <div className="overflow-y-auto p-6 font-mono text-sm text-slate-800 print:p-2">
          <div className="mx-auto max-w-xs">
            {/* Store Header */}
            <div className="text-center">
              <h2 className="font-sans text-lg font-bold text-slate-900">
                {settings.storeName}
              </h2>
              <p className="text-xs text-slate-500">{settings.branchName}</p>
              <p className="mt-1 text-xs text-slate-500">{settings.address}</p>
              <p className="text-xs text-slate-500">
                โทร: {settings.phone} | เลขผู้เสียภาษี: {settings.taxId}
              </p>
              <div className="my-3 border-b border-dashed border-slate-300" />
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-600">
                ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ
              </p>
              {sale.status === "voided" && (
                <span className="mt-1 inline-block rounded bg-rose-100 px-2 py-0.5 font-sans text-xs font-bold text-rose-700">
                  ยกเลิกบิลแล้ว (VOIDED)
                </span>
              )}
            </div>

            {/* Meta Info */}
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>เลขที่ใบเสร็จ:</span>
                <span className="font-semibold text-slate-900">
                  {sale.receiptNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span>วันที่/เวลา:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>แคชเชียร์:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>สมาชิก/เบอร์โทร:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="my-3 border-b border-dashed border-slate-300" />

            {/* Items */}
            <div className="space-y-2 text-xs">
              {sale.items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-sans font-medium text-slate-900">
                    {item.name}
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity} {item.unit} x ฿{item.price.toFixed(2)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      ฿{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-3 border-b border-dashed border-slate-300" />

            {/* Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>
                  รวมสินค้า ({sale.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                  ชิ้น)
                </span>
                <span>฿{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>ส่วนลดท้ายบิล</span>
                  <span>-฿{sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>
                  ภาษีมูลค่าเพิ่ม VAT {settings.vatRate}% (
                  {settings.vatIncluded ? "รวมใน" : "แยกนอก"})
                </span>
                <span>฿{sale.vatAmount.toFixed(2)}</span>
              </div>
              <div className="my-2 border-b border-slate-200" />
              <div className="flex items-baseline justify-between font-sans text-base font-bold text-slate-900">
                <span>ยอดสุทธิ (TOTAL)</span>
                <span className="text-lg text-emerald-700">
                  ฿{sale.total.toFixed(2)}
                </span>
              </div>

              <div className="pt-1 text-slate-600">
                <div className="flex justify-between">
                  <span>ชำระโดย:</span>
                  <span className="font-sans font-medium">
                    {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                  </span>
                </div>
                {sale.paymentMethod === "cash" &&
                  sale.cashReceived !== undefined && (
                    <>
                      <div className="flex justify-between">
                        <span>รับเงินสด:</span>
                        <span>฿{sale.cashReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>เงินทอน:</span>
                        <span>฿{(sale.changeAmount || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
              </div>
            </div>

            <div className="my-4 border-b border-dashed border-slate-300" />

            {/* Footer */}
            <div className="text-center font-sans text-xs text-slate-500">
              <p>{settings.receiptFooter}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                * {sale.receiptNo} *
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions (Hidden when printing) */}
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            พิมพ์ใบเสร็จ
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            เริ่มบิลถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

