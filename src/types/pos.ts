export type PaymentMethod = "cash" | "promptpay" | "transfer" | "card";

export type EmployeeRole = "owner" | "manager" | "cashier";

export interface Employee {
  id: string;
  code: string;
  name: string;
  role: EmployeeRole;
  pin: string; // 4-digit PIN
  phone: string;
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
}

export interface RolePermissions {
  canViewCostAndProfit: boolean;
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  canVoidSales: boolean;
  canManageEmployees: boolean;
  canManageSettings: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string;
  emoji?: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface HeldOrder {
  id: string;
  note: string;
  items: CartItem[];
  discount: number;
  createdAt: string;
}

export interface SaleOrderItem {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface SaleOrder {
  id: string;
  receiptNo: string;
  items: SaleOrderItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  customerPhone?: string;
  cashierId?: string;
  cashierName: string;
  voidedBy?: string;
  status: "completed" | "voided";
  createdAt: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  type: "in" | "out" | "sale" | "void" | "adjust";
  quantityChange: number;
  previousStock: number;
  newStock: number;
  note: string;
  performedBy?: string;
  createdAt: string;
}

export interface CashDrawerMovement {
  id: string;
  type: "in" | "out";
  amount: number;
  note: string;
  performedBy?: string;
  createdAt: string;
}

export interface DailyCashDrawer {
  dateKey: string; // YYYY-MM-DD
  openingCash: number; // เงินทอนตั้งต้นประจำวัน
  movements: CashDrawerMovement[]; // รายการนำเงินสดเข้า/ออกลิ้นชักระหว่างวัน
  actualClosingCash?: number; // ยอดเงินสดที่นับได้จริงตอนปิดกะ
  status: "open" | "closed";
  openedAt: string;
  closedAt?: string;
  closedBy?: string;
  note?: string;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  taxId: string;
  phone: string;
  address: string;
  promptPayId: string;
  vatRate: number;
  vatIncluded: boolean;
  receiptFooter: string;
  cashierName: string;
  defaultOpeningCash?: number;
}
