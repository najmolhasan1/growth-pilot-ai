import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Product URL is required' }, { status: 400 });
    }

    let parsedUrl = url.trim();
    if (!parsedUrl.startsWith('http')) {
      parsedUrl = 'https://' + parsedUrl;
    }

    let title = '';
    let description = '';
    let image = '';
    let price = 1850;

    try {
      const response = await fetch(parsedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const html = await response.text();

        // Extract Title
        const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<title>(.*?)<\/title>/i);
        if (ogTitle && ogTitle[1]) title = ogTitle[1].trim();

        // Extract Image
        const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
        if (ogImage && ogImage[1]) image = ogImage[1].trim();

        // Extract Description
        const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                       html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        if (ogDesc && ogDesc[1]) description = ogDesc[1].trim();

        // Extract Price (e.g., ৳1,450 or BDT 1450 or standard schema)
        const priceMatch = html.match(/["']price["']:\s*["']?(\d+)/i) ||
                           html.match(/৳\s*([\d,]+)/) ||
                           html.match(/BDT\s*([\d,]+)/i);
        if (priceMatch && priceMatch[1]) {
          const num = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          if (!isNaN(num) && num > 0) price = num;
        }
      }
    } catch (fetchErr) {
      console.warn('Scrape fallback used for:', parsedUrl);
    }

    // Smart fallback if metadata is sparse
    if (!title) {
      const pathSegments = new URL(parsedUrl).pathname.split('/').filter(Boolean);
      const slug = pathSegments[pathSegments.length - 1] || 'Imported Product';
      title = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    const estimatedCost = Math.round(price * 0.48); // ~52% gross margin estimation
    const margin = Math.round(((price - estimatedCost) / price) * 100);

    return NextResponse.json({
      success: true,
      data: {
        url: parsedUrl,
        title,
        description: description.slice(0, 160),
        image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        price,
        estimatedCost,
        margin,
        suggestedSku: `SKU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
