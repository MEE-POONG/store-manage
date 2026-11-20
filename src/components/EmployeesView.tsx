"use client";

import React, { useMemo, useState } from "react";
import { ROLE_LABELS, usePOS } from "@/context/POSContext";
import { Employee, EmployeeRole } from "@/types/pos";
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Lock,
  Phone,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const AVATAR_COLORS = [
  { label: "เขียวมรกต", value: "bg-emerald-600" },
  { label: "น้ำเงินคราม", value: "bg-indigo-600" },
  { label: "ฟ้า", value: "bg-sky-600" },
  { label: "ส้มอำพัน", value: "bg-amber-600" },
  { label: "ม่วง", value: "bg-purple-600" },
  { label: "ชมพูเข้ม", value: "bg-rose-600" },
];

export default function EmployeesView() {
  const {
    employees,
    currentEmployee,
    permissions,
    sales,
    saveEmployee,
    deleteEmployee,
    openSwitchEmployeeModal,
    switchEmployee,
  } = usePOS();

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<EmployeeRole>("cashier");
  const [formPin, setFormPin] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formColor, setFormColor] = useState("bg-sky-600");
  const [formIsActive, setFormIsActive] = useState(true);

  // Per-employee sales statistics
  const employeeStats = useMemo(() => {
    const map = new Map<
      string,
      { billCount: number; totalRevenue: number }
    >();

    sales
      .filter((s) => s.status === "completed")
      .forEach((sale) => {
        // Match by cashierId or cashierName
        const matchedEmp = employees.find(
          (e) => e.id === sale.cashierId || e.name === sale.cashierName
        );
        const key = matchedEmp ? matchedEmp.id : sale.cashierName;
        const cur = map.get(key) || { billCount: 0, totalRevenue: 0 };
        cur.billCount += 1;
        cur.totalRevenue = Number((cur.totalRevenue + sale.total).toFixed(2));
        map.set(key, cur);
      });

    return map;
  }, [sales, employees]);

  const openAddModal = () => {
    setEditingId(undefined);
    setFormCode(`EMP-${String(employees.length + 1).padStart(3, "0")}`);
    setFormName("");
    setFormRole("cashier");
    setFormPin("5555");
    setFormPhone("");
    setFormColor("bg-sky-600");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setFormCode(emp.code);
    setFormName(emp.name);
    setFormRole(emp.role);
    setFormPin(emp.pin);
    setFormPhone(emp.phone);
    setFormColor(emp.avatarColor || "bg-sky-600");
    setFormIsActive(emp.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    saveEmployee({
      id: editingId,
      code: formCode.trim() || "EMP-000",
      name: formName.trim(),
      role: formRole,
      pin: formPin.trim().slice(0, 4) || "0000",
      phone: formPhone.trim() || "-",
      avatarColor: formColor,
      isActive: formIsActive,
    });
    setIsModalOpen(false);
  };

  const currentRoleInfo = ROLE_LABELS[currentEmployee.role];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            จัดการพนักงานและสิทธิ์การใช้งาน (Staff & Permissions)
          </h1>
          <p className="text-xs text-slate-500">
            กำหนดรายชื่อพนักงาน ตำแหน่ง รหัส PIN 4 หลักสำหรับการสลับแคชเชียร์ และตรวจสอบยอดขายรายบุคคล
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openSwitchEmployeeModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>สลับผู้ใช้งาน / กด PIN</span>
          </button>

          {permissions.canManageEmployees && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>เพิ่มพนักงานใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Active Session Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-white shadow ${currentEmployee.avatarColor}`}
          >
            {currentEmployee.name.slice(0, 2)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                ผู้ใช้งานที่กำลังเปิดเครื่องปัจจุบัน:
              </span>
              <strong className="text-base font-extrabold text-slate-900">
                {currentEmployee.name}
              </strong>
              <span
                className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${currentRoleInfo.badgeStyle}`}
              >
                {currentRoleInfo.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {currentRoleInfo.desc}
            </p>
          </div>
        </div>

        {!permissions.canManageEmployees && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800">
            <Lock className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              หากต้องการเพิ่ม/แก้ไขพนักงานหรือดูราคาทุน-กำไร กรุณาสลับเป็นบัญชี{" "}
              <button
                type="button"
                onClick={openSwitchEmployeeModal}
                className="font-bold underline hover:text-amber-950"
              >
                เจ้าของร้าน (PIN: 1111)
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Employee Roster Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              รายชื่อพนักงานทั้งหมด ({employees.length} คน)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            สามารถคลิก &ldquo;สลับใช้งาน&rdquo; เพื่อทดสอบมุมมองสิทธิ์ของแต่ละตำแหน่งได้ทันที
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">พนักงาน</th>
                <th className="px-4 py-3">ตำแหน่ง & สิทธิ์</th>
                <th className="px-4 py-3">เบอร์โทรศัพท์</th>
                <th className="px-4 py-3 text-center">รหัส PIN</th>
                <th className="px-4 py-3 text-center">จำนวนบิลที่ขาย</th>
                <th className="px-4 py-3 text-right">ยอดขายที่ทำได้</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isCurrent = currentEmployee.id === emp.id;
                const roleInfo = ROLE_LABELS[emp.role];
                const stats = employeeStats.get(emp.id) || {
                  billCount: 0,
                  totalRevenue: 0,
                };

                return (
                  <tr
                    key={emp.id}
                    className={`transition hover:bg-slate-50 ${
                      isCurrent ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm ${emp.avatarColor}`}
                        >
                          {emp.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {emp.name}
                            </span>
                            {isCurrent && (
                              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                กำลังใช้งาน
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {emp.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-lg border px-2.5 py-1 text-[11px] font-bold ${roleInfo.badgeStyle}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono">
                      {permissions.canManageEmployees || isCurrent ? (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-800">
                          {emp.pin}
                        </span>
                      ) : (
                        <span className="text-slate-400">••••</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                      {stats.billCount} บิล
                    </td>

                    <td className="px-4 py-3.5 text-right font-extrabold text-emerald-700">
                      ฿
                      {stats.totalRevenue.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          ปกติ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                          ระงับชั่วคราว
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {!isCurrent && emp.isActive && (
                          <button
                            type="button"
                            onClick={() => switchEmployee(emp.id, "", true)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                            title="สลับไปใช้งานในชื่อพนักงานคนนี้"
                          >
                            สลับใช้งาน
                          </button>
                        )}
                        {permissions.canManageEmployees && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(emp)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              title="แก้ไขข้อมูลพนักงาน"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEmployee(emp.id)}
                              disabled={
                                emp.role === "owner" &&
                                employees.filter(
                                  (e) => e.isActive && e.role === "owner"
                                ).length <= 1
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                              title="ลบพนักงาน"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Comparison Matrix */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">
            ตารางกำหนดสิทธิ์การใช้งานตามตำแหน่ง (Role-Based Permissions Matrix)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ความสามารถ / การเข้าถึงเมนู</th>
                <th className="px-4 py-3 text-center text-sky-800">
                  พนักงานแคชเชียร์ (Cashier)
                </th>
                <th className="px-4 py-3 text-center text-indigo-800">
                  ผู้จัดการร้าน (Manager)
                </th>
                <th className="px-4 py-3 text-center text-emerald-800">
                  เจ้าของร้าน (Owner)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                {
                  feature:
                    "ขายสินค้าหน้าร้าน (POS) / สแกนบาร์โค้ด / พักบิล / พิมพ์ใบเสร็จ",
                  cashier: "✅ ได้",
                  manager: "✅ ได้",
                  owner: "✅ ได้",
                },
                {
                  feature:
                    "บันทึกเงินทอนตั้งต้น & นับเงินสดปิดกะ (Cash Drawer)",
                  cashier: "✅ ได้",
                  manager: "✅ ได้",
                  owner: "✅ ได้",
                },
                {
                  feature: "ดูรายการสินค้าและจำนวนสต็อกคงเหลือ",
                  cashier: "✅ ได้",
                  manager: "✅ ได้",
                  owner: "✅ ได้",
                },
                {
                  feature: "เพิ่ม/แก้ไขสินค้า และรับของเข้า/ปรับสต็อก",
                  cashier: "🔒 ไม่ได้ (ดูได้อย่างเดียว)",
                  manager: "✅ ได้",
                  owner: "✅ ได้",
                },
                {
                  feature:
                    "ยกเลิกบิลขาย (Void Bill เพื่อคืนสต็อก)",
                  cashier: "🔑 ต้องใช้ PIN ผู้จัดการ/เจ้าของร้านอนุมัติ",
                  manager: "✅ อนุมัติได้ทันที",
                  owner: "✅ อนุมัติได้ทันที",
                },
                {
                  feature:
                    "ดูราคาทุนสินค้า (Cost) และกำไรขั้นต้น (Gross Profit)",
                  cashier: "🔒 ซ่อนข้อมูล",
                  manager: "🔒 ซ่อนข้อมูล",
                  owner: "✅ ดูได้ทั้งหมด",
                },
                {
                  feature:
                    "ลบรายการสินค้า / จัดการพนักงาน / ตั้งค่าร้านค้า",
                  cashier: "🔒 ไม่ได้",
                  manager: "🔒 ไม่ได้",
                  owner: "✅ ได้ทั้งหมด",
                },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    {row.feature}
                  </td>
                  <td className="px-4 py-2.5 text-center">{row.cashier}</td>
                  <td className="px-4 py-2.5 text-center">{row.manager}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-emerald-700">
                    {row.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {editingId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    รหัสพนักงาน
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block font-semibold text-slate-700">
                    ชื่อ-นามสกุล / ชื่อเรียก *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น น้องฟ้า (แคชเชียร์)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  ตำแหน่งและระดับสิทธิ์การใช้งาน *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as EmployeeRole)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="cashier">
                    พนักงานแคชเชียร์ (Cashier) — ขายหน้าร้าน & เปิด/ปิดกะ
                  </option>
                  <option value="manager">
                    ผู้จัดการร้าน (Manager) — จัดการสต็อก & อนุมัติยกเลิกบิลได้
                  </option>
                  <option value="owner">
                    เจ้าของร้าน (Owner) — สิทธิ์สูงสุด ดูราคาทุน-กำไรได้
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 font-semibold text-slate-700">
                    <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                    <span>รหัส PIN 4 หลัก *</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={formPin}
                    onChange={(e) =>
                      setFormPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="เช่น 1234"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-base font-bold tracking-widest text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-slate-700">
                  สีโปรไฟล์พนักงาน
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className={`h-8 w-8 rounded-xl ${c.value} ${
                        formColor === c.value
                          ? "ring-2 ring-slate-900 ring-offset-2"
                          : "opacity-70"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 pt-1 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>เปิดใช้งานบัญชีพนักงานนี้ (Active)</span>
              </label>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                บันทึกข้อมูลพนักงาน
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
