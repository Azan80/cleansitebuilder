"use client";

import { ToolLayout } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/tools/CopyButton";
import { useState, useMemo } from "react";
import { Globe, FileText, Share2, Twitter } from "lucide-react";

export default function MetaTagGeneratorPage() {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        keywords: "",
        url: "",
        siteName: "",
        ogImage: "",
        twitterHandle: "",
        author: "",
    });

    // Use useMemo instead of useEffect + state for derived data
    const generatedCode = useMemo(() => {
        const lines: string[] = [];

        // Basic Meta Tags
        lines.push("<!-- Primary Meta Tags -->");
        if (formData.title) {
            lines.push(`<title>${formData.title}</title>`);
            lines.push(`<meta name="title" content="${formData.title}">`);
        }
        if (formData.description) {
            lines.push(`<meta name="description" content="${formData.description}">`);
        }
        if (formData.keywords) {
            lines.push(`<meta name="keywords" content="${formData.keywords}">`);
        }
        if (formData.author) {
            lines.push(`<meta name="author" content="${formData.author}">`);
        }

        // Open Graph
        lines.push("");
        lines.push("<!-- Open Graph / Facebook -->");
        lines.push(`<meta property="og:type" content="website">`);
        if (formData.url) {
            lines.push(`<meta property="og:url" content="${formData.url}">`);
        }
        if (formData.title) {
            lines.push(`<meta property="og:title" content="${formData.title}">`);
        }
        if (formData.description) {
            lines.push(`<meta property="og:description" content="${formData.description}">`);
        }
        if (formData.ogImage) {
            lines.push(`<meta property="og:image" content="${formData.ogImage}">`);
        }
        if (formData.siteName) {
            lines.push(`<meta property="og:site_name" content="${formData.siteName}">`);
        }

        // Twitter
        lines.push("");
        lines.push("<!-- Twitter -->");
        lines.push(`<meta property="twitter:card" content="summary_large_image">`);
        if (formData.url) {
            lines.push(`<meta property="twitter:url" content="${formData.url}">`);
        }
        if (formData.title) {
            lines.push(`<meta property="twitter:title" content="${formData.title}">`);
        }
        if (formData.description) {
            lines.push(`<meta property="twitter:description" content="${formData.description}">`);
        }
        if (formData.ogImage) {
            lines.push(`<meta property="twitter:image" content="${formData.ogImage}">`);
        }
        if (formData.twitterHandle) {
            lines.push(`<meta name="twitter:creator" content="${formData.twitterHandle}">`);
        }

        return lines.join("\n");
    }, [formData]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <ToolLayout
            title="Meta Tag Generator"
            description="Generate SEO-optimized meta tags for your website. Includes Open Graph and Twitter Card tags for perfect social sharing."
            category="SEO Tools"
        >
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-lg font-bold text-white">Basic Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Page Title <span className="text-gray-600">(30-60 characters)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    placeholder="My Awesome Website - Best Services"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <p className="mt-1 text-xs text-gray-500">{formData.title.length} characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Description <span className="text-gray-600">(120-160 characters)</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="A compelling description of your page that will appear in search results..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                />
                                <p className="mt-1 text-xs text-gray-500">{formData.description.length} characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Keywords</label>
                                <input
                                    type="text"
                                    value={formData.keywords}
                                    onChange={(e) => handleChange("keywords", e.target.value)}
                                    placeholder="keyword1, keyword2, keyword3"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Author</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => handleChange("author", e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Share2 className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-lg font-bold text-white">Social Media</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    <Globe className="w-4 h-4 inline mr-1" />
                                    Website URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => handleChange("url", e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Site Name</label>
                                <input
                                    type="text"
                                    value={formData.siteName}
                                    onChange={(e) => handleChange("siteName", e.target.value)}
                                    placeholder="My Website"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">OG Image URL</label>
                                <input
                                    type="url"
                                    value={formData.ogImage}
                                    onChange={(e) => handleChange("ogImage", e.target.value)}
                                    placeholder="https://example.com/og-image.jpg"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <p className="mt-1 text-xs text-gray-500">Recommended: 1200x630 pixels</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    <Twitter className="w-4 h-4 inline mr-1" />
                                    Twitter Handle
                                </label>
                                <input
                                    type="text"
                                    value={formData.twitterHandle}
                                    onChange={(e) => handleChange("twitterHandle", e.target.value)}
                                    placeholder="@username"
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generated Code */}
                <div className="lg:sticky lg:top-24 h-fit">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="font-bold text-white">Generated Meta Tags</h2>
                            <CopyButton text={generatedCode} label="Copy" />
                        </div>
                        <pre className="p-6 text-sm text-gray-300 overflow-x-auto max-h-[600px] overflow-y-auto">
                            <code>{generatedCode || "Fill in the form to generate meta tags..."}</code>
                        </pre>
                    </div>

                    {/* Preview */}
                    {formData.title && (
                        <div className="mt-6 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Google Search Preview</h3>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-green-700 mb-1">{formData.url || "https://example.com"}</p>
                                <h4 className="text-lg text-blue-800 font-medium mb-1 line-clamp-1">
                                    {formData.title || "Page Title"}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {formData.description || "Page description will appear here..."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
}
