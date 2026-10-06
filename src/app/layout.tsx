import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AccountProvider } from "@/components/site/AccountProvider";
import PwaRegister from "@/components/site/PwaRegister";

const inter = localFont({
  variable: "--font-inter",
  src: "../../public/fonts/inter-latin.woff2", weight: "100 900", display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Easy Tickets | Events in Namibia", template: "%s | Easy Tickets" },
  description: "Find music, festivals, culture, food and sport in Namibia. Book your next event with Easy Tickets.",
  applicationName: "Easy Tickets Namibia",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Easy Tickets" },
  icons: { apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};

export const viewport: Viewport = { themeColor: "#164dcc", colorScheme: "light", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
    >
      <body>
        <AccountProvider>{children}<PwaRegister/></AccountProvider>
      </body>
    </html>
  );
}
