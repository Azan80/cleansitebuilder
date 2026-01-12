import { NextResponse } from 'next/server';

export async function GET() {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.cleansitebuilder.com/</loc>
  </url>
  <url>
    <loc>https://www.cleansitebuilder.com/pricing</loc>
  </url>
  <url>
    <loc>https://www.cleansitebuilder.com/signup</loc>
  </url>
  <url>
    <loc>https://www.cleansitebuilder.com/login</loc>
  </url>
</urlset>`;

    return new NextResponse(sitemap, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
