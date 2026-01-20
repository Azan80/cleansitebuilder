import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Speed Test - Free Website Performance Analyzer | CleanSiteBuilder",
    description: "Test your website speed instantly. Analyze load times, Core Web Vitals (LCP, FID, CLS), performance metrics, and get actionable optimization recommendations to boost your site's speed.",
    keywords: [
        "page speed test",
        "website speed test",
        "site speed analyzer",
        "core web vitals",
        "website performance test",
        "load time checker",
        "performance analyzer",
        "speed optimization tool",
        "LCP test",
        "FID test",
        "CLS test",
        "free speed test",
        "website audit",
        "performance score",
        "TTFB checker",
    ],
    openGraph: {
        title: "Free Page Speed Test Tool - Instant Performance Analysis",
        description: "Test your website's speed and performance. Get Core Web Vitals scores, load time analysis, and optimization tips to make your site lightning fast.",
        type: "website",
        images: [
            {
                url: "/og-page-speed.png",
                width: 1200,
                height: 630,
                alt: "Page Speed Test Tool - Analyze Website Performance",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Free Page Speed Test - Analyze Website Performance",
        description: "Instant website speed analysis with Core Web Vitals, performance metrics, and optimization recommendations.",
    },
    alternates: {
        canonical: "https://www.cleansitebuilder.com/tools/page-speed-test",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
