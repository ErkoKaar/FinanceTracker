// useAuth hook: tracks the current Supabase session and exposes signIn/signOut. (Sign-ups are closed.)
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    []
  );

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "";

  const updateDisplayName = useCallback(async (name: string) => {
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: name } });
    if (!error && data.user) setUser(data.user);
  }, []);

  return { user, loading, signIn, signOut, displayName, updateDisplayName };
}
