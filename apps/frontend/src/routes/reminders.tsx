import { createFileRoute } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading, SectionHeader } from "@/components/aroha/primitives";
import { NotificationPermissionCard } from "@/components/aroha/notification-permission-card";
import { Switch } from "@/components/ui/switch";
import { reminders as seed } from "@/data/mock";
import { useAuth, type PreferenceKey } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type RemindersSearch = { reminder?: string };

export const Route = createFileRoute("/reminders")({
  validateSearch: (search: Record<string, unknown>): RemindersSearch =>
    typeof search['reminder'] === "string" ? { reminder: search['reminder'] } : {},
  head: () => ({
    meta: [
      { title: "Reminders — AROHA" },
      { name: "description", content: "Smart wake-up, workout, hydration and journal reminders with voice alerts." },
      { property: "og:title", content: "Reminders — AROHA" },
      { property: "og:description", content: "Smart, voice-enabled nudges at the right hour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RemindersPage,
});

const channels = [
  { id: "reminders_enabled", label: "Reminders", detail: "Scheduled nudges for blocks and habits" },
  { id: "voice_alerts_enabled", label: "Voice alerts", detail: "Spoken reminders for key blocks" },
  { id: "focus_mode_enabled", label: "Focus mode", detail: "Silence alerts during deep work" },
] as const satisfies ReadonlyArray<{ id: PreferenceKey; label: string; detail: string }>;

function RemindersPage() {
  const [items, setItems] = useState(seed);
  const { profile, updatePreference } = useAuth();
  const { reminder: focusedId } = Route.useSearch();
  const focusRef = useRef<HTMLLIElement | null>(null);
  const remindersOn = profile?.reminders_enabled ?? false;
  const voiceOn = profile?.voice_alerts_enabled ?? false;

  useEffect(() => {
    if (focusedId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusedId]);

  async function onToggle(key: PreferenceKey, value: boolean) {
    try {
      await updatePreference(key, value);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preference");
    }
  }

  return (
    <AppShell title="Reminders">
      <PageHeading title="Nudges" subtitle="Alerts that protect the routine." />

      <SectionHeader title="Device" />
      <NotificationPermissionCard />

      <SectionHeader title="Delivery" className="mt-6" />
      <ul className="card-surface divide-y divide-border overflow-hidden">
        {channels.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{c.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>
            </div>
            <Switch
              checked={profile?.[c.id] ?? false}
              disabled={!profile}
              aria-label={c.label}
              onCheckedChange={(v) => void onToggle(c.id, v)}
            />
          </li>
        ))}
      </ul>

      <SectionHeader title="Schedule" className="mt-6" />
      <ul
        className={cn(
          "card-surface divide-y divide-border overflow-hidden transition-opacity",
          !remindersOn && "opacity-50",
        )}
      >
        {items.map((r) => (
          <li
            key={r.id}
            ref={focusedId === r.id ? focusRef : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5",
              focusedId === r.id && "bg-primary-soft",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm text-foreground">
                {r.title}
                {r.voice && voiceOn ? (
                  <Mic className="size-3.5 text-primary" strokeWidth={1.75} />
                ) : null}
              </p>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {r.time} · {r.repeat}
              </p>
            </div>
            <Switch
              checked={remindersOn && r.enabled}
              disabled={!remindersOn}
              aria-label={r.title}
              onCheckedChange={(v) =>
                setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, enabled: v } : i)))
              }
            />
          </li>
        ))}
      </ul>
      {!remindersOn ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Reminders are off — turn them on above to receive these nudges.
        </p>
      ) : null}
    </AppShell>
  );
}
