import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { money, messageFromError, shortDate } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import type { PaymentMethod } from "@/types/domain";

type Receipt = Awaited<ReturnType<typeof posApi.receipt>>;

export function ReceiptPage() {
  const { orderId } = useParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReceipt = useCallback(async () => {
    if (!orderId) return;
    try {
      setReceipt(await posApi.receipt(orderId));
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadReceipt();
  }, [loadReceipt]);

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Receipt"
        description="A clear, printable record for your customer."
        actions={
          <>
            <Button variant="outline" render={<Link to={`/billing/${orderId}`} />}>
              <ArrowLeft /> Back to bill
            </Button>
            <Button onClick={() => window.print()} disabled={!receipt}>
              <Printer /> Print receipt
            </Button>
          </>
        }
      />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <LoadingState label="Loading receipt…" />
      ) : receipt ? (
        <Card className="mx-auto max-w-2xl p-6 sm:p-10 print:border-0 print:shadow-none">
          <div className="text-center">
            <p className="font-heading text-2xl font-bold">Cloud Café</p>
            <p className="mt-1 text-sm text-muted-foreground">Payment receipt</p>
          </div>
          <div className="mt-7 flex justify-between gap-4 border-y py-4 text-sm">
            <div>
              <p className="font-semibold">{receipt.invoiceNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {shortDate(receipt.issuedAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{receipt.order.orderNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Table {receipt.order.table.tableNumber}
              </p>
            </div>
          </div>
          <div className="divide-y">
            {receipt.order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {item.itemName} <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-medium">{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="ml-auto mt-4 grid max-w-xs gap-2 border-t pt-4 text-sm">
            <ReceiptRow label="Subtotal" value={money(receipt.subtotal)} />
            <ReceiptRow label="Discount" value={`− ${money(receipt.discountAmount)}`} />
            <ReceiptRow label="Tax" value={money(receipt.taxAmount)} />
            <ReceiptRow label="Total" value={money(receipt.total)} strong />
            <ReceiptRow label="Paid" value={money(receipt.paidAmount)} strong />
          </div>
          <div className="mt-7 border-t pt-5">
            <p className="text-sm font-semibold">Payments</p>
            <div className="mt-2 space-y-2">
              {receipt.order.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatMethod(payment.method)} · {payment.paymentNumber}</span>
                  <span>{money(payment.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Thank you for visiting Cloud Café.
          </p>
        </Card>
      ) : null}
    </>
  );
}

function ReceiptRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatMethod(method: PaymentMethod) {
  return method === "UPI" ? "UPI" : method.charAt(0) + method.slice(1).toLowerCase();
}
