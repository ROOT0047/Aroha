import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading } from "@/components/aroha/primitives";
import { NotificationPermissionCard } from "@/components/aroha/notification-permission-card";
import { notifications } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — AROHA" },
      { name: "description", content: "Streak warnings, session reminders and weekly review alerts." },
      { property: "og:title", content: "Notifications — AROHA" },
      { property: "og:description", content: "Streak warnings and review alerts in one feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <AppShell title="Notifications">
      <PageHeading title="Alerts" />
      <div className="mb-4">
        <NotificationPermissionCard />
      </div>
      <ul className="space-y-2.5">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={cn("card-surface flex items-start gap-3 px-4 py-3.5", n.read && "opacity-60")}
          >
            <Bell className="mt-0.5 size-4 text-primary" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-foreground">{n.title}</p>
              <p className="num mt-1 text-[0.68rem] text-muted-foreground">{n.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
