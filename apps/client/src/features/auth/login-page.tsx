import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { messageFromError } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import heroMark from "@/assets/hero.png";

export function LoginPage() {
  const { user, login, loginAsDemo, initializationError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname;
      navigate(from || "/", { replace: true });
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setSubmitting(true);
    try {
      await loginAsDemo();
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#17241d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-32 size-130 rounded-full border border-white/10" />
        <div className="absolute -right-12 -top-8 size-90 rounded-full border border-white/10" />
        <Brand />
        <div className="relative z-10 max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Your café, in good flow
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-[1.08] tracking-tight">
            Make every
            <br />
            service feel
            <br />
            <span className="text-primary">effortless.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            Orders, tables, kitchen tickets and billing — one calm workspace for your whole team.
          </p>
        </div>
        <p className="text-xs text-white/45">Cloud Café POS · Built for better service</p>
      </section>
      <section className="grid place-items-center bg-background px-5 py-10 sm:px-10">
        <div className="w-full max-w-102.5">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={heroMark} alt="" className="size-11 rounded-xl bg-white p-1 object-contain" />
            <span className="font-heading font-bold">Cloud Café</span>
          </div>
          <p className="text-sm font-semibold text-primary">WELCOME BACK</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your staff email and password to continue.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            {initializationError ? (
              <ErrorMessage message={initializationError} />
            ) : null}
            {error ? <ErrorMessage message={error} /> : null}
            <Field label="Email address">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@cafe.com"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </Field>
            <Button type="submit" className="mt-1 w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting ? <ArrowRight /> : null}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={submitting}
              onClick={handleDemoLogin}
            >
              Login as guest demo
            </Button>
          </form>
          <p className="mt-7 text-center text-sm text-muted-foreground">
            Setting up your café for the first time?{" "}
            <Link to="/setup" className="font-semibold text-primary hover:underline">
              Create owner account
            </Link>
          </p>
          <div className="mt-12 border-t pt-5 text-center text-xs text-muted-foreground">
            Secure access for authorized café staff only
          </div>
        </div>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src={heroMark} alt="" className="size-11 rounded-xl bg-white p-1 object-contain" />
      <div>
        <p className="font-heading text-base font-bold">Cloud Café</p>
        <p className="text-xs text-white/55">Point of sale</p>
      </div>
    </div>
  );
}
