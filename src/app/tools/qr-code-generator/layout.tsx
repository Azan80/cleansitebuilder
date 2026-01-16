import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free QR Code Generator - Create QR Codes | CleanSiteBuilder",
    description: "Generate QR codes for URLs and text. Customize colors and size. Download as PNG. Free online QR code generator.",
    keywords: ["qr code generator", "create qr code", "qr code maker", "generate qr code", "qr code online", "free qr code"],
    openGraph: {
        title: "Free QR Code Generator | CleanSiteBuilder",
        description: "Generate QR codes for URLs and text. Customize colors and download as PNG.",
        type: "website",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
