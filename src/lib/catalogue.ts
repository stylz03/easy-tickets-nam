import "server-only";
import { events, type EventItem } from "@/data/events";
import { supabaseAdmin } from "./supabase-admin";
export async function catalogue(): Promise<{ events: EventItem[]; preview: boolean }> {
  if (process.env.EASY_TICKETS_PREVIEW === "true" || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { events, preview: true };
  const { data, error } = await supabaseAdmin().rpc("website_catalogue");
  if (error) throw new Error("The event catalogue is unavailable. Please try again shortly.");
  return { events: (data ?? []).map((row: {payload: EventItem}) => row.payload as EventItem), preview: false };
}
