"use client";

import Link from "next/link";
import { Zap, Search, Tags, Binary, QrCode, ArrowRight } from "lucide-react";

const tools = [
    {
        title: "Page Speed Test",
        description: "Analyze load times, Core Web Vitals, and get instant optimization tips.",
        href: "/tools/page-speed-test",
        icon: Zap,
        gradient: "from-yellow-500 to-orange-500",
        bgGlow: "bg-yellow-500/10",
    },
    {
        title: "SEO Analyzer",
        description: "Professional SEO analysis with 25+ checks for better rankings.",
        href: "/tools/seo-analyzer",
        icon: Search,
        gradient: "from-indigo-500 to-purple-500",
        bgGlow: "bg-indigo-500/10",
    },
    {
        title: "Meta Tag Generator",
        description: "Generate SEO-optimized meta tags for social media and search.",
        href: "/tools/meta-tag-generator",
        icon: Tags,
        gradient: "from-pink-500 to-rose-500",
        bgGlow: "bg-pink-500/10",
    },
    {
        title: "QR Code Generator",
        description: "Create custom QR codes for URLs, text, and more in seconds.",
        href: "/tools/qr-code-generator",
        icon: QrCode,
        gradient: "from-green-500 to-emerald-500",
        bgGlow: "bg-green-500/10",
    },
];

export const FreeTools = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium uppercase tracking-wider mb-6">
                        Free Tools
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white">
                        Powerful Tools,{" "}
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            100% Free
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Optimize your website with our suite of professional-grade tools. No signup required, unlimited use.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {tools.map((tool) => (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                        >
                            {/* Gradient Glow on Hover */}
                            <div className={`absolute inset-0 ${tool.bgGlow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <tool.icon className="w-full h-full text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                    {tool.title}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {tool.description}
                                </p>

                                {/* Arrow */}
                                <div className="flex items-center text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
                                    Try it free
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Tools CTA */}
                <div className="text-center">
                    <Link
                        href="/tools"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-white/10"
                    >
                        View All Free Tools
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
};
