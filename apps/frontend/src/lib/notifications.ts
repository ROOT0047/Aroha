/**
 * Android/system notification helpers.
 *
 * Android Chrome refuses `new Notification()` and requires
 * ServiceWorkerRegistration.showNotification(), so we register a tiny
 * notification-only worker (no fetch handler, no caching) on demand.
 */

const SW_URL = "/notifications-sw.js";

export type NotificationSupport = "supported" | "unsupported" | "insecure";

function inIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function notificationSupport(): NotificationSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (!window.isSecureContext) return "insecure";
  return "supported";
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (notificationSupport() !== "supported") return "unsupported";
  return Notification.permission;
}

let registration: ServiceWorkerRegistration | null = null;

export async function ensureNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  if (notificationSupport() !== "supported") return null;
  // Never register inside the editor preview iframe.
  if (inIframe()) return null;
  if (registration) return registration;
  try {
    registration =
      (await navigator.serviceWorker.getRegistration(SW_URL)) ??
      (await navigator.serviceWorker.register(SW_URL, { scope: "/" }));
    await navigator.serviceWorker.ready.catch(() => undefined);
    return registration;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (notificationSupport() !== "supported") return "unsupported";
  const result = await Notification.requestPermission();
  if (result === "granted") await ensureNotificationWorker();
  return result;
}

export type ArohaNotification = {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
  /** Vibrate on delivery (respects the account haptics preference). */
  vibrate?: boolean;
  silent?: boolean;
};

export async function showSystemNotification(input: ArohaNotification): Promise<boolean> {
  if (notificationPermission() !== "granted") return false;
  const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    ...(input.body ? { body: input.body } : {}),
    tag: input.tag ?? `aroha-${Date.now()}`,
    icon: "/app-icon-192.png",
    badge: "/app-icon-192.png",
    data: { url: input.url ?? "/home" },
    silent: input.silent ?? false,
    renotify: false,
  };
  if (input.vibrate) options.vibrate = [60, 40, 60];

  const reg = await ensureNotificationWorker();
  if (reg) {
    await reg.showNotification(input.title, options);
    return true;
  }
  try {
    // Desktop fallback when no worker is available.
    new Notification(input.title, options);
    return true;
  } catch {
    return false;
  }
}

export function vibrate(pattern: number | number[] = 30) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

/** True when running as an installed (standalone) app. */
export function isInstalledApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
