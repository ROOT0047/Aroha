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
import type { Session } from "@supabase/supabase-js";

export type { Profile, PreferenceKey, AuthState } from "@/hooks/auth-context";
export { authDebug, isAuthDebugEnabled, setAuthDebugEnabled } from "@/hooks/auth-context";

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

  useEffect(() => {
    authDebug("AuthProvider mounted");
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      authDebug("auth state change", { event: _event, hasSession: !!next });
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      authDebug("initial getSession", { hasSession: !!data.session });
      setSession(data.session);
      setLoading(false);
    });
    return () => {
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
    authDebug("profile loaded", { userId, found: !!data });
    setProfile(data ?? null);

    const path = data?.avatar_url ?? null;
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
  }, [userId]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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