import { BellRing, Check, Smartphone, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  isInstalledApp,
  notificationPermission,
  notificationSupport,
  requestNotificationPermission,
  showSystemNotification,
  vibrate,
} from "@/lib/notifications";
import { useAuth } from "@/hooks/use-auth";

type State = NotificationPermission | "unsupported";

/** Android system-notification permission + install status. */
export function NotificationPermissionCard() {
  const { profile } = useAuth();
  const [permission, setPermission] = useState<State>("default");
  const [support, setSupport] = useState<"supported" | "unsupported" | "insecure">("supported");
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupport(notificationSupport());
    setPermission(notificationPermission());
    setInstalled(isInstalledApp());
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const next = await requestNotificationPermission();
      setPermission(next);
      if (next === "granted") {
        await showSystemNotification({
          title: "AROHA alerts are live",
          body: "Blocks and nudges will now appear in your notification shade.",
          tag: "aroha-enabled",
          vibrate: profile?.haptics_enabled ?? false,
        });
        toast.success("System notifications enabled");
      } else if (next === "denied") {
        toast.error("Blocked — allow notifications for this site in your browser settings");
      }
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (profile?.haptics_enabled) vibrate([60, 40, 60]);
    const ok = await showSystemNotification({
      title: "Workout window opens in 10 minutes",
      body: "Test alert from AROHA.",
      tag: "aroha-test",
      url: "/schedule",
      vibrate: profile?.haptics_enabled ?? false,
    });
    if (!ok) toast.error("Could not post the notification");
  }

  if (support === "unsupported") {
    return (
      <div className="card-surface flex items-start gap-3 px-4 py-3.5">
        <TriangleAlert className="mt-0.5 size-4.5 text-warning" strokeWidth={1.75} />
        <p className="text-xs text-muted-foreground">
          This browser can't post system notifications. Open AROHA in Chrome on Android to get
          alerts in the notification shade.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface space-y-3 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-4.5 text-primary" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">System notifications</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {permission === "granted"
              ? "Alerts appear in your Android notification shade."
              : permission === "denied"
                ? "Blocked. Re-allow notifications for this site in browser settings."
                : "Allow AROHA to post alerts to your device."}
          </p>
        </div>
        {permission === "granted" ? (
          <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[0.68rem] text-primary">
            <Check className="size-3" strokeWidth={2.5} /> On
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        {permission !== "granted" ? (
          <button
            onClick={() => void enable()}
            disabled={busy || permission === "denied"}
            className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Requesting…" : "Enable on this device"}
          </button>
        ) : (
          <button
            onClick={() => void test()}
            className="flex-1 rounded-xl border border-border px-3 py-2 text-xs text-foreground transition-colors hover:bg-surface"
          >
            Send a test notification
          </button>
        )}
      </div>

      {!installed ? (
        <p className="flex items-start gap-2 text-[0.68rem] leading-relaxed text-muted-foreground">
          <Smartphone className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          For reliable delivery, install AROHA: open the browser menu and choose “Add to Home
          screen”.
        </p>
      ) : null}
    </div>
  );
}
