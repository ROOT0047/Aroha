import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import mark from "@/assets/aroha-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search) => ({ token: (search.token as string) || "" }),
  head: () => ({
    meta: [{ title: "Reset Password — AROHA" }],
  }),
  component: ResetPassword,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
  match: boolean;
}

function getChecks(password: string, confirm: string): PasswordChecks {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(password),
    match: password.length > 0 && password === confirm,
  };
}

const CHECK_LABELS: Record<keyof PasswordChecks, string> = {
  length: "At least 8 characters",
  upper: "One uppercase letter",
  lower: "One lowercase letter",
  number: "One number",
  special: "One special character",
  match: "Passwords match",
};

function ResetPassword() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [tokenState, setTokenState] = useState<"loading" | "valid" | "invalid">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checks = getChecks(password, confirm);
  const allValid = Object.values(checks).every(Boolean);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }
    async function validate() {
      try {
        const res = await fetch(
          `${API_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
        );
        setTokenState(res.ok ? "valid" : "invalid");
      } catch {
        setTokenState("invalid");
      }
    }
    void validate();
  }, [token]);

  // Countdown after success
  useEffect(() => {
    if (!done) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          void navigate({ to: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [done, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Failed to reset password. The link may have expired.");
        return;
      }
      toast.success("Password changed!");
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full opacity-45 blur-[120px]"
        style={{ background: "var(--primary)" }}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-10 px-6 py-14">
        {/* Logo */}
        <div className="rise flex flex-col items-center text-center">
          <img
            src={mark}
            alt="AROHA logo"
            width={816}
            height={816}
            className="size-16 drop-shadow-[0_0_28px_oklch(0.618_0.207_288/0.55)]"
          />
          <h1 className="mt-6 text-3xl tracking-[0.28em] text-foreground">AROHA</h1>
        </div>

        {/* Loading */}
        {tokenState === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-8 animate-spin text-primary" strokeWidth={1.75} />
            <p className="text-sm text-muted-foreground">Validating your link…</p>
          </div>
        )}

        {/* Invalid / Expired */}
        {tokenState === "invalid" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
              <X className="size-7 text-destructive" strokeWidth={1.75} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Link Expired</h2>
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Links are valid for 15 minutes.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Request a new link
            </Link>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Check className="size-7 text-primary" strokeWidth={1.75} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Password changed!</h2>
              <p className="text-sm text-muted-foreground">
                Your password has been updated successfully.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Redirecting to sign in in {countdown}s…
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in now
            </Link>
          </div>
        )}

        {/* Reset form */}
        {tokenState === "valid" && !done && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <KeyRound className="size-7 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Reset password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a strong new password for your account.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs text-muted-foreground">
                  Confirm password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>

              {/* Strength checklist */}
              {password.length > 0 && (
                <ul className="space-y-1.5 rounded-xl border border-border bg-surface/50 p-3">
                  {(Object.keys(CHECK_LABELS) as Array<keyof PasswordChecks>).map((key) => (
                    <li key={key} className="flex items-center gap-2 text-xs">
                      {checks[key] ? (
                        <Check className="size-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      ) : (
                        <X className="size-3.5 shrink-0 text-muted-foreground/50" strokeWidth={2.5} />
                      )}
                      <span className={checks[key] ? "text-foreground" : "text-muted-foreground"}>
                        {CHECK_LABELS[key]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={busy || !allValid}
                className="h-12 w-full gap-2 rounded-2xl"
              >
                {busy ? (
                  <Loader2 className="size-4.5 animate-spin" strokeWidth={1.75} />
                ) : (
                  <KeyRound className="size-4.5" strokeWidth={1.75} />
                )}
                {busy ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
