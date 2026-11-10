import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { messageFromError } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import heroMark from "@/assets/hero.png";

export function SetupPage() {
  const { user, setupOwner } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    setupSecret: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await setupOwner(form);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm sm:p-9">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <img src={heroMark} alt="" className="size-11 rounded-xl bg-white p-1 object-contain" />
          <div>
            <p className="font-heading font-bold">Cloud Café</p>
            <p className="text-xs text-muted-foreground">Initial setup</p>
          </div>
        </div>
        <h1 className="mt-7 font-heading text-3xl font-semibold">Create owner account</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This one-time setup requires the secret configured in the server environment.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {error ? <ErrorMessage message={error} /> : null}
          <Field label="Owner name">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              minLength={2}
              maxLength={100}
              required
            />
          </Field>
          <Field label="Email address">
            <Input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </Field>
          <Field label="Password" hint="Use at least 8 characters.">
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
          <Field label="Owner setup secret">
            <Input
              type="password"
              autoComplete="off"
              value={form.setupSecret}
              onChange={(event) =>
                setForm({ ...form, setupSecret: event.target.value })
              }
              minLength={32}
              required
            />
          </Field>
          <Button type="submit" className="mt-2 w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create owner account"}
          </Button>
        </form>
      </section>
    </main>
  );
}
