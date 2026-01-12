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
  metadataBase: new URL('https://www.cleansitebuilder.com'),
  title: "CleanSiteBuilder - AI Website Builder",
  description: "The AI-powered builder that turns your prompts into production-ready UI templates and websites. Deploy instantly to the edge.",
  keywords: [
    "website builder ai", "automation", "website builder", "no code ", "business tools", "AI website builder",
    "ai website generator free","ai website generator free", "ui Templates","ai website generator free", "deployment ready", "generate landing page", "clean website", "llms",
    "html", "css", "tailwind", "bootstrap", "animation", "deepseek" ,"chatgpt", 
  ],
  authors: [{ name: "CleanSiteBuilder" }],
  openGraph: {
    title: "CleanSiteBuilder - AI Website Builder",
    description: "The AI-powered builder that turns your prompts into production-ready UI templates and websites. Deploy instantly to the edge.",
    type: "website",
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17809019638"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17809019638');
            `,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7370515162038849"
          crossOrigin="anonymous"
        ></script>
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
