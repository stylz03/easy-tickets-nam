import { notFound } from "next/navigation";
import PageFrame from "@/components/site/PageFrame";
import AuthForm, { type AuthMode } from "@/components/site/AuthForm";
import { safeNext } from "@/lib/navigation";
export default async function AuthPage({ params,searchParams }: { params:Promise<{mode:string}>;searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const {mode} = await params; const sp = await searchParams; if(!["sign-in","sign-up","forgot-password","update-password"].includes(mode)) notFound();
  return <PageFrame><main id="main" className="auth-page"><AuthForm mode={mode as AuthMode} next={safeNext(sp.next)} callbackError={!!sp.error}/></main></PageFrame>;
}
