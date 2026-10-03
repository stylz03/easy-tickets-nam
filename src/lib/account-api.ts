import "server-only";
import { NextResponse } from "next/server";
import { serverSupabase } from "./supabase/server";
export const json = (body:unknown,status=200) => NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export function sameOrigin(req:Request) { return req.headers.get("origin") === new URL(req.url).origin && (req.headers.get("content-type") || "").includes("application/json"); }
export async function accountIdentity() {
  const client = await serverSupabase(); if(!client) return null;
  const {data,error} = await client.auth.getUser(); if(error || !data.user) return null;
  return {client,user:data.user};
}
