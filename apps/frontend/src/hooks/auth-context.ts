import { createContext } from "react";
import { migrateBrandPreferences } from "@/lib/brand-preferences";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  push_enabled: boolean;
  voice_alerts_enabled: boolean;
  haptics_enabled: boolean;
  journal_lock_enabled: boolean;
  reminders_enabled: boolean;
  focus_mode_enabled: boolean;
};

export type PreferenceKey =
  | "push_enabled"
  | "voice_alerts_enabled"
  | "haptics_enabled"
  | "journal_lock_enabled"
  | "reminders_enabled"
  | "focus_mode_enabled";

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Displayable (signed) URL for the stored avatar, if any. */
  avatarSrc: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updatePreference: (key: PreferenceKey, value: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

/**
 * The context object is cached on globalThis so a hot-reload of the provider
 * module reuses the exact same context instance. Without this, HMR creates a
 * fresh context while mounted consumers still read the old one, which makes
 * `useAuth` see `null` and blanks routes like the login screen.
 */
const KEY = "__aroha_auth_context__";
const globalStore = globalThis as typeof globalThis & {
  [KEY]?: ReturnType<typeof createContext<AuthState | null>>;
};

export const AuthContext =
  globalStore[KEY] ?? (globalStore[KEY] = createContext<AuthState | null>(null));

/**
 * Developer-only debug logging.
 * Enable in the browser console with:  __arohaAuthDebug(true)
 * (persists in localStorage under "aroha:auth-debug"). Off by default and
 * fully inert in production builds.
 */
const DEBUG_STORAGE_KEY = "aroha:auth-debug";

const debugStore = globalThis as typeof globalThis & {
  __arohaAuthDebugEnabled?: boolean;
  __arohaAuthDebug?: (on?: boolean) => boolean;
};

export function isAuthDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof debugStore.__arohaAuthDebugEnabled === "boolean") {
    return debugStore.__arohaAuthDebugEnabled;
  }
  try {
    migrateBrandPreferences();
    const stored = globalThis.localStorage?.getItem(DEBUG_STORAGE_KEY) === "1";
    debugStore.__arohaAuthDebugEnabled = stored;
    return stored;
  } catch {
    return false;
  }
}

export function setAuthDebugEnabled(on: boolean): boolean {
  debugStore.__arohaAuthDebugEnabled = on;
  try {
    if (on) globalThis.localStorage?.setItem(DEBUG_STORAGE_KEY, "1");
    else globalThis.localStorage?.removeItem(DEBUG_STORAGE_KEY);
  } catch {
    /* storage unavailable — in-memory toggle still applies */
  }
  return on;
}

/** No-op unless debug logging is switched on in a dev build. */
export function authDebug(message: string, ...details: unknown[]) {
  if (!isAuthDebugEnabled()) return;
  console.info(`[auth] ${message}`, ...details);
}

if (import.meta.env.DEV && !debugStore.__arohaAuthDebug) {
  debugStore.__arohaAuthDebug = (on = true) => setAuthDebugEnabled(on);
}