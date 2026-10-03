import PageFrame from "@/components/site/PageFrame";
export default function CheckoutShell({children}:{children:React.ReactNode}) {
 return <PageFrame><main id="main" className="wrap page-content" style={{maxWidth:640}}>{children}</main></PageFrame>;
}
