"use client";

import { ToolLayout } from "@/components/tools/ToolLayout";
import { useState } from "react";
import {
    Zap,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Globe,
    Clock,
    Download,
    FileText,
    Image as ImageIcon,
    Code,
    Server,
    Gauge,
    TrendingUp,
    Monitor,
    Smartphone,
    ArrowUp,
    ArrowDown,
    Minus,
    ExternalLink,
} from "lucide-react";

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    score: number;
    status: "good" | "needs-improvement" | "poor";
    description: string;
}

interface ResourceBreakdown {
    type: string;
    count: number;
    totalSize: number;
    avgSize: number;
}

interface Recommendation {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: string;
}

interface SpeedTestResult {
    url: string;
    analyzedAt: string;
    overallScore: number;
    performanceScore: number;
    loadTime: number;
    timeToFirstByte: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    totalPageSize: number;
    requests: number;
    metrics: PerformanceMetric[];
    resources: ResourceBreakdown[];
    recommendations: Recommendation[];
    coreWebVitals: {
        lcp: { value: number; rating: string };
        fid: { value: number; rating: string };
        cls: { value: number; rating: string };
    };
    stats: {
        html: number;
        css: number;
        js: number;
        images: number;
        fonts: number;
        other: number;
    };
}

const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
};

const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500";
    if (score >= 50) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-red-700";
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "good":
            return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case "needs-improvement":
            return <AlertCircle className="w-5 h-5 text-yellow-500" />;
        case "poor":
            return <XCircle className="w-5 h-5 text-red-500" />;
        default:
            return <Minus className="w-5 h-5 text-gray-500" />;
    }
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

