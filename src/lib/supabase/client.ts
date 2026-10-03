import { createBrowserClient } from "@supabase/ssr";
export function authConfigured() { return process.env.NEXT_PUBLIC_EASY_TICKETS_PREVIEW !== "true" && !!(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)); }
export function browserSupabase() {
  if (!authConfigured()) throw new Error("Account services are not connected yet.");
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!);
}
