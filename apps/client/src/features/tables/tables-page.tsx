import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Armchair, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorMessage, LoadingState, StatusBadge } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { messageFromError } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import { useCurrentRole } from "@/stores/auth-store";
import type { DiningTable, TableStatus } from "@/types/domain";

export function TablesPage() {
  const role = useCurrentRole();
  const canManage = role === "OWNER" || role === "MANAGER";
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedSection, setSelectedSection] = useState("All tables");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    tableNumber: "",
    name: "",
    capacity: "2",
    section: "",
    type: "AC" as "AC" | "NON_AC",
  });

  const loadTables = useCallback(async () => {
    setError("");
    try {
      setTables(await posApi.tables());
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  const sections = [
    "All tables",
    ...new Set(tables.map((table) => table.section?.trim() || "Main floor")),
  ];
  const visibleTables =
    selectedSection === "All tables"
      ? tables
      : tables.filter(
          (table) => (table.section?.trim() || "Main floor") === selectedSection,
        );
  const selectedTable = tables.find((table) => table.id === selectedTableId);

  async function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setError("");
    try {
      await posApi.createTable({
        ...form,
        capacity: Number(form.capacity),
        name: form.name || undefined,
        section: form.section || undefined,
      });
      setDialogOpen(false);
      setForm({ tableNumber: "", name: "", capacity: "2", section: "", type: "AC" });
      await loadTables();
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setBusyId("");
    }
  }

  async function changeStatus(table: DiningTable, status: TableStatus) {
    if (!["AVAILABLE", "RESERVED", "OUT_OF_SERVICE"].includes(status)) return;
    setBusyId(table.id);
    setError("");
    try {
      await posApi.updateTableStatus(
        table.id,
        status as "AVAILABLE" | "RESERVED" | "OUT_OF_SERVICE",
      );
      await loadTables();
    } catch (actionError) {
      setError(messageFromError(actionError));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Floor management"
        title="Tables"
        description="Manage the floor and keep availability up to date for your service team."
        actions={
          canManage ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus /> Add table
            </Button>
          ) : undefined
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      {loading ? (
        <LoadingState label="Loading tables…" />
      ) : tables.length ? (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <FloorMetric label="Total tables" value={tables.length} />
            <FloorMetric
              label="Available"
              value={tables.filter((table) => table.status === "AVAILABLE").length}
            />
            <FloorMetric
              label="Occupied"
              value={tables.filter((table) => table.status === "OCCUPIED").length}
            />
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {sections.map((section) => (
              <Button
                key={section}
                size="sm"
                variant={selectedSection === section ? "default" : "outline"}
                onClick={() => setSelectedSection(section)}
              >
                {section}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 rounded-2xl border bg-card/40 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {visibleTables.map((table) => {
              const isSelected = selectedTableId === table.id;
              const tone =
                table.status === "AVAILABLE"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15"
                  : table.status === "OCCUPIED"
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-800 hover:bg-sky-500/15"
                    : table.status === "RESERVED"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/15"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted";

              return (
                <button
                  key={table.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`min-h-32 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  } ${tone}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Armchair aria-hidden="true" className="size-5" />
                    <StatusBadge status={table.status} />
                  </div>
                  <p className="mt-4 font-heading text-lg font-semibold">
                    {table.name || `Table ${table.tableNumber}`}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                    <Users aria-hidden="true" className="size-3.5" />
                    {table.capacity} seats
                  </p>
                </button>
              );
            })}
          </div>
          {selectedTable ? (
            <Card className="mt-5">
              <CardHeader className="flex-row items-center justify-between gap-4 pb-3">
                <div>
                  <h3 className="font-heading text-lg font-semibold">
                    {selectedTable.name || `Table ${selectedTable.tableNumber}`}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTable.section || "Main floor"} · {selectedTable.type === "AC" ? "Air conditioned" : "Non-AC"} · {selectedTable.capacity} seats
                  </p>
                </div>
                <StatusBadge status={selectedTable.status} />
              </CardHeader>
              {canManage ? (
                <CardContent>
                  <label className="grid max-w-sm gap-1.5 text-xs font-medium text-muted-foreground">
                    Update availability
                    <Select
                      value={selectedTable.status}
                      disabled={busyId === selectedTable.id || selectedTable.status === "OCCUPIED"}
                      onChange={(event) =>
                        void changeStatus(selectedTable, event.target.value as TableStatus)
                      }
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="OUT_OF_SERVICE">Out of service</option>
                      {selectedTable.status === "OCCUPIED" ? (
                        <option value="OCCUPIED">Occupied</option>
                      ) : null}
                    </Select>
                  </label>
                  {selectedTable.status === "OCCUPIED" ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      An open order controls this table’s availability.
                    </p>
                  ) : null}
                </CardContent>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <EmptyState
            title="No tables yet"
            description={
              canManage
                ? "Add your dining tables to start taking orders."
                : "Ask your owner or manager to set up the dining floor."
            }
          />
        </Card>
      )}
      {dialogOpen ? (
        <Dialog
          title="Add a table"
          description="Add a new place to your floor plan."
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={createTable} className="grid gap-4">
            {error ? <ErrorMessage message={error} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Table number">
                <Input
                  value={form.tableNumber}
                  onChange={(event) => setForm({ ...form, tableNumber: event.target.value })}
                  maxLength={20}
                  required
                />
              </Field>
              <Field label="Display name">
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  maxLength={60}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Capacity">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.capacity}
                  onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                  required
                />
              </Field>
              <Field label="Section">
                <Input
                  value={form.section}
                  onChange={(event) => setForm({ ...form, section: event.target.value })}
                  maxLength={60}
                  placeholder="Main floor"
                />
              </Field>
            </div>
            <Field label="Table type">
              <Select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as "AC" | "NON_AC" })
                }
              >
                <option value="AC">Air conditioned</option>
                <option value="NON_AC">Non-AC</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busyId === "create"}>
                {busyId === "create" ? "Adding…" : "Add table"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}

function FloorMetric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
