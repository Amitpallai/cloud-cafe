import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Armchair,
  BookOpen,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import heroMark from "@/assets/hero.png";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/field";
import { messageFromError } from "@/lib/format";
import { useAuthStore, useCurrentRole } from "@/stores/auth-store";
import type { UserRole } from "@/types/domain";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const allRoles: UserRole[] = ["OWNER", "MANAGER", "CASHIER", "KITCHEN", "WAITER"];
const orderRoles: UserRole[] = ["OWNER", "MANAGER", "CASHIER", "WAITER"];
const kitchenRoles: UserRole[] = ["OWNER", "MANAGER", "KITCHEN"];
const managerRoles: UserRole[] = ["OWNER", "MANAGER"];

interface WorkspaceShortcut {
  role: UserRole;
  to: string;
}

const workspaceShortcuts: WorkspaceShortcut[] = [
  { role: "OWNER", to: "/" },
  { role: "MANAGER", to: "/menu" },
  { role: "CASHIER", to: "/pos" },
  { role: "WAITER", to: "/tables" },
  { role: "KITCHEN", to: "/kitchen" },
];

const navigation: NavItem[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard, roles: allRoles },
  { label: "Point of sale", to: "/pos", icon: ShoppingBag, roles: orderRoles },
  { label: "Orders", to: "/orders", icon: ClipboardList, roles: orderRoles },
  { label: "Tables", to: "/tables", icon: Armchair, roles: allRoles },
  { label: "Kitchen", to: "/kitchen", icon: ChefHat, roles: kitchenRoles },
  { label: "Menu", to: "/menu", icon: BookOpen, roles: managerRoles },
  { label: "Team", to: "/staff", icon: Users, roles: managerRoles },
];

export function AppLayout() {
  const { user, logout, previewRole, setPreviewRole } = useAuthStore();
  const currentRole = useCurrentRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(currentRole ?? "CASHIER"),
  );
  const currentPage =
    visibleNavigation.find((item) =>
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to),
    )?.label ?? "Cloud Café";

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(messageFromError(error));
    } finally {
      setLoggingOut(false);
    }
  }

  function handleWorkspaceChange(roleValue: string) {
    const workspace = workspaceShortcuts.find((item) => item.role === roleValue);
    if (!workspace) return;
    setPreviewRole(workspace.role === user?.role ? null : workspace.role);
    navigate(workspace.to);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </div>
        <nav className="mt-3 grid gap-1">
          {visibleNavigation.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="mt-auto rounded-xl border bg-background p-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={user?.name ?? "Staff"} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatRole(currentRole)}
              </p>
            </div>
          </div>
          <WorkspaceSelector
            workspaces={workspaceShortcuts}
            currentRole={currentRole}
            onChange={handleWorkspaceChange}
            className="mt-4"
          />
          {previewRole ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Previewing as {formatRole(previewRole)}. Actions still use your signed-in account.
            </p>
          ) : null}
          <Button
            variant="ghost"
            className="mt-4 w-full justify-start text-muted-foreground"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
          <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-7">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                onClick={() => setMobileOpen((open) => !open)}
              >
                {mobileOpen ? <X /> : <MenuIcon />}
              </Button>
              <div>
                <p className="text-xs text-muted-foreground">Cloud Café / {currentPage}</p>
                <h1 className="font-heading text-lg font-semibold">{currentPage}</h1>
              </div>
            </div>
             
          </div>
          {mobileOpen ? (
            <div className="border-t bg-background p-3 lg:hidden">
              <nav className="grid gap-1">
                {visibleNavigation.map((item) => (
                  <NavigationLink
                    key={item.to}
                    item={item}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
                <WorkspaceSelector
                  workspaces={workspaceShortcuts}
                  currentRole={currentRole}
                  onChange={handleWorkspaceChange}
                  className="mt-2"
                />
                {previewRole ? (
                  <p className="px-3 py-1 text-xs text-muted-foreground">
                    Previewing as {formatRole(previewRole)}. Actions still use your signed-in account.
                  </p>
                ) : null}
                <Button
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut /> Sign out
                </Button>
              </nav>
            </div>
          ) : null}
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">
          {logoutError ? (
            <ErrorMessage message={logoutError} className="mb-5" />
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function WorkspaceSelector({
  workspaces,
  currentRole,
  onChange,
  className,
}: {
  workspaces: WorkspaceShortcut[];
  currentRole?: UserRole;
  onChange: (role: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Field label="Preview role (demo)">
        <Select
          aria-label="Preview role (demo)"
          value={currentRole ?? ""}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose a role</option>
          {workspaces.map(({ role }) => (
            <option key={role} value={role}>
              {formatRole(role)}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

function NavigationLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      end={item.to === "/"}
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`
      }
    >
      <Icon aria-hidden="true" className="size-4.5" />
      {item.label}
    </NavLink>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <img
        src={heroMark}
        alt=""
        className="size-10 rounded-xl bg-white p-1.5 object-contain"
      />
      <div>
        <p className="font-heading text-base font-bold tracking-tight">Cloud Café</p>
        <p className="text-xs text-muted-foreground">POS workspace</p>
      </div>
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary-foreground">
      {initials}
    </span>
  );
}

function formatRole(role?: UserRole) {
  if (!role) return "Staff";
  return role.charAt(0) + role.slice(1).toLowerCase();
}
