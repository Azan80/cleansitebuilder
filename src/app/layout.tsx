import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  description: "The AI-powered builder that turns your prompts into production-ready UI templates and websites. Deploy instantly to the edge.",
  keywords: [
    "SaaS", "automation", "workflow", "productivity", "business tools", "AI website builder",
    "ai website generator", "ui Templates", "website builder", "deployment ready", "generate landing page", "clean website", "llms",
    "html", "css", "tailwind", "bootstrap", "animation"
  ],
  authors: [{ name: "CleanSiteBuilder" }],
  openGraph: {
    title: "CleanSiteBuilder - AI Website Builder",
    description: "The AI-powered builder that turns your prompts into production-ready UI templates and websites. Deploy instantly to the edge.",
    type: "website",
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "CleanSiteBuilder",
                  "url": "https://www.cleansitebuilder.com",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.cleansitebuilder.com/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "SiteNavigationElement",
                  "name": "Login",
                  "url": "https://www.cleansitebuilder.com/login",
                  "description": "Access your dashboard and projects."
                },
                {
                  "@type": "SiteNavigationElement",
                  "name": "Pricing",
                  "url": "https://www.cleansitebuilder.com/pricing",
                  "description": "Start for free. Upgrade to get the capacity that exactly matches your needs."
                },
                {
                  "@type": "SiteNavigationElement",
                  "name": "Create your account",
                  "url": "https://www.cleansitebuilder.com/signup",
                  "description": "Create account for CleanSiteBuilder."
                }
              ]
            })
          }}
        />
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
