import { useEffect, useRef } from "react";
import { migrateBrandPreferences } from "@/lib/brand-preferences";
import { useAroha } from "@/context/aroha";
import { useAuth } from "@/hooks/use-auth";
import { reminders as reminderSeed } from "@/data/mock";
import {
  ensureNotificationWorker,
  notificationPermission,
  showSystemNotification,
  vibrate,
} from "@/lib/notifications";

const FIRED_KEY = "aroha:fired-notifications";
/** Minutes before a block starts that the heads-up fires. */
const LEAD_MINUTES = 10;

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readFired(): Set<string> {
  try {
    migrateBrandPreferences();
    const raw = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}") as {
      date?: string;
      keys?: string[];
    };
    if (raw.date !== todayIso()) return new Set();
    return new Set(raw.keys ?? []);
  } catch {
    return new Set();
  }
}

function writeFired(keys: Set<string>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: todayIso(), keys: [...keys] }));
  } catch {
    /* storage unavailable */
  }
}

function minutesOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Delivers AROHA alerts to the Android notification shade while the app is
 * open or backgrounded on the device. Renders nothing.
 */
export function NotificationScheduler() {
  const { schedule, selectedDate } = useAroha();
  const { profile } = useAuth();
  const stateRef = useRef({ schedule, selectedDate, profile });
  stateRef.current = { schedule, selectedDate, profile };

  useEffect(() => {
    if (notificationPermission() === "granted") void ensureNotificationWorker();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      const { schedule: blocks, selectedDate: date, profile: p } = stateRef.current;
      if (!p?.reminders_enabled && !p?.push_enabled) return;
      if (notificationPermission() !== "granted") return;
      if (p?.focus_mode_enabled) return;

      const fired = readFired();
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const haptics = p?.haptics_enabled ?? false;
      const queued: { key: string; title: string; body: string; url: string }[] = [];

      if (date === todayIso()) {
        for (const block of blocks) {
          if (block.completed) continue;
          const start = minutesOfDay(block.startTime);
          if (start === null) continue;
          const delta = start - nowMinutes;
          if (delta > LEAD_MINUTES || delta < 0) continue;
          const key = `block:${block.id}`;
          if (fired.has(key)) continue;
          queued.push({
            key,
            title: delta <= 0 ? `${block.title} starts now` : `${block.title} in ${delta} min`,
            body: block.description || `${block.startTime} — ${block.endTime} · ${block.priority} priority`,
            url: `/schedule?date=${date}&block=${block.id}`,
          });
        }
      }

      if (p?.reminders_enabled) {
        for (const reminder of reminderSeed) {
          if (!reminder.enabled) continue;
          const at = minutesOfDay(reminder.time);
          if (at === null) continue;
          const delta = nowMinutes - at;
          if (delta < 0 || delta > 5) continue;
          const key = `reminder:${reminder.id}`;
          if (fired.has(key)) continue;
          queued.push({
            key,
            title: reminder.title,
            body: `Scheduled nudge · ${reminder.repeat}`,
            url: `/reminders?reminder=${reminder.id}`,
          });
        }
      }

      for (const item of queued) {
        const delivered = await showSystemNotification({
          title: item.title,
          body: item.body,
          tag: item.key,
          url: item.url,
          vibrate: haptics,
        });
        if (delivered) {
          if (haptics) vibrate([60, 40, 60]);
          fired.add(item.key);
        }
      }
      if (queued.length) writeFired(fired);
    }

    void tick();
    const id = setInterval(() => void tick(), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
