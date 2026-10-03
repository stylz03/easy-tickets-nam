import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/navigation";
export async function GET(req:NextRequest) {
  const code = req.nextUrl.searchParams.get("code"); const client = await serverSupabase();
  if(code && client) { const {error} = await client.auth.exchangeCodeForSession(code); if(!error) return NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")),req.url)); }
  return NextResponse.redirect(new URL("/auth/sign-in?error=link",req.url));
}
