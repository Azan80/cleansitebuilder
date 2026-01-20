import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        let targetUrl = url.trim();
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = `https://${targetUrl}`;
        }

        // Validate URL
        try {
            new URL(targetUrl);
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        const startTime = Date.now();

        // Fetch the webpage with performance tracking
        const fetchStart = Date.now();
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; PageSpeedBot/1.0)",
            },
            redirect: "follow",
        });
        const fetchEnd = Date.now();
        const html = await response.text();
        const loadTime = Date.now() - startTime;

        // Calculate TTFB (Time to First Byte)
        const timeToFirstByte = fetchEnd - fetchStart;

        // Parse HTML to analyze resources
        const htmlSize = new TextEncoder().encode(html).length;

        // Count various resources (simplified - in production, use a proper HTML parser)
        const cssLinks = (html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
        const jsScripts = (html.match(/<script[^>]*src=["'][^"']*["'][^>]*>/gi) || []).length;
        const images = (html.match(/<img[^>]*src=["'][^"']*["'][^>]*>/gi) || []).length;
        const totalRequests = 1 + cssLinks + jsScripts + images; // 1 for HTML

        // Estimate sizes (in production, fetch each resource)
        const estimatedCssSize = cssLinks * 50000; // 50KB per CSS file
        const estimatedJsSize = jsScripts * 100000; // 100KB per JS file
        const estimatedImageSize = images * 150000; // 150KB per image
        const estimatedFontSize = 75000; // Assume one font family

        const totalPageSize = htmlSize + estimatedCssSize + estimatedJsSize + estimatedImageSize + estimatedFontSize;

        // Simulate performance metrics
        const domContentLoaded = loadTime * 0.7;
        const firstContentfulPaint = loadTime * 0.4;
        const largestContentfulPaint = loadTime * 0.8;

        // Calculate Core Web Vitals
        const lcp = largestContentfulPaint;
        const fid = Math.random() * 100; // Simulated
        const cls = Math.random() * 0.1; // Simulated

        const lcpRating = lcp <= 2500 ? "good" : lcp <= 4000 ? "needs-improvement" : "poor";
        const fidRating = fid <= 100 ? "good" : fid <= 300 ? "needs-improvement" : "poor";
        const clsRating = cls <= 0.1 ? "good" : cls <= 0.25 ? "needs-improvement" : "poor";

        // Performance Metrics
        const metrics: PerformanceMetric[] = [
            {
                name: "Time to First Byte (TTFB)",
                value: Math.round(timeToFirstByte),
                unit: "ms",
                score: timeToFirstByte < 600 ? 90 : timeToFirstByte < 1800 ? 50 : 20,
                status: timeToFirstByte < 600 ? "good" : timeToFirstByte < 1800 ? "needs-improvement" : "poor",
                description: "Server response time - how quickly the server sends the first byte",
            },
            {
                name: "First Contentful Paint (FCP)",
                value: Math.round(firstContentfulPaint),
                unit: "ms",
                score: firstContentfulPaint < 1800 ? 90 : firstContentfulPaint < 3000 ? 50 : 20,
                status: firstContentfulPaint < 1800 ? "good" : firstContentfulPaint < 3000 ? "needs-improvement" : "poor",
                description: "Time until the first content appears on screen",
            },
            {
                name: "Largest Contentful Paint (LCP)",
                value: Math.round(largestContentfulPaint),
                unit: "ms",
                score: lcp < 2500 ? 90 : lcp < 4000 ? 50 : 20,
                status: lcpRating as "good" | "needs-improvement" | "poor",
                description: "Time until the largest content element is rendered",
            },
            {
                name: "DOM Content Loaded",
                value: Math.round(domContentLoaded),
                unit: "ms",
                score: domContentLoaded < 1500 ? 90 : domContentLoaded < 3000 ? 50 : 20,
                status: domContentLoaded < 1500 ? "good" : domContentLoaded < 3000 ? "needs-improvement" : "poor",
                description: "Time until the DOM is fully parsed and ready",
            },
            {
                name: "Total Page Size",
                value: Math.round(totalPageSize / 1024),
                unit: "KB",
                score: totalPageSize < 1000000 ? 90 : totalPageSize < 3000000 ? 50 : 20,
                status: totalPageSize < 1000000 ? "good" : totalPageSize < 3000000 ? "needs-improvement" : "poor",
                description: "Total size of all resources loaded",
            },
        ];

        // Resource Breakdown
        const resources: ResourceBreakdown[] = [
            {
                type: "CSS",
                count: cssLinks,
                totalSize: estimatedCssSize,
                avgSize: cssLinks > 0 ? estimatedCssSize / cssLinks : 0,
            },
            {
                type: "JavaScript",
                count: jsScripts,
                totalSize: estimatedJsSize,
                avgSize: jsScripts > 0 ? estimatedJsSize / jsScripts : 0,
            },
            {
                type: "Images",
                count: images,
                totalSize: estimatedImageSize,
                avgSize: images > 0 ? estimatedImageSize / images : 0,
            },
        ];

        // Generate Recommendations
        const recommendations: Recommendation[] = [];

        if (timeToFirstByte > 600) {
            recommendations.push({
                title: "Reduce Server Response Time",
                description: "Your server response time is slow. Consider using a CDN, optimizing your backend, or upgrading your hosting plan.",
                impact: "high",
                category: "Server",
            });
        }

        if (totalPageSize > 3000000) {
            recommendations.push({
                title: "Reduce Total Page Size",
                description: "Your page is too large. Compress images, minify CSS/JS, and remove unused resources.",
                impact: "high",
                category: "Optimization",
            });
        }

        if (images > 20) {
            recommendations.push({
                title: "Optimize Images",
                description: "You have many images. Use modern formats like WebP, implement lazy loading, and compress images.",
                impact: "high",
                category: "Images",
            });
        }

        if (jsScripts > 10) {
            recommendations.push({
                title: "Reduce JavaScript",
                description: "Too many JavaScript files. Bundle and minify your scripts, and remove unused code.",
                impact: "medium",
                category: "JavaScript",
            });
        }

        if (cssLinks > 5) {
            recommendations.push({
                title: "Optimize CSS Delivery",
                description: "Multiple CSS files detected. Combine and minify CSS files to reduce requests.",
                impact: "medium",
                category: "CSS",
            });
        }

        if (lcp > 2500) {
            recommendations.push({
                title: "Improve Largest Contentful Paint",
                description: "Optimize your largest content element (images, text blocks) to load faster.",
                impact: "high",
                category: "Performance",
            });
        }

        if (!html.includes('loading="lazy"') && images > 5) {
            recommendations.push({
                title: "Implement Lazy Loading",
                description: "Add lazy loading to images below the fold to improve initial page load time.",
                impact: "medium",
                category: "Images",
            });
        }

        if (html.length > 100000) {
            recommendations.push({
                title: "Reduce HTML Size",
                description: "Your HTML is large. Minimize inline styles, remove comments, and reduce DOM size.",
                impact: "low",
                category: "HTML",
            });
        }

        // Calculate overall score
        const avgMetricScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
        const performanceScore = Math.round(avgMetricScore);

        // Overall score considers both performance and best practices
        const overallScore = Math.round(
            performanceScore * 0.7 +
            (recommendations.length === 0 ? 100 : Math.max(0, 100 - recommendations.length * 10)) * 0.3
        );

        return NextResponse.json({
            url: targetUrl,
            analyzedAt: new Date().toISOString(),
            overallScore,
            performanceScore,
            loadTime,
            timeToFirstByte,
            domContentLoaded,
            firstContentfulPaint,
            largestContentfulPaint,
            totalPageSize,
            requests: totalRequests,
            metrics,
            resources,
            recommendations,
            coreWebVitals: {
                lcp: { value: Math.round(lcp), rating: lcpRating },
                fid: { value: Math.round(fid), rating: fidRating },
                cls: { value: parseFloat(cls.toFixed(3)), rating: clsRating },
            },
            stats: {
                html: htmlSize,
                css: estimatedCssSize,
                js: estimatedJsSize,
                images: estimatedImageSize,
                fonts: estimatedFontSize,
                other: totalPageSize - (htmlSize + estimatedCssSize + estimatedJsSize + estimatedImageSize + estimatedFontSize),
            },
        });
    } catch (error) {
        console.error("Speed test error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to analyze page speed" },
            { status: 500 }
        );
    }
}
