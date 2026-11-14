import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AuthContext,
  authDebug,
  type AuthState,
  type PreferenceKey,
  type Profile,
} from "@/hooks/auth-context";
import type { Session, User } from "@supabase/supabase-js";

export type { Profile, PreferenceKey, AuthState } from "@/hooks/auth-context";
export { authDebug, isAuthDebugEnabled, setAuthDebugEnabled } from "@/hooks/auth-context";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** Safe fallback so a transient missing provider (e.g. dev HMR) never blanks the app. */
const fallbackAuth: AuthState = {
  session: null,
  user: null,
  profile: null,
  avatarSrc: null,
  loading: true,
  refreshProfile: async () => {},
  updatePreference: async () => {},
  signOut: async () => {
    await supabase.auth.signOut();
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check both Supabase and custom backend session
  useEffect(() => {
    let mounted = true;
    authDebug("AuthProvider mounted");

    const checkBackendSession = async (): Promise<Session | null> => {
      try {
        const token = localStorage.getItem("aroha_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const fakeUser: Partial<User> = {
              id: data.user.id,
              email: data.user.email,
              app_metadata: {},
              user_metadata: { display_name: data.user.displayName },
              aud: "authenticated",
              created_at: data.user.createdAt,
            };
            return {
              access_token: token || "",
              refresh_token: "",
              expires_in: 3600,
              token_type: "bearer",
              user: fakeUser as User,
            };
          }
        }
      } catch {
        // Backend not reachable or unauthenticated
      }
      return null;
    };

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!mounted) return;
      authDebug("auth state change", { event: _event, hasSession: !!next });
      if (next) {
        setSession(next);
        setLoading(false);
      } else {
        const backendSession = await checkBackendSession();
        if (mounted) {
          setSession(backendSession);
          setLoading(false);
        }
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      authDebug("initial getSession", { hasSession: !!data.session });
      if (data.session) {
        setSession(data.session);
        setLoading(false);
      } else {
        const backendSession = await checkBackendSession();
        if (mounted) {
          setSession(backendSession);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authDebug("AuthProvider unmounted (hot-reload or navigation)");
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setAvatarSrc(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, timezone, push_enabled, voice_alerts_enabled, haptics_enabled, journal_lock_enabled, reminders_enabled, focus_mode_enabled",
      )
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      authDebug("profile loaded", { userId, found: true });
      setProfile(data);
      const path = data.avatar_url ?? null;
      if (!path) {
        setAvatarSrc(null);
      } else if (path.startsWith("http")) {
        setAvatarSrc(path);
      } else {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(path, 60 * 60);
        setAvatarSrc(signed?.signedUrl ?? null);
      }
    } else {
      // Fallback profile from session metadata
      setProfile({
        id: userId,
        display_name: session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0] || "User",
        avatar_url: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        push_enabled: false,
        voice_alerts_enabled: false,
        haptics_enabled: false,
        journal_lock_enabled: false,
        reminders_enabled: false,
        focus_mode_enabled: false,
      });
      setAvatarSrc(null);
    }
  }, [userId, session]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("aroha_token");
    setSession(null);
    setProfile(null);
    setAvatarSrc(null);
  }, []);

  const updatePreference = useCallback(
    async (key: PreferenceKey, value: boolean) => {
      if (!userId) return;
      const previous = profile;
      setProfile((p) => (p ? { ...p, [key]: value } : p));
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value } as Partial<Record<PreferenceKey, boolean>>)
        .eq("id", userId);
      if (error) {
        setProfile(previous);
        throw error;
      }
    },
    [userId, profile],
  );

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      avatarSrc,
      loading,
      refreshProfile,
      updatePreference,
      signOut,
    }),
    [session, profile, avatarSrc, loading, refreshProfile, updatePreference, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    authDebug(
      "useAuth called without a provider in the tree — using signed-out fallback",
    );
  }
  return ctx ?? fallbackAuth;
}
