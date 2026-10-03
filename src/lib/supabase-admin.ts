import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * NEVER import this from a client component, and never expose the key via NEXT_PUBLIC_*.
 * The `orders` table has RLS enabled with no policies, so only this client can access it.
 */
let client: SupabaseClient | null = null;

export class SupabaseConfigError extends Error {}

export function supabaseAdmin(): SupabaseClient {
  if (process.env.EASY_TICKETS_PREVIEW === "true") throw new SupabaseConfigError("Live services are disabled in design preview.");
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new SupabaseConfigError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}
