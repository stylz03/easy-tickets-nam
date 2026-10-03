import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.NEXT_PUBLIC_EASY_TICKETS_PREVIEW === "true" || !url || !key) return null;
  const jar = await cookies();
  return createServerClient(url, key, { cookies: { getAll: () => jar.getAll(), setAll: (values) => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Proxy refreshes cookies when rendering server components. */ } } } });
}
export async function currentUser() {
  const client = await serverSupabase();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}
