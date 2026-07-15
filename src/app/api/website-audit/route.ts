import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getSupabaseServerClient } from '@/lib/supabase';
import { generateGeminiText, extractJsonText } from '@/lib/gemini';

// Helper function to extract user ID from token
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return null;

    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    return data.user.id;
  } catch {
    return null;
  }
}

// Helper to fetch user's brand profile context
async function getBrandProfile(userId: string): Promise<string> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return 'None';

    const { data, error } = await supabase
      .from('brand_profiles')
      .select('profile')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.profile) return 'None';
    return JSON.stringify(data.profile, null, 2);
  } catch {
    return 'None';
  }
}

// Fetch helper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Check if a secondary file/URL exists (robots.txt, sitemap)
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, { method: 'GET' }, 4000);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

// HTML tags and content parsing
function parseHtmlContent(html: string, urlStr: string) {
  // Title tag
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  // Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                    html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : '';

  // Meta robots
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([\s\S]*?)["']/i) ||
                      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']robots["']/i);
  const robots = robotsMatch ? robotsMatch[1].trim() : '';

  // Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["']/i) ||
                         html.match(/<link[^>]*href=["']([\s\S]*?)["'][^>]*rel=["']canonical["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';

  // Open Graph
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["']/i) ||
                       html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:title["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].replace(/\s+/g, ' ').trim() : '';

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:description["']/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1].replace(/\s+/g, ' ').trim() : '';

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["']/i) ||
                       html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:image["']/i);
  const ogImage = ogImageMatch ? ogImageMatch[1].trim() : '';

  // Headings counts and H1s
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1s = h1Matches.map(m => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);

  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  const h4Count = (html.match(/<h4[^>]*>/gi) || []).length;
  const h5Count = (html.match(/<h5[^>]*>/gi) || []).length;
  const h6Count = (html.match(/<h6[^>]*>/gi) || []).length;

  // Images alt checks
  const imgMatches = [...html.matchAll(/<img\s+([\s\S]*?)>/gi)];
  const totalImages = imgMatches.length;
  let imagesMissingAlt = 0;

  imgMatches.forEach(match => {
    const attrs = match[1];
    const hasAlt = /alt=["']([\s\S]*?)["']/i.test(attrs);
    if (!hasAlt) {
      imagesMissingAlt++;
    } else {
      const altVal = attrs.match(/alt=["']([\s\S]*?)["']/i);
      if (altVal && altVal[1].trim() === '') {
        imagesMissingAlt++;
      }
    }
  });

  // Links checks
  const aMatches = [...html.matchAll(/<a\s+([\s\S]*?)>/gi)];
  const totalLinks = aMatches.length;
  let internalLinks = 0;
  let externalLinks = 0;

  try {
    const urlObj = new URL(urlStr);
    const domain = urlObj.hostname;

    aMatches.forEach(match => {
      const attrs = match[1];
      const hrefMatch = attrs.match(/href=["']([\s\S]*?)["']/i);
      if (hrefMatch) {
        const href = hrefMatch[1].trim();
        if (href.startsWith('/') || href.startsWith('.') || href.includes(domain) || href.startsWith('#')) {
          internalLinks++;
        } else if (href.startsWith('http')) {
          externalLinks++;
        }
      }
    });
  } catch {
    internalLinks = totalLinks;
  }

  // Word count & text content snippet
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const textSnippet = text.slice(0, 3000);

  return {
    title,
    description,
    robots,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    h1Count: h1s.length,
    h1s,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    totalImages,
    imagesMissingAlt,
    totalLinks,
    internalLinks,
    externalLinks,
    wordCount,
    textSnippet,
  };
}

export async function POST(req: Request) {
  try {
    const rateLimit = enforceRateLimit(req, 'website-audit', 10, 60000);
    if (rateLimit) return rateLimit;

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'Target URL is required.' }, { status: 400 });
    }

    // Standardize URL protocol
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format.' }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(req);
    const brandContext = userId ? await getBrandProfile(userId) : 'None';

    const startTime = Date.now();
    let html = '';
    let loadTimeMs = 0;

    try {
      const response = await fetchWithTimeout(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      }, 10000);

      loadTimeMs = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      html = await response.text();
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({
        success: false,
        error: `Could not connect to ${targetUrl}. Please ensure the site is public and allows requests. (${fetchError.message || 'Connection timeout'})`,
      }, { status: 500 });
    }

    // Parse the HTML content
    const parsedData = parseHtmlContent(html, targetUrl);

    // Parallel checks for robots.txt and sitemap.xml
    const origin = parsedUrl.origin;
    const robotsTxtUrl = `${origin}/robots.txt`;
    const sitemapUrl = `${origin}/sitemap.xml`;

    const [hasRobotsTxt, hasSitemap] = await Promise.all([
      checkUrlExists(robotsTxtUrl),
      checkUrlExists(sitemapUrl),
    ]);

    const isHttps = parsedUrl.protocol.toLowerCase() === 'https:';

    // AI audit prompting
    const prompt = `You are a Senior SEO Consultant and Conversion Rate Optimization (CRO) Auditor.
Analyze the following parsed metadata and content snippet from this webpage: ${targetUrl}.

Website Crawled Data:
- URL: ${targetUrl}
- Title Tag: "${parsedData.title}" (length: ${parsedData.title.length} characters)
- Meta Description: "${parsedData.description}" (length: ${parsedData.description.length} characters)
- Robots Directives: "${parsedData.robots || 'None specified'}"
- Canonical Tag: "${parsedData.canonical || 'None specified'}"
- Heading Tags Hierarchy: H1 count: ${parsedData.h1Count} (List: ${JSON.stringify(parsedData.h1s)}), H2: ${parsedData.h2Count}, H3: ${parsedData.h3Count}, H4: ${parsedData.h4Count}, H5: ${parsedData.h5Count}, H6: ${parsedData.h6Count}
- Images Analysis: ${parsedData.totalImages} total images, ${parsedData.imagesMissingAlt} missing alt tags
- Links Analysis: ${parsedData.totalLinks} total links (${parsedData.internalLinks} internal, ${parsedData.externalLinks} external)
- Content Word Count: ${parsedData.wordCount} words
- Load Time (First Byte): ${loadTimeMs}ms
- HTTPS (SSL) configured: ${isHttps ? 'Yes' : 'No'}
- Robots.txt present: ${hasRobotsTxt ? 'Yes' : 'No'}
- Sitemap.xml present: ${hasSitemap ? 'Yes' : 'No'}

Website Text Content Snippet:
"""
${parsedData.textSnippet}
"""

Brand Profile Context (Use this to review business alignment and target market insights if specified):
${brandContext}

Evaluate this website and generate:
1. Category Scores: SEO, Speed, Security, Mobile (estimate each between 0-100 based on crawled data).
2. Actionable Audit Checklist: A checklist of technical/copywriting fixes. Categorize them into 'SEO', 'Performance', 'Security', 'Copywriting', or 'UX'. Give each a 'status' of 'fail', 'warning', or 'pass', and a priority ('High', 'Medium', 'Low').
3. Copywriting Audit: Assess the current value proposition, target customer hook, and write exactly 3 high-converting copywriting headline suggestions tailored to their business.
4. Local Market Advice: If the site is Bangladeshi, South Asian, or targets multi-lingual users, advice on English/Banglish/Bangla localization. Otherwise, general optimization recommendations.

Return ONLY a valid JSON object matching this structure:
{
  "scores": {
    "seo": 85,
    "speed": 78,
    "security": 90,
    "mobile": 82
  },
  "summary": "Short 2-sentence description of what this website sells or represents",
  "seoAudit": {
    "titleEvaluation": "Evaluation of Title tag length and keywords",
    "descriptionEvaluation": "Evaluation of Meta description tag length and clickability",
    "headingsEvaluation": "Analysis of heading tags structure (e.g. single H1 check, logical hierarchy)",
    "contentEvaluation": "Evaluation of content density, word count and keyword coverage"
  },
  "uxCroAudit": {
    "evaluation": "Overall UX analysis of the text snippet and structure",
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"]
  },
  "checklist": [
    {
      "id": "h1_check",
      "category": "SEO",
      "title": "Configure a single H1 tag",
      "description": "The page has X H1 tags. It is recommended to have exactly one H1 tag per page representing the main topic.",
      "priority": "High",
      "status": "fail"
    }
  ],
  "copywritingSuggestions": {
    "headlineTweaks": [
      {
        "original": "Original text hook",
        "suggested": "Optimized copy headline recommendation",
        "reason": "Why this suggestion converts better"
      }
    ],
    "valueProposition": "Detailed evaluation of the brand value proposition",
    "localMarketAdvice": "Specific regional local audience advice"
  }
}

Do NOT include any markdown code blocks, backticks, or text outside the JSON structure. Return raw JSON text starting with { and ending with }.`;

    let aiAuditData;
    try {
      const responseText = await generateGeminiText(prompt);
      const cleanedJsonText = extractJsonText(responseText);
      aiAuditData = JSON.parse(cleanedJsonText);
    } catch (aiError) {
      console.error('Gemini audit error:', aiError);
      // Fallback response structure in case of AI parsing failures
      aiAuditData = {
        scores: {
          seo: parsedData.h1Count === 1 && parsedData.title && parsedData.description ? 75 : 55,
          speed: Math.max(20, Math.min(100, Math.round(100 - (loadTimeMs / 100)))),
          security: isHttps ? 90 : 30,
          mobile: 70
        },
        summary: `A parsed webpage containing ${parsedData.wordCount} words of text.`,
        seoAudit: {
          titleEvaluation: parsedData.title ? `Title is set: "${parsedData.title}"` : 'Title tag is missing.',
          descriptionEvaluation: parsedData.description ? 'Meta description is present.' : 'Meta description is missing.',
          headingsEvaluation: `H1 tag count is ${parsedData.h1Count}. H2-H6 tags count is ${parsedData.h2Count + parsedData.h3Count + parsedData.h4Count}.`,
          contentEvaluation: `Found ${parsedData.wordCount} words. Content density is standard.`
        },
        uxCroAudit: {
          evaluation: 'Basic analysis based on tag structure.',
          strengths: [isHttps ? 'SSL configured' : '', parsedData.title ? 'Has page title' : ''].filter(Boolean),
          weaknesses: [!isHttps ? 'Insecure HTTP' : '', parsedData.imagesMissingAlt > 0 ? 'Images missing alt attributes' : ''].filter(Boolean)
        },
        checklist: [
          {
            id: 'ssl_check',
            category: 'Security',
            title: isHttps ? 'SSL Certificate Enabled' : 'SSL Certificate Missing',
            description: isHttps ? 'Your website uses secure HTTPS protocol.' : 'Your website is loaded over insecure HTTP. Install an SSL certificate.',
            priority: 'High',
            status: isHttps ? 'pass' : 'fail'
          },
          {
            id: 'h1_check',
            category: 'SEO',
            title: parsedData.h1Count === 1 ? 'Single H1 Tag Configured' : 'Incorrect H1 Tag Count',
            description: `Found ${parsedData.h1Count} H1 tags. Best practice is exactly one H1 tag per page.`,
            priority: 'High',
            status: parsedData.h1Count === 1 ? 'pass' : 'fail'
          },
          {
            id: 'meta_desc',
            category: 'SEO',
            title: parsedData.description ? 'Meta Description Present' : 'Meta Description Missing',
            description: parsedData.description ? 'Meta description is present and set.' : 'Create a search-friendly meta description under 160 characters.',
            priority: 'Medium',
            status: parsedData.description ? 'pass' : 'fail'
          },
          {
            id: 'images_alt',
            category: 'SEO',
            title: parsedData.imagesMissingAlt === 0 ? 'All Images Have Alt Attributes' : 'Images Missing Alt Text',
            description: parsedData.imagesMissingAlt === 0 ? 'Great job, all images have alt attributes.' : `${parsedData.imagesMissingAlt} out of ${parsedData.totalImages} images do not have alt tags for search engine bots and accessibility.`,
            priority: 'Low',
            status: parsedData.imagesMissingAlt === 0 ? 'pass' : 'warning'
          }
        ],
        copywritingSuggestions: {
          headlineTweaks: [],
          valueProposition: 'Value proposition details could not be parsed automatically.',
          localMarketAdvice: 'Optimize local language variables where appropriate.'
        }
      };
    }

    const auditReport = {
      url: targetUrl,
      domain: parsedUrl.hostname,
      scannedAt: new Date().toISOString(),
      crawled: {
        title: parsedData.title,
        description: parsedData.description,
        robots: parsedData.robots,
        canonical: parsedData.canonical,
        ogTitle: parsedData.ogTitle,
        ogDescription: parsedData.ogDescription,
        ogImage: parsedData.ogImage,
        h1Count: parsedData.h1Count,
        h1s: parsedData.h1s,
        headings: {
          h1: parsedData.h1Count,
          h2: parsedData.h2Count,
          h3: parsedData.h3Count,
          h4: parsedData.h4Count,
          h5: parsedData.h5Count,
          h6: parsedData.h6Count
        },
        images: {
          total: parsedData.totalImages,
          missingAlt: parsedData.imagesMissingAlt
        },
        links: {
          total: parsedData.totalLinks,
          internal: parsedData.internalLinks,
          external: parsedData.externalLinks
        },
        wordCount: parsedData.wordCount,
        loadTimeMs,
        isHttps,
        hasRobotsTxt,
        hasSitemap
      },
      audit: aiAuditData
    };

    // Save to database if user is authenticated
    if (userId) {
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          await supabase
            .from('marketing_assets')
            .insert({
              user_id: userId,
              tool: 'website_analyzer',
              title: `SEO Audit - ${parsedUrl.hostname}`,
              language: 'English',
              inputs: { url: targetUrl },
              brand_snapshot: brandContext !== 'None' ? JSON.parse(brandContext) : {},
              result: auditReport
            });
        }
      } catch (dbError) {
        console.warn('Failed to save audit asset to Supabase:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      report: auditReport
    });

  } catch (error: any) {
    console.error('Audit server error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
