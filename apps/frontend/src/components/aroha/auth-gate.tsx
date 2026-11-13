import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

/** Client-side gate: every in-app screen requires a signed-in session. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">LOADING…</p>
      </div>
    );
  }

  return <>{children}</>;
}