import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
export default function PageFrame({ children }: { children: React.ReactNode }) { return <><a className="skip-link" href="#main">Skip to content</a><SiteHeader />{children}<SiteFooter /></>; }
