"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CartItem,
  Category,
  DailyCashDrawer,
  Employee,
  EmployeeRole,
  HeldOrder,
  PaymentMethod,
  Product,
  RolePermissions,
  SaleOrder,
  StockLog,
  StoreSettings,
} from "@/types/pos";
import {
  DEFAULT_CASH_DRAWERS,
  DEFAULT_CATEGORIES,
  DEFAULT_EMPLOYEES,
  DEFAULT_PRODUCTS,
  DEFAULT_SALES,
  DEFAULT_SETTINGS,
  DEFAULT_STOCK_LOGS,
} from "@/lib/seed-data";

const STORAGE_KEYS = {
  PRODUCTS: "sabaipos_products_v1",
  CATEGORIES: "sabaipos_categories_v1",
  SALES: "sabaipos_sales_v1",
  STOCK_LOGS: "sabaipos_stock_logs_v1",
  HELD_ORDERS: "sabaipos_held_orders_v1",
  SETTINGS: "sabaipos_settings_v1",
  CASH_DRAWERS: "sabaipos_cash_drawers_v1",
  EMPLOYEES: "sabaipos_employees_v1",
  CURRENT_EMPLOYEE_ID: "sabaipos_current_employee_id_v1",
};

export function getTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getPermissionsForRole(role: EmployeeRole): RolePermissions {
  switch (role) {
    case "owner":
      return {
        canViewCostAndProfit: true,
        canManageProducts: true,
        canDeleteProducts: true,
        canVoidSales: true,
        canManageEmployees: true,
        canManageSettings: true,
      };
    case "manager":
      return {
        canViewCostAndProfit: false,
        canManageProducts: true,
        canDeleteProducts: false,
        canVoidSales: true,
        canManageEmployees: false,
        canManageSettings: false,
      };
    case "cashier":
    default:
      return {
        canViewCostAndProfit: false,
        canManageProducts: false,
        canDeleteProducts: false,
        canVoidSales: false,
        canManageEmployees: false,
        canManageSettings: false,
      };
  }
}

export const ROLE_LABELS: Record<
  EmployeeRole,
  { label: string; badgeStyle: string; desc: string }
> = {
  owner: {
    label: "เจ้าของร้าน (Owner)",
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "เข้าถึงทุกเมนู ดูราคาทุน-กำไร ลบสินค้า ยกเลิกบิล และจัดการพนักงานได้ทั้งหมด",
  },
  manager: {
    label: "ผู้จัดการร้าน (Manager)",
    badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-300",
    desc: "ขายหน้าร้าน เปิด-ปิดกะ เพิ่ม/แก้ไขสินค้า ปรับสต็อก และอนุมัติยกเลิกบิลได้ (ซ่อนราคาทุน-กำไร)",
  },
  cashier: {
    label: "พนักงานแคชเชียร์ (Cashier)",
    badgeStyle: "bg-sky-100 text-sky-800 border-sky-300",
    desc: "ขายหน้าร้าน เปิด-ปิดกะ และตรวจสอบจำนวนสต็อกคงเหลือ (ซ่อนราคาทุน-กำไร การลบสินค้าและยกเลิกบิลต้องใช้ PIN ผู้จัดการ/เจ้าของร้าน)",
  },
};

interface CheckoutPayload {
  paymentMethod: PaymentMethod;
  discount: number;
  cashReceived?: number;
  customerPhone?: string;
}

interface POSContextType {
  isHydrated: boolean;
  products: Product[];
  categories: Category[];
  sales: SaleOrder[];
  stockLogs: StockLog[];
  heldOrders: HeldOrder[];
  settings: StoreSettings;
  cashDrawers: Record<string, DailyCashDrawer>;
  employees: Employee[];
  currentEmployee: Employee;
  permissions: RolePermissions;
  cart: CartItem[];
  discount: number;
  setDiscount: (amount: number) => void;

  // Employee & Permission Actions
  isSwitchEmployeeModalOpen: boolean;
  openSwitchEmployeeModal: () => void;
  closeSwitchEmployeeModal: () => void;
  switchEmployee: (
    employeeId: string,
    pin?: string,
    bypassPin?: boolean
  ) => { ok: boolean; message?: string };
  verifyManagerOrOwnerPin: (pin: string) => {
    ok: boolean;
    approver?: Employee;
    message?: string;
  };
  saveEmployee: (
    empData: Omit<Employee, "id" | "createdAt"> & { id?: string }
  ) => void;
  deleteEmployee: (employeeId: string) => void;

