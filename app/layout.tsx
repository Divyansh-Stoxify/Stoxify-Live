import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionTimeoutManager } from "@/components/auth/session-timeout-manager";

import { LenisProvider } from "@/components/lenis-provider";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import "lenis/dist/lenis.css";
import { Manrope, Inter } from "next/font/google";

import { JsonLd, getOrganizationSchema, getWebSiteSchema } from "@/components/seo/json-ld";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stoxify.in"),
  title: {
    default: "Stoxify - India's SEBI-Registered Research Analyst & PaRRVA Compliance Platform",
    template: "%s | Stoxify",
  },
  description:
    "Subscribe to verified SEBI-registered Research Analysts. Receive real-time timestamped trade recommendations with entry, target, stop-loss, and PaRRVA-aligned performance metrics.",
  keywords: [
    "SEBI Research Analyst",
    "PaRRVA compliance",
    "NSE trade timestamping",
    "SEBI registered stock tips",
    "verified trading ideas India",
    "Investment Advisor platform",
    "F&O trade alerts",
    "Stoxify",
  ],
  authors: [{ name: "Stoxify Private Limited", url: "https://www.stoxify.in" }],
  publisher: "Stoxify Private Limited",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.stoxify.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.stoxify.in",
    siteName: "Stoxify",
    title: "Stoxify - SEBI-Registered Research Analyst Infrastructure & Marketplace",
    description:
      "India's PaRRVA-aligned platform connecting verified SEBI Research Analysts with retail traders. Real-time timestamped trade alerts.",
    images: [
      {
        url: "https://www.stoxify.in/logo-primary.svg",
        width: 800,
        height: 600,
        alt: "Stoxify Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stoxify - SEBI-Registered Research Analyst Infrastructure",
    description:
      "Verified SEBI Research Analyst trade ideas, PaRRVA compliance, and automated subscriber management.",
    site: "@stoxifyin",
  },
  other: {
    "geo.region": "IN-MH",
    "geo.placename": "India",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${manrope.variable} ${inter.variable} ${plusJakartaSans.variable}`} data-scroll-behavior="smooth" lang="en">
      <body>
        <JsonLd data={[getOrganizationSchema(), getWebSiteSchema()]} />
        <LenisProvider>
          <TooltipProvider>
            <Suspense fallback={null}>
              <SessionTimeoutManager />
            </Suspense>
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </LenisProvider>
      </body>
    </html>
  );
}



