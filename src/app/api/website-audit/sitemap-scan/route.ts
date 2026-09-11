import { NextResponse } from 'next/server';

interface PageAuditSummary {
  url: string;
  status: number;
  title: string;
  hasH1: boolean;
  metaDescription: string;
  loadTimeMs: number;
  score: number;
  issues: string[];
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const domain = parsedUrl.origin;
    const possibleSitemaps = [
      domain + '/sitemap.xml',
      domain + '/sitemap_index.xml',
      domain + '/wp-sitemap.xml'
    ];

    let sitemapXml = '';
    let foundSitemapUrl = '';

    for (const smUrl of possibleSitemaps) {
      try {
        const res = await fetch(smUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GrowthPilot-DeepAudit/2.0; +https://growthpilot.ai)',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const text = await res.text();
          if (text.includes('<urlset') || text.includes('<sitemapindex')) {
            sitemapXml = text;
            foundSitemapUrl = smUrl;
            break;
          }
        }
      } catch {
        // Continue
      }
    }

    const extractedUrls: string[] = [];

    if (sitemapXml) {
      const locRegex = /<loc>(.*?)<\/loc>/g;
      let match;
      while ((match = locRegex.exec(sitemapXml)) !== null) {
        const found = match[1]?.trim();
        if (found && !found.endsWith('.xml') && !extractedUrls.includes(found)) {
          extractedUrls.push(found);
        }
      }
    }

    if (extractedUrls.length === 0) {
      extractedUrls.push(domain);
      extractedUrls.push(domain + '/about');
      extractedUrls.push(domain + '/pricing');
      extractedUrls.push(domain + '/blog');
      extractedUrls.push(domain + '/contact');
    }

    const sampleUrls = extractedUrls.slice(0, 5);

    const pageAudits: PageAuditSummary[] = await Promise.all(
      sampleUrls.map(async (targetUrl) => {
        const start = Date.now();
        const issues: string[] = [];
        let score = 100;
        let status = 0;
        let title = '';
        let metaDescription = '';
        let hasH1 = false;

        try {
          const pageRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GrowthPilot-SitemapCrawler/2.0)',
            },
            signal: AbortSignal.timeout(7000),
          });

          status = pageRes.status;
          const html = await pageRes.text();
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                            html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
          metaDescription = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : '';

          hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html);

          if (status !== 200) {
            issues.push('HTTP Status ' + status);
            score -= 40;
          }

          if (!title) {
            issues.push('Missing Title tag');
            score -= 25;
          } else if (title.length < 30 || title.length > 65) {
            issues.push('Sub-optimal Title length (' + title.length + ' chars)');
            score -= 10;
          }

          if (!metaDescription) {
            issues.push('Missing Meta Description');
            score -= 20;
          }

          if (!hasH1) {
            issues.push('Missing H1 Heading');
            score -= 15;
          }
        } catch (err: any) {
          status = 500;
          issues.push(err.message?.includes('timeout') ? 'Request Timed Out' : 'Failed to reach page');
          score = 30;
        }

        const loadTimeMs = Date.now() - start;
        if (loadTimeMs > 2500) {
          issues.push('Slow response time (' + loadTimeMs + 'ms)');
          score -= 10;
        }

        return {
          url: targetUrl,
          status,
          title: title || 'N/A',
          hasH1,
          metaDescription: metaDescription || 'N/A',
          loadTimeMs,
          score: Math.max(10, Math.min(100, score)),
          issues,
        };
      })
    );

    const overallSitemapScore = Math.round(
      pageAudits.reduce((acc, p) => acc + p.score, 0) / (pageAudits.length || 1)
    );

    const totalIssuesCount = pageAudits.reduce((acc, p) => acc + p.issues.length, 0);

    return NextResponse.json({
      success: true,
      foundSitemap: Boolean(foundSitemapUrl),
      sitemapUrl: foundSitemapUrl || 'Fallback to sample crawl routes',
      totalPagesDiscovered: extractedUrls.length,
      sampleSize: pageAudits.length,
      overallScore: overallSitemapScore,
      totalIssuesCount,
      pages: pageAudits,
    });
  } catch (error: any) {
    console.error('Sitemap scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete sitemap deep scan' },
      { status: 500 }
    );
  }
}