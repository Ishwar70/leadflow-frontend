import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "LeadFlow CRM — Multi-tenant sales CRM", template: "%s · LeadFlow CRM" },
  description:
    "LeadFlow CRM helps sales teams capture leads, assign ownership, schedule follow-ups, manage pipelines and track performance from one secure workspace.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0b1124",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
