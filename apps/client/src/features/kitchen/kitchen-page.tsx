import { useCallback, useEffect, useState } from "react";
import { ChefHat, Clock3, RefreshCw, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState, StatusBadge } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { messageFromError, shortDate } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import type { KitchenTicket } from "@/types/domain";

export function KitchenPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadTickets = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    setError("");
    try {
      setTickets(await posApi.kitchenTickets());
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
    const intervalId = window.setInterval(() => void loadTickets(), 15000);
    return () => window.clearInterval(intervalId);
  }, [loadTickets]);

  async function advanceTicket(ticket: KitchenTicket) {
    const nextStatus = ticket.status === "NEW" ? "PREPARING" : "READY";
    setBusyId(ticket.id);
    setError("");
    try {
      await posApi.updateTicket(ticket.id, nextStatus);
      await loadTickets();
    } catch (actionError) {
      setError(messageFromError(actionError));
    } finally {
      setBusyId("");
    }
  }

  const newTickets = tickets.filter((ticket) => ticket.status === "NEW");
  const preparingTickets = tickets.filter((ticket) => ticket.status === "PREPARING");

  return (
    <>
      <PageHeader
        eyebrow="Kitchen display"
        title="Kitchen board"
        description="New tickets arrive automatically. Move each order through prep as it’s ready."
        actions={
          <Button
            variant="outline"
            onClick={() => void loadTickets(true)}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      {loading ? (
        <LoadingState label="Loading kitchen tickets…" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <TicketColumn
            title="New tickets"
            description="Ready to start"
            tickets={newTickets}
            busyId={busyId}
            onAdvance={advanceTicket}
          />
          <TicketColumn
            title="Preparing"
            description="In progress"
            tickets={preparingTickets}
            busyId={busyId}
            onAdvance={advanceTicket}
          />
        </div>
      )}
    </>
  );
}

function TicketColumn({
  title,
  description,
  tickets,
  busyId,
  onAdvance,
}: {
  title: string;
  description: string;
  tickets: KitchenTicket[];
  busyId: string;
  onAdvance: (ticket: KitchenTicket) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold">
          {tickets.length}
        </span>
      </div>
      <div className="grid content-start gap-3">
        {tickets.length ? (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              busy={busyId === ticket.id}
              onAdvance={() => onAdvance(ticket)}
            />
          ))
        ) : (
          <Card>
            <EmptyState title="All caught up" description="New tickets will appear here automatically." />
          </Card>
        )}
      </div>
    </section>
  );
}

function TicketCard({
  ticket,
  busy,
  onAdvance,
}: {
  ticket: KitchenTicket;
  busy: boolean;
  onAdvance: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b bg-muted/25 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-semibold">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Order {ticket.order.orderNumber} · Table {ticket.order.table.tableNumber}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">
            <ChefHat className="size-3.5" /> {ticket.station.name}
          </span>
          <p className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" /> {shortDate(ticket.createdAt)}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {ticket.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-sm font-bold text-primary">
              {item.quantity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.itemName}</p>
              {item.notes ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p>
              ) : null}
            </div>
            <Utensils className="mt-1 size-4 text-muted-foreground/60" />
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Button className="w-full" onClick={onAdvance} disabled={busy}>
          {busy
            ? "Updating…"
            : ticket.status === "NEW"
              ? "Start preparing"
              : "Mark ready"}
        </Button>
      </div>
    </Card>
  );
}
