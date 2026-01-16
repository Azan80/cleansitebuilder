"use client";

import { ToolLayout } from "@/components/tools/ToolLayout";
import { useState } from "react";
import {
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Info,
    Loader2,
    Globe,
    Zap,
    FileText,
    Share2,
    Link2,
    Shield,
    Smartphone,
    Code,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
} from "lucide-react";

interface SEOCheck {
    name: string;
    category: string;
    status: "pass" | "warning" | "fail" | "info";
    score: number;
    maxScore: number;
    message: string;
    details?: string;
    recommendation?: string;
}

interface CategoryScore {
    score: number;
    maxScore: number;
    percentage: number;
}

interface Recommendation {
    check: string;
    category: string;
    priority: "high" | "medium";
    recommendation: string;
}

interface SEOResult {
    url: string;
    analyzedAt: string;
    overallScore: number;
    loadTime: number;
    htmlSize: number;
    wordCount: number;
    title: string;
    description: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    totalImages: number;
    imgWithoutAlt: number;
    internalLinks: number;
    externalLinks: number;
    checks: SEOCheck[];
    categoryScores: Record<string, CategoryScore>;
    recommendations: Recommendation[];
    stats: {
        passed: number;
        warnings: number;
        failed: number;
        info: number;
        total: number;
    };
}

const categoryIcons: Record<string, React.ElementType> = {
    "Security": Shield,
    "Performance": Zap,
    "On-Page SEO": FileText,
    "Technical SEO": Code,
    "Mobile SEO": Smartphone,
    "Content": FileText,
    "Social Media": Share2,
    "Rich Results": TrendingUp,
    "Links": Link2,
    "Branding": Globe,
};

