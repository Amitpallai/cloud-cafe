import { create } from "zustand";
import axios from "axios";
import { api } from "@/services/api";
import type { User, UserRole } from "@/types/domain";

interface AuthState {
  user: User | null;
  initialized: boolean;
  initializationError: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  setupOwner: (input: {
    name: string;
    email: string;
    password: string;
    setupSecret: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  initializationError: null,

  initialize: async () => {
    try {
      const response = await api.get<{ data: { user: User } }>("/auth/me");
      set({ user: response.data.data.user, initializationError: null });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      set({
        user: null,
        initializationError:
          status === undefined || status >= 500
            ? "Could not connect to the server. You can still try signing in."
            : null,
      });
    } finally {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    const response = await api.post<{ data: { user: User } }>("/auth/login", {
      email,
      password,
    });
    set({
      user: response.data.data.user,
      initialized: true,
      initializationError: null,
    });
  },

  loginAsDemo: async (role) => {
    const response = await api.post<{ data: { user: User } }>("/auth/demo-login", {
      role,
    });
    set({
      user: response.data.data.user,
      initialized: true,
      initializationError: null,
    });
  },

  setupOwner: async (input) => {
    const response = await api.post<{ data: { user: User } }>(
      "/auth/setup-owner",
      input,
    );
    set({
      user: response.data.data.user,
      initialized: true,
      initializationError: null,
    });
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({
      user: null,
      initialized: true,
      initializationError: null,
    });
  },

  clearSession: () =>
    set({
      user: null,
      initialized: true,
      initializationError: null,
    }),
}));

export function useCurrentRole() {
  return useAuthStore((state) => state.user?.role);
}
