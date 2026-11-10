import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BookOpen, Check, Plus, Search, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { money, messageFromError } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import type { MenuCategory, MenuItem } from "@/types/domain";

type MenuDialog = "item" | "category" | null;

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<MenuDialog>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    preparationTimeMinutes: "10",
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  const loadMenu = useCallback(async () => {
    setError("");
    try {
      const [menuItems, menuCategories] = await Promise.all([
        posApi.menu(),
        posApi.categories(),
      ]);
      setItems(menuItems);
      setCategories(menuCategories);
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.category?.name ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function createMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("item");
    setError("");
    try {
      await posApi.createMenuItem({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        categoryId: form.categoryId,
        preparationTimeMinutes: Number(form.preparationTimeMinutes),
        sortOrder: 0,
        isAvailable: true,
      });
      setDialog(null);
      setForm({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        preparationTimeMinutes: "10",
      });
      await loadMenu();
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setBusyId("");
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("category");
    setError("");
    try {
      await posApi.createCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
      });
      setDialog(null);
      setCategoryForm({ name: "", description: "" });
      await loadMenu();
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setBusyId("");
    }
  }

  async function toggleAvailability(item: MenuItem) {
    setBusyId(item.id);
    setError("");
    try {
      await posApi.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      await loadMenu();
    } catch (actionError) {
      setError(messageFromError(actionError));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Menu"
        description="Manage categories, prices and availability for the items your team serves."
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("category")}>
              <BookOpen /> Add category
            </Button>
            <Button onClick={() => setDialog("item")}>
              <Plus /> Add menu item
            </Button>
          </>
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-3 py-1.5 font-medium">
              {items.length} items
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-700">
              {items.filter((item) => item.isAvailable).length} available
            </span>
            <span className="rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
              {categories.length} categories
            </span>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search menu"
              placeholder="Search menu…"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <LoadingState label="Loading menu…" />
        ) : visibleItems.length ? (
          <div className="divide-y">
            {visibleItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-5">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-14 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Utensils className="size-5" />
                  </span>
                )}
                <div className="min-w-37.5 flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category?.name ?? "Uncategorized"} · {item.preparationTimeMinutes} min
                  </p>
                </div>
                <span className="min-w-20 text-sm font-semibold">{money(item.price)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.isAvailable
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => void toggleAvailability(item)}
                >
                  {item.isAvailable ? "Mark unavailable" : <><Check /> Enable</>}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={items.length ? "No menu items match" : "Your menu is empty"}
            description={
              items.length
                ? "Try a different search term."
                : "Create a category, then add your first menu item."
            }
          />
        )}
      </Card>

      {dialog === "item" ? (
        <Dialog
          title="Add a menu item"
          description="Add an item to the menu available at the point of sale."
          size="lg"
          onClose={() => setDialog(null)}
        >
          <form onSubmit={createMenuItem} className="grid gap-4 sm:grid-cols-2">
            {error ? <ErrorMessage message={error} className="sm:col-span-2" /> : null}
            <Field label="Item name">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                minLength={2}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Price (INR)">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Preparation time (minutes)">
              <Input
                type="number"
                min={1}
                max={240}
                value={form.preparationTimeMinutes}
                onChange={(event) =>
                  setForm({ ...form, preparationTimeMinutes: event.target.value })
                }
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  maxLength={1000}
                  placeholder="Optional details for your team"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!categories.length || busyId === "item"}>
                {busyId === "item" ? "Saving…" : "Add menu item"}
              </Button>
            </div>
            {!categories.length ? (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Create a category before adding a menu item.
              </p>
            ) : null}
          </form>
        </Dialog>
      ) : null}

      {dialog === "category" ? (
        <Dialog
          title="Add a category"
          description="Group related items to make the point of sale easier to browse."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={createCategory} className="grid gap-4">
            {error ? <ErrorMessage message={error} /> : null}
            <Field label="Category name">
              <Input
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, name: event.target.value })
                }
                minLength={2}
                maxLength={60}
                required
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, description: event.target.value })
                }
                maxLength={500}
                placeholder="Optional"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busyId === "category"}>
                {busyId === "category" ? "Saving…" : "Add category"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
