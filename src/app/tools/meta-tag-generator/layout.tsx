import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Meta Tag Generator - SEO Meta Tags | CleanSiteBuilder",
    description: "Generate SEO meta tags, Open Graph, and Twitter Card tags for your website. Free online meta tag generator with live preview.",
    keywords: ["meta tag generator", "seo meta tags", "open graph generator", "twitter card generator", "html meta tags"],
    openGraph: {
        title: "Free Meta Tag Generator | CleanSiteBuilder",
        description: "Generate SEO meta tags, Open Graph, and Twitter Card tags for your website. Live preview included.",
        type: "website",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
