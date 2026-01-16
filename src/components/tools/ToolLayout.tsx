"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface ToolLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
    category: string;
}

export const ToolLayout = ({ children, title, description, category }: ToolLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#030712]">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/tools"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">All Tools</span>
                        </Link>

                        <Link
                            href="/builder"
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Try AI Builder
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />

                <div className="container mx-auto px-6 py-16 relative">
                    <div className="max-w-2xl">
                        <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium uppercase tracking-wider mb-4">
                            {category}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                            {title}
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12">
                {children}
            </main>

            {/* CTA */}
            <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-indigo-950/10">
                <div className="container mx-auto px-6 py-16 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Need a complete website?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Build stunning websites in seconds with our AI-powered builder. No coding required.
                    </p>
                    <Link
                        href="/builder"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        <Sparkles className="w-5 h-5" />
                        Start Building Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} CleanSiteBuilder. All rights reserved.
                        </p>
                        <Link href="/tools" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Browse All Free Tools →
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
