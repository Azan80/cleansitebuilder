import { NextResponse } from 'next/server';

const tools = [
  'seo-analyzer',
  'meta-tag-generator',
  'base64',
  'qr-code-generator',
];

export async function GET() {
  const baseUrl = 'https://www.cleansitebuilder.com';

  const staticPages = [
    '',
    '/pricing',
    '/signup',
    '/login',
    '/tools',
  ];

  const toolPages = tools.map(tool => `/tools/${tool}`);
  const allPages = [...staticPages, ...toolPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.includes('/tools/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : page === '/tools' ? '0.9' : page.includes('/tools/') ? '0.8' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
