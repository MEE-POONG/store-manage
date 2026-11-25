"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePOS } from "@/context/POSContext";
import { PaymentMethod, Product, SaleOrder } from "@/types/pos";
import ReceiptModal from "@/components/ReceiptModal";
import ProductImage from "@/components/ProductImage";
import CameraBarcodeScannerModal from "@/components/CameraBarcodeScannerModal";
import { playScannerBeep } from "@/lib/scanner-sound";
import {
  AlertTriangle,
  Banknote,
  Barcode,
  Camera,
  CheckCircle2,
  ChevronUp,
  Clock,
  CreditCard,
  Landmark,
  Minus,
  PauseCircle,
  PlayCircle,
  Plus,
  QrCode,
  Radio,
  Search,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";

export default function PosTerminalView() {
  const {
    products,
    categories,
    cart,
    discount,
    setDiscount,
    heldOrders,
    settings,
    addToCart,
    addByBarcode,
    updateCartQty,
    removeFromCart,
    clearCart,
    holdCurrentOrder,
    resumeHeldOrder,
    removeHeldOrder,
    completeSale,
  } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [scanFeedback, setScanFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [globalScannerEnabled, setGlobalScannerEnabled] = useState(true);
  const [completedSale, setCompletedSale] = useState<SaleOrder | null>(null);

  // Checkout state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const barcodeRef = useRef<HTMLInputElement>(null);
  const scannerBufferRef = useRef<{ text: string; lastKeyTime: number }>({
    text: "",
    lastKeyTime: 0,
  });

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setScanFeedback({ type, text });
    setTimeout(() => {
      setScanFeedback((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  }, []);

  const executeBarcodeScan = useCallback(
    (code: string, sourceLabel?: string) => {
      const result = addByBarcode(code);
      if (result.ok && result.product) {
        playScannerBeep("success");
        const prefix = sourceLabel ? `[${sourceLabel}] ` : "";
        const msg = `${prefix}สแกนเพิ่ม "${result.product.name}" (฿${result.product.price}) ลงตะกร้าแล้ว`;
        showToast("success", msg);
        return { ok: true, message: msg };
      } else {
        playScannerBeep("error");
        const errMsg = result.message || `ไม่พบสินค้ารหัส "${code}"`;
        showToast("error", errMsg);
        return { ok: false, message: errMsg };
      }
    },
    [addByBarcode, showToast]
  );

  // Global Hardware Barcode Scanner Listener (USB / 2.4GHz / Bluetooth HID)
  useEffect(() => {
    if (
      !globalScannerEnabled ||
      isCheckoutOpen ||
      isHeldModalOpen ||
      isCameraScannerOpen ||
      completedSale !== null
    ) {
      return;
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() || "";
      const isInputFocused =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      // If the user is already focused in our main barcode input box, let the form's onSubmit handle it
      if (target === barcodeRef.current) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - scannerBufferRef.current.lastKeyTime;

      // Reset buffer if pause is too long (1.2s when no input focused, or 65ms when inside another input)
      const maxGap = isInputFocused ? 65 : 1200;
      if (timeDiff > maxGap) {
        scannerBufferRef.current.text = "";
      }

      if (e.key === "Enter") {
        const scannedCode = scannerBufferRef.current.text.trim();
        const minLen = isInputFocused ? 6 : 3;
        if (scannedCode.length >= minLen) {
          e.preventDefault();
          e.stopPropagation();
          scannerBufferRef.current.text = "";
          executeBarcodeScan(scannedCode, "เครื่องยิงอัตโนมัติ");
        }
        return;
      }

      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        /^[a-zA-Z0-9\-_]$/.test(e.key)
      ) {
        scannerBufferRef.current.text += e.key;
        scannerBufferRef.current.lastKeyTime = now;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [
    globalScannerEnabled,
    isCheckoutOpen,
    isHeldModalOpen,
    isCameraScannerOpen,
    completedSale,
    executeBarcodeScan,
  ]);

  // Filtered products for the grid
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (selectedCategory === "low-stock") {
        if (p.stock > p.minStock) return false;
      } else if (
        selectedCategory !== "all" &&
        p.categoryId !== selectedCategory
      ) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const subtotal = useMemo(
    () =>
      Number(
        cart
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
          .toFixed(2)
      ),
    [cart]
  );

  const effectiveDiscount = Math.min(Math.max(0, discount), subtotal);
  const netTotal = Number(Math.max(0, subtotal - effectiveDiscount).toFixed(2));
  const vatAmount = settings.vatIncluded
    ? Number(
        ((netTotal * settings.vatRate) / (100 + settings.vatRate)).toFixed(2)
      )
    : Number(((netTotal * settings.vatRate) / 100).toFixed(2));

  const totalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Handle Barcode Scan (Enter key)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const res = executeBarcodeScan(barcodeInput);
    if (res.ok) {
      setBarcodeInput("");
    }
  };

  // Simulate random barcode scan for quick demo testing
  const handleSimulateScan = () => {
    const available = products.filter((p) => p.isActive && p.stock > 0);
    if (available.length === 0) {
      playScannerBeep("error");
      showToast("error", "ไม่มีสินค้าที่มีสต็อกพร้อมขาย");
      return;
    }
    const randomProd =
      available[Math.floor(Math.random() * available.length)];
    executeBarcodeScan(randomProd.barcode, `จำลองยิง ${randomProd.barcode}`);
  };

  const handleProductClick = (product: Product) => {
    const res = addToCart(product, 1);
    if (!res.ok && res.message) {
      showToast("error", res.message);
    }
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setPaymentMethod("cash");
    setCashReceivedInput(String(Math.ceil(netTotal)));
    setCustomerPhone("");
    setIsCheckoutOpen(true);
  };

  const cashReceivedNum = Number(cashReceivedInput) || 0;
  const changeAmount = Math.max(
    0,
    Number((cashReceivedNum - netTotal).toFixed(2))
  );
  const isCashSufficient =
    paymentMethod !== "cash" || cashReceivedNum >= netTotal;

  const handleConfirmPayment = () => {
    if (!isCashSufficient) return;
    const sale = completeSale({
      paymentMethod,
      discount: effectiveDiscount,
      cashReceived: paymentMethod === "cash" ? cashReceivedNum : undefined,
      customerPhone: customerPhone.trim() || undefined,
    });
    if (sale) {
      setIsCheckoutOpen(false);
      setCompletedSale(sale);
    }
  };

  const getCartQty = (productId: string) => {
    const found = cart.find((c) => c.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="grid grid-cols-1 gap-4 p-2.5 sm:p-4 lg:h-[calc(100vh-4rem)] lg:grid-cols-12">
      {/* LEFT AREA: Barcode Scanner, Categories, Product Grid */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
        {/* Top Bar: Barcode Input & Search */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Barcode Scanner Input */}
            <form
              onSubmit={handleBarcodeSubmit}
              className="relative flex flex-1 items-center"
            >
              <Barcode className="pointer-events-none absolute left-3 h-5 w-5 text-emerald-600" />
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัส SKU..."
                className="w-full rounded-xl border border-emerald-300 bg-white py-2.5 pl-10 pr-20 text-sm text-slate-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                className="absolute right-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                เพิ่ม
              </button>
            </form>

            {/* Action Buttons Row on Mobile */}
            <div className="grid grid-cols-3 gap-1.5 sm:flex">
              {/* Camera Barcode Scanner Button */}
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                title="เปิดกล้องมือถือ / แท็บเล็ต / เว็บแคม เพื่อส่องสแกนบาร์โค้ดสินค้าจริง"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Camera className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate">สแกนกล้อง</span>
              </button>

              {/* Quick Simulate Barcode Button */}
              <button
                type="button"
                onClick={handleSimulateScan}
                title="จำลองการยิงบาร์โค้ดสินค้าแบบสุ่มเพื่อทดสอบระบบ"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="truncate">ทดลองยิง</span>
              </button>

              {/* Mobile Quick Held Orders Button */}
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(true)}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2.5 text-xs font-bold text-amber-800 lg:hidden"
              >
                <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="truncate">บิลพัก ({heldOrders.length})</span>
              </button>
            </div>

            {/* Search Filter Input */}
            <div className="relative sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า / รหัส..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-800 transition focus:border-slate-400 focus:outline-none sm:py-2.5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Global Hardware Scanner Status Strip */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setGlobalScannerEnabled(!globalScannerEnabled)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                globalScannerEnabled
                  ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "bg-slate-200/70 text-slate-600 hover:bg-slate-200"
              }`}
              title="คลิกเพื่อเปิด/ปิดโหมดดักจับเครื่องยิงบาร์โค้ด USB อัตโนมัติทั่วหน้าจอ"
            >
              <Radio
                className={`h-3.5 w-3.5 ${
                  globalScannerEnabled
                    ? "animate-pulse text-emerald-600"
                    : "text-slate-400"
                }`}
              />
              <span>
                {globalScannerEnabled
                  ? "โหมดรับเครื่องยิงบาร์โค้ดอัตโนมัติ: เปิดอยู่ (ยิงได้ทันทีโดยไม่ต้องคลิกช่อง)"
                  : "โหมดรับเครื่องยิงบาร์โค้ดอัตโนมัติ: ปิดอยู่"}
              </span>
            </button>
          </div>

          {/* Scan Toast Feedback */}
          {scanFeedback && (
            <div
              className={`mt-2.5 flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium ${
                scanFeedback.type === "success"
                  ? "bg-emerald-100/90 text-emerald-800"
                  : "bg-rose-100/90 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {scanFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{scanFeedback.text}</span>
              </div>
              <button
                onClick={() => setScanFeedback(null)}
                className="text-current opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              ทั้งหมด ({products.filter((p) => p.isActive).length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.isActive && p.categoryId === cat.id
              ).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                  <span>{cat.name}</span>
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedCategory("low-stock")}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === "low-stock"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                สต็อกต่ำ (
                {
                  products.filter((p) => p.isActive && p.stock <= p.minStock)
                    .length
                }
                )
              </span>
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3.5">
          {filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
              <Search className="mb-2 h-10 w-10 stroke-1" />
              <p className="font-medium text-slate-600">
                ไม่พบสินค้าที่ตรงกับเงื่อนไข
              </p>
              <p className="text-xs">
                ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ &ldquo;ทั้งหมด&rdquo;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const inCartQty = getCartQty(product.id);
                const isOut = product.stock <= 0;
                const isLow = !isOut && product.stock <= product.minStock;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOut}
                    onClick={() => handleProductClick(product)}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                      isOut
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                        : inCartQty > 0
                        ? "border-emerald-500 bg-emerald-50/30 shadow-sm ring-1 ring-emerald-500/30"
                        : "border-slate-200/90 bg-white hover:border-emerald-400 hover:shadow-md"
                    }`}
                  >
                    {/* In-Cart Quantity Badge */}
                    {inCartQty > 0 && (
                      <span className="absolute -right-2 -top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white shadow">
                        {inCartQty}
                      </span>
                    )}

                    <div>
                      {/* Product Photo + Stock Badge Overlay */}
                      <div className="relative mb-2.5 overflow-hidden rounded-xl bg-slate-100">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-28 w-full rounded-xl"
                          imgClassName="object-cover group-hover:scale-105"
                        />
                        <span
                          className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                            isOut
                              ? "bg-rose-600/95 text-white"
                              : isLow
                              ? "bg-amber-500/95 text-slate-950"
                              : "bg-slate-900/75 text-white"
                          }`}
                        >
                          {isOut
                            ? "สินค้าหมด"
                            : `เหลือ ${product.stock} ${product.unit}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
                        {product.name}
                      </h3>

                      {/* Barcode & SKU */}
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {product.barcode}
                      </p>
                    </div>

                    {/* Price & Unit */}
                    <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-2.5">
                      <span className="text-base font-bold text-emerald-700">
                        ฿{product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">
                        /{product.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE CART BACKDROP */}
      {isMobileCartOpen && (
        <div
          onClick={() => setIsMobileCartOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* RIGHT AREA: Cart & Checkout Panel (Inline on Desktop lg+, Slide-up Drawer on Mobile) */}
      <div
        className={`flex flex-col overflow-hidden bg-white shadow-sm lg:col-span-4 lg:rounded-2xl lg:border lg:border-slate-200 ${
          isMobileCartOpen
            ? "fixed inset-x-0 bottom-0 z-50 max-h-[86vh] rounded-t-3xl shadow-2xl"
            : "hidden lg:flex"
        }`}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">รายการขายปัจจุบัน</h2>
              <p className="text-[11px] text-slate-400">
                {cart.length} รายการ ({totalItemsCount} ชิ้น)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Held Orders Button */}
            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className="relative inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              title="ดูบิลที่พักไว้"
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>บิลพัก</span>
              {heldOrders.length > 0 && (
                <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-slate-950">
                  {heldOrders.length}
                </span>
              )}
            </button>

            {/* Hold Current Cart Button */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  holdCurrentOrder();
                  setIsMobileCartOpen(false);
                  showToast("success", "พักบิลปัจจุบันเรียบร้อยแล้ว");
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/30"
                title="พักบิลนี้ไว้ก่อน"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                <span>พักบิล</span>
              </button>
            )}

            {/* Clear Cart */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-lg bg-rose-500/20 p-1.5 text-rose-300 transition hover:bg-rose-500/30"
                title="ล้างตะกร้า"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Close Mobile Cart Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="ml-1 rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 lg:hidden"
              title="ย่อหน้าต่างตะกร้า"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto px-3.5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center text-slate-400">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <ShoppingCart className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                ยังไม่มีสินค้าในตะกร้า
              </p>
              <p className="mt-1 max-w-[220px] text-xs text-slate-400">
                คลิกเลือกสินค้าจากฝั่งซ้าย หรือยิงบาร์โค้ดเพื่อเพิ่มรายการขาย
              </p>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-2 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-200/80"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      ฿{product.price.toFixed(2)} / {product.unit} • คลัง:{" "}
                      {product.stock}
                    </p>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateCartQty(product.id, quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) =>
                      updateCartQty(product.id, parseInt(e.target.value, 10) || 1)
                    }
                    className="h-7 w-11 rounded-lg border border-slate-200 text-center text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => updateCartQty(product.id, quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="flex items-center gap-2 text-right">
                  <span className="w-16 text-sm font-bold text-slate-900">
                    ฿{(product.price * quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer: Discount + Summary + Checkout Button */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          {/* Quick Discount Row */}
          <div className="mb-3 rounded-xl border border-slate-200/80 bg-white p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Tag className="h-3.5 w-3.5 text-emerald-600" />
                <span>ส่วนลดท้ายบิล (฿)</span>
              </div>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount || ""}
                onChange={(e) =>
                  setDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                }
                placeholder="0.00"
                className="w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-right text-xs font-bold text-rose-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[0, 5, 10, 20].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDiscount(amt)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                    discount === amt
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {amt === 0 ? "ไม่ลด" : `-฿${amt}`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDiscount(Number((subtotal * 0.05).toFixed(2)))}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => setDiscount(Number((subtotal * 0.1).toFixed(2)))}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
              >
                -10%
              </button>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>ยอดรวมสินค้า ({totalItemsCount} ชิ้น)</span>
              <span className="font-medium text-slate-800">
                ฿{subtotal.toFixed(2)}
              </span>
            </div>
            {effectiveDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>ส่วนลด</span>
                <span>-฿{effectiveDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>
                ภาษีมูลค่าเพิ่ม VAT {settings.vatRate}% (
                {settings.vatIncluded ? "รวมใน" : "แยกนอก"})
              </span>
              <span>฿{vatAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="my-2.5 flex items-baseline justify-between border-t border-slate-200 pt-2.5">
            <span className="text-sm font-bold text-slate-800">
              ยอดสุทธิที่ต้องชำระ
            </span>
            <span className="text-2xl font-extrabold text-emerald-700">
              ฿{netTotal.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              setIsMobileCartOpen(false);
              openCheckoutModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Banknote className="h-5 w-5" />
            <span>คิดเงิน / ชำระเงิน (฿{netTotal.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* FLOATING MOBILE CART BAR (Shown on screens < lg when items are in cart) */}
      {cart.length > 0 && !isMobileCartOpen && (
        <div className="fixed inset-x-3 bottom-[4.35rem] z-30 flex items-center justify-between gap-2 rounded-2xl bg-slate-900 p-2.5 text-white shadow-xl ring-1 ring-white/10 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="flex flex-1 items-center gap-2.5 text-left"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-extrabold text-white">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-950">
                {totalItemsCount}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <span>ดูตะกร้า / แก้ไข</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </div>
              <p className="truncate text-base font-extrabold text-white">
                ฿{netTotal.toFixed(2)}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={openCheckoutModal}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm active:scale-95"
          >
            <Banknote className="h-4 w-4" />
            <span>คิดเงินทันที</span>
          </button>
        </div>
      )}

      {/* CHECKOUT PAYMENT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">ชำระเงิน (Checkout)</h3>
                <p className="text-xs text-slate-400">
                  เลือกช่องทางการชำระเงินและตรวจสอบยอดเงินทอน
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              {/* Total Banner */}
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    ยอดชำระสุทธิ
                  </p>
                  <p className="text-xs text-emerald-600">
                    {totalItemsCount} ชิ้น{" "}
                    {effectiveDiscount > 0 &&
                      `(หักส่วนลด ฿${effectiveDiscount.toFixed(2)})`}
                  </p>
                </div>
                <div className="text-3xl font-extrabold text-emerald-700">
                  ฿{netTotal.toFixed(2)}
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  เลือกวิธีชำระเงิน
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    {
                      id: "cash",
                      label: "เงินสด",
                      icon: Banknote,
                    },
                    {
                      id: "promptpay",
                      label: "QR พร้อมเพย์",
                      icon: QrCode,
                    },
                    {
                      id: "transfer",
                      label: "โอนเงิน",
                      icon: Landmark,
                    },
                    {
                      id: "card",
                      label: "บัตรเครดิต",
                      icon: CreditCard,
                    },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                          active
                            ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            active ? "text-emerald-600" : "text-slate-400"
                          }`}
                        />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Payment Section */}
              {paymentMethod === "cash" && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      รับเงินสดมา (บาท)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      className="w-36 rounded-xl border border-slate-300 bg-white px-3 py-2 text-right text-lg font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Quick Banknotes */}
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    <button
                      type="button"
                      onClick={() => setCashReceivedInput(String(netTotal))}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      พอดี
                    </button>
                    {[20, 50, 100, 500, 1000].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setCashReceivedInput(String(note))}
                        className="rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                      >
                        ฿{note}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-sm font-semibold text-slate-700">
                      เงินทอนลูกค้า
                    </span>
                    {cashReceivedNum >= netTotal ? (
                      <span className="text-2xl font-extrabold text-indigo-600">
                        ฿{changeAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-600">
                        ยังขาดอีก ฿{(netTotal - cashReceivedNum).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "promptpay" && (
                <div className="flex flex-col items-center rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
                  <div className="mb-2 rounded-xl bg-indigo-900 px-4 py-1 text-xs font-bold tracking-wider text-white">
                    THAI QR PAYMENT • PROMPTPAY
                  </div>
                  {/* Simulated QR Code Visual */}
                  <div className="my-2 flex h-40 w-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-white p-3 shadow-sm">
                    <QrCode className="h-24 w-24 text-slate-800" />
                    <span className="mt-1 font-mono text-[10px] text-slate-500">
                      ID: {settings.promptPayId}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {settings.storeName}
                  </p>
                  <p className="text-xs text-slate-500">
                    สแกนจ่ายยอด{" "}
                    <strong className="text-emerald-700">
                      ฿{netTotal.toFixed(2)}
                    </strong>
                  </p>
                </div>
              )}

              {/* Optional Member Phone */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  เบอร์โทรศัพท์สมาชิก / ลูกค้า (ไม่บังคับ)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!isCashSufficient}
                onClick={handleConfirmPayment}
                className="flex-[2] rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                ยืนยันรับชำระเงิน & ออกใบเสร็จ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELD ORDERS MODAL */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-800">
                  รายการบิลที่พักไว้ ({heldOrders.length})
                </h3>
              </div>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto p-4">
              {heldOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  ไม่มีรายการบิลที่พักไว้
                </p>
              ) : (
                heldOrders.map((held) => {
                  const heldSum = held.items.reduce(
                    (s, i) => s + i.product.price * i.quantity,
                    0
                  );
                  return (
                    <div
                      key={held.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {held.note}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(held.createdAt).toLocaleTimeString("th-TH")}{" "}
                          • ยอดรวม ฿{heldSum.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            resumeHeldOrder(held.id);
                            setIsHeldModalOpen(false);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          เรียกคืน
                        </button>
                        <button
                          onClick={() => removeHeldOrder(held.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAMERA BARCODE SCANNER MODAL */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onDetected={(code) => executeBarcodeScan(code, "กล้องสแกน")}
        sampleProducts={products.filter((p) => p.isActive && p.stock > 0)}
      />

      {/* RECEIPT PREVIEW / PRINT MODAL */}
      <ReceiptModal
        sale={completedSale}
        settings={settings}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
}

