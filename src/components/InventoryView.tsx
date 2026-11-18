"use client";

import React, { useMemo, useRef, useState } from "react";
import { usePOS } from "@/context/POSContext";
import { Product } from "@/types/pos";
import { SAMPLE_PRODUCT_IMAGES } from "@/lib/seed-data";
import ProductImage from "@/components/ProductImage";
import {
  AlertTriangle,
  ArrowDownUp,
  Barcode,
  Boxes,
  Edit3,
  FolderPlus,
  History,
  ImagePlus,
  Link2,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const COLOR_OPTIONS = [
  { label: "ฟ้า", value: "bg-sky-500" },
  { label: "ส้มอำพัน", value: "bg-amber-500" },
  { label: "ส้ม", value: "bg-orange-500" },
  { label: "น้ำเงินคราม", value: "bg-indigo-500" },
  { label: "เขียวมรกต", value: "bg-emerald-500" },
  { label: "ม่วง", value: "bg-purple-500" },
  { label: "ชมพู", value: "bg-rose-500" },
];

export default function InventoryView() {
  const {
    products,
    categories,
    stockLogs,
    saveProduct,
    deleteProduct,
    adjustStock,
    addCategory,
    deleteCategory,
  } = usePOS();

  const [subTab, setSubTab] = useState<"products" | "categories" | "logs">(
    "products"
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMinStock, setFormMinStock] = useState("10");
  const [formUnit, setFormUnit] = useState("ชิ้น");
  const [formImageUrl, setFormImageUrl] = useState(
    SAMPLE_PRODUCT_IMAGES[0].url
  );
  const [formIsActive, setFormIsActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stock Adjust Modal State
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"in" | "out" | "adjust">("in");
  const [adjustQty, setAdjustQty] = useState("12");
  const [adjustNote, setAdjustNote] = useState("");

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("bg-emerald-500");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) {
        return false;
      }
      if (stockFilter === "low" && (p.stock > p.minStock || p.stock === 0)) {
        return false;
      }
      if (stockFilter === "out" && p.stock > 0) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, categoryFilter, stockFilter, search]);

  const openAddProduct = () => {
    setEditingId(undefined);
    setFormSku(`SKU-${String(products.length + 1).padStart(3, "0")}`);
    setFormBarcode(
      `885${Math.floor(1000000000 + Math.random() * 9000000000)}`
    );
    setFormName("");
    setFormCategoryId(categories[0]?.id || "cat-drinks");
    setFormPrice("");
    setFormCost("");
    setFormStock("24");
    setFormMinStock("10");
    setFormUnit("ชิ้น");
    setFormImageUrl(SAMPLE_PRODUCT_IMAGES[0].url);
    setFormIsActive(true);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingId(p.id);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormName(p.name);
    setFormCategoryId(p.categoryId);
    setFormPrice(String(p.price));
    setFormCost(String(p.cost));
    setFormStock(String(p.stock));
    setFormMinStock(String(p.minStock));
    setFormUnit(p.unit);
    setFormImageUrl(p.imageUrl || SAMPLE_PRODUCT_IMAGES[0].url);
    setFormIsActive(p.isActive);
    setIsProductModalOpen(true);
  };

  // Compress uploaded image via Canvas so it fits comfortably in LocalStorage
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setFormImageUrl(compressedDataUrl);
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    saveProduct({
      id: editingId,
      sku: formSku.trim() || "SKU-000",
      barcode: formBarcode.trim() || "8850000000000",
      name: formName.trim(),
      categoryId: formCategoryId || categories[0]?.id || "cat-drinks",
      price: Math.max(0, parseFloat(formPrice) || 0),
      cost: Math.max(0, parseFloat(formCost) || 0),
      stock: Math.max(0, parseInt(formStock, 10) || 0),
      minStock: Math.max(0, parseInt(formMinStock, 10) || 0),
      unit: formUnit.trim() || "ชิ้น",
      imageUrl: formImageUrl.trim() || SAMPLE_PRODUCT_IMAGES[0].url,
      isActive: formIsActive,
    });
    setIsProductModalOpen(false);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const qty = parseInt(adjustQty, 10) || 0;
    if (qty < 0) return;
    adjustStock(adjustTarget.id, adjustType, qty, adjustNote);
    setAdjustTarget(null);
    setAdjustNote("");
  };

  const totalInventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.cost * p.stock, 0),
    [products]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      {/* Header & Summary Strip */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            คลังสินค้าและสต็อก (Inventory & Stock)
          </h1>
          <p className="text-xs text-slate-500">
            จัดการรายการสินค้า รูปถ่ายสินค้าจริง บาร์โค้ด ราคาทุน-ราคาขาย และรับสินค้าเข้าคลัง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs">
            <span className="text-slate-500">มูลค่าสต็อกราคาทุน: </span>
            <strong className="font-bold text-slate-900">
              ฿
              {totalInventoryValue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3.5 py-2 text-xs font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>สินค้าใกล้หมด/หมด {lowStockCount} รายการ</span>
            </div>
          )}
          <button
            onClick={openAddProduct}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <PackagePlus className="h-4 w-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          {
            id: "products",
            label: `รายการสินค้าทั้งหมด (${products.length})`,
            icon: Boxes,
          },
          {
            id: "categories",
            label: `หมวดหมู่สินค้า (${categories.length})`,
            icon: FolderPlus,
          },
          {
            id: "logs",
            label: `ประวัติความเคลื่อนไหวสต็อก (${stockLogs.length})`,
            icon: History,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: PRODUCTS TABLE */}
      {subTab === "products" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า, บาร์โค้ด, หรือ SKU..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "low", label: "ใกล้หมด" },
                  { id: "out", label: "สินค้าหมด" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStockFilter(f.id as typeof stockFilter)}
                    className={`rounded-lg px-2.5 py-1.5 font-semibold transition ${
                      stockFilter === f.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3">บาร์โค้ด / SKU</th>
                  <th className="px-4 py-3">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right">ราคาทุน</th>
                  <th className="px-4 py-3 text-right">ราคาขาย</th>
                  <th className="px-4 py-3 text-center">คงเหลือ</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isOut = p.stock <= 0;
                  const isLow = !isOut && p.stock <= p.minStock;
                  const margin =
                    p.price > 0
                      ? (((p.price - p.cost) / p.price) * 100).toFixed(0)
                      : "0";

                  return (
                    <tr
                      key={p.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-12 w-12 shrink-0 rounded-xl border border-slate-200/80 shadow-sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              หน่วย: {p.unit} • แจ้งเตือนเมื่อ ≤ {p.minStock}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Barcode className="h-3.5 w-3.5 text-slate-400" />
                          {p.barcode}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.sku}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              cat?.color || "bg-slate-400"
                            }`}
                          />
                          {cat?.name || "ไม่ระบุ"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ฿{p.cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-emerald-700">
                          ฿{p.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          กำไร {margin}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            isOut
                              ? "bg-rose-100 text-rose-700"
                              : isLow
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setAdjustTarget(p);
                              setAdjustType("in");
                              setAdjustQty("12");
                              setAdjustNote("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                            title="รับสินค้าเข้า / ปรับสต็อก"
                          >
                            <ArrowDownUp className="h-3.5 w-3.5" />
                            <span>ปรับสต็อก</span>
                          </button>
                          <button
                            onClick={() => openEditProduct(p)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            title="แก้ไขสินค้า"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CATEGORIES */}
      {subTab === "categories" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCatName.trim()) return;
              addCategory(newCatName, newCatColor);
              setNewCatName("");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-800">
              เพิ่มหมวดหมู่สินค้าใหม่
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ชื่อหมวดหมู่
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="เช่น อาหารแช่แข็ง, เครื่องเขียน"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  สีป้ายกำกับ
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewCatColor(c.value)}
                      className={`h-7 w-7 rounded-full ${c.value} ${
                        newCatColor === c.value
                          ? "ring-2 ring-slate-900 ring-offset-2"
                          : "opacity-70"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                บันทึกหมวดหมู่
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.categoryId === cat.id
              ).length;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-4 w-4 rounded-full ${cat.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {cat.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        มีสินค้า {count} รายการ
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={count > 0}
                    onClick={() => deleteCategory(cat.id)}
                    title={
                      count > 0
                        ? "ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้"
                        : "ลบหมวดหมู่"
                    }
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: STOCK MOVEMENT LOGS */}
      {subTab === "logs" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">วัน-เวลา</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3">ประเภทรายการ</th>
                  <th className="px-4 py-3 text-right">จำนวนที่เปลี่ยน</th>
                  <th className="px-4 py-3 text-right">สต็อกคงเหลือใหม่</th>
                  <th className="px-4 py-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {log.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {log.barcode}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          log.type === "in" || log.type === "void"
                            ? "bg-emerald-100 text-emerald-700"
                            : log.type === "sale"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.type === "in"
                          ? "รับเข้าสต็อก"
                          : log.type === "sale"
                          ? "ขายหน้าร้าน"
                          : log.type === "void"
                          ? "คืนสต็อกจากยกเลิกบิล"
                          : log.type === "out"
                          ? "ตัดสต็อกออก"
                          : "ปรับยอด"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        log.quantityChange >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {log.quantityChange >= 0
                        ? `+${log.quantityChange}`
                        : log.quantityChange}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {log.previousStock} → {log.newStock}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveProduct}
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
              <h3 className="text-base font-bold">
                {editingId ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่เข้าคลัง"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5 text-xs">
              {/* Real Product Image Picker & Upload */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <label className="mb-2 flex items-center gap-1.5 font-semibold text-slate-700">
                  <ImagePlus className="h-4 w-4 text-emerald-600" />
                  <span>รูปภาพสินค้าจริง</span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <ProductImage
                    src={formImageUrl}
                    alt={formName || "ตัวอย่างรูปสินค้า"}
                    className="h-24 w-24 shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
                  />

                  <div className="flex-1 space-y-2">
                    {/* Upload File Button */}
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>อัปโหลดรูปจากเครื่อง</span>
                      </button>
                    </div>

                    {/* Direct Image URL Input */}
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="หรือวางลิงก์รูปภาพ (https://...)"
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Sample Product Photos */}
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                    หรือเลือกจากภาพตัวอย่างสินค้า:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {SAMPLE_PRODUCT_IMAGES.map((sample) => (
                      <button
                        key={sample.url}
                        type="button"
                        onClick={() => setFormImageUrl(sample.url)}
                        className={`group relative shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          formImageUrl === sample.url
                            ? "border-emerald-600 ring-2 ring-emerald-500/20"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        title={sample.label}
                      >
                        <ProductImage
                          src={sample.url}
                          alt={sample.label}
                          className="h-11 w-11"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  ชื่อสินค้า *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น น้ำดื่มคริสตัล 600 มล."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    รหัสบาร์โค้ด (13 หลัก)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormBarcode(
                          `885${Math.floor(
                            1000000000 + Math.random() * 9000000000
                          )}`
                        )
                      }
                      title="สุ่มรหัสบาร์โค้ดใหม่"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    รหัส SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    หมวดหมู่สินค้า
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    หน่วยนับ (เช่น ขวด, ซอง, ชิ้น)
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    ราคาทุนต่อหน่วย (฿)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    ราคาขายหน้าร้าน (฿) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50/30 px-3 py-2 text-sm font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    จำนวนสต็อกปัจจุบัน
                  </label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    จุดแจ้งเตือนสต็อกต่ำ (Min Stock)
                  </label>
                  <input
                    type="number"
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                บันทึกข้อมูลสินค้า
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADJUST STOCK */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleStockAdjustmentSubmit}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <ProductImage
                  src={adjustTarget.imageUrl}
                  alt={adjustTarget.name}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-700"
                />
                <div>
                  <h3 className="text-sm font-bold">
                    รับสินค้าเข้า / ปรับปรุงสต็อก
                  </h3>
                  <p className="text-xs text-slate-400">{adjustTarget.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3">
                <span className="text-slate-600">สต็อกคงเหลือปัจจุบัน:</span>
                <span className="text-base font-bold text-slate-900">
                  {adjustTarget.stock} {adjustTarget.unit}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "in", label: "+ รับสินค้าเข้า" },
                  { id: "out", label: "- ตัดสต็อกออก" },
                  { id: "adjust", label: "= ตั้งยอดคงเหลือใหม่" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setAdjustType(opt.id as "in" | "out" | "adjust")
                    }
                    className={`rounded-xl border py-2.5 font-bold transition ${
                      adjustType === opt.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {adjustType === "adjust"
                    ? `ระบุยอดคงเหลือใหม่ (${adjustTarget.unit})`
                    : `ระบุจำนวน (${adjustTarget.unit})`}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  หมายเหตุ / สาเหตุ
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="เช่น รับของเข้าจากซัพพลายเออร์, สินค้าชำรุด, ตรวจนับสต็อก"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                ยืนยันการปรับสต็อก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
