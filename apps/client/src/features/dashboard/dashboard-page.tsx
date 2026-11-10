import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Armchair,
  Clock3,
  Coffee,
  CookingPot,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState, StatusBadge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { messageFromError, money, shortDate } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import { useAuthStore, useCurrentRole } from "@/stores/auth-store";
import type { DiningTable, KitchenTicket, Order } from "@/types/domain";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const role = useCurrentRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        if (role === "KITCHEN") {
          const result = await posApi.kitchenTickets();
          if (active) setTickets(result);
        } else {
          const [orderData, tableData] = await Promise.all([
            posApi.orders(),
            posApi.tables(),
          ]);
          if (active) {
            setOrders(orderData);
            setTables(tableData);
          }
        }
      } catch (loadError) {
        if (active) setError(messageFromError(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, [role]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today,
  );
  const revenue = todayOrders
    .filter((order) => order.status === "COMPLETED")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const activeOrders = orders.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.status),
  );
  const occupiedTables = tables.filter((table) => table.status === "OCCUPIED").length;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date())}
        title={`Good ${getGreeting()}, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Here’s how your café is doing today."
        actions={
          role !== "KITCHEN" ? (
            <Button render={<Link to="/pos" />}>
              <ShoppingBag /> Start an order
            </Button>
          ) : undefined
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      {loading ? (
        <LoadingState label="Gathering today's service data…" />
      ) : role === "KITCHEN" ? (
        <KitchenOverview tickets={tickets} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Sales today"
              value={money(revenue)}
              detail={`${todayOrders.filter((order) => order.status === "COMPLETED").length} completed orders`}
              icon={ReceiptText}
              tone="lime"
            />
            <MetricCard
              label="Orders today"
              value={String(todayOrders.length)}
              detail={`${activeOrders.length} currently in progress`}
              icon={ShoppingBag}
              tone="blue"
            />
            <MetricCard
              label="Tables occupied"
              value={`${occupiedTables}/${tables.length}`}
              detail={`${tables.filter((table) => table.status === "AVAILABLE").length} tables ready`}
              icon={Armchair}
              tone="violet"
            />
            <MetricCard
              label="Awaiting kitchen"
              value={String(
                orders.filter((order) =>
                  ["SENT_TO_KITCHEN", "PREPARING"].includes(order.status),
                ).length,
              )}
              detail="Live kitchen orders"
              icon={CookingPot}
              tone="orange"
            />
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="font-heading text-base font-semibold">Recent orders</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep an eye on what’s moving through service.
                  </p>
                </div>
                <Button variant="outline" size="sm" render={<Link to="/orders" />}>
                  View all <ArrowUpRight />
                </Button>
              </CardHeader>
              <CardContent className="px-0 pb-1">
                {orders.length ? (
                  <div className="divide-y">
                    {orders.slice(0, 6).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                            <Coffee className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Table {order.table?.tableNumber ?? "—"} · {shortDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-sm font-semibold">{money(order.total)}</span>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No orders yet" description="Your new orders will appear here." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <h3 className="font-heading text-base font-semibold">Table overview</h3>
                  <p className="mt-1 text-sm text-muted-foreground">A quick look at the floor.</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="View tables" render={<Link to="/tables" />}>
                  <ArrowUpRight />
                </Button>
              </CardHeader>
              <CardContent>
                {tables.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-3">
                    {tables.slice(0, 12).map((table) => (
                      <div key={table.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{table.tableNumber}</span>
                          <span
                            className={`size-2 rounded-full ${
                              table.status === "AVAILABLE"
                                ? "bg-emerald-500"
                                : table.status === "OCCUPIED"
                                  ? "bg-sky-500"
                                  : "bg-amber-500"
                            }`}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {table.capacity} seats
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No tables set up" description="Add your tables to see floor activity." />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof ShoppingBag;
  tone: string;
}) {
  const toneStyles: Record<string, string> = {
    lime: "bg-emerald-500/10 text-emerald-700",
    blue: "bg-sky-500/10 text-sky-700",
    violet: "bg-violet-500/10 text-violet-700",
    orange: "bg-orange-500/10 text-orange-700",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <span className={`grid size-10 place-items-center rounded-xl ${toneStyles[tone]}`}>
            <Icon className="size-5" />
          </span>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function KitchenOverview({ tickets }: { tickets: KitchenTicket[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="font-heading text-base font-semibold">Kitchen queue</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"} need attention.
          </p>
        </div>
        <Button render={<Link to="/kitchen" />}>Open kitchen board</Button>
      </CardHeader>
      <CardContent>
        {tickets.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tickets.slice(0, 6).map((ticket) => (
              <div key={ticket.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{ticket.ticketNumber}</p>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Table {ticket.order.table.tableNumber} · {ticket.station.name}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" /> {shortDate(ticket.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Kitchen is clear" description="New tickets show here as soon as orders arrive." />
        )}
      </CardContent>
    </Card>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
