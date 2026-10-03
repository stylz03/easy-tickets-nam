"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { authConfigured, browserSupabase } from "@/lib/supabase/client";
export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";
const labels = { "sign-in": ["Welcome back.", "Sign in to find your tickets and saved events.", "Sign in"], "sign-up": ["Make it a date.", "One account for your tickets and favourite events.", "Create account"], "forgot-password": ["Let’s get you back in.", "We’ll send you a link to reset your password.", "Send reset link"], "update-password": ["A fresh start.", "Choose a new password for your account.", "Save password"] };
export default function AuthForm({ mode, next, callbackError }: { mode:AuthMode; next:string; callbackError:boolean }) {
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState(""); const [error,setError] = useState(callbackError ? "That sign-in link is invalid or expired. Please request a new one." : ""); const [show,setShow] = useState(false); const configured = authConfigured();
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage(""); const fd = new FormData(e.currentTarget); const email = String(fd.get("email") || "").trim(); const password = String(fd.get("password") || "");
    try {
      const client = browserSupabase();
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(mode === "forgot-password" ? "/auth/update-password" : next)}`;
      if(mode === "sign-in") { const {error} = await client.auth.signInWithPassword({email,password}); if(error) throw error; window.location.assign(next); }
      if(mode === "sign-up") { const {data,error} = await client.auth.signUp({email,password,options:{data:{full_name:String(fd.get("name") || "").trim()},emailRedirectTo:callback}}); if(error) throw error; if(data.session) window.location.assign(next); else setMessage("Check your inbox for the confirmation link, then return to sign in."); }
      if(mode === "forgot-password") { const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo:callback}); if(error) throw error; setMessage("If an account exists for that email, a reset link will arrive shortly."); }
      if(mode === "update-password") { const {data} = await client.auth.getUser(); if(!data.user) throw new Error("Open the reset link from your email before setting a new password."); const {error} = await client.auth.updateUser({password}); if(error) throw error; window.location.assign("/account"); }
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="auth-card"><p className="eyebrow">YOUR EASY TICKETS ACCOUNT</p><h1>{labels[mode][0]}</h1><p className="muted">{labels[mode][1]}</p>{!configured && <p className="inline-preview">Account services are awaiting the Easy Tickets connection. This form is a preview.</p>}<form className="form-stack" onSubmit={submit}>
    {mode === "sign-up" && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>}
    {mode !== "update-password" && <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>}
    {mode !== "forgot-password" && <label>Password<div className="password-field"><input name="password" type={show ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? 1 : 10} required/><button type="button" className="icon-button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>{mode !== "sign-in" && <span className="muted">Use at least 10 characters.</span>}</label>}
    {mode === "sign-in" && <Link href="/auth/forgot-password" className="auth-link">Forgot your password?</Link>}{error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}<button className="button primary full" disabled={busy || !configured}>{busy ? <Loader2 className="spin" size={18}/> : <>{labels[mode][2]}<ArrowRight size={17}/></>}</button>
  </form><p className="auth-bottom">{mode === "sign-in" ? <>New here? <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link></> : <>Already have an account? <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link></>}</p></div>;
}
