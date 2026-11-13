import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "input-otp";
import { Loader2, MailCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import mark from "@/assets/aroha-mark.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search) => ({ email: (search.email as string) || "" }),
  head: () => ({
    meta: [{ title: "Verify Email — AROHA" }],
  }),
  component: VerifyEmail,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const RESEND_COOLDOWN = 60;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length <= 1 ? "*" : local[0] + "***";
  return `${masked}@${domain}`;
}

function VerifyEmail() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [attempts, setAttempts] = useState<{ current: number; max: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCountdown();
    return () => clearTimer();
  }, []);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startCountdown() {
    clearTimer();
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function submitOtp(value: string) {
    if (value.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.attempts) {
          setAttempts({ current: data.attempts.current, max: data.attempts.max });
        }
        setError(data.message ?? "Verification failed. Please try again.");
        setOtp("");
        return;
      }
      toast.success("Email verified!");
      void navigate({ to: "/home" });
    } catch {
      setError("Network error. Please check your connection.");
      setOtp("");
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setResendBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Failed to resend code.");
        return;
      }
      toast.success("New code sent! Check your inbox.");
      setOtp("");
      setAttempts(null);
      startCountdown();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResendBusy(false);
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

        {/* Card */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <MailCheck className="size-7 text-primary" strokeWidth={1.75} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-foreground">Verify your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email ? maskEmail(email) : "your email"}</span>.
            </p>
            <p className="text-xs text-muted-foreground/70">Enter it below to continue.</p>
          </div>

          {/* OTP Input */}
          <div className="flex flex-col items-center gap-3">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (value.length === 6) void submitOtp(value);
              }}
              disabled={busy}
              className="gap-2"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="size-12 rounded-xl border-border text-lg font-semibold"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {busy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                Verifying…
              </div>
            )}

            {error && (
              <p className="max-w-xs text-center text-xs text-destructive">{error}</p>
            )}

            {attempts && (
              <p className="text-xs text-muted-foreground/70">
                Attempt {attempts.current} of {attempts.max}
              </p>
            )}
          </div>

          {/* Resend */}
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={countdown > 0 || resendBusy}
              onClick={resendOtp}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {resendBusy ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                  Sending…
                </span>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                "Resend code"
              )}
            </Button>
          </div>
        </div>

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
