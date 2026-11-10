export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN" | "WAITER";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE";
export type OrderStatus =
  | "OPEN"
  | "SENT_TO_KITCHEN"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";
export type TicketStatus = "NEW" | "PREPARING" | "READY" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET";
export type Numeric = number | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface DiningTable {
  id: string;
  tableNumber: string;
  name: string | null;
  capacity: number;
  section: string | null;
  type: "AC" | "NON_AC";
  status: TableStatus;
  isActive: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: Numeric;
  imageUrl: string | null;
  categoryId: string;
  category?: MenuCategory;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPrice: Numeric;
  quantity: number;
  lineTotal: Numeric;
  notes: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  table: DiningTable;
  createdBy?: { id: string; name: string; employeeId?: string | null };
  status: OrderStatus;
  subtotal: Numeric;
  discountAmount: Numeric;
  taxAmount: Numeric;
  total: Numeric;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface KitchenTicket {
  id: string;
  ticketNumber: string;
  orderId: string;
  station: { id: string; name: string; code: string };
  status: TicketStatus;
  notes: string | null;
  createdAt: string;
  items: Array<{ id: string; itemName: string; quantity: number; notes: string | null }>;
  order: {
    id: string;
    orderNumber: string;
    table: { tableNumber: string };
  };
}

export interface Bill {
  order: Order & {
    payments: Array<{
      id: string;
      paymentNumber: string;
      method: PaymentMethod;
      amount: Numeric;
      reference: string | null;
      createdAt: string;
    }>;
    invoice: { invoiceNumber: string; issuedAt: string } | null;
  };
  summary: {
    subtotal: Numeric;
    discount: Numeric;
    tax: Numeric;
    total: Numeric;
    paid: Numeric;
    due: Numeric;
  };
}

export interface StaffMember extends User {
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}
