import { Metadata } from "next";
import Link from "next/link";
import {
    Search,
    Tags,
    Binary,
    QrCode,
    ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
    title: "Free SEO & Developer Tools | CleanSiteBuilder",
    description: "Free online tools for SEO and developers. Analyze websites, generate meta tags, encode/decode Base64, and create QR codes. No signup required.",
    keywords: "SEO tools, meta tag generator, Base64 encoder, QR code generator, free tools, website analyzer",
};

const tools = [
    {
        title: "SEO Analyzer",
        description: "Professional SEO analysis with 25+ checks. Analyze meta tags, robots.txt, sitemap, performance, and more.",
        href: "/tools/seo-analyzer",
        icon: Search,
        category: "SEO",
        badge: "Pro",
    },
    {
        title: "Meta Tag Generator",
        description: "Generate SEO-optimized meta tags for your website. Includes Open Graph and Twitter Card tags.",
        href: "/tools/meta-tag-generator",
        icon: Tags,
        category: "SEO",
    },
    {
        title: "Base64 to Image",
        description: "Convert Base64 encoded strings to PNG images. Paste your code, preview, and download.",
        href: "/tools/base64",
        icon: Binary,
        category: "Developer",
    },
    {
        title: "QR Code Generator",
        description: "Generate QR codes for URLs, text, and more. Customize colors and size. Download as PNG.",
        href: "/tools/qr-code-generator",
        icon: QrCode,
        category: "Developer",
    },
];

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-white">
                        CleanSiteBuilder
                    </Link>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Build Your Website
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Free SEO & Developer Tools
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                        Powerful tools to optimize your website and streamline development.
                        No signup required, 100% free.
                    </p>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        {tools.map((tool) => (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                className="group relative bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                        <tool.icon className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                                {tool.title}
                                            </h2>
                                            {tool.badge && (
                                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded">
                                                    {tool.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">
                                                {tool.category}
                                            </span>
                                            <span className="text-indigo-400 flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                                                Use Tool <ArrowRight className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 border-t border-white/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to build your website?
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Use our AI-powered website builder to create stunning websites in minutes.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all"
                    >
                        Start Building Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 px-6">
                <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} CleanSiteBuilder. All tools are free to use.</p>
                </div>
            </footer>
        </div>
    );
}
