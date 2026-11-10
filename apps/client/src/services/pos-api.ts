import { api, getData } from "@/services/api";
import type {
  Bill,
  DiningTable,
  KitchenTicket,
  MenuCategory,
  MenuItem,
  Numeric,
  Order,
  PaymentMethod,
  StaffMember,
} from "@/types/domain";

export const posApi = {
  menu: () => getData<MenuItem[]>("/menu"),
  categories: () => getData<MenuCategory[]>("/menu/categories"),
  tables: () => getData<DiningTable[]>("/tables"),
  orders: () => getData<Order[]>("/orders"),
  kitchenTickets: () => getData<KitchenTicket[]>("/kitchen/tickets"),
  staff: () => getData<StaffMember[]>("/staff"),
  bill: (orderId: string) => getData<Bill>(`/billing/${orderId}`),
  receipt: (orderId: string) => getData<{
    invoiceNumber: string;
    issuedAt: string;
    subtotal: Numeric;
    discountAmount: Numeric;
    taxAmount: Numeric;
    total: Numeric;
    paidAmount: Numeric;
    order: Order & {
      payments: Array<{
        id: string;
        paymentNumber: string;
        method: PaymentMethod;
        amount: Numeric;
        createdAt: string;
      }>;
    };
  }>(`/billing/${orderId}/receipt`),

  createOrder: async (input: {
    tableId: string;
    notes?: string;
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  }) => {
    const response = await api.post<{ data: Order }>("/orders", input);
    return response.data.data;
  },

  sendToKitchen: async (orderId: string) => {
    const response = await api.post<{ data: KitchenTicket[] }>(
      `/kitchen/orders/${orderId}/send`,
    );
    return response.data.data;
  },

  cancelOrder: async (orderId: string, reason: string) => {
    const response = await api.post<{ data: Order }>(
      `/orders/${orderId}/cancel`,
      { reason },
    );
    return response.data.data;
  },

  updateTableStatus: async (
    tableId: string,
    status: "AVAILABLE" | "RESERVED" | "OUT_OF_SERVICE",
  ) => {
    const response = await api.patch<{ data: DiningTable }>(
      `/tables/${tableId}/status`,
      { status },
    );
    return response.data.data;
  },

  createTable: async (input: {
    tableNumber: string;
    name?: string;
    capacity: number;
    section?: string;
    type: "AC" | "NON_AC";
  }) => {
    const response = await api.post<{ data: DiningTable }>("/tables", input);
    return response.data.data;
  },

  createCategory: async (input: { name: string; description?: string }) => {
    const response = await api.post<{ data: MenuCategory }>(
      "/menu/categories",
      input,
    );
    return response.data.data;
  },

  createMenuItem: async (input: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    preparationTimeMinutes: number;
    sortOrder: number;
    isAvailable: boolean;
  }) => {
    const response = await api.post<{ data: MenuItem }>("/menu", input);
    return response.data.data;
  },

  updateMenuItem: async (
    itemId: string,
    input: { isAvailable: boolean },
  ) => {
    const response = await api.patch<{ data: MenuItem }>(
      `/menu/${itemId}`,
      input,
    );
    return response.data.data;
  },

  updateStaffStatus: async (staffId: string, isActive: boolean) => {
    const response = await api.patch<{ data: StaffMember }>(
      `/staff/${staffId}/status`,
      { isActive },
    );
    return response.data.data;
  },

  createStaff: async (input: {
    name: string;
    email: string;
    password: string;
    role: "MANAGER" | "CASHIER" | "KITCHEN" | "WAITER";
    employeeId?: string;
    phone?: string;
  }) => {
    const response = await api.post<{ data: StaffMember }>("/staff", input);
    return response.data.data;
  },

  applyDiscount: async (
    orderId: string,
    input: { type: "FIXED" | "PERCENTAGE"; value: number; reason: string },
  ) => {
    const response = await api.post<{ data: unknown }>(
      `/billing/${orderId}/discount`,
      input,
    );
    return response.data.data;
  },

  updateTicket: async (
    ticketId: string,
    status: "PREPARING" | "READY",
  ) => {
    const response = await api.patch<{ data: KitchenTicket }>(
      `/kitchen/tickets/${ticketId}/status`,
      { status },
    );
    return response.data.data;
  },

  recordPayment: async (
    orderId: string,
    input: { method: PaymentMethod; amount: number; reference?: string },
  ) => {
    const response = await api.post<{ data: unknown }>(
      `/billing/${orderId}/payments`,
      input,
    );
    return response.data.data;
  },
};