export default function SEOAnalyzerPage() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SEOResult | null>(null);
    const [error, setError] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const analyzeUrl = async () => {
        if (!url) return;

        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch("/api/seo-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze URL");
            }

            setResult(data);
            // Expand categories with issues by default
            const categoriesWithIssues = new Set<string>(
                data.checks
                    .filter((c: SEOCheck) => c.status === "fail" || c.status === "warning")
                    .map((c: SEOCheck) => c.category)
            );
            setExpandedCategories(categoriesWithIssues);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string, size = "w-5 h-5") => {
        switch (status) {
            case "pass":
                return <CheckCircle2 className={`${size} text-green-500`} />;
            case "warning":
                return <AlertCircle className={`${size} text-yellow-500`} />;
            case "fail":
                return <XCircle className={`${size} text-red-500`} />;
            default:
                return <Info className={`${size} text-blue-400`} />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        if (score >= 40) return "text-orange-500";
        return "text-red-500";
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return "from-green-500 to-emerald-500";
        if (score >= 60) return "from-yellow-500 to-orange-500";
        if (score >= 40) return "from-orange-500 to-red-500";
        return "from-red-500 to-red-700";
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const downloadReport = () => {
        if (!result) return;

        const report = `SEO ANALYSIS REPORT
====================
URL: ${result.url}
Analyzed: ${new Date(result.analyzedAt).toLocaleString()}
Overall Score: ${result.overallScore}/100

SUMMARY
-------
✓ Passed: ${result.stats.passed}
⚠ Warnings: ${result.stats.warnings}
✗ Failed: ${result.stats.failed}

KEY METRICS
-----------
Load Time: ${(result.loadTime / 1000).toFixed(2)}s
Word Count: ${result.wordCount.toLocaleString()}
Title: ${result.title}
Description: ${result.description}

CHECKS
------
${result.checks.map(c => `[${c.status.toUpperCase()}] ${c.name}: ${c.message}`).join('\n')}

RECOMMENDATIONS
---------------
${result.recommendations.map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.check}: ${r.recommendation}`).join('\n')}
`;

        const blob = new Blob([report], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `seo-report-${new URL(result.url).hostname}.txt`;
        a.click();
    };

    const sampleUrls = ["google.com", "github.com", "wikipedia.org", "amazon.com", "twitter.com"];

    return (
        <ToolLayout
            title="Pro SEO Analyzer"
            description="Professional-grade SEO analysis with 25+ checks. Analyze technical SEO, on-page factors, performance, social media, and more."
            category="SEO Tools"
        >
            {/* Input Section */}
            <div className="max-w-3xl mx-auto mb-12">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && analyzeUrl()}
                            placeholder="Enter website URL (e.g., google.com)"
                            className="w-full pl-12 pr-4 py-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={analyzeUrl}
                        disabled={isLoading || !url}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        {isLoading ? "Analyzing..." : "Analyze"}
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500">Try:</span>
                    {sampleUrls.map((sampleUrl) => (
                        <button
                            key={sampleUrl}
                            onClick={() => setUrl(sampleUrl)}
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            {sampleUrl}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        {error}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-20">
                    <Loader2 className="w-16 h-16 text-indigo-500 mx-auto mb-6 animate-spin" />
                    <h2 className="text-2xl font-bold text-white mb-2">Analyzing Website...</h2>
                    <p className="text-gray-400">Running 25+ SEO checks. This may take a few seconds.</p>
                </div>
            )}

            {/* Results */}
            {result && !isLoading && (
                <div className="space-y-8">
                    {/* Header with Score */}
                    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 rounded-2xl p-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Score Circle */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="#1a1a1a" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="url(#scoreGradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${result.overallScore * 4.4} 440`}
                                        />
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" className={result.overallScore >= 60 ? "text-green-500" : "text-red-500"} stopColor="currentColor" />
                                                <stop offset="100%" className={result.overallScore >= 60 ? "text-emerald-500" : "text-orange-500"} stopColor="currentColor" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                                            {result.overallScore}
                                        </span>
                                        <span className="text-gray-500 text-sm">/ 100</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-gray-400 font-medium">Overall SEO Score</p>
                            </div>

                            {/* Quick Stats */}
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-green-500">{result.stats.passed}</div>
                                    <div className="text-sm text-gray-400">Passed</div>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-yellow-500">{result.stats.warnings}</div>
                                    <div className="text-sm text-gray-400">Warnings</div>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-red-500">{result.stats.failed}</div>
                                    <div className="text-sm text-gray-400">Failed</div>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-400">{result.stats.total}</div>
                                    <div className="text-sm text-gray-400">Total Checks</div>
                                </div>
                            </div>
                        </div>

                        {/* URL and Actions */}
                        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <ExternalLink className="w-4 h-4" />
                                <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                    {result.url}
                                </a>
                            </div>
                            <button
                                onClick={downloadReport}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download Report
                            </button>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: "Load Time", value: `${(result.loadTime / 1000).toFixed(2)}s`, icon: Zap },
                            { label: "Word Count", value: result.wordCount.toLocaleString(), icon: FileText },
                            { label: "H1 Tags", value: result.h1Count, icon: Code },
                            { label: "Images", value: result.totalImages, icon: Globe },
                            { label: "Links", value: result.internalLinks + result.externalLinks, icon: Link2 },
                        ].map((metric) => (
                            <div key={metric.label} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-center">
                                <metric.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{metric.value}</div>
                                <div className="text-sm text-gray-500">{metric.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Priority Recommendations */}
                    {result.recommendations.length > 0 && (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-orange-500" />
                                    Priority Recommendations
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Fix these issues to improve your SEO score</p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {result.recommendations.slice(0, 5).map((rec, index) => (
                                    <div key={index} className="p-4 flex items-start gap-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${rec.priority === "high" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                                            }`}>
                                            {rec.priority}
                                        </span>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white">{rec.check}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{rec.recommendation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category Scores */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(result.categoryScores).map(([category, scores]) => {
                            const Icon = categoryIcons[category] || FileText;
                            return (
                                <div key={category} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-5 h-5 text-indigo-400" />
                                            <span className="font-medium text-white">{category}</span>
                                        </div>
                                        <span className={`font-bold ${getScoreColor(scores.percentage)}`}>
                                            {scores.percentage}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getScoreGradient(scores.percentage)} transition-all`}
                                            style={{ width: `${scores.percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {scores.score}/{scores.maxScore} points
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Checks by Category */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white">Detailed Analysis</h2>

                        {Object.entries(result.categoryScores).map(([category]) => {
                            const categoryChecks = result.checks.filter(c => c.category === category);
                            const Icon = categoryIcons[category] || FileText;
                            const isExpanded = expandedCategories.has(category);

                            return (
                                <div key={category} className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5 text-indigo-400" />
                                            <span className="font-medium text-white">{category}</span>
                                            <div className="flex gap-1">
                                                {categoryChecks.filter(c => c.status === "pass").length > 0 && (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                        {categoryChecks.filter(c => c.status === "pass").length} passed
                                                    </span>
                                                )}
                                                {categoryChecks.filter(c => c.status === "fail").length > 0 && (
                                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                                        {categoryChecks.filter(c => c.status === "fail").length} failed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-white/10 divide-y divide-white/5">
                                            {categoryChecks.map((check, index) => (
                                                <div key={index} className="p-4 flex items-start gap-4">
                                                    {getStatusIcon(check.status)}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-medium text-white">{check.name}</h3>
                                                            <span className="text-xs text-gray-500">
                                                                {check.score}/{check.maxScore} pts
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-400 mt-1">{check.message}</p>
                                                        {check.details && (
                                                            <p className="text-xs text-gray-500 mt-1 truncate">{check.details}</p>
                                                        )}
                                                        {check.recommendation && (
                                                            <p className="text-sm text-indigo-400 mt-2 bg-indigo-500/10 px-3 py-2 rounded">
                                                                💡 {check.recommendation}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Meta Preview */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-indigo-400" />
                                Google Search Preview
                            </h3>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-green-700 truncate">{result.url}</p>
                                <h4 className="text-lg text-blue-800 font-medium line-clamp-1 mt-1">
                                    {result.title || "No title found"}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                    {result.description || "No description found"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-indigo-400" />
                                Social Media Preview
                            </h3>
                            <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                                {result.ogImage && (
                                    <div className="aspect-video bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                                        OG Image: {result.ogImage.substring(0, 50)}...
                                    </div>
                                )}
                                <div className="p-4">
                                    <h4 className="font-medium text-white line-clamp-1">
                                        {result.ogTitle || result.title || "No OG title"}
                                    </h4>
                                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                                        {result.ogDescription || result.description || "No OG description"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!result && !isLoading && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                        <Search className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Professional SEO Analysis</h2>
                    <p className="text-gray-400 mb-6">Enter a URL to run 25+ comprehensive SEO checks</p>
                    <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
                        <span className="px-3 py-1 bg-white/5 rounded-full">✓ Technical SEO</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">✓ On-Page Factors</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">✓ Performance</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">✓ Social Media</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">✓ Content Analysis</span>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
