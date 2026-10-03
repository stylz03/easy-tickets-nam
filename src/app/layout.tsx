import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AccountProvider } from "@/components/site/AccountProvider";

const inter = localFont({
  variable: "--font-inter",
  src: "../../public/fonts/inter-latin.woff2", weight: "100 900", display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Easy Tickets | Events in Namibia", template: "%s | Easy Tickets" },
  description: "Find music, festivals, culture, food and sport in Namibia. Book your next event with Easy Tickets.",
};

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
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
