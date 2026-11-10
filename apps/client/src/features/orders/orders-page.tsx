import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ChefHat,
  CircleDollarSign,
  Search,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorMessage, LoadingState, StatusBadge } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { money, messageFromError, shortDate } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import { useCurrentRole } from "@/stores/auth-store";
import type { Order, OrderStatus } from "@/types/domain";

const filters: Array<{ label: string; value: "ALL" | OrderStatus }> = [
  { label: "All orders", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In kitchen", value: "SENT_TO_KITCHEN" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrdersPage() {
  const role = useCurrentRole();
  const canBill = ["OWNER", "MANAGER", "CASHIER"].includes(role ?? "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      setOrders(await posApi.orders());
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const statusMatches = filter === "ALL" || order.status === filter;
        const searchMatches =
          `${order.orderNumber} ${order.table?.tableNumber ?? ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        return statusMatches && searchMatches;
      }),
    [orders, filter, query],
  );

  async function sendOrder(order: Order) {
    setBusyId(order.id);
    setError("");
    try {
      await posApi.sendToKitchen(order.id);
      await loadOrders(false);
    } catch (actionError) {
      setError(messageFromError(actionError));
    } finally {
      setBusyId("");
    }
  }

  async function handleCancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cancelOrder) return;
    setBusyId(cancelOrder.id);
    setError("");
    try {
      await posApi.cancelOrder(cancelOrder.id, reason);
      setCancelOrder(null);
      setReason("");
      await loadOrders(false);
    } catch (actionError) {
      setError(messageFromError(actionError));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Service"
        title="Orders"
        description="Track every order from the first item to the final bill."
        actions={
          <Button render={<Link to="/pos" />}>
            <CircleDollarSign /> New order
          </Button>
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? "secondary" : "ghost"}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                {option.value === "ALL" ? (
                  <span className="ml-1 rounded-full bg-background px-1.5 py-0.5 text-[10px]">
                    {orders.length}
                  </span>
                ) : null}
              </Button>
            ))}
          </div>
          <label className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search order or table…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search order or table"
            />
          </label>
        </div>
        {loading ? (
          <LoadingState label="Loading orders…" />
        ) : visibleOrders.length ? (
          <div className="divide-y">
            {visibleOrders.map((order) => (
              <article
                key={order.id}
                className="grid gap-4 p-4 transition hover:bg-muted/20 sm:p-5 xl:grid-cols-[minmax(210px,1.1fr)_minmax(200px,1fr)_140px_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CircleDollarSign className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Table {order.table?.tableNumber ?? "—"} · {shortDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                  <span>·</span>
                  <span className="truncate">
                    {order.items.slice(0, 2).map((item) => item.itemName).join(", ")}
                    {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 xl:justify-end">
                  <span className="font-semibold">{money(order.total)}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  {order.status === "OPEN" ? (
                    <>
                      <Button
                        size="sm"
                        disabled={busyId === order.id}
                        onClick={() => void sendOrder(order)}
                      >
                        <ChefHat />
                        {busyId === order.id ? "Sending…" : "Send to kitchen"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={busyId === order.id}
                        onClick={() => setCancelOrder(order)}
                      >
                        <XCircle /> Cancel
                      </Button>
                    </>
                  ) : null}
                  {canBill ? (
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link to={`/billing/${order.id}`} />}
                    >
                      Bill <ArrowUpRight />
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={orders.length ? "No matching orders" : "No orders yet"}
            description={
              orders.length
                ? "Clear the search or choose another status."
                : "Create your first order from the point of sale."
            }
          />
        )}
      </Card>
      {cancelOrder ? (
        <Dialog
          title="Cancel this order?"
          description={`${cancelOrder.orderNumber} will be cancelled and its table released.`}
          onClose={() => {
            setCancelOrder(null);
            setReason("");
          }}
        >
          <form onSubmit={handleCancel} className="grid gap-4">
            {error ? <ErrorMessage message={error} /> : null}
            <Field label="Reason for cancellation">
              <Select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              >
                <option value="">Select a reason</option>
                <option value="Customer changed their mind">Customer changed their mind</option>
                <option value="Order entered incorrectly">Order entered incorrectly</option>
                <option value="Item unavailable">Item unavailable</option>
                <option value="Other service issue">Other service issue</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCancelOrder(null)}>
                Keep order
              </Button>
              <Button type="submit" variant="destructive" disabled={busyId === cancelOrder.id}>
                {busyId === cancelOrder.id ? "Cancelling…" : "Cancel order"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