  // Cash Drawer & Shift Actions
  getCashDrawerForDate: (dateKey: string) => DailyCashDrawer;
  setOpeningCash: (dateKey: string, amount: number, note?: string) => void;
  addDrawerMovement: (
    dateKey: string,
    type: "in" | "out",
    amount: number,
    note: string
  ) => void;
  deleteDrawerMovement: (dateKey: string, movementId: string) => void;
  closeCashDrawerShift: (
    dateKey: string,
    actualClosingCash: number,
    note?: string
  ) => void;
  reopenCashDrawerShift: (dateKey: string) => void;
  isCashDrawerModalOpen: boolean;
  cashDrawerModalDateKey: string;
  openCashDrawerModal: (dateKey?: string) => void;
  closeCashDrawerModal: () => void;

  // Cart Actions
  addToCart: (product: Product, qty?: number) => { ok: boolean; message?: string };
  addByBarcode: (barcode: string) => {
    ok: boolean;
    product?: Product;
    message?: string;
  };
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Hold Order Actions
  holdCurrentOrder: (note?: string) => void;
  resumeHeldOrder: (heldId: string) => void;
  removeHeldOrder: (heldId: string) => void;

  // Checkout & Sales Actions
  completeSale: (payload: CheckoutPayload) => SaleOrder | null;
  voidSale: (saleId: string, approvedByName?: string) => void;

  // Product & Inventory Actions
  saveProduct: (productData: Omit<Product, "id"> & { id?: string }) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (
    productId: string,
    type: "in" | "out" | "adjust",
    quantity: number,
    note: string
  ) => void;
  addCategory: (name: string, color: string) => void;
  deleteCategory: (categoryId: string) => void;

