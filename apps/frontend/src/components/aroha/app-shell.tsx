import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  CloudCog,
  Cog,
  Heart,
  Home,
  Menu,
  NotebookPen,
  Shield,
  Target,
  Timer,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/aroha/auth-gate";

const bottomNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/analytics", label: "Analytics", icon: Activity },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const drawerNav = [
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/habits", label: "Habits", icon: CheckCircle2 },
  { to: "/coach", label: "AROHA AI", icon: Brain },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/health", label: "Health", icon: Heart },
  { to: "/level", label: "Level", icon: Shield },
  { to: "/achievements", label: "Achievements", icon: Award },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/sync", label: "Sync", icon: CloudCog },
  { to: "/settings", label: "Settings", icon: Cog },
] as const;

export function AppShell({
  children,
  title,
  right,
}: {
  children: ReactNode;
  title: string;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            >
              <Menu className="size-4.5" strokeWidth={1.75} />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-border bg-surface p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="flex items-center gap-2 text-left text-base tracking-[0.24em]">
                  AROHA
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {drawerNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    activeProps={{ className: "bg-primary-soft text-foreground" }}
                  >
                    <item.icon className="size-4.5" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <span className="flex-1 truncate text-sm font-semibold tracking-[0.14em] uppercase text-foreground">
            {title}
          </span>

          {right ?? (
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="size-4.5" strokeWidth={1.75} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </Link>
          )}
        </header>

        <main className="flex-1 px-4 pb-28 pt-5">
          <AuthGate>{children}</AuthGate>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border/70 bg-background/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl">
          <ul className="flex items-stretch justify-between">
            {bottomNav.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to} className="flex-1">
                  <Link
                    to={item.to}
                    className="flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5"
                  >
                    <span
                      className={cn(
                        "grid h-8 w-12 place-items-center rounded-full transition-colors duration-200",
                        active ? "bg-primary-soft text-primary" : "text-muted-foreground",
                      )}
                    >
                      <item.icon className="size-4.5" strokeWidth={1.75} />
                    </span>
                    <span
                      className={cn(
                        "text-[0.62rem] tracking-wide transition-colors",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
