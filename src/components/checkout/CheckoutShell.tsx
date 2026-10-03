import Link from "next/link";
import Logo from "@/components/Logo";

/**
 * Page chrome for /checkout/* pages, matching Design 1:
 * white -> sky -> rose hero wash, soft blurred blobs, Logo header, slate footer.
 */
export default function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/70 to-rose-50/90" />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-sky-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-rose-100/50 blur-3xl" />
      </div>

      <header className="relative z-20 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full">
          <Link href="/design/1" className="flex items-center gap-3" aria-label="Easy Tickets home">
            <Logo dark={false} size="lg" />
          </Link>
          <Link
            href="/design/1#events"
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2.5 rounded-full shadow-md shadow-blue-200 font-semibold text-sm"
          >
            Browse Events
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-xl mx-auto px-6 py-16 lg:py-24">{children}</main>

      <footer className="relative z-10 bg-slate-900 text-slate-500 py-8">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Logo dark size="md" />
          <p>&copy; {new Date().getFullYear()} Easy Tickets Namibia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