  // Settings & System Actions
  updateSettings: (newSettings: StoreSettings) => void;
  resetToDemoData: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [sales, setSales] = useState<SaleOrder[]>(DEFAULT_SALES);
  const [stockLogs, setStockLogs] = useState<StockLog[]>(DEFAULT_STOCK_LOGS);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [cashDrawers, setCashDrawers] = useState<
    Record<string, DailyCashDrawer>
  >(DEFAULT_CASH_DRAWERS);
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>(
    DEFAULT_EMPLOYEES[0].id
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  // Global Modals
  const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState(false);
  const [cashDrawerModalDateKey, setCashDrawerModalDateKey] = useState<string>(
    () => getTodayDateKey()
  );
  const [isSwitchEmployeeModalOpen, setIsSwitchEmployeeModalOpen] =
    useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const savedSales = localStorage.getItem(STORAGE_KEYS.SALES);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      const savedHeld = localStorage.getItem(STORAGE_KEYS.HELD_ORDERS);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedDrawers = localStorage.getItem(STORAGE_KEYS.CASH_DRAWERS);
      const savedEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const savedCurrentEmpId = localStorage.getItem(
        STORAGE_KEYS.CURRENT_EMPLOYEE_ID
      );

      if (savedProducts) {
        const parsed: Product[] = JSON.parse(savedProducts);
        const migrated = parsed.map((p) => {
          if (p.imageUrl && p.imageUrl.trim() !== "") return p;
          const seedMatch = DEFAULT_PRODUCTS.find(
            (d) => d.id === p.id || d.barcode === p.barcode
          );
          return {
            ...p,
            imageUrl:
              seedMatch?.imageUrl ||
              "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80",
          };
        });
        setProducts(migrated);
      }
      if (savedCategories) setCategories(JSON.parse(savedCategories));
      if (savedSales) {
        const parsedSales: SaleOrder[] = JSON.parse(savedSales);
        const existingIds = new Set(parsedSales.map((s) => s.id));
        const missingSeedSales = DEFAULT_SALES.filter(
          (s) => !existingIds.has(s.id)
        );
        setSales([...parsedSales, ...missingSeedSales]);
      }
      if (savedLogs) setStockLogs(JSON.parse(savedLogs));
      if (savedHeld) setHeldOrders(JSON.parse(savedHeld));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedDrawers) {
        const parsedDrawers: Record<string, DailyCashDrawer> =
          JSON.parse(savedDrawers);
        setCashDrawers({ ...DEFAULT_CASH_DRAWERS, ...parsedDrawers });
      }
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }
      if (savedCurrentEmpId) {
        setCurrentEmployeeId(savedCurrentEmpId);
      }
    } catch (err) {
      console.error("Failed to load POS state from localStorage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist changes to LocalStorage
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(stockLogs));
  }, [stockLogs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.HELD_ORDERS, JSON.stringify(heldOrders));
  }, [heldOrders, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      STORAGE_KEYS.CASH_DRAWERS,
      JSON.stringify(cashDrawers)
    );
  }, [cashDrawers, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_EMPLOYEE_ID, currentEmployeeId);
  }, [currentEmployeeId, isHydrated]);

  const currentEmployee = useMemo<Employee>(() => {
    return (
      employees.find((e) => e.id === currentEmployeeId && e.isActive) ||
      employees.find((e) => e.isActive) ||
      DEFAULT_EMPLOYEES[0]
    );
  }, [employees, currentEmployeeId]);

  const permissions = useMemo<RolePermissions>(
    () => getPermissionsForRole(currentEmployee.role),
    [currentEmployee.role]
  );

  // Employee Management Actions
  const openSwitchEmployeeModal = () => setIsSwitchEmployeeModalOpen(true);
  const closeSwitchEmployeeModal = () => setIsSwitchEmployeeModalOpen(false);

  const switchEmployee = (
    employeeId: string,
    pin = "",
    bypassPin = false
  ): { ok: boolean; message?: string } => {
    const target = employees.find((e) => e.id === employeeId);
    if (!target) {
      return { ok: false, message: "ไม่พบข้อมูลพนักงาน" };
    }
    if (!target.isActive) {
      return { ok: false, message: "บัญชีพนักงานนี้ถูกระงับการใช้งานชั่วคราว" };
    }
    if (!bypassPin && target.pin !== pin.trim()) {
      return { ok: false, message: "รหัส PIN 4 หลักไม่ถูกต้อง" };
    }

    setCurrentEmployeeId(target.id);
    setSettings((prev) => ({ ...prev, cashierName: target.name }));
    return { ok: true, message: `สลับผู้ใช้งานเป็น ${target.name} สำเร็จ` };
  };

  const verifyManagerOrOwnerPin = (
    pin: string
  ): { ok: boolean; approver?: Employee; message?: string } => {
    const cleanPin = pin.trim();
    const approver = employees.find(
      (e) =>
        e.isActive &&
        (e.role === "owner" || e.role === "manager") &&
        e.pin === cleanPin
    );
    if (!approver) {
      return {
        ok: false,
        message: "รหัส PIN ของเจ้าของร้านหรือผู้จัดการไม่ถูกต้อง",
      };
    }
    return { ok: true, approver };
  };

  const saveEmployee = (
    empData: Omit<Employee, "id" | "createdAt"> & { id?: string }
  ) => {
    if (empData.id) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === empData.id
            ? {
                ...e,
                ...empData,
                id: empData.id,
              }
            : e
        )
      );
    } else {
      const newEmp: Employee = {
        ...empData,
        id: `emp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEmployees((prev) => [...prev, newEmp]);
    }
  };

  const deleteEmployee = (employeeId: string) => {
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return;
    // Prevent deleting the last active owner
    const activeOwners = employees.filter(
      (e) => e.isActive && e.role === "owner"
    );
    if (target.role === "owner" && activeOwners.length <= 1) {
      return;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    if (currentEmployeeId === employeeId) {
      const fallback = employees.find(
        (e) => e.id !== employeeId && e.isActive
      );
      if (fallback) {
        setCurrentEmployeeId(fallback.id);
      }
    }
  };

  // Cash Drawer & Shift helpers
  const getCashDrawerForDate = (dateKey: string): DailyCashDrawer => {
    if (cashDrawers[dateKey]) {
      return cashDrawers[dateKey];
    }
    return {
      dateKey,
      openingCash: settings.defaultOpeningCash ?? 1000,
      movements: [],
      status: "open",
      openedAt: new Date().toISOString(),
    };
  };

  const setOpeningCash = (dateKey: string, amount: number, note?: string) => {
    const cleanAmount = Math.max(0, Number(amount.toFixed(2)));
    setCashDrawers((prev) => {
      const existing = prev[dateKey] || getCashDrawerForDate(dateKey);
      return {
        ...prev,
        [dateKey]: {
          ...existing,
          dateKey,
          openingCash: cleanAmount,
          note: note !== undefined ? note : existing.note,
        },
      };
    });
  };

  const addDrawerMovement = (
    dateKey: string,
    type: "in" | "out",
    amount: number,
    note: string
  ) => {
    const cleanAmount = Math.max(0, Number(Math.abs(amount).toFixed(2)));
    if (cleanAmount <= 0) return;

    setCashDrawers((prev) => {
      const existing = prev[dateKey] || getCashDrawerForDate(dateKey);
      const newMovement = {
        id: `mvm-${Date.now()}`,
        type,
        amount: cleanAmount,
        note:
          note.trim() ||
          (type === "in"
            ? "นำเงินทอนเข้าลิ้นชักเพิ่ม"
            : "นำเงินสดออกจากลิ้นชัก"),
        performedBy: currentEmployee.name,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [dateKey]: {
          ...existing,
          dateKey,
          movements: [newMovement, ...existing.movements],
        },
      };
    });
  };

  const deleteDrawerMovement = (dateKey: string, movementId: string) => {
    setCashDrawers((prev) => {
      const existing = prev[dateKey];
      if (!existing) return prev;
      return {
        ...prev,
        [dateKey]: {
          ...existing,
          movements: existing.movements.filter((m) => m.id !== movementId),
        },
      };
    });
  };

  const closeCashDrawerShift = (
    dateKey: string,
    actualClosingCash: number,
    note?: string
  ) => {
    const cleanActual = Math.max(0, Number(actualClosingCash.toFixed(2)));
    setCashDrawers((prev) => {
      const existing = prev[dateKey] || getCashDrawerForDate(dateKey);
      return {
        ...prev,
        [dateKey]: {
          ...existing,
          dateKey,
          actualClosingCash: cleanActual,
          status: "closed",
          closedAt: new Date().toISOString(),
          closedBy: currentEmployee.name,
          note: note !== undefined ? note : existing.note,
        },
      };
    });
  };

  const reopenCashDrawerShift = (dateKey: string) => {
    setCashDrawers((prev) => {
      const existing = prev[dateKey] || getCashDrawerForDate(dateKey);
      return {
        ...prev,
        [dateKey]: {
          ...existing,
          status: "open",
        },
      };
    });
  };

  const openCashDrawerModal = (dateKey?: string) => {
    setCashDrawerModalDateKey(dateKey || getTodayDateKey());
    setIsCashDrawerModalOpen(true);
  };

  const closeCashDrawerModal = () => {
    setIsCashDrawerModalOpen(false);
  };

  const addToCart = (
    product: Product,
    qty = 1
  ): { ok: boolean; message?: string } => {
    const latestProduct =
      products.find((p) => p.id === product.id) || product;
    const existingItem = cart.find((item) => item.product.id === product.id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    if (latestProduct.stock <= 0) {
      return { ok: false, message: `สินค้า "${latestProduct.name}" หมดสต็อก` };
    }

    if (currentQtyInCart + qty > latestProduct.stock) {
      return {
        ok: false,
        message: `สต็อก "${latestProduct.name}" เหลือเพียง ${latestProduct.stock} ${latestProduct.unit}`,
      };
    }

    setCart((prev) => {
      const found = prev.find((item) => item.product.id === latestProduct.id);
      if (found) {
        return prev.map((item) =>
          item.product.id === latestProduct.id
            ? {
                ...item,
                product: latestProduct,
                quantity: item.quantity + qty,
              }
            : item
        );
      }
      return [...prev, { product: latestProduct, quantity: qty }];
    });

    return { ok: true };
  };

  const addByBarcode = (
    code: string
  ): { ok: boolean; product?: Product; message?: string } => {
    const clean = code.trim();
    if (!clean) return { ok: false };

    const matched = products.find(
      (p) =>
        p.isActive &&
        (p.barcode === clean ||
          p.sku.toLowerCase() === clean.toLowerCase())
    );

    if (!matched) {
      return {
        ok: false,
        message: `ไม่พบสินค้ารหัสบาร์โค้ด / SKU: "${clean}"`,
      };
    }

    const res = addToCart(matched, 1);
    return { ...res, product: matched };
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    const maxStock = product ? product.stock : 9999;
    const clampedQty = Math.min(quantity, maxStock);

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: clampedQty }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const holdCurrentOrder = (note?: string) => {
    if (cart.length === 0) return;
    const newHeld: HeldOrder = {
      id: `hold-${Date.now()}`,
      note:
        note?.trim() ||
        `พักบิล (${cart.reduce((s, i) => s + i.quantity, 0)} รายการ)`,
      items: cart,
      discount,
      createdAt: new Date().toISOString(),
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    clearCart();
  };

  const resumeHeldOrder = (heldId: string) => {
    const target = heldOrders.find((h) => h.id === heldId);
    if (!target) return;
    setCart(target.items);
    setDiscount(target.discount);
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
  };

  const removeHeldOrder = (heldId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
  };

  const completeSale = (payload: CheckoutPayload): SaleOrder | null => {
    if (cart.length === 0) return null;

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seq = String(sales.length + 1).padStart(4, "0");
    const receiptNo = `INV-${datePart}-${seq}`;

    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      sku: item.product.sku,
      barcode: item.product.barcode,
      name: item.product.name,
      price: item.product.price,
      cost: item.product.cost,
      quantity: item.quantity,
      unit: item.product.unit,
      subtotal: Number((item.product.price * item.quantity).toFixed(2)),
    }));

    const subtotal = Number(
      saleItems.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2)
    );
    const appliedDiscount = Math.min(Math.max(0, payload.discount), subtotal);
    const total = Number(Math.max(0, subtotal - appliedDiscount).toFixed(2));
    const vatAmount = settings.vatIncluded
      ? Number(
          ((total * settings.vatRate) / (100 + settings.vatRate)).toFixed(2)
        )
      : Number(((total * settings.vatRate) / 100).toFixed(2));

    const totalCost = Number(
      saleItems.reduce((acc, i) => acc + i.cost * i.quantity, 0).toFixed(2)
    );
    const profit = Number((total - totalCost).toFixed(2));

    const newSale: SaleOrder = {
      id: `sale-${Date.now()}`,
      receiptNo,
      items: saleItems,
      subtotal,
      discount: appliedDiscount,
      vatAmount,
      total,
      totalCost,
      profit,
      paymentMethod: payload.paymentMethod,
      cashReceived: payload.cashReceived,
      changeAmount:
        payload.paymentMethod === "cash" && payload.cashReceived
          ? Number(Math.max(0, payload.cashReceived - total).toFixed(2))
          : 0,
      customerPhone: payload.customerPhone,
      cashierId: currentEmployee.id,
      cashierName: currentEmployee.name,
      status: "completed",
      createdAt: now.toISOString(),
    };

    // Deduct stock & create stock logs
    const newLogs: StockLog[] = [];
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const soldItem = saleItems.find((si) => si.productId === prod.id);
        if (!soldItem) return prod;
        const nextStock = Math.max(0, prod.stock - soldItem.quantity);
        newLogs.push({
          id: `log-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          type: "sale",
          quantityChange: -soldItem.quantity,
          previousStock: prod.stock,
          newStock: nextStock,
          note: `ขายหน้าร้าน ${receiptNo} (${currentEmployee.name})`,
          performedBy: currentEmployee.name,
          createdAt: now.toISOString(),
        });
        return { ...prod, stock: nextStock };
      })
    );

    setStockLogs((prev) => [...newLogs, ...prev]);
    setSales((prev) => [newSale, ...prev]);
    clearCart();

    return newSale;
  };

  const voidSale = (saleId: string, approvedByName?: string) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale || targetSale.status === "voided") return;

    const actor = approvedByName || currentEmployee.name;
    const nowIso = new Date().toISOString();
    const restoreLogs: StockLog[] = [];

    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const item = targetSale.items.find((i) => i.productId === prod.id);
        if (!item) return prod;
        const nextStock = prod.stock + item.quantity;
        restoreLogs.push({
          id: `log-void-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          type: "void",
          quantityChange: item.quantity,
          previousStock: prod.stock,
          newStock: nextStock,
          note: `ยกเลิกบิล ${targetSale.receiptNo} (อนุมัติโดย ${actor})`,
          performedBy: actor,
          createdAt: nowIso,
        });
        return { ...prod, stock: nextStock };
      })
    );

    setStockLogs((prev) => [...restoreLogs, ...prev]);
    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId ? { ...s, status: "voided", voidedBy: actor } : s
      )
    );
  };

  const saveProduct = (productData: Omit<Product, "id"> & { id?: string }) => {
    if (productData.id) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productData.id
            ? ({ ...productData, id: productData.id } as Product)
            : p
        )
      );
    } else {
      const newProd: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
      };
      setProducts((prev) => [newProd, ...prev]);
      if (newProd.stock > 0) {
        setStockLogs((prev) => [
          {
            id: `log-init-${Date.now()}`,
            productId: newProd.id,
            productName: newProd.name,
            barcode: newProd.barcode,
            type: "in",
            quantityChange: newProd.stock,
            previousStock: 0,
            newStock: newProd.stock,
            note: `เพิ่มสินค้าใหม่เข้าคลัง (${currentEmployee.name})`,
            performedBy: currentEmployee.name,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const adjustStock = (
    productId: string,
    type: "in" | "out" | "adjust",
    quantity: number,
    note: string
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const prevStock = target.stock;
    let newStock = prevStock;
    if (type === "in") newStock = prevStock + Math.abs(quantity);
    else if (type === "out")
      newStock = Math.max(0, prevStock - Math.abs(quantity));
    else if (type === "adjust") newStock = Math.max(0, quantity);

    const diff = newStock - prevStock;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const baseNote =
      note.trim() ||
      (type === "in"
        ? "รับสินค้าเข้าสต็อก"
        : type === "out"
        ? "ตัดสต็อกสินค้า"
        : "ปรับปรุงยอดสต็อกคงเหลือ");

    setStockLogs((prev) => [
      {
        id: `log-adj-${Date.now()}`,
        productId: target.id,
        productName: target.name,
        barcode: target.barcode,
        type,
        quantityChange: diff,
        previousStock: prevStock,
        newStock,
        note: `${baseNote} (${currentEmployee.name})`,
        performedBy: currentEmployee.name,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const addCategory = (name: string, color: string) => {
    const clean = name.trim();
    if (!clean) return;
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: clean, color },
    ]);
  };

  const deleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const resetToDemoData = () => {
    setProducts(DEFAULT_PRODUCTS);
    setCategories(DEFAULT_CATEGORIES);
    setSales(DEFAULT_SALES);
    setStockLogs(DEFAULT_STOCK_LOGS);
    setHeldOrders([]);
    setSettings(DEFAULT_SETTINGS);
    setCashDrawers(DEFAULT_CASH_DRAWERS);
    setEmployees(DEFAULT_EMPLOYEES);
    setCurrentEmployeeId(DEFAULT_EMPLOYEES[0].id);
    clearCart();
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  };

  return (
    <POSContext.Provider
      value={{
        isHydrated,
        products,
        categories,
        sales,
        stockLogs,
        heldOrders,
        settings,
        cashDrawers,
        employees,
        currentEmployee,
        permissions,
        cart,
        discount,
        setDiscount,
        isSwitchEmployeeModalOpen,
        openSwitchEmployeeModal,
        closeSwitchEmployeeModal,
        switchEmployee,
        verifyManagerOrOwnerPin,
        saveEmployee,
        deleteEmployee,
        getCashDrawerForDate,
        setOpeningCash,
        addDrawerMovement,
        deleteDrawerMovement,
        closeCashDrawerShift,
        reopenCashDrawerShift,
        isCashDrawerModalOpen,
        cashDrawerModalDateKey,
        openCashDrawerModal,
        closeCashDrawerModal,
        addToCart,
        addByBarcode,
        updateCartQty,
        removeFromCart,
        clearCart,
        holdCurrentOrder,
        resumeHeldOrder,
        removeHeldOrder,
        completeSale,
        voidSale,
        saveProduct,
        deleteProduct,
        adjustStock,
        addCategory,
        deleteCategory,
        updateSettings,
        resetToDemoData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
}
