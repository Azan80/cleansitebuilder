import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Base64 to Image Converter - Free Online Tool | CleanSiteBuilder",
    description: "Convert Base64 encoded strings to PNG images instantly. Paste your Base64 code, preview the image, and download as PNG.",
    keywords: ["base64 to image", "base64 converter", "base64 to png", "decode base64 image", "base64 viewer", "free tool"],
    openGraph: {
        title: "Base64 to Image Converter | CleanSiteBuilder",
        description: "Convert Base64 strings to PNG images online. Free tool with instant preview and download.",
        type: "website",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
