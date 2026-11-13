import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading, SectionHeader } from "@/components/aroha/primitives";
import { Switch } from "@/components/ui/switch";
import { useAuth, type PreferenceKey } from "@/hooks/use-auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AROHA" },
      { name: "description", content: "Theme, notifications, privacy and account preferences for AROHA." },
      { property: "og:title", content: "Settings — AROHA" },
      { property: "og:description", content: "Theme, notifications and privacy preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const toggles = [
  { id: "reminders_enabled", label: "Reminders", detail: "Scheduled nudges for blocks and habits" },
  { id: "push_enabled", label: "Push notifications", detail: "Streaks, sessions and reviews" },
  { id: "voice_alerts_enabled", label: "Voice alerts", detail: "Spoken reminders for key blocks" },
  { id: "focus_mode_enabled", label: "Focus mode", detail: "Silence alerts during deep work" },
  { id: "haptics_enabled", label: "Haptics", detail: "Feedback on completion" },
  {
    id: "journal_lock_enabled",
    label: "Private journal lock",
    detail: "Require unlock to open entries",
  },
] as const satisfies ReadonlyArray<{ id: PreferenceKey; label: string; detail: string }>;

function SettingsPage() {
  const { user, profile, updatePreference } = useAuth();

  async function onToggle(key: PreferenceKey, value: boolean) {
    try {
      await updatePreference(key, value);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preference");
    }
  }

  return (
    <AppShell title="Settings">
      <PageHeading title="Settings" subtitle={profile?.timezone ?? "UTC"} />

      <SectionHeader title="Preferences" />
      <ul className="card-surface divide-y divide-border overflow-hidden">
        {toggles.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{t.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.detail}</p>
            </div>
            <Switch
              checked={profile?.[t.id] ?? false}
              disabled={!profile}
              aria-label={t.label}
              onCheckedChange={(v) => void onToggle(t.id, v)}
            />
          </li>
        ))}
      </ul>
      <Link
        to="/profile/edit"
        className="mt-2 block text-center text-xs text-primary transition-opacity hover:opacity-80"
      >
        Edit name, avatar and timezone
      </Link>

      <SectionHeader title="Account" className="mt-6" />
      <div className="card-surface divide-y divide-border overflow-hidden text-sm">
        <p className="flex items-center justify-between px-4 py-3.5">
          <span className="text-muted-foreground">Email</span>
          <span className="text-foreground">{user?.email}</span>
        </p>
        <p className="flex items-center justify-between px-4 py-3.5">
          <span className="text-muted-foreground">Theme</span>
          <span className="text-foreground">Tactical Dark</span>
        </p>
        <p className="flex items-center justify-between px-4 py-3.5">
          <span className="text-muted-foreground">Version</span>
          <span className="num text-foreground">0.1.0</span>
        </p>
      </div>
    </AppShell>
  );
}
