"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getTodayDateKey, usePOS } from "@/context/POSContext";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Lock,
  Plus,
  QrCode,
  Save,
  Trash2,
  Unlock,
  Wallet,
  X,
} from "lucide-react";

function getLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatThaiDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const DENOMINATIONS = [
  { value: 1000, label: "แบงก์ ฿1,000" },
  { value: 500, label: "แบงก์ ฿500" },
  { value: 100, label: "แบงก์ ฿100" },
  { value: 50, label: "แบงก์ ฿50" },
  { value: 20, label: "แบงก์ ฿20" },
  { value: 10, label: "เหรียญ ฿10" },
  { value: 5, label: "เหรียญ ฿5" },
  { value: 2, label: "เหรียญ ฿2" },
  { value: 1, label: "เหรียญ ฿1" },
];

export default function CashDrawerModal() {
  const {
    isCashDrawerModalOpen,
    cashDrawerModalDateKey,
    openCashDrawerModal,
    closeCashDrawerModal,
    sales,
    getCashDrawerForDate,
    setOpeningCash,
    addDrawerMovement,
    deleteDrawerMovement,
    closeCashDrawerShift,
    reopenCashDrawerShift,
  } = usePOS();

  const [activeSection, setActiveSection] = useState<
    "summary" | "movements" | "close"
  >("summary");

  const drawer = getCashDrawerForDate(cashDrawerModalDateKey);
  const todayKey = getTodayDateKey();

  // Form states
  const [openingInput, setOpeningInput] = useState<string>(
    String(drawer.openingCash)
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Movement form state
  const [mvmType, setMvmType] = useState<"in" | "out">("out");
  const [mvmAmount, setMvmAmount] = useState<string>("");
  const [mvmNote, setMvmNote] = useState<string>("");

  // Close shift form state
  const [actualCashInput, setActualCashInput] = useState<string>("");
  const [closeNote, setCloseNote] = useState<string>("");
  const [showDenomHelper, setShowDenomHelper] = useState<boolean>(false);
  const [denomCounts, setDenomCounts] = useState<Record<number, string>>({});

  // Calculate sales & drawer totals for the selected date
  const dayStats = useMemo(() => {
    const dayCompletedSales = sales.filter(
      (s) =>
        s.status === "completed" &&
        getLocalDateKey(s.createdAt) === cashDrawerModalDateKey
    );

    const cashSalesAmount = Number(
      dayCompletedSales
        .filter((s) => s.paymentMethod === "cash")
        .reduce((acc, s) => acc + s.total, 0)
        .toFixed(2)
    );
    const cashSalesCount = dayCompletedSales.filter(
      (s) => s.paymentMethod === "cash"
    ).length;

    const transferSalesAmount = Number(
      dayCompletedSales
        .filter((s) => s.paymentMethod !== "cash")
        .reduce((acc, s) => acc + s.total, 0)
        .toFixed(2)
    );
    const transferSalesCount = dayCompletedSales.filter(
      (s) => s.paymentMethod !== "cash"
    ).length;

    const cashInAmount = Number(
      drawer.movements
        .filter((m) => m.type === "in")
        .reduce((acc, m) => acc + m.amount, 0)
        .toFixed(2)
    );
    const cashOutAmount = Number(
      drawer.movements
        .filter((m) => m.type === "out")
        .reduce((acc, m) => acc + m.amount, 0)
        .toFixed(2)
    );

    const expectedCash = Number(
      (
        drawer.openingCash +
        cashSalesAmount +
        cashInAmount -
        cashOutAmount
      ).toFixed(2)
    );

    return {
      cashSalesAmount,
      cashSalesCount,
      transferSalesAmount,
      transferSalesCount,
      cashInAmount,
      cashOutAmount,
      expectedCash,
    };
  }, [sales, cashDrawerModalDateKey, drawer]);

  // Sync inputs when dateKey or modal opens
  useEffect(() => {
    if (!isCashDrawerModalOpen) return;
    setOpeningInput(String(drawer.openingCash));
    setActualCashInput(
      drawer.actualClosingCash !== undefined
        ? String(drawer.actualClosingCash)
        : String(dayStats.expectedCash)
    );
    setCloseNote(drawer.note || "");
    setDenomCounts({});
  }, [
    isCashDrawerModalOpen,
    cashDrawerModalDateKey,
    drawer.openingCash,
    drawer.actualClosingCash,
    drawer.note,
    dayStats.expectedCash,
  ]);

  if (!isCashDrawerModalOpen) return null;

  const showToast = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2800);
  };

  const handleSaveOpeningCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.max(0, parseFloat(openingInput) || 0);
    setOpeningCash(cashDrawerModalDateKey, val);
    showToast(`บันทึกเงินทอนตั้งต้น ฿${val.toFixed(2)} เรียบร้อยแล้ว`);
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(mvmAmount) || 0;
    if (amt <= 0) return;
    addDrawerMovement(cashDrawerModalDateKey, mvmType, amt, mvmNote);
    setMvmAmount("");
    setMvmNote("");
    showToast(
      mvmType === "in"
        ? `บันทึกนำเงินสดเข้าลิ้นชัก +฿${amt.toFixed(2)} แล้ว`
        : `บันทึกนำเงินสดออกจากลิ้นชัก -฿${amt.toFixed(2)} แล้ว`
    );
  };

  const handleDenomChange = (denomValue: number, qtyStr: string) => {
    const nextCounts = { ...denomCounts, [denomValue]: qtyStr };
    setDenomCounts(nextCounts);

    const sum = DENOMINATIONS.reduce((acc, d) => {
      const q = Math.max(0, parseInt(nextCounts[d.value] || "0", 10) || 0);
      return acc + d.value * q;
    }, 0);
    setActualCashInput(String(sum));
  };

  const actualCashNum = Math.max(0, parseFloat(actualCashInput) || 0);
  const cashDiff = Number((actualCashNum - dayStats.expectedCash).toFixed(2));

  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    closeCashDrawerShift(cashDrawerModalDateKey, actualCashNum, closeNote);
    showToast("บันทึกยอดนับเงินสดและปิดกะเรียบร้อยแล้ว");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  ลิ้นชักเงินสด & เปิด-ปิดกะ (Cash Drawer)
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    drawer.status === "open"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {drawer.status === "open" ? (
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
              <p className="text-xs text-slate-400">
                ประจำวันที่ {formatThaiDate(cashDrawerModalDateKey)}{" "}
                {cashDrawerModalDateKey === todayKey && "(วันนี้)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={cashDrawerModalDateKey}
              onChange={(e) => {
                if (e.target.value) openCashDrawerModal(e.target.value);
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={closeCashDrawerModal}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5">
          {[
            {
              id: "summary",
              label: "1. เงินทอนตั้งต้น & ยอดในลิ้นชัก",
              icon: Banknote,
            },
            {
              id: "movements",
              label: `2. นำเงินสดเข้า/ออก (${drawer.movements.length})`,
              icon: ArrowUpRight,
            },
            {
              id: "close",
              label: "3. นับเงินสดปิดกะ",
              icon: Calculator,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveSection(tab.id as typeof activeSection)
                }
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition ${
                  active
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toast Feedback */}
        {savedNotice && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto p-5 text-xs">
          {/* TAB 1: SUMMARY & OPENING CASH */}
          {activeSection === "summary" && (
            <>
              {/* Expected Cash Equation Banner */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800">
                      เงินสดที่ควรมีในลิ้นชัก (Expected Cash in Drawer)
                    </span>
                    <p className="text-[11px] text-emerald-700">
                      คำนวณจาก: เงินทอนตั้งต้น + ขายเงินสด + นำเข้า - นำออก
                    </p>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700">
                    ฿
                    {dayStats.expectedCash.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Breakdown Grid */}
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="text-[11px] text-slate-500">
                      เงินทอนตั้งต้น (เปิดกะ)
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      ฿
                      {drawer.openingCash.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="text-[11px] text-slate-500">
                      + ขายรับเงินสด ({dayStats.cashSalesCount} บิล)
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-emerald-700">
                      +฿
                      {dayStats.cashSalesAmount.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="text-[11px] text-slate-500">
                      + นำเงินเข้าลิ้นชักเพิ่ม
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-sky-700">
                      +฿
                      {dayStats.cashInAmount.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="text-[11px] text-slate-500">
                      - นำเงินออกจากลิ้นชัก
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-rose-600">
                      -฿
                      {dayStats.cashOutAmount.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Separate Note for Transfer / QR Sales */}
              <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <QrCode className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-bold text-indigo-950">
                      ยอดรับเงินโอน / QR พร้อมเพย์ ของวันนี้ ({dayStats.transferSalesCount}{" "}
                      บิล)
                    </p>
                    <p className="text-[11px] text-indigo-700">
                      ยอดนี้เข้าบัญชีธนาคารโดยตรง ไม่ถูกนำมารวมกับเงินสดในลิ้นชัก
                    </p>
                  </div>
                </div>
                <span className="text-base font-extrabold text-indigo-700">
                  ฿
                  {dayStats.transferSalesAmount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Form: Set Daily Opening Cash */}
              <form
                onSubmit={handleSaveOpeningCash}
                className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      กำหนดเงินทอนตั้งต้นประจำวัน (Opening Cash Float)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ระบุจำนวนเงินสดที่เตรียมไว้ในลิ้นชักตอนเปิดร้านสำหรับทอนลูกค้า
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  {[500, 1000, 1500, 2000, 3000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningInput(String(preset))}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        Number(openingInput) === preset
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      ฿{preset.toLocaleString("th-TH")}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ฿
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={openingInput}
                      onChange={(e) => setOpeningInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-base font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>บันทึกเงินทอนตั้งต้น</span>
                  </button>
                </div>
              </form>
            </>
          )}

          {/* TAB 2: CASH IN / OUT MOVEMENTS */}
          {activeSection === "movements" && (
            <div className="space-y-4">
              <form
                onSubmit={handleAddMovement}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-sm font-bold text-slate-900">
                  บันทึกนำเงินสดเข้า / ออกจากลิ้นชักระหว่างวัน
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMvmType("out")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-bold transition ${
                      mvmType === "out"
                        ? "border-rose-600 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>- นำเงินออก (จ่ายค่าใช้จ่ายหน้าร้าน)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMvmType("in")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-bold transition ${
                      mvmType === "in"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>+ นำเงินทอนเข้าลิ้นชักเพิ่ม</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">
                      จำนวนเงิน (บาท) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={1}
                      required
                      value={mvmAmount}
                      onChange={(e) => setMvmAmount(e.target.value)}
                      placeholder="เช่น 100"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block font-semibold text-slate-700">
                      หมายเหตุ / รายละเอียด *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={mvmNote}
                        onChange={(e) => setMvmNote(e.target.value)}
                        placeholder={
                          mvmType === "out"
                            ? "เช่น จ่ายค่าน้ำแข็ง, ซื้อถุงพลาสติก"
                            : "เช่น เติมเหรียญ 10 บาทไว้ทอนลูกค้า"
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        <span>เพิ่มรายการ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Movements List */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-700">
                  ประวัติการนำเงินสดเข้า/ออกลิ้นชัก ({drawer.movements.length})
                </div>
                {drawer.movements.length === 0 ? (
                  <p className="py-8 text-center text-slate-400">
                    ยังไม่มีรายการนำเงินสดเข้าหรือออกจากลิ้นชักในวันนี้
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {drawer.movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                m.type === "in"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {m.type === "in" ? "+ นำเงินเข้า" : "- นำเงินออก"}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {m.note}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            เวลา{" "}
                            {new Date(m.createdAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-extrabold ${
                              m.type === "in"
                                ? "text-emerald-700"
                                : "text-rose-600"
                            }`}
                          >
                            {m.type === "in" ? "+" : "-"}฿{m.amount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              deleteDrawerMovement(
                                cashDrawerModalDateKey,
                                m.id
                              )
                            }
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CLOSE SHIFT & RECONCILE CASH */}
          {activeSection === "close" && (
            <form onSubmit={handleConfirmCloseShift} className="space-y-4">
              {/* Comparison Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-semibold text-slate-500">
                    1. เงินสดที่ควรมีในลิ้นชัก
                  </span>
                  <p className="mt-1 text-xl font-extrabold text-slate-900">
                    ฿
                    {dayStats.expectedCash.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    ตั้งต้น ฿{drawer.openingCash} + ขายสด ฿
                    {dayStats.cashSalesAmount}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300 bg-white p-4">
                  <span className="text-[11px] font-semibold text-emerald-700">
                    2. เงินสดที่นับได้จริง (บาท)
                  </span>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    required
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1 text-lg font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    cashDiff === 0
                      ? "border-emerald-200 bg-emerald-50"
                      : cashDiff > 0
                      ? "border-sky-200 bg-sky-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-600">
                    3. ผลต่าง (ขาด / เกิน)
                  </span>
                  <p
                    className={`mt-1 text-xl font-extrabold ${
                      cashDiff === 0
                        ? "text-emerald-700"
                        : cashDiff > 0
                        ? "text-sky-700"
                        : "text-rose-600"
                    }`}
                  >
                    {cashDiff === 0
                      ? "ครบพอดี (฿0.00)"
                      : cashDiff > 0
                      ? `เงินเกิน +฿${cashDiff.toFixed(2)}`
                      : `เงินขาด -฿${Math.abs(cashDiff).toFixed(2)}`}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {cashDiff === 0
                      ? "ยอดเงินสดตรงตามระบบ"
                      : "กรุณาตรวจสอบธนบัตรและเหรียญอีกครั้ง"}
                  </p>
                </div>
              </div>

              {/* Optional Banknote & Coin Counter Helper */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowDenomHelper(!showDenomHelper)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>
                      {showDenomHelper
                        ? "ซ่อนตารางช่วยนับธนบัตรและเหรียญ"
                        : "เปิดตารางช่วยนับธนบัตรและเหรียญ (คำนวณยอดรวมอัตโนมัติ)"}
                    </span>
                  </button>
                </div>

                {showDenomHelper && (
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {DENOMINATIONS.map((d) => {
                      const count =
                        parseInt(denomCounts[d.value] || "0", 10) || 0;
                      return (
                        <div
                          key={d.value}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div>
                            <p className="font-bold text-slate-800">
                              {d.label}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              = ฿{(d.value * count).toLocaleString("th-TH")}
                            </p>
                          </div>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={denomCounts[d.value] || ""}
                            onChange={(e) =>
                              handleDenomChange(d.value, e.target.value)
                            }
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  หมายเหตุปิดกะ / บันทึกเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="เช่น นับเงินสดปิดร้านครบถ้วน นำส่งยอดขายเรียบร้อย"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {drawer.status === "closed" ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">
                      <Lock className="h-3.5 w-3.5" />
                      ปิดกะแล้วโดย {drawer.closedBy || "แคชเชียร์"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        reopenCashDrawerShift(cashDrawerModalDateKey);
                        showToast("เปิดกะเพื่อแก้ไขข้อมูลเรียบร้อยแล้ว");
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      <span>เปิดกะอีกครั้ง</span>
                    </button>
                  </div>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {drawer.status === "closed"
                      ? "อัปเดตยอดปิดกะ"
                      : "ยืนยันนับเงินสด & ปิดกะประจำวัน"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
