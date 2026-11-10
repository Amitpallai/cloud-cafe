import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Mail, Plus, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { messageFromError } from "@/lib/format";
import { posApi } from "@/services/pos-api";
import { useAuthStore, useCurrentRole } from "@/stores/auth-store";
import type { StaffMember, UserRole } from "@/types/domain";

type StaffRole = Exclude<UserRole, "OWNER">;

export function StaffPage() {
  const currentUser = useAuthStore((state) => state.user);
  const role = useCurrentRole();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER" as StaffRole,
    employeeId: "",
    phone: "",
  });

  const loadStaff = useCallback(async () => {
    setError("");
    try {
      setStaff(await posApi.staff());
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setError("");
    try {
      await posApi.createStaff({
        ...form,
        employeeId: form.employeeId || undefined,
        phone: form.phone || undefined,
      });
      setDialogOpen(false);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "CASHIER",
        employeeId: "",
        phone: "",
      });
      await loadStaff();
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setBusyId("");
    }
  }

  async function toggleStatus(member: StaffMember) {
    setBusyId(member.id);
    setError("");
    try {
      await posApi.updateStaffStatus(member.id, !member.isActive);
      await loadStaff();
    } catch (actionError) {
      setError(messageFromError(actionError));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Invite staff and give each person the access their role needs."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Add team member
          </Button>
        }
      />
      {error ? <ErrorMessage message={error} className="mb-5" /> : null}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[minmax(170px,1.3fr)_minmax(150px,1fr)_130px_120px] gap-3 border-b bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Team member</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Access</span>
        </div>
        {loading ? (
          <LoadingState label="Loading team…" />
        ) : staff.length ? (
          <div className="divide-y">
            {staff.map((member) => (
              <div
                key={member.id}
                className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[minmax(170px,1.3fr)_minmax(150px,1fr)_130px_120px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {member.name}
                      {currentUser?.id === member.id ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="size-3.5" /> {member.email}
                    </p>
                  </div>
                </div>
                <div className="text-sm">{formatRole(member.role)}</div>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    member.isActive
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                <div className="text-right">
                  {role === "OWNER" && currentUser?.id !== member.id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === member.id}
                      onClick={() => void toggleStatus(member)}
                    >
                      {member.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheck className="size-3.5" /> Protected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No team members found"
            description="Add staff accounts so your team can sign in to the POS."
          />
        )}
      </Card>
      {dialogOpen ? (
        <Dialog
          title="Add a team member"
          description="Create a secure staff account. They can sign in with their email and password."
          size="lg"
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={createStaff} className="grid gap-4 sm:grid-cols-2">
            {error ? <ErrorMessage message={error} className="sm:col-span-2" /> : null}
            <Field label="Full name">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                minLength={2}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </Field>
            <Field label="Temporary password" hint="At least 8 characters.">
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                minLength={8}
                maxLength={72}
                required
              />
            </Field>
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as StaffRole })
                }
              >
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier</option>
                <option value="WAITER">Waiter</option>
                <option value="KITCHEN">Kitchen</option>
              </Select>
            </Field>
            <Field label="Employee ID">
              <Input
                value={form.employeeId}
                onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
                maxLength={50}
                placeholder="Optional"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={20}
                placeholder="Optional"
              />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busyId === "create"}>
                {busyId === "create" ? "Creating…" : "Create account"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}

function formatRole(role: UserRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
