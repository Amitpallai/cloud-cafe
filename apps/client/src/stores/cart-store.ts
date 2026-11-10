import { create } from "zustand";
import type { MenuItem } from "@/types/domain";

export interface CartLine {
  item: MenuItem;
  quantity: number;
  notes: string;
}

interface CartState {
  tableId: string;
  lines: CartLine[];
  setTable: (id: string) => void;
  addItem: (item: MenuItem) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  tableId: "",
  lines: [],
  setTable: (tableId) => set({ tableId }),
  addItem: (item) =>
    set((state) => {
      const existing = state.lines.find((line) => line.item.id === item.id);
      return {
        lines: existing
          ? state.lines.map((line) =>
              line.item.id === item.id
                ? { ...line, quantity: Math.min(100, line.quantity + 1) }
                : line,
            )
          : [...state.lines, { item, quantity: 1, notes: "" }],
      };
    }),
  setQuantity: (itemId, quantity) =>
    set((state) => ({
      lines:
        quantity < 1
          ? state.lines.filter((line) => line.item.id !== itemId)
          : state.lines.map((line) =>
              line.item.id === itemId
                ? { ...line, quantity: Math.min(100, quantity) }
                : line,
            ),
    })),
  clear: () => set({ tableId: "", lines: [] }),
}));
