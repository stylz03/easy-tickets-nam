import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import AmbientBackdrop from "./AmbientBackdrop";
import MobileDock from "./MobileDock";
export default function PageFrame({ children }: { children: React.ReactNode }) { return <><a className="skip-link" href="#main">Skip to content</a><AmbientBackdrop/><SiteHeader /><div className="page-layer">{children}<SiteFooter /></div><MobileDock/></>; }
