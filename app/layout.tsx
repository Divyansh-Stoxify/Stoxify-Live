import type { Metadata } from "next";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
