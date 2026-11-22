import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent, type SVGProps } from "react";
import { toast } from "sonner";
import mark from "@/assets/aroha-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.35 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27a7.19 7.19 0 0 1 0-4.54V6.58H1.27a11.96 11.96 0 0 0 0 10.84l4.01-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.65 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AROHA — Your Personal Evolution System" },
      {
        name: "description",
        content:
          "Sign in to AROHA, the personal evolution system for schedule, habits, focus, health and AI coaching.",
      },
      { property: "og:title", content: "AROHA — Your Personal Evolution System" },
      {
        property: "og:description",
        content: "Sign in to AROHA, the personal evolution system for schedule, habits, focus, health and AI coaching.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-aroha.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-aroha.jpg" },
    ],
  }),
  component: Login,
});

function Login() {
  const { session, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "31361964168-7melvbf8mc0bfo1ovaol2jq2c2kuf341.apps.googleusercontent.com";
    if (!clientId || typeof window === "undefined") return;

    function initGsi() {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response.credential) return;
            setBusy(true);
            try {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
              });
              if (error) throw error;
              toast.success("Welcome back");
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : "Google sign-in failed");
            } finally {
              setBusy(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn("Failed to initialize Google Identity Services:", err);
      }
    }

    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    } else {
      initGsi();
    }
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.prompt(async (notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              try {
                await signInWithGoogle();
              } catch (err) {
                setBusy(false);
                toast.error(err instanceof Error ? err.message : "Google sign-in failed");
              }
            }
          });
        } else {
          await signInWithGoogle();
        }
      } catch (error) {
        setBusy(false);
        toast.error(error instanceof Error ? error.message : "Google sign-in failed");
      }
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full opacity-45 blur-[120px]"
          style={{ background: "var(--primary)" }}
        />
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-between gap-8 px-6 py-14">
          <div className="rise flex flex-col items-center justify-center pt-6 text-center">
            <img
              src={mark}
              alt="AROHA logo"
              width={816}
              height={816}
              className="size-16 drop-shadow-[0_0_28px_oklch(0.618_0.207_288/0.55)]"
            />
            <h1 className="mt-6 text-3xl tracking-[0.28em] text-foreground">AROHA</h1>
            <p className="mt-3 text-sm text-muted-foreground">Your Personal Evolution System.</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Master your habits. Master yourself.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs text-muted-foreground">
                  Display name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Kiyotaka"
                  autoComplete="name"
                />
              </div>
            )}
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
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            <Button type="submit" disabled={busy} className="h-12 w-full gap-2 rounded-2xl">
              {busy ? (
                <Loader2 className="size-4.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <Mail className="size-4.5" strokeWidth={1.75} />
              )}
              {mode === "signup" ? "Create account" : "Continue with Email"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onGoogle}
              className="h-12 w-full gap-2 rounded-2xl bg-surface"
            >
              {busy ? (
                <Loader2 className="size-4.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="w-full pt-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already enrolled? Sign in"}
            </button>
          </form>

          <section className="space-y-3 pb-4 text-center">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              A personal evolution system for your day
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              AROHA combines schedule planning, habit tracking, deep focus
              sessions, health monitoring, journaling and an AI coach in one
              app — so every day is planned, measured and improved.
            </p>
            <Link
              to="/aroha"
              className="inline-block text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              About AROHA
            </Link>
            <Link
              to="/features"
              className="inline-block text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              Explore the discipline app features
            </Link>
          </section>
        </div>
      </div>
    );
  }
