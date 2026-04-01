import "./globals.css";
import "./editor.css";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import Providers from "../components/layout/Providers";
import ClientLayout from "../components/layout/ClientLayout";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "EmberOS | Pranay Chandra",
  description:
    "A high-performance cinematic dashboard portfolio by Pranay Chandra — Full Stack Engineer & Systems Builder.",
  openGraph: {
    title: "EmberOS | Pranay Chandra",
    description: "A premium developer portfolio built with Next.js App Router.",
    siteName: "Pranay Chandra Portfolio",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <div className="min-h-screen selection:bg-orange-500/30">
          <Providers>
            <ClientLayout>{children}</ClientLayout>
          </Providers>
          <Analytics />
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
