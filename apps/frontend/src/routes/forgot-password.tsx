import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Mail, SendHorizonal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import mark from "@/assets/aroha-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot Password — AROHA" }],
  }),
  component: ForgotPassword,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please try again in a few minutes.");
        return;
      }

      // We always show success to avoid revealing if an email exists
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Only show non-existence-revealing errors (e.g. validation)
        if (res.status === 400) {
          setError(data.message ?? "Please enter a valid email address.");
          return;
        }
      }

      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
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

        {sent ? (
          /* Success state */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="size-7 text-primary" strokeWidth={1.75} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>, we've
                sent a password reset link. It expires in 15 minutes.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Don't see it? Check your spam folder.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-2xl bg-surface"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Send another link
            </Button>
          </div>
        ) : (
          /* Form state */
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Forgot password?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aroha.app"
                  autoComplete="email"
                  disabled={busy}
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full gap-2 rounded-2xl"
              >
                {busy ? (
                  <Loader2 className="size-4.5 animate-spin" strokeWidth={1.75} />
                ) : (
                  <SendHorizonal className="size-4.5" strokeWidth={1.75} />
                )}
                {busy ? "Sending…" : "Send reset link"}
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
