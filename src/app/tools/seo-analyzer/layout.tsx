import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free SEO Analyzer Tool - Check Website SEO | CleanSiteBuilder",
    description: "Analyze any website's SEO for free. Check meta tags, heading structure, image alt tags, Open Graph, and more. Get an instant SEO score.",
    keywords: ["seo analyzer", "seo checker", "website seo test", "meta tag checker", "seo audit tool", "free seo analysis"],
    openGraph: {
        title: "Free SEO Analyzer Tool | CleanSiteBuilder",
        description: "Analyze any website's SEO for free. Check meta tags, headings, images, and get an instant SEO score.",
        type: "website",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
