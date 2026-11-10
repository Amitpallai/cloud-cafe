import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Armchair,
  Check,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { money } from "@/lib/format";
import { messageFromError } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import { useCartStore } from "@/stores/cart-store";
import type { DiningTable, MenuCategory, MenuItem } from "@/types/domain";

export function PosPage() {
  const navigate = useNavigate();
  const { tableId, lines, setTable, addItem, setQuantity, clear } = useCartStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([posApi.menu(), posApi.categories(), posApi.tables()])
      .then(([menu, categoryData, tableData]) => {
        if (!active) return;
        setItems(menu);
        setCategories(categoryData);
        setTables(tableData.filter((table) => ["AVAILABLE", "RESERVED"].includes(table.status)));
      })
      .catch((loadError: unknown) => {
        if (active) setError(messageFromError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const categoryMatches = categoryId === "all" || item.categoryId === categoryId;
        const queryMatches = item.name.toLowerCase().includes(query.trim().toLowerCase());
        return item.isAvailable && categoryMatches && queryMatches;
      }),
    [items, categoryId, query],
  );
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.item.price) * line.quantity,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tableId || !lines.length) return;
    setError("");
    setSubmitting(true);
    try {
      await posApi.createOrder({
        tableId,
        items: lines.map((line) => ({
          menuItemId: line.item.id,
          quantity: line.quantity,
          ...(line.notes ? { notes: line.notes } : {}),
        })),
      });
      clear();
      navigate("/orders", { replace: true });
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Point of sale"
        title="Create an order"
        description="Choose a table, add items, and send the order straight to your service queue."
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      {loading ? (
        <LoadingState label="Loading menu and tables…" />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search menu"
                  className="pl-9"
                  placeholder="Search menu items…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              <Button
                size="sm"
                variant={categoryId === "all" ? "default" : "outline"}
                onClick={() => setCategoryId("all")}
              >
                All items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={categoryId === category.id ? "default" : "outline"}
                  onClick={() => setCategoryId(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            {filteredItems.length ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredItems.map((item) => {
                  const quantity = lines.find((line) => line.item.id === item.id)?.quantity ?? 0;
                  return (
                    <Card key={item.id} className="group overflow-hidden transition hover:border-primary/40 hover:shadow-md">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-36 place-items-center bg-linear-to-br from-primary/10 via-muted to-primary/5">
                          <ShoppingBag className="size-9 text-primary/35" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{item.name}</h3>
                            <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-4 text-muted-foreground">
                              {item.description || item.category?.name || "Made fresh to order"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-semibold">
                            {money(item.price)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={quantity ? "secondary" : "outline"}
                          className="mt-4 w-full"
                          onClick={() => addItem(item)}
                        >
                          {quantity ? <Check /> : <Plus />}
                          {quantity ? `${quantity} added · Add one` : "Add to order"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="font-semibold">No items found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another search or choose a different category.
                </p>
              </Card>
            )}
          </section>

          <Card className="xl:sticky xl:top-24">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="font-heading text-lg font-semibold">Current order</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lines.reduce((count, line) => count + line.quantity, 0)} items
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={!lines.length}
                onClick={clear}
              >
                <Trash2 /> Clear
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid gap-2">
                <h4 id="table-picker-label" className="text-sm font-medium">
                  Choose a table
                </h4>
                <div
                  aria-labelledby="table-picker-label"
                  className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1"
                  role="radiogroup"
                >
                  {tables.map((table) => {
                    const selected = tableId === table.id;
                    const reserved = table.status === "RESERVED";
                    return (
                      <button
                        key={table.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setTable(table.id)}
                        className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : reserved
                              ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                              : "bg-background hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <Armchair
                            aria-hidden="true"
                            className={`size-4 ${reserved ? "text-amber-700" : "text-primary"}`}
                          />
                          {selected ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
                        </span>
                        <span className="mt-2 block truncate text-sm font-semibold">
                          Table {table.tableNumber}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Users aria-hidden="true" className="size-3" />
                          {table.capacity} seats
                        </span>
                        {reserved ? (
                          <span className="mt-1 block text-[11px] font-medium text-amber-700">
                            Reserved
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              {!tables.length ? (
                <p className="mt-2 text-xs text-destructive">
                  No available tables. Change a table status or complete an order first.
                </p>
              ) : null}
              <div className="my-5 max-h-90 space-y-3 overflow-y-auto">
                {lines.length ? (
                  lines.map((line) => (
                    <div key={line.item.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{line.item.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {money(line.item.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg border p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Remove one ${line.item.name}`}
                          onClick={() => setQuantity(line.item.id, line.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-semibold">{line.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Add one ${line.item.name}`}
                          onClick={() => setQuantity(line.item.id, line.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed py-8 text-center">
                    <ShoppingBag className="mx-auto size-6 text-muted-foreground/60" />
                    <p className="mt-2 text-sm font-medium">Your order is empty</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add items from the menu.</p>
                  </div>
                )}
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-semibold">
                  <span>Estimated total</span>
                  <span>{money(subtotal)}</span>
                </div>
              </div>
              <Button
                type="submit"
                className="mt-5 w-full"
                disabled={!lines.length || !tableId || submitting}
              >
                {submitting ? "Placing order…" : "Place order"}
                {!submitting ? <ShoppingBag /> : null}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
