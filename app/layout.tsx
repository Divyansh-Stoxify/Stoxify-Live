import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionTimeoutManager } from "@/components/auth/session-timeout-manager";

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
          <TooltipProvider>
            <SessionTimeoutManager />
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </LenisProvider>
      </body>
    </html>
  );
}

