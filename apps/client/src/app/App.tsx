import { useEffect } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuthStore, useCurrentRole } from "@/stores/auth-store";
import type { UserRole } from "@/types/domain";
import { LoginPage } from "@/features/auth/login-page";
import { SetupPage } from "@/features/auth/setup-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { PosPage } from "@/features/pos/pos-page";
import { OrdersPage } from "@/features/orders/orders-page";
import { TablesPage } from "@/features/tables/tables-page";
import { KitchenPage } from "@/features/kitchen/kitchen-page";
import { MenuPage } from "@/features/menu/menu-page";
import { StaffPage } from "@/features/staff/staff-page";
import { BillingPage } from "@/features/billing/billing-page";
import { ReceiptPage } from "@/features/billing/receipt-page";

const orderRoles: UserRole[] = ["OWNER", "MANAGER", "CASHIER", "WAITER"];
const billingRoles: UserRole[] = ["OWNER", "MANAGER", "CASHIER"];
const kitchenRoles: UserRole[] = ["OWNER", "MANAGER", "KITCHEN"];
const managerRoles: UserRole[] = ["OWNER", "MANAGER"];

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const clearSession = useAuthStore((state) => state.clearSession);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    void initialize();
    const onExpired = () => clearSession();
    window.addEventListener("session:expired", onExpired);
    return () => window.removeEventListener("session:expired", onExpired);
  }, [initialize, clearSession]);

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Connecting to your workspace…
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route element={<RequireRole roles={orderRoles} />}>
            <Route path="pos" element={<PosPage />} />
            <Route path="orders" element={<OrdersPage />} />
          </Route>
          <Route element={<RequireRole roles={billingRoles} />}>
            <Route path="billing/:orderId" element={<BillingPage />} />
            <Route path="billing/:orderId/receipt" element={<ReceiptPage />} />
          </Route>
          <Route path="tables" element={<TablesPage />} />
          <Route element={<RequireRole roles={kitchenRoles} />}>
            <Route path="kitchen" element={<KitchenPage />} />
          </Route>
          <Route element={<RequireRole roles={managerRoles} />}>
            <Route path="menu" element={<MenuPage />} />
            <Route path="staff" element={<StaffPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function RequireAuth() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function RequireRole({ roles }: { roles: UserRole[] }) {
  const user = useAuthStore((state) => state.user);
  const role = useCurrentRole();
  return user && role && roles.includes(role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Page not found</h1>
        <a className="mt-4 inline-block text-sm text-primary underline" href="/">
          Return to overview
        </a>
      </div>
    </div>
  );
}
