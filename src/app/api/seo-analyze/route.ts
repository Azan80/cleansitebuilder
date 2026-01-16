import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate and normalize URL
        let validUrl = url.trim();
        if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
            validUrl = 'https://' + validUrl;
        }

        let urlObj: URL;
        try {
            urlObj = new URL(validUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        const startTime = Date.now();

        // Fetch the page content
        const response = await fetch(validUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
            },
            signal: AbortSignal.timeout(20000),
            redirect: 'follow',
        });

        const loadTime = Date.now() - startTime;

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
                { status: 400 }
            );
        }

        const html = await response.text();
        const htmlSize = new Blob([html]).size;

        // Fetch robots.txt and sitemap.xml in parallel
        const robotsUrl = `${urlObj.origin}/robots.txt`;
        const sitemapUrl = `${urlObj.origin}/sitemap.xml`;

        const [robotsResult, sitemapResult] = await Promise.allSettled([
            fetchWithTimeout(robotsUrl, 5000),
            fetchWithTimeout(sitemapUrl, 5000),
        ]);

        const robotsData = robotsResult.status === 'fulfilled' ? robotsResult.value : null;
        const sitemapData = sitemapResult.status === 'fulfilled' ? sitemapResult.value : null;

        // Perform comprehensive SEO analysis
        const analysis = performSEOAnalysis(html, urlObj, {
            loadTime,
            htmlSize,
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            finalUrl: response.url,
            robotsTxt: robotsData,
            sitemapXml: sitemapData,
        });

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('SEO Analyzer error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
            return NextResponse.json(
                { error: 'Request timed out. The website took too long to respond.' },
                { status: 408 }
            );
        }

        return NextResponse.json(
            { error: `Could not analyze URL: ${errorMessage}` },
            { status: 500 }
        );
    }
}

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeout: number): Promise<{ exists: boolean; content: string; status: number }> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CleanSiteBuilder SEO Analyzer/1.0)',
            },
            signal: AbortSignal.timeout(timeout),
        });

        const content = response.ok ? await response.text() : '';
        return {
            exists: response.ok,
            content,
            status: response.status,
        };
    } catch {
        return { exists: false, content: '', status: 0 };
    }
}

interface RobotsSitemapData {
    exists: boolean;
    content: string;
    status: number;
}

interface AnalysisContext {
    loadTime: number;
    htmlSize: number;
    statusCode: number;
    headers: Record<string, string>;
    finalUrl: string;
    robotsTxt: RobotsSitemapData | null;
    sitemapXml: RobotsSitemapData | null;
}

interface SEOCheck {
    name: string;
    category: string;
    status: 'pass' | 'warning' | 'fail' | 'info';
    score: number;
    maxScore: number;
    message: string;
    details?: string;
    recommendation?: string;
}

