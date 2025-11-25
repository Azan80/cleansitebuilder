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
  title: "YourSaaS - Transform Your Business Workflow",
  description: "The all-in-one platform that automates your processes, streamlines operations, and accelerates growth. Built for teams who demand excellence.",
  keywords: ["SaaS", "automation", "workflow", "productivity", "business tools"],
  authors: [{ name: "YourSaaS" }],
  openGraph: {
    title: "YourSaaS - Transform Your Business Workflow",
    description: "The all-in-one platform that automates your processes, streamlines operations, and accelerates growth.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
