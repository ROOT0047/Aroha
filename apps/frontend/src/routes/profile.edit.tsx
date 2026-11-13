import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading, SectionHeader } from "@/components/aroha/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import mark from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit profile — AROHA" },
      {
        name: "description",
        content: "Update your display name, avatar, timezone and reminder preferences in AROHA.",
      },
      { property: "og:title", content: "Edit profile — AROHA" },
      { property: "og:description", content: "Update your display name, avatar and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditProfilePage,
});

const schema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, { message: "Display name must be at least 2 characters" })
    .max(50, { message: "Display name must be under 50 characters" }),
  timezone: z.string().trim().min(1).max(64),
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const prefFields = [
  { key: "reminders_enabled", label: "Reminders", detail: "Scheduled nudges for blocks and habits" },
  { key: "push_enabled", label: "Push notifications", detail: "Streaks, sessions and reviews" },
  { key: "voice_alerts_enabled", label: "Voice alerts", detail: "Spoken reminders for key blocks" },
  { key: "focus_mode_enabled", label: "Focus mode", detail: "Silence alerts during deep work" },
  { key: "haptics_enabled", label: "Haptics", detail: "Feedback on completion" },
  { key: "journal_lock_enabled", label: "Private journal lock", detail: "Require unlock to open entries" },
] as const;

type PrefKey = (typeof prefFields)[number]["key"];

function EditProfilePage() {
  const { user, profile, avatarSrc, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    reminders_enabled: true,
    push_enabled: true,
    voice_alerts_enabled: true,
    focus_mode_enabled: true,
    haptics_enabled: true,
    journal_lock_enabled: false,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    // Initialize once per account so an avatar refresh never wipes unsaved edits.
    if (!profile || initializedFor.current === profile.id) return;
    initializedFor.current = profile.id;
    setDisplayName(profile.display_name ?? "");
    setTimezone(profile.timezone || "UTC");
    setPrefs({
      reminders_enabled: profile.reminders_enabled,
      push_enabled: profile.push_enabled,
      voice_alerts_enabled: profile.voice_alerts_enabled,
      focus_mode_enabled: profile.focus_mode_enabled,
      haptics_enabled: profile.haptics_enabled,
      journal_lock_enabled: profile.journal_lock_enabled,
    });
  }, [profile]);

  async function onAvatarChange(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (error) throw error;

      setPreview(URL.createObjectURL(file));
      await refreshProfile();
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user) return;
    setUploading(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPreview(null);
    await refreshProfile();
    toast.success("Avatar removed");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ display_name: displayName, timezone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...parsed.data, ...prefs })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
    void navigate({ to: "/profile" });
  }

  const shown = preview ?? avatarSrc ?? mark;

  return (
    <AppShell title="Edit profile">
      <PageHeading title="Edit profile" subtitle="Identity and preferences" />

      <form onSubmit={onSubmit}>
        <section className="card-surface flex items-center gap-4 px-4 py-4">
          <img src={shown} alt="Your avatar" className="size-16 rounded-2xl object-cover" />
          <div className="flex flex-1 flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Camera className="size-4" strokeWidth={1.75} />
              )}
              Change avatar
            </Button>
            {profile?.avatar_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={removeAvatar}
                className="gap-2 text-muted-foreground"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
                Remove
              </Button>
            ) : null}
            <p className="text-[0.68rem] text-muted-foreground">PNG or JPG, up to 2MB.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onAvatarChange(file);
            }}
          />
        </section>

        <SectionHeader title="Details" className="mt-6" />
        <div className="card-surface space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name" className="text-xs text-muted-foreground">
              Display name
            </Label>
            <Input
              id="display_name"
              value={displayName}
              maxLength={50}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-xs text-muted-foreground">
              Timezone
            </Label>
            <Input
              id="timezone"
              value={timezone}
              maxLength={64}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Europe/Istanbul"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Signed in as <span className="text-foreground">{user?.email}</span>
          </p>
        </div>

        <SectionHeader title="Preferences" className="mt-6" />
        <ul className="card-surface divide-y divide-border overflow-hidden">
          {prefFields.map((field) => (
            <li key={field.key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{field.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{field.detail}</p>
              </div>
              <Switch
                checked={prefs[field.key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [field.key]: v }))}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-2">
          <Button type="submit" disabled={saving} className="h-12 flex-1 gap-2 rounded-2xl">
            {saving ? <Loader2 className="size-4 animate-spin" strokeWidth={1.75} /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => void navigate({ to: "/profile" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </AppShell>
  );
}