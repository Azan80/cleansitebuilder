import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CleanSiteBuilder - AI Website Builder",
  description: "The AI-powered builder that turns your prompts into production-ready Next.js websites. Deploy instantly to the edge.",
  keywords: ["SaaS", "automation", "workflow", "productivity", "business tools", "AI website builder", "Next.js"],
  authors: [{ name: "CleanSiteBuilder" }],
  openGraph: {
    title: "CleanSiteBuilder - AI Website Builder",
    description: "The AI-powered builder that turns your prompts into production-ready Next.js websites. Deploy instantly to the edge.",
    type: "website",
  },
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
