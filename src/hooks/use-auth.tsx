import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  refreshProfile: async () => { },
  updatePreference: async () => { },
  signOut: async () => {
    await supabase.auth.signOut();
  },
  signInWithGoogle: async () => { },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const activeUser = useRef<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authDebug("AuthProvider mounted");
    let alive = true;
    let receivedEvent = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      receivedEvent = true;
      if (!alive) return;
      if (activeUser.current !== (next?.user.id ?? null)) {
        activeUser.current = next?.user.id ?? null;
        setProfile(null);
        setAvatarSrc(null);
        queryClient.clear();
      }
      authDebug("auth state change", { event: _event, hasSession: !!next });
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || receivedEvent) return;
      if (error) toast.error("Could not restore your session. Please sign in again.");
      activeUser.current = data.session?.user.id ?? null;
      authDebug("initial getSession", { hasSession: !!data.session });
      setSession(data.session);
      setLoading(false);
    }).catch(() => { if (alive) setLoading(false); });
    return () => {
      alive = false;
      authDebug("AuthProvider unmounted (hot-reload or navigation)");
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setAvatarSrc(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, timezone, push_enabled, voice_alerts_enabled, haptics_enabled, journal_lock_enabled, reminders_enabled, focus_mode_enabled",
      )
      .eq("id", userId)
      .maybeSingle();
    if (activeUser.current !== userId) return;
    if (error) throw error;
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
      if (activeUser.current !== userId) return;
      setAvatarSrc(signed?.signedUrl ?? null);
    }
  }, [userId]);

  useEffect(() => {
    void refreshProfile().catch(() => toast.error("Could not load your profile. Please try again."));
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setAvatarSrc(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) throw error;
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
      signInWithGoogle,
    }),
    [session, profile, avatarSrc, loading, refreshProfile, updatePreference, signOut, signInWithGoogle],
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