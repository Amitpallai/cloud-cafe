import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus, TableStatus, TicketStatus } from "@/types/domain";

export function ErrorMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700"
    >
      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const statusNames: Record<OrderStatus | TableStatus | TicketStatus, string> = {
  OPEN: "Open",
  SENT_TO_KITCHEN: "In kitchen",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  OUT_OF_SERVICE: "Out of service",
  NEW: "New",
};

const statusColors: Record<OrderStatus | TableStatus | TicketStatus, string> = {
  OPEN: "bg-sky-500/10 text-sky-700",
  SENT_TO_KITCHEN: "bg-amber-500/10 text-amber-700",
  PREPARING: "bg-orange-500/10 text-orange-700",
  READY: "bg-emerald-500/10 text-emerald-700",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  AVAILABLE: "bg-emerald-500/10 text-emerald-700",
  OCCUPIED: "bg-sky-500/10 text-sky-700",
  RESERVED: "bg-amber-500/10 text-amber-700",
  OUT_OF_SERVICE: "bg-muted text-muted-foreground",
  NEW: "bg-violet-500/10 text-violet-700",
};

export function StatusBadge({
  status,
}: {
  status: OrderStatus | TableStatus | TicketStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        statusColors[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusNames[status]}
    </span>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-40 place-items-center px-5 py-10 text-center">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
