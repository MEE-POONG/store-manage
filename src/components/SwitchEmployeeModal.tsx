"use client";

import React, { useEffect, useState } from "react";
import { ROLE_LABELS, usePOS } from "@/context/POSContext";
import { Employee } from "@/types/pos";
import {
  AlertTriangle,
  CheckCircle2,
  Delete,
  KeyRound,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

export default function SwitchEmployeeModal() {
  const {
    isSwitchEmployeeModalOpen,
    closeSwitchEmployeeModal,
    employees,
    currentEmployee,
    switchEmployee,
  } = usePOS();

  const activeEmployees = employees.filter((e) => e.isActive);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isSwitchEmployeeModalOpen) {
      setSelectedEmp(currentEmployee);
      setPin("");
      setErrorMsg(null);
    }
  }, [isSwitchEmployeeModalOpen, currentEmployee]);

  if (!isSwitchEmployeeModalOpen) return null;

  const handleDigitClick = (digit: string) => {
    setErrorMsg(null);
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4 && selectedEmp) {
      const res = switchEmployee(selectedEmp.id, nextPin, false);
      if (res.ok) {
        closeSwitchEmployeeModal();
      } else {
        setErrorMsg(res.message || "รหัส PIN ไม่ถูกต้อง");
        setTimeout(() => setPin(""), 400);
      }
    }
  };

  const handleQuickSwitchDemo = (emp: Employee) => {
    const res = switchEmployee(emp.id, "", true);
    if (res.ok) {
      closeSwitchEmployeeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                สลับผู้ใช้งาน / พนักงานแคชเชียร์ (Switch Staff)
              </h2>
              <p className="text-xs text-slate-400">
                เลือกชื่อพนักงานและกดรหัส PIN 4 หลักเพื่อเข้าปฏิบัติงานตามสิทธิ์ตำแหน่ง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSwitchEmployeeModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-5 overflow-y-auto p-5 md:grid-cols-12">
          {/* Left: Employee List */}
          <div className="space-y-2.5 md:col-span-7">
            <p className="text-xs font-bold text-slate-600">
              1. เลือกบัญชีพนักงาน ({activeEmployees.length} คน)
            </p>
            <div className="space-y-2">
              {activeEmployees.map((emp) => {
                const isSelected = selectedEmp?.id === emp.id;
                const isCurrent = currentEmployee.id === emp.id;
                const roleInfo = ROLE_LABELS[emp.role];

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmp(emp);
                      setPin("");
                      setErrorMsg(null);
                    }}
                    className={`cursor-pointer rounded-2xl border p-3 transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm ${emp.avatarColor}`}
                        >
                          {emp.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900">
                              {emp.name}
                            </p>
                            {isCurrent && (
                              <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                กำลังใช้งาน
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${roleInfo.badgeStyle}`}
                            >
                              {roleInfo.label}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              PIN ทดสอบ: {emp.pin}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickSwitchDemo(emp);
                        }}
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        title="สลับด่วนโดยไม่ต้องกด PIN (สำหรับทดสอบระบบ)"
                      >
                        สลับด่วน
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: 4-Digit PIN Pad */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <KeyRound className="h-4 w-4 text-emerald-600" />
                <span>2. กดรหัส PIN 4 หลัก</span>
              </div>
              {selectedEmp && (
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  เข้าสู่ระบบเป็น: <strong>{selectedEmp.name}</strong>
                </p>
              )}

              {/* 4 PIN Dots */}
              <div className="my-4 flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-lg font-bold transition ${
                        filled
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white text-slate-300"
                      }`}
                    >
                      {filled ? "•" : ""}
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="mb-3 flex items-center justify-center gap-1 rounded-xl bg-rose-100 px-3 py-1.5 text-[11px] font-bold text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Numpad Grid */}
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigitClick(d)}
                    className="h-11 rounded-xl border border-slate-200 bg-white text-base font-extrabold text-slate-800 shadow-sm transition hover:bg-emerald-50 active:scale-95"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPin("");
                    setErrorMsg(null);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitClick("0")}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-base font-extrabold text-slate-800 shadow-sm transition hover:bg-emerald-50 active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((p) => p.slice(0, -1))}
                  className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                >
                  <Delete className="h-4 w-4" />
                </button>
              </div>
            </div>

            {selectedEmp && (
              <p className="mt-3 text-center text-[11px] text-slate-400">
                รหัส PIN ของ {selectedEmp.name.split(" ")[0]} คือ{" "}
                <strong className="font-mono text-slate-700">
                  {selectedEmp.pin}
                </strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
