"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { authConfigured, browserSupabase } from "@/lib/supabase/client";
export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";
const labels = { "sign-in": ["Welcome back.", "Sign in to find your tickets and saved events.", "Sign in"], "sign-up": ["Make it a date.", "One account for your tickets and favourite events.", "Create account"], "forgot-password": ["Let’s get you back in.", "We’ll send you a link to reset your password.", "Send reset link"], "update-password": ["A fresh start.", "Choose a new password for your account.", "Save password"] };
export default function AuthForm({ mode, next, callbackError }: { mode:AuthMode; next:string; callbackError:boolean }) {
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState(""); const [error,setError] = useState(callbackError ? "That sign-in link is invalid or expired. Please request a new one." : ""); const [show,setShow] = useState(false); const configured = authConfigured();
  const [passwordAccount,setPasswordAccount] = useState<string | null>(null);
  useEffect(() => {
    if (mode !== "update-password" || !configured) return;
    const client = browserSupabase();
    let active = true;
    client.auth.getUser().then(({ data }) => { if (active) setPasswordAccount(data.user?.email ?? null); }).catch(() => { if (active) setPasswordAccount(null); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setPasswordAccount(session?.user.email ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [mode, configured]);
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage(""); const fd = new FormData(e.currentTarget); const email = String(fd.get("email") || "").trim(); const password = String(fd.get("password") || "");
    try {
      const client = browserSupabase();
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(mode === "forgot-password" ? "/auth/update-password" : next)}`;
      if(mode === "sign-in") { const {error} = await client.auth.signInWithPassword({email,password}); if(error) throw error; window.location.assign(next); }
      if(mode === "sign-up") { const {data,error} = await client.auth.signUp({email,password,options:{data:{full_name:String(fd.get("name") || "").trim()},emailRedirectTo:callback}}); if(error) throw error; if(data.session) window.location.assign(next); else setMessage("Check your inbox for the confirmation link, then return to sign in."); }
      if(mode === "forgot-password") { const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo:callback}); if(error) throw error; setMessage("If an account exists for that email, a reset link will arrive shortly."); }
      if(mode === "update-password") { const {data,error:accountError} = await client.auth.getUser(); if(accountError || !data.user?.email) throw new Error("Open the reset or invitation link from your email before setting a password."); if(email.toLowerCase() !== data.user.email.toLowerCase()) throw new Error(`This link is signed in as ${data.user.email}. Sign out and reopen the staff invitation if you meant to change another account.`); const {error} = await client.auth.updateUser({password}); if(error) throw error; await client.auth.signOut(); window.location.assign("/auth/sign-in?next=/check-in"); }
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="auth-card"><p className="eyebrow">YOUR EASY TICKETS ACCOUNT</p><h1>{labels[mode][0]}</h1><p className="muted">{labels[mode][1]}</p>{mode === "update-password" && <p className="inline-preview" role="status">{passwordAccount ? <>This will change the password for <strong>{passwordAccount}</strong>. If you expected a different account, sign out and reopen its email link.</> : "Open the password or staff invitation link from your email to continue."}</p>}{!configured && <p className="inline-preview">Account services are awaiting the Easy Tickets connection. This form is a preview.</p>}<form className="form-stack" onSubmit={submit}>
    {mode === "sign-up" && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>}
    <label>{mode === "update-password" ? "Type the account email to confirm" : "Email address"}<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    {mode !== "forgot-password" && <label>Password<div className="password-field"><input name="password" type={show ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? 1 : 10} required/><button type="button" className="icon-button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>{mode !== "sign-in" && <span className="muted">Use at least 10 characters.</span>}</label>}
    {mode === "sign-in" && <Link href="/auth/forgot-password" className="auth-link">Forgot your password?</Link>}{error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}<button className="button primary full" disabled={busy || !configured || (mode === "update-password" && !passwordAccount)}>{busy ? <Loader2 className="spin" size={18}/> : <>{labels[mode][2]}<ArrowRight size={17}/></>}</button>
  </form><p className="auth-bottom">{mode === "sign-in" ? <>New here? <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link></> : <>Already have an account? <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link></>}</p></div>;
}