export default function PageSpeedTestPage() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SpeedTestResult | null>(null);
    const [error, setError] = useState("");

    const analyzeUrl = async () => {
        if (!url) return;

        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch("/api/page-speed-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze URL");
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const downloadReport = () => {
        if (!result) return;

        const report = `PAGE SPEED TEST REPORT
====================
URL: ${result.url}
Analyzed: ${new Date(result.analyzedAt).toLocaleString()}
Overall Score: ${result.overallScore}/100
Performance Score: ${result.performanceScore}/100

PERFORMANCE METRICS
-------------------
Load Time: ${formatTime(result.loadTime)}
Time to First Byte: ${formatTime(result.timeToFirstByte)}
DOM Content Loaded: ${formatTime(result.domContentLoaded)}
First Contentful Paint: ${formatTime(result.firstContentfulPaint)}
Largest Contentful Paint: ${formatTime(result.largestContentfulPaint)}

PAGE STATISTICS
---------------
Total Size: ${formatBytes(result.totalPageSize)}
Total Requests: ${result.requests}
HTML: ${formatBytes(result.stats.html)}
CSS: ${formatBytes(result.stats.css)}
JavaScript: ${formatBytes(result.stats.js)}
Images: ${formatBytes(result.stats.images)}
Fonts: ${formatBytes(result.stats.fonts)}

CORE WEB VITALS
---------------
LCP: ${result.coreWebVitals.lcp.value}ms (${result.coreWebVitals.lcp.rating})
FID: ${result.coreWebVitals.fid.value}ms (${result.coreWebVitals.fid.rating})
CLS: ${result.coreWebVitals.cls.value} (${result.coreWebVitals.cls.rating})

RECOMMENDATIONS
---------------
${result.recommendations.map((r, i) => `${i + 1}. [${r.impact.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}
`;

        const blob = new Blob([report], { type: "text/plain" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `speed-test-${new URL(result.url).hostname}.txt`;
        a.click();
    };

    return (
        <ToolLayout
            title="Page Speed Test Tool"
            description="Instant website performance audit. Analyze load times, Core Web Vitals, and get actionable recommendations to speed up your website."
            category="Performance Tools"
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
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {isLoading ? "Testing..." : "Test Speed"}
                    </button>
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
                    <h2 className="text-2xl font-bold text-white mb-2">Analyzing Performance...</h2>
                    <p className="text-gray-400">Testing page speed and analyzing resources</p>
                </div>
            )}

            {/* Results */}
            {result && !isLoading && (
                <div className="space-y-8">
                    {/* Score Header */}
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
                                                <stop offset="0%" className={result.overallScore >= 50 ? "text-green-500" : "text-red-500"} stopColor="currentColor" />
                                                <stop offset="100%" className={result.overallScore >= 50 ? "text-emerald-500" : "text-orange-500"} stopColor="currentColor" />
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
                                <p className="mt-4 text-gray-400 font-medium">Performance Score</p>
                            </div>

                            {/* Quick Stats */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                                    <Clock className="w-6 h-6 text-indigo-400 mb-2" />
                                    <div className="text-2xl font-bold text-white">{formatTime(result.loadTime)}</div>
                                    <div className="text-sm text-gray-400">Load Time</div>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                    <FileText className="w-6 h-6 text-purple-400 mb-2" />
                                    <div className="text-2xl font-bold text-white">{formatBytes(result.totalPageSize)}</div>
                                    <div className="text-sm text-gray-400">Page Size</div>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <Server className="w-6 h-6 text-blue-400 mb-2" />
                                    <div className="text-2xl font-bold text-white">{result.requests}</div>
                                    <div className="text-sm text-gray-400">Requests</div>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <Zap className="w-6 h-6 text-green-400 mb-2" />
                                    <div className="text-2xl font-bold text-white">{formatTime(result.timeToFirstByte)}</div>
                                    <div className="text-sm text-gray-400">TTFB</div>
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

                    {/* Core Web Vitals */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Gauge className="w-6 h-6 text-indigo-400" />
                                Core Web Vitals
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Google's key metrics for user experience</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-px bg-white/5">
                            <div className="bg-[#0a0a0a] p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400">LCP</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${result.coreWebVitals.lcp.rating === "good" ? "bg-green-500/20 text-green-400" :
                                            result.coreWebVitals.lcp.rating === "needs-improvement" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                        }`}>
                                        {result.coreWebVitals.lcp.rating}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">{formatTime(result.coreWebVitals.lcp.value)}</div>
                                <p className="text-xs text-gray-500">Largest Contentful Paint</p>
                            </div>
                            <div className="bg-[#0a0a0a] p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400">FID</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${result.coreWebVitals.fid.rating === "good" ? "bg-green-500/20 text-green-400" :
                                            result.coreWebVitals.fid.rating === "needs-improvement" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                        }`}>
                                        {result.coreWebVitals.fid.rating}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">{formatTime(result.coreWebVitals.fid.value)}</div>
                                <p className="text-xs text-gray-500">First Input Delay</p>
                            </div>
                            <div className="bg-[#0a0a0a] p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400">CLS</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${result.coreWebVitals.cls.rating === "good" ? "bg-green-500/20 text-green-400" :
                                            result.coreWebVitals.cls.rating === "needs-improvement" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                        }`}>
                                        {result.coreWebVitals.cls.rating}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">{result.coreWebVitals.cls.value.toFixed(3)}</div>
                                <p className="text-xs text-gray-500">Cumulative Layout Shift</p>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-indigo-400" />
                                Performance Metrics
                            </h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {result.metrics.map((metric, index) => (
                                <div key={index} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        {getStatusIcon(metric.status)}
                                        <div>
                                            <h3 className="font-medium text-white">{metric.name}</h3>
                                            <p className="text-sm text-gray-400">{metric.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-white">
                                            {metric.value}{metric.unit}
                                        </div>
                                        <div className={`text-sm ${getScoreColor(metric.score)}`}>
                                            Score: {metric.score}/100
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resource Breakdown */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Code className="w-6 h-6 text-indigo-400" />
                                Resource Breakdown
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                {result.resources.map((resource, index) => (
                                    <div key={index} className="bg-white/5 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-400 font-medium">{resource.type}</span>
                                            <span className="text-sm text-gray-500">{resource.count} files</span>
                                        </div>
                                        <div className="text-xl font-bold text-white mb-1">{formatBytes(resource.totalSize)}</div>
                                        <p className="text-xs text-gray-500">Avg: {formatBytes(resource.avgSize)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Size Distribution */}
                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Size Distribution</h3>
                                <div className="space-y-2">
                                    {[
                                        { name: "HTML", size: result.stats.html, color: "bg-blue-500" },
                                        { name: "CSS", size: result.stats.css, color: "bg-purple-500" },
                                        { name: "JavaScript", size: result.stats.js, color: "bg-yellow-500" },
                                        { name: "Images", size: result.stats.images, color: "bg-green-500" },
                                        { name: "Fonts", size: result.stats.fonts, color: "bg-pink-500" },
                                        { name: "Other", size: result.stats.other, color: "bg-gray-500" },
                                    ].map((item) => {
                                        const percentage = (item.size / result.totalPageSize) * 100;
                                        return (
                                            <div key={item.name} className="flex items-center gap-3">
                                                <div className="w-24 text-sm text-gray-400">{item.name}</div>
                                                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.color} transition-all`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <div className="w-20 text-sm text-gray-400 text-right">{formatBytes(item.size)}</div>
                                                <div className="w-12 text-sm text-gray-500 text-right">{percentage.toFixed(1)}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-orange-500" />
                                    Optimization Recommendations
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Follow these tips to improve your site speed</p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {result.recommendations.map((rec, index) => (
                                    <div key={index} className="p-4 flex items-start gap-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${rec.impact === "high" ? "bg-red-500/20 text-red-400" :
                                                rec.impact === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                                                    "bg-blue-500/20 text-blue-400"
                                            }`}>
                                            {rec.impact}
                                        </span>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white flex items-center gap-2">
                                                {rec.title}
                                                <span className="text-xs text-gray-500 px-2 py-0.5 bg-white/5 rounded">{rec.category}</span>
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">{rec.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!result && !isLoading && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Professional Speed Analysis</h2>
                    <p className="text-gray-400 mb-6">Test your website's performance and get instant optimization tips</p>
                    <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
                        <span className="px-3 py-1 bg-white/5 rounded-full">⚡ Core Web Vitals</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">📊 Load Time Analysis</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">🎯 Resource Breakdown</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full">💡 Optimization Tips</span>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