function performSEOAnalysis(html: string, urlObj: URL, context: AnalysisContext) {
    const checks: SEOCheck[] = [];

    // Helper functions
    const getMetaContent = (name: string, property = false): string => {
        const attr = property ? 'property' : 'name';
        const patterns = [
            new RegExp(`<meta\\s+${attr}=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'),
            new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+${attr}=["']${name}["']`, 'i'),
        ];
        for (const regex of patterns) {
            const match = html.match(regex);
            if (match) return match[1];
        }
        return '';
    };

    const getTagContent = (tag: string): string => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
        const match = html.match(regex);
        return match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
    };

    const countTags = (tag: string): number => {
        const regex = new RegExp(`<${tag}[\\s>]`, 'gi');
        return (html.match(regex) || []).length;
    };

    const getTextContent = (): string => {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const textContent = getTextContent();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

    // ============ TECHNICAL SEO ============

    // 1. HTTPS Check
    checks.push({
        name: 'HTTPS Security',
        category: 'Security',
        status: urlObj.protocol === 'https:' ? 'pass' : 'fail',
        score: urlObj.protocol === 'https:' ? 10 : 0,
        maxScore: 10,
        message: urlObj.protocol === 'https:' ? 'Site uses HTTPS encryption' : 'Site is not using HTTPS',
        recommendation: urlObj.protocol !== 'https:' ? 'Migrate to HTTPS immediately. HTTPS is a ranking factor and essential for user trust.' : undefined,
    });

    // 2. Page Load Time
    const loadTimeStatus = context.loadTime < 2000 ? 'pass' : context.loadTime < 4000 ? 'warning' : 'fail';
    checks.push({
        name: 'Page Load Time',
        category: 'Performance',
        status: loadTimeStatus,
        score: loadTimeStatus === 'pass' ? 10 : loadTimeStatus === 'warning' ? 5 : 0,
        maxScore: 10,
        message: `Page loaded in ${(context.loadTime / 1000).toFixed(2)}s`,
        details: context.loadTime < 2000 ? 'Excellent load time!' : context.loadTime < 4000 ? 'Consider optimizing for faster loads' : 'Very slow - needs optimization',
        recommendation: context.loadTime >= 2000 ? 'Optimize images, enable compression, use CDN, minimize CSS/JS' : undefined,
    });

    // 3. HTML Size
    const htmlSizeKB = context.htmlSize / 1024;
    const htmlSizeStatus = htmlSizeKB < 100 ? 'pass' : htmlSizeKB < 300 ? 'warning' : 'fail';
    checks.push({
        name: 'HTML Document Size',
        category: 'Performance',
        status: htmlSizeStatus,
        score: htmlSizeStatus === 'pass' ? 5 : htmlSizeStatus === 'warning' ? 3 : 0,
        maxScore: 5,
        message: `HTML size: ${htmlSizeKB.toFixed(1)} KB`,
        recommendation: htmlSizeKB >= 100 ? 'Consider reducing inline CSS/JS and using external files' : undefined,
    });

    // 4. Robots.txt Check
    const robotsTxt = context.robotsTxt;
    const hasRobotsTxt = robotsTxt?.exists ?? false;
    let robotsDetails = '';
    let robotsDisallowsAll = false;
    let robotsHasSitemap = false;

    if (hasRobotsTxt && robotsTxt?.content) {
        // Check if robots.txt disallows all
        robotsDisallowsAll = /Disallow:\s*\/\s*$/im.test(robotsTxt.content);
        // Check if sitemap is declared in robots.txt
        robotsHasSitemap = /Sitemap:/i.test(robotsTxt.content);
        // Count user-agent rules
        const userAgentCount = (robotsTxt.content.match(/User-agent:/gi) || []).length;
        const disallowCount = (robotsTxt.content.match(/Disallow:/gi) || []).length;
        robotsDetails = `${userAgentCount} User-agents, ${disallowCount} Disallow rules${robotsHasSitemap ? ', Sitemap declared' : ''}`;
    }

    checks.push({
        name: 'Robots.txt',
        category: 'Technical SEO',
        status: hasRobotsTxt ? (robotsDisallowsAll ? 'warning' : 'pass') : 'warning',
        score: hasRobotsTxt ? (robotsDisallowsAll ? 3 : 8) : 0,
        maxScore: 8,
        message: hasRobotsTxt
            ? (robotsDisallowsAll ? 'Robots.txt found but may be blocking crawlers' : 'Robots.txt found and properly configured')
            : 'No robots.txt file found',
        details: robotsDetails || undefined,
        recommendation: !hasRobotsTxt
            ? 'Create a robots.txt file to guide search engine crawlers and include your sitemap URL'
            : robotsDisallowsAll
                ? 'Your robots.txt may be blocking search engines. Review Disallow rules.'
                : !robotsHasSitemap
                    ? 'Add your sitemap URL to robots.txt: Sitemap: https://yoursite.com/sitemap.xml'
                    : undefined,
    });

    // 5. Sitemap.xml Check  
    const sitemapXml = context.sitemapXml;
    const hasSitemap = sitemapXml?.exists ?? false;
    let sitemapDetails = '';
    let sitemapUrlCount = 0;

    if (hasSitemap && sitemapXml?.content) {
        // Count URLs in sitemap
        sitemapUrlCount = (sitemapXml.content.match(/<loc>/gi) || []).length;
        // Check if it's a sitemap index
        const isSitemapIndex = /<sitemapindex/i.test(sitemapXml.content);
        sitemapDetails = isSitemapIndex
            ? `Sitemap index with ${sitemapUrlCount} sitemaps`
            : `${sitemapUrlCount} URLs indexed`;
    }

    checks.push({
        name: 'Sitemap.xml',
        category: 'Technical SEO',
        status: hasSitemap ? 'pass' : 'warning',
        score: hasSitemap ? 8 : 0,
        maxScore: 8,
        message: hasSitemap
            ? `Sitemap found (${sitemapUrlCount} entries)`
            : 'No sitemap.xml file found',
        details: sitemapDetails || undefined,
        recommendation: !hasSitemap
            ? 'Create an XML sitemap to help search engines discover all your pages. Submit it to Google Search Console.'
            : sitemapUrlCount === 0
                ? 'Your sitemap appears empty. Add URLs to help search engines index your content.'
                : undefined,
    });

    // ============ ON-PAGE SEO ============

    // 4. Title Tag
    const title = getTagContent('title');
    const titleLength = title.length;
    const titleStatus = titleLength >= 30 && titleLength <= 60 ? 'pass' : titleLength > 0 && titleLength < 30 ? 'warning' : titleLength > 60 ? 'warning' : 'fail';
    checks.push({
        name: 'Title Tag',
        category: 'On-Page SEO',
        status: titleStatus,
        score: titleStatus === 'pass' ? 15 : titleStatus === 'warning' ? 8 : 0,
        maxScore: 15,
        message: title ? `"${title.substring(0, 60)}${title.length > 60 ? '...' : ''}" (${titleLength} chars)` : 'Missing title tag',
        details: titleLength > 0 ? `Optimal length: 30-60 characters. Current: ${titleLength}` : 'Title tag is crucial for SEO',
        recommendation: !title ? 'Add a unique, descriptive title tag with target keywords' : titleLength < 30 ? 'Title is too short. Include more descriptive keywords.' : titleLength > 60 ? 'Title is too long. Google will truncate it in search results.' : undefined,
    });

    // 5. Meta Description
    const description = getMetaContent('description');
    const descLength = description.length;
    const descStatus = descLength >= 120 && descLength <= 160 ? 'pass' : descLength > 0 && descLength < 120 ? 'warning' : descLength > 160 ? 'warning' : 'fail';
    checks.push({
        name: 'Meta Description',
        category: 'On-Page SEO',
        status: descStatus,
        score: descStatus === 'pass' ? 10 : descStatus === 'warning' ? 5 : 0,
        maxScore: 10,
        message: description ? `${descLength} characters` : 'Missing meta description',
        details: description ? description.substring(0, 100) + '...' : 'Meta description improves click-through rate',
        recommendation: !description ? 'Add a compelling meta description with target keywords and call-to-action' : descLength < 120 ? 'Description too short. Aim for 120-160 characters.' : descLength > 160 ? 'Description too long. Google will truncate it.' : undefined,
    });

    // 6. H1 Tag
    const h1Count = countTags('h1');
    const h1Status = h1Count === 1 ? 'pass' : h1Count === 0 ? 'fail' : 'warning';
    checks.push({
        name: 'H1 Heading',
        category: 'On-Page SEO',
        status: h1Status,
        score: h1Status === 'pass' ? 10 : h1Status === 'warning' ? 5 : 0,
        maxScore: 10,
        message: h1Count === 1 ? 'One H1 tag found (perfect)' : h1Count === 0 ? 'No H1 tag found' : `${h1Count} H1 tags found`,
        recommendation: h1Count === 0 ? 'Add exactly one H1 tag containing your primary keyword' : h1Count > 1 ? 'Use only one H1 tag per page for clear hierarchy' : undefined,
    });

    // 7. Heading Structure
    const h2Count = countTags('h2');
    const h3Count = countTags('h3');
    const h4Count = countTags('h4');
    const hasGoodStructure = h1Count === 1 && h2Count >= 2;
    checks.push({
        name: 'Heading Hierarchy',
        category: 'On-Page SEO',
        status: hasGoodStructure ? 'pass' : h2Count > 0 ? 'warning' : 'fail',
        score: hasGoodStructure ? 5 : h2Count > 0 ? 3 : 0,
        maxScore: 5,
        message: `H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}, H4: ${h4Count}`,
        details: 'Good heading hierarchy helps search engines understand content structure',
        recommendation: h2Count < 2 ? 'Add more H2 headings to break up content into sections' : undefined,
    });

    // 8. Content Length
    const contentStatus = wordCount >= 1000 ? 'pass' : wordCount >= 300 ? 'warning' : 'fail';
    checks.push({
        name: 'Content Length',
        category: 'Content',
        status: contentStatus,
        score: contentStatus === 'pass' ? 10 : contentStatus === 'warning' ? 5 : 0,
        maxScore: 10,
        message: `${wordCount.toLocaleString()} words`,
        details: wordCount >= 1000 ? 'Good content length for SEO' : 'Thin content may not rank well',
        recommendation: wordCount < 300 ? 'Add more valuable content. Aim for at least 1000+ words for comprehensive coverage.' : wordCount < 1000 ? 'Consider expanding content to 1000+ words for better rankings.' : undefined,
    });

    // 9. Images
    const totalImages = countTags('img');
    const imgWithoutAlt = (html.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
    const imgStatus = totalImages === 0 ? 'info' : imgWithoutAlt === 0 ? 'pass' : imgWithoutAlt < totalImages / 2 ? 'warning' : 'fail';
    checks.push({
        name: 'Image Alt Attributes',
        category: 'On-Page SEO',
        status: imgStatus,
        score: imgStatus === 'pass' ? 5 : imgStatus === 'warning' ? 3 : imgStatus === 'info' ? 5 : 0,
        maxScore: 5,
        message: totalImages === 0 ? 'No images found' : imgWithoutAlt === 0 ? `All ${totalImages} images have alt text` : `${imgWithoutAlt}/${totalImages} images missing alt text`,
        recommendation: imgWithoutAlt > 0 ? 'Add descriptive alt text to all images for accessibility and SEO' : undefined,
    });

    // 10. Canonical URL
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
        html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : '';
    checks.push({
        name: 'Canonical URL',
        category: 'Technical SEO',
        status: canonical ? 'pass' : 'warning',
        score: canonical ? 5 : 0,
        maxScore: 5,
        message: canonical ? 'Canonical URL defined' : 'No canonical URL found',
        details: canonical || undefined,
        recommendation: !canonical ? 'Add a canonical tag to prevent duplicate content issues' : undefined,
    });

    // 11. Viewport Meta Tag
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    checks.push({
        name: 'Mobile Viewport',
        category: 'Mobile SEO',
        status: hasViewport ? 'pass' : 'fail',
        score: hasViewport ? 10 : 0,
        maxScore: 10,
        message: hasViewport ? 'Viewport meta tag present' : 'Missing viewport meta tag',
        recommendation: !hasViewport ? 'Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">' : undefined,
    });

    // 12. Robots Meta Tag
    const robots = getMetaContent('robots');
    const isIndexable = !robots.includes('noindex');
    checks.push({
        name: 'Robots Meta Tag',
        category: 'Technical SEO',
        status: isIndexable ? 'pass' : 'warning',
        score: isIndexable ? 5 : 0,
        maxScore: 5,
        message: robots ? `Robots: ${robots}` : 'No robots meta tag (default: index, follow)',
        details: isIndexable ? 'Page is indexable by search engines' : 'Page is set to noindex - will not appear in search results',
    });

    // 13. Language Declaration
    const hasLang = /<html[^>]+lang=["'][^"']+["']/i.test(html);
    checks.push({
        name: 'Language Declaration',
        category: 'Technical SEO',
        status: hasLang ? 'pass' : 'warning',
        score: hasLang ? 3 : 0,
        maxScore: 3,
        message: hasLang ? 'Language attribute declared' : 'Missing language attribute',
        recommendation: !hasLang ? 'Add lang attribute to <html> tag: <html lang="en">' : undefined,
    });

    // ============ SOCIAL MEDIA ============

    // 14. Open Graph Tags
    const ogTitle = getMetaContent('og:title', true);
    const ogDescription = getMetaContent('og:description', true);
    const ogImage = getMetaContent('og:image', true);
    const ogUrl = getMetaContent('og:url', true);
    const ogComplete = ogTitle && ogDescription && ogImage;
    checks.push({
        name: 'Open Graph Tags',
        category: 'Social Media',
        status: ogComplete ? 'pass' : ogTitle || ogDescription ? 'warning' : 'fail',
        score: ogComplete ? 10 : ogTitle || ogDescription ? 5 : 0,
        maxScore: 10,
        message: ogComplete ? 'Complete OG tags found' : 'Missing or incomplete Open Graph tags',
        details: `Title: ${ogTitle ? '✓' : '✗'}, Description: ${ogDescription ? '✓' : '✗'}, Image: ${ogImage ? '✓' : '✗'}, URL: ${ogUrl ? '✓' : '✗'}`,
        recommendation: !ogComplete ? 'Add complete Open Graph tags for better social media sharing' : undefined,
    });

    // 15. Twitter Cards
    const twitterCard = getMetaContent('twitter:card');
    const twitterTitle = getMetaContent('twitter:title');
    const twitterImage = getMetaContent('twitter:image');
    checks.push({
        name: 'Twitter Card Tags',
        category: 'Social Media',
        status: twitterCard ? 'pass' : 'warning',
        score: twitterCard ? 5 : 0,
        maxScore: 5,
        message: twitterCard ? `Twitter Card: ${twitterCard}` : 'Missing Twitter Card tags',
        recommendation: !twitterCard ? 'Add Twitter Card meta tags for better Twitter sharing' : undefined,
    });

    // ============ STRUCTURED DATA ============

    // 16. Schema.org / JSON-LD
    const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
    const hasMicrodata = /itemscope|itemtype/i.test(html);
    checks.push({
        name: 'Structured Data',
        category: 'Rich Results',
        status: hasJsonLd ? 'pass' : hasMicrodata ? 'pass' : 'warning',
        score: hasJsonLd || hasMicrodata ? 8 : 0,
        maxScore: 8,
        message: hasJsonLd ? 'JSON-LD structured data found' : hasMicrodata ? 'Microdata structured data found' : 'No structured data found',
        details: 'Structured data enables rich snippets in search results',
        recommendation: !hasJsonLd && !hasMicrodata ? 'Add JSON-LD structured data for rich search results (reviews, FAQs, etc.)' : undefined,
    });

    // ============ LINKS ============

    // 17. Internal Links
    const allLinks = html.match(/<a[^>]+href=["']([^"'#]+)["']/gi) || [];
    let internalLinks = 0;
    let externalLinks = 0;

    for (const link of allLinks) {
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;
        const href = hrefMatch[1];

        if (href.startsWith('/') || href.startsWith(urlObj.origin) || href.startsWith(urlObj.host)) {
            internalLinks++;
        } else if (href.startsWith('http')) {
            externalLinks++;
        }
    }

    checks.push({
        name: 'Internal Links',
        category: 'Links',
        status: internalLinks >= 3 ? 'pass' : internalLinks > 0 ? 'warning' : 'fail',
        score: internalLinks >= 3 ? 5 : internalLinks > 0 ? 2 : 0,
        maxScore: 5,
        message: `${internalLinks} internal links found`,
        recommendation: internalLinks < 3 ? 'Add more internal links to help users and search engines navigate your site' : undefined,
    });

    // 18. External Links
    checks.push({
        name: 'External Links',
        category: 'Links',
        status: externalLinks > 0 ? 'pass' : 'info',
        score: externalLinks > 0 ? 3 : 3,
        maxScore: 3,
        message: `${externalLinks} external links found`,
        details: 'External links to authoritative sources can improve credibility',
    });

    // 19. Broken Link Check (check for empty hrefs)
    const emptyLinks = (html.match(/<a[^>]+href=["'][\s]*["']/gi) || []).length;
    checks.push({
        name: 'Empty Links',
        category: 'Links',
        status: emptyLinks === 0 ? 'pass' : 'warning',
        score: emptyLinks === 0 ? 3 : 0,
        maxScore: 3,
        message: emptyLinks === 0 ? 'No empty links found' : `${emptyLinks} empty links detected`,
        recommendation: emptyLinks > 0 ? 'Fix or remove empty href attributes' : undefined,
    });

    // ============ ADDITIONAL CHECKS ============

    // 20. Favicon
    const hasFavicon = /<link[^>]+rel=["'](icon|shortcut icon|apple-touch-icon)["']/i.test(html);
    checks.push({
        name: 'Favicon',
        category: 'Branding',
        status: hasFavicon ? 'pass' : 'warning',
        score: hasFavicon ? 2 : 0,
        maxScore: 2,
        message: hasFavicon ? 'Favicon found' : 'No favicon detected',
        recommendation: !hasFavicon ? 'Add a favicon for better brand recognition in browser tabs' : undefined,
    });

    // 21. Keywords Meta (deprecated but still checked)
    const keywords = getMetaContent('keywords');
    checks.push({
        name: 'Meta Keywords',
        category: 'On-Page SEO',
        status: 'info',
        score: 0,
        maxScore: 0,
        message: keywords ? `Keywords defined (${keywords.split(',').length} keywords)` : 'No meta keywords (not a ranking factor)',
        details: 'Meta keywords are no longer used by Google but may be used by other search engines',
    });

    // 22. URL Structure
    const urlPath = urlObj.pathname;
    const hasCleanUrl = !urlPath.includes('?') && !urlPath.includes('&') && urlPath.split('/').every(p => p.length < 50);
    checks.push({
        name: 'URL Structure',
        category: 'Technical SEO',
        status: hasCleanUrl ? 'pass' : 'warning',
        score: hasCleanUrl ? 3 : 1,
        maxScore: 3,
        message: hasCleanUrl ? 'Clean, SEO-friendly URL' : 'URL could be improved',
        details: urlObj.pathname,
        recommendation: !hasCleanUrl ? 'Use short, descriptive URLs with keywords, separated by hyphens' : undefined,
    });

    // 23. GZIP Compression
    const hasCompression = context.headers['content-encoding']?.includes('gzip') ||
        context.headers['content-encoding']?.includes('br');
    checks.push({
        name: 'Compression',
        category: 'Performance',
        status: hasCompression ? 'pass' : 'warning',
        score: hasCompression ? 3 : 0,
        maxScore: 3,
        message: hasCompression ? `Compression enabled (${context.headers['content-encoding']})` : 'No compression detected',
        recommendation: !hasCompression ? 'Enable GZIP or Brotli compression to reduce page size' : undefined,
    });

    // 24. Doctype
    const hasDoctype = /<!doctype\s+html/i.test(html);
    checks.push({
        name: 'HTML5 Doctype',
        category: 'Technical SEO',
        status: hasDoctype ? 'pass' : 'fail',
        score: hasDoctype ? 2 : 0,
        maxScore: 2,
        message: hasDoctype ? 'Valid HTML5 doctype' : 'Missing or invalid doctype',
        recommendation: !hasDoctype ? 'Add <!DOCTYPE html> at the beginning of your HTML' : undefined,
    });

    // 25. Character Encoding
    const hasCharset = /<meta[^>]+charset=["']utf-8["']/i.test(html) ||
        /<meta[^>]+content=["'][^"']*charset=utf-8/i.test(html);
    checks.push({
        name: 'Character Encoding',
        category: 'Technical SEO',
        status: hasCharset ? 'pass' : 'warning',
        score: hasCharset ? 2 : 0,
        maxScore: 2,
        message: hasCharset ? 'UTF-8 charset declared' : 'No charset declaration found',
        recommendation: !hasCharset ? 'Add <meta charset="UTF-8"> for proper character encoding' : undefined,
    });

    // Calculate overall scores by category
    const categories = [...new Set(checks.map(c => c.category))];
    const categoryScores: Record<string, { score: number; maxScore: number; percentage: number }> = {};

    for (const category of categories) {
        const categoryChecks = checks.filter(c => c.category === category);
        const score = categoryChecks.reduce((sum, c) => sum + c.score, 0);
        const maxScore = categoryChecks.reduce((sum, c) => sum + c.maxScore, 0);
        categoryScores[category] = {
            score,
            maxScore,
            percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 100,
        };
    }

    // Calculate overall score
    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxTotalScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
    const overallScore = Math.round((totalScore / maxTotalScore) * 100);

    // Get priority recommendations
    const recommendations = checks
        .filter(c => c.recommendation && (c.status === 'fail' || c.status === 'warning'))
        .sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score))
        .slice(0, 10)
        .map(c => ({
            check: c.name,
            category: c.category,
            priority: c.status === 'fail' ? 'high' : 'medium',
            recommendation: c.recommendation!,
        }));

    return {
        url: context.finalUrl,
        analyzedAt: new Date().toISOString(),
        overallScore,
        loadTime: context.loadTime,
        htmlSize: context.htmlSize,
        wordCount,

        // Meta info
        title,
        description,
        canonical,
        ogTitle,
        ogDescription,
        ogImage,

        // Counts
        h1Count,
        h2Count,
        h3Count,
        totalImages,
        imgWithoutAlt,
        internalLinks,
        externalLinks,

        // Detailed results
        checks,
        categoryScores,
        recommendations,

        // Summary stats
        stats: {
            passed: checks.filter(c => c.status === 'pass').length,
            warnings: checks.filter(c => c.status === 'warning').length,
            failed: checks.filter(c => c.status === 'fail').length,
            info: checks.filter(c => c.status === 'info').length,
            total: checks.length,
        },
    };
}
