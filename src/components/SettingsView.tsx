"use client";

import React, { useState } from "react";
import { usePOS } from "@/context/POSContext";
import {
  CheckCircle2,
  Download,
  RotateCcw,
  Save,
  Store,
} from "lucide-react";

export default function SettingsView() {
  const {
    settings,
    products,
    categories,
    sales,
    stockLogs,
    permissions,
    openSwitchEmployeeModal,
    updateSettings,
    resetToDemoData,
  } = usePOS();

  const [form, setForm] = useState(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleExportJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      products,
      sales,
      stockLogs,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sabaipos-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          ตั้งค่าร้านค้าและใบเสร็จ (Store Settings)
        </h1>
        <p className="text-xs text-slate-500">
          กำหนดข้อมูลร้านค้า เลขผู้เสียภาษี เบอร์พร้อมเพย์รับเงิน และจัดการข้อมูลในเครื่อง (LocalStorage)
        </p>
      </div>

      {!permissions.canManageSettings && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <span>
            🔒 เฉพาะบัญชีตำแหน่ง <strong>เจ้าของร้าน (Owner)</strong>{" "}
            เท่านั้นที่สามารถบันทึกการแก้ไขตั้งค่าร้านค้าหรือรีเซ็ตระบบได้
          </span>
          <button
            type="button"
            onClick={openSwitchEmployeeModal}
            className="rounded-xl bg-amber-600 px-3.5 py-2 font-bold text-white hover:bg-amber-700"
          >
            สลับเป็นเจ้าของร้าน (PIN: 1111)
          </button>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Store className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-800">
            ข้อมูลร้านค้าบนหัวใบเสร็จ
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              ชื่อร้านค้า *
            </label>
            <input
              type="text"
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              ชื่อสาขา / รหัสสาขา
            </label>
            <input
              type="text"
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              เลขประจำตัวผู้เสียภาษี (Tax ID)
            </label>
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              เบอร์โทรศัพท์ร้าน
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block font-semibold text-slate-700">
              ที่อยู่ร้านค้า
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              หมายเลขพร้อมเพย์ (PromptPay ID สำหรับสร้าง QR)
            </label>
            <input
              type="text"
              value={form.promptPayId}
              onChange={(e) =>
                setForm({ ...form, promptPayId: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              ชื่อพนักงานแคชเชียร์ปัจจุบัน
            </label>
            <input
              type="text"
              value={form.cashierName}
              onChange={(e) =>
                setForm({ ...form, cashierName: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              อัตราภาษีมูลค่าเพิ่ม VAT (%)
            </label>
            <input
              type="number"
              step="any"
              value={form.vatRate}
              onChange={(e) =>
                setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              วิธีคำนวณ VAT
            </label>
            <select
              value={form.vatIncluded ? "included" : "excluded"}
              onChange={(e) =>
                setForm({
                  ...form,
                  vatIncluded: e.target.value === "included",
                })
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="included">รวมในราคาสินค้าแล้ว (VAT Included)</option>
              <option value="excluded">แยกนอกราคาสินค้า (VAT Excluded)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block font-semibold text-slate-700">
              ข้อความท้ายใบเสร็จ
            </label>
            <input
              type="text"
              value={form.receiptFooter}
              onChange={(e) =>
                setForm({ ...form, receiptFooter: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {savedNotice ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              บันทึกการตั้งค่าเรียบร้อยแล้ว
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={!permissions.canManageSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </form>

      {/* LocalStorage Data Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800">
          จัดการข้อมูลระบบ (LocalStorage Data)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          ข้อมูลทั้งหมดถูกจัดเก็บไว้ในเบราว์เซอร์ของคุณ สามารถส่งออกเป็นไฟล์ JSON เพื่อสำรองข้อมูล หรือรีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้นได้
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>สำรองข้อมูล (Export JSON)</span>
          </button>

          <button
            type="button"
            disabled={!permissions.canManageSettings}
            onClick={() => {
              resetToDemoData();
              setForm({
                ...settings,
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            <span>รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น (Reset Demo Data)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

