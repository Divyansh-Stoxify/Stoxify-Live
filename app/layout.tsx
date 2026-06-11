import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import { LenisProvider } from "@/components/lenis-provider";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import "lenis/dist/lenis.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Stoxify - Get Real-Time Trade Ideas from SEBI-Registered Research Analysts",
  description:
    "Subscribe to verified SEBI-registered Research Analysts and receive real-time trading and investing ideas with entry, target, and stop-loss.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={plusJakartaSans.variable} data-scroll-behavior="smooth" lang="en">
      <body>
        <LenisProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
