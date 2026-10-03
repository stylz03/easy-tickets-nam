"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { authConfigured, browserSupabase } from "@/lib/supabase/client";
const AccountContext = createContext<{ user: User | null; loading: boolean; configured: boolean }>({ user: null, loading: true, configured: false });
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(authConfigured());
  useEffect(() => {
    if (!authConfigured()) return;
    const client = browserSupabase(); let active = true;
    client.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setLoading(false); } }).catch(() => { if (active) setLoading(false); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return <AccountContext.Provider value={{ user, loading, configured: authConfigured() }}>{children}</AccountContext.Provider>;
}
export const useAccount = () => useContext(AccountContext);
