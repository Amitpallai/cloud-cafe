import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, ReceiptText, Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorMessage, LoadingState, StatusBadge, SuccessMessage } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { money, messageFromError, shortDate } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import { useCurrentRole } from "@/stores/auth-store";
import type { Bill, PaymentMethod } from "@/types/domain";

export function BillingPage() {
  const role = useCurrentRole();
  const { orderId } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const loadBill = useCallback(async () => {
    if (!orderId) return;
    setError("");
    try {
      const result = await posApi.bill(orderId);
      setBill(result);
      setAmount(Number(result.summary.due).toFixed(2));
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadBill();
  }, [loadBill]);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orderId || !bill) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await posApi.recordPayment(orderId, {
        method,
        amount: Number(amount),
        reference: reference || undefined,
      });
      setSuccess("Payment recorded successfully.");
      setReference("");
      await loadBill();
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function submitDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orderId || !bill) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await posApi.applyDiscount(orderId, {
        type: discountType,
        value: Number(discountValue),
        reason: discountReason,
      });
      setSuccess("Discount applied to this order.");
      setDiscountValue("");
      setDiscountReason("");
      await loadBill();
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setBusy(false);
    }
  }

  const isClosed =
    bill?.order.status === "COMPLETED" || bill?.order.status === "CANCELLED";
  const canDiscount =
    ["OWNER", "MANAGER"].includes(role ?? "") &&
    Number(bill?.summary.paid ?? 0) === 0 &&
    !isClosed;

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Order bill"
        description="Review the balance, apply an eligible discount, and record a payment."
        actions={
          <Button variant="outline" render={<Link to="/orders" />}>
            <ArrowLeft /> Back to orders
          </Button>
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      {success ? <SuccessMessage message={success} /> : null}
      {loading ? (
        <LoadingState label="Loading bill…" />
      ) : bill ? (
        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {bill.order.orderNumber}
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-semibold">
                    Table {bill.order.table?.tableNumber ?? "—"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Created {shortDate(bill.order.createdAt)}
                  </p>
                </div>
                <StatusBadge status={bill.order.status} />
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="divide-y border-t">
                  {bill.order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium">{item.itemName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.quantity} × {money(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{money(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t bg-muted/20 p-5">
                  <SummaryRow label="Subtotal" value={money(bill.summary.subtotal)} />
                  <SummaryRow label="Discount" value={`− ${money(bill.summary.discount)}`} />
                  <SummaryRow label="Tax" value={money(bill.summary.tax)} />
                  <SummaryRow label="Total" value={money(bill.summary.total)} strong />
                  <div className="my-3 border-t" />
                  <SummaryRow label="Paid" value={money(bill.summary.paid)} />
                  <SummaryRow label="Balance due" value={money(bill.summary.due)} strong accent />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <h3 className="font-heading font-semibold">Payment history</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Payments recorded for this order.</p>
                </div>
                {bill.order.invoice ? (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {bill.order.invoice.invoiceNumber}
                  </span>
                ) : null}
              </CardHeader>
              <CardContent>
                {bill.order.payments.length ? (
                  <div className="divide-y rounded-lg border">
                    {bill.order.payments.map((payment) => (
                      <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 p-3.5">
                        <div>
                          <p className="text-sm font-medium">
                            {formatPaymentMethod(payment.method)} · {payment.paymentNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {shortDate(payment.createdAt)}
                            {payment.reference ? ` · Ref ${payment.reference}` : ""}
                          </p>
                        </div>
                        <span className="font-semibold">{money(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed py-7 text-center text-sm text-muted-foreground">
                    No payments have been recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <CreditCard className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold">Record a payment</h3>
                    <p className="text-xs text-muted-foreground">Balance due {money(bill.summary.due)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isClosed || Number(bill.summary.due) <= 0 ? (
                  <div className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-800">
                    <CheckCircle2 className="mb-2 size-5" />
                    {bill.order.status === "COMPLETED"
                      ? "This order is fully paid and closed."
                      : bill.order.status === "CANCELLED"
                        ? "This order has been cancelled."
                        : "This order has no outstanding balance."}
                  </div>
                ) : (
                  <form onSubmit={submitPayment} className="grid gap-4">
                    <Field label="Payment method">
                      <Select
                        value={method}
                        onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="WALLET">Wallet</option>
                      </Select>
                    </Field>
                    <Field label="Amount (INR)">
                      <Input
                        type="number"
                        min="0.01"
                        max={Number(bill.summary.due)}
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Reference number" hint="Optional for card or UPI.">
                      <Input
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                        maxLength={150}
                        placeholder="Transaction or terminal reference"
                      />
                    </Field>
                    <Button type="submit" disabled={busy || Number(amount) <= 0}>
                      {busy ? "Recording…" : "Record payment"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {["OWNER", "MANAGER"].includes(role ?? "") ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-700">
                      <Tag className="size-4" />
                    </span>
                    <div>
                      <h3 className="font-heading font-semibold">Order discount</h3>
                      <p className="text-xs text-muted-foreground">Available before any payment.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {canDiscount ? (
                    <form onSubmit={submitDiscount} className="grid gap-4">
                      {error ? <ErrorMessage message={error} /> : null}
                      <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                        <Field label="Type">
                          <Select
                            value={discountType}
                            onChange={(event) =>
                              setDiscountType(event.target.value as "FIXED" | "PERCENTAGE")
                            }
                          >
                            <option value="PERCENTAGE">Percent</option>
                            <option value="FIXED">Fixed amount</option>
                          </Select>
                        </Field>
                        <Field label={discountType === "FIXED" ? "Amount (INR)" : "Percent"}>
                          <Input
                            type="number"
                            min="0.01"
                            max={discountType === "PERCENTAGE" ? 100 : Number(bill.summary.subtotal)}
                            step="0.01"
                            value={discountValue}
                            onChange={(event) => setDiscountValue(event.target.value)}
                            required
                          />
                        </Field>
                      </div>
                      <Field label="Reason">
                        <Input
                          value={discountReason}
                          onChange={(event) => setDiscountReason(event.target.value)}
                          minLength={3}
                          maxLength={300}
                          placeholder="e.g. Loyalty offer"
                          required
                        />
                      </Field>
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={busy || Number(discountValue) <= 0}
                      >
                        Apply discount
                      </Button>
                    </form>
                  ) : (
                    <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      A discount can’t be changed after a payment or when an order is closed.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}
            <Button
              variant="outline"
              render={<Link to={`/billing/${orderId}/receipt`} />}
            >
              <ReceiptText /> View receipt
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 text-sm ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={accent ? "text-primary" : ""}>{value}</span>
    </div>
  );
}

function formatPaymentMethod(method: PaymentMethod) {
  return method === "UPI" ? "UPI" : method.charAt(0) + method.slice(1).toLowerCase();
}
