/** Legacy names appear only here to preserve existing device preferences. */
const LEGACY_PREFERENCES = [
  ["ascend:auth-debug", "aroha:auth-debug"],
  ["ascend:fired-notifications", "aroha:fired-notifications"],
] as const;

export function migrateBrandPreferences(): void {
  if (typeof window === "undefined") return;
  try {
    for (const [legacyKey, key] of LEGACY_PREFERENCES) {
      const value = window.localStorage.getItem(legacyKey);
      if (value === null) continue;
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, value);
      }
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    // Restricted storage must not interrupt sign-in or notifications.
  }
}
