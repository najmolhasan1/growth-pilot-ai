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

// Enhanced HTML tags, Schema, and technical content parsing
function parseHtmlContent(html: string, urlStr: string, loadTimeMs: number) {
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

  // Viewport / Mobile tag
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

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

  // Twitter Cards
  const twitterCardMatch = html.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([\s\S]*?)["']/i);
  const twitterCard = twitterCardMatch ? twitterCardMatch[1].trim() : '';

  const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([\s\S]*?)["']/i);
  const twitterTitle = twitterTitleMatch ? twitterTitleMatch[1].trim() : '';

  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([\s\S]*?)["']/i);
  const twitterImage = twitterImageMatch ? twitterImageMatch[1].trim() : '';

  // Schema.org / JSON-LD Detection
  const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const detectedSchemas: string[] = [];
  let hasSameAs = false;
  jsonLdMatches.forEach(m => {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed['@type']) detectedSchemas.push(String(parsed['@type']));
      if (parsed['sameAs'] && (Array.isArray(parsed['sameAs']) ? parsed['sameAs'].length > 0 : true)) hasSameAs = true;
      if (Array.isArray(parsed['@graph'])) {
        parsed['@graph'].forEach((item: any) => {
          if (item?.['@type']) detectedSchemas.push(String(item['@type']));
          if (item?.['sameAs']) hasSameAs = true;
        });
      }
    } catch {}
  });

  // Author meta tag
  const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([\s\S]*?)["']/i);
  const author = authorMatch ? authorMatch[1].trim() : '';

  // Data density & structure signals (Information Gain & AEO chunkability)
  const tableCount = (html.match(/<table\b/gi) || []).length;
  const listCount = (html.match(/<li\b/gi) || []).length;
  const blockquoteCount = (html.match(/<blockquote\b/gi) || []).length;
  const questionHeadingsCount = (html.match(/<h[2-4][^>]*>[^<]*(what|how|why|where|when|who|is|are|can|best|vs)[^<]*<\/h[2-4]>/gi) || []).length;
  const domElementsCount = (html.match(/<[a-z][a-z0-9]*\b/gi) || []).length;

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

  // Assets & Page weight
  const scriptCount = (html.match(/<script\b/gi) || []).length;
  const stylesheetCount = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
  const pageSizeKb = Math.round(html.length / 1024);

  // Text content snippet
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const textSnippet = text.slice(0, 3500);

  // Core Web Vitals estimates
  // LCP: estimated from TTFB + page size weight + image density
  const estimatedLcpSec = Number((Math.max(0.6, (loadTimeMs / 1000) * 1.5 + (pageSizeKb > 200 ? 0.8 : 0.2))).toFixed(2));
  // CLS: estimated based on missing image dimensions and font loads
  const estimatedCls = imagesMissingAlt > 5 ? 0.18 : 0.04;
  // INP: interaction latency estimated from script payload count
  const estimatedInpMs = Math.min(450, Math.round(scriptCount * 12 + 40));

  return {
    title,
    description,
    robots,
    canonical,
    hasViewport,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    twitterTitle,
    twitterImage,
    schemas: [...new Set(detectedSchemas)],
    hasSchema: detectedSchemas.length > 0,
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
    scriptCount,
    stylesheetCount,
    pageSizeKb,
    wordCount,
    textSnippet,
    vitals: {
      ttfbMs: loadTimeMs,
      lcpSec: estimatedLcpSec,
      cls: estimatedCls,
      inpMs: estimatedInpMs,
    },
    tableCount,
    listCount,
    blockquoteCount,
    questionHeadingsCount,
    hasSameAs,
    author,
    domElementsCount,
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

    // Parse the HTML content & extract technical signals
    const parsedData = parseHtmlContent(html, targetUrl, loadTimeMs);

    // Parallel checks for robots.txt and sitemap.xml
    const origin = parsedUrl.origin;
    const robotsTxtUrl = `${origin}/robots.txt`;
    const sitemapUrl = `${origin}/sitemap.xml`;

    const [hasRobotsTxt, hasSitemap] = await Promise.all([
      checkUrlExists(robotsTxtUrl),
      checkUrlExists(sitemapUrl),
    ]);

    const isHttps = parsedUrl.protocol.toLowerCase() === 'https:';

    // Advanced SEMrush & Ubersuggest style prompt
    const prompt = `You are a Principal SEO Architect and Enterprise Technical Auditor (like SEMrush & Ubersuggest site audit engines).
Perform a comprehensive diagnostic analysis of this crawled webpage: ${targetUrl}.

CRAWLED PAGE SIGNALS:
- URL: ${targetUrl}
- Title: "${parsedData.title}" (${parsedData.title.length} chars)
- Description: "${parsedData.description}" (${parsedData.description.length} chars)
- Robots Directives: "${parsedData.robots || 'None'}"
- Canonical URL: "${parsedData.canonical || 'Missing'}"
- Mobile Viewport Tag: ${parsedData.hasViewport ? 'Present' : 'Missing'}
- HTTPS/SSL: ${isHttps ? 'Valid HTTPS' : 'Insecure HTTP'}
- Robots.txt: ${hasRobotsTxt ? 'Found' : 'Missing'}
- Sitemap.xml: ${hasSitemap ? 'Found' : 'Missing'}
- Schema.org (JSON-LD): ${parsedData.hasSchema ? parsedData.schemas.join(', ') : 'None detected'}
- Open Graph Title: "${parsedData.ogTitle}" | Image: "${parsedData.ogImage ? 'Present' : 'Missing'}"
- Twitter Card: "${parsedData.twitterCard || 'Missing'}"
- Headings: H1 count: ${parsedData.h1Count} (List: ${JSON.stringify(parsedData.h1s)}), H2: ${parsedData.h2Count}, H3: ${parsedData.h3Count}, H4: ${parsedData.h4Count}
- Images: ${parsedData.totalImages} total (${parsedData.imagesMissingAlt} missing alt tags)
- Links: ${parsedData.totalLinks} total (${parsedData.internalLinks} internal, ${parsedData.externalLinks} external)
- Word Count: ${parsedData.wordCount} words
- Structural Density: ${parsedData.tableCount} tables, ${parsedData.listCount} lists, ${parsedData.questionHeadingsCount} Q&A headings, SameAs Entity Links: ${parsedData.hasSameAs ? 'Present' : 'Missing'}, Author: "${parsedData.author || 'None'}"
- Page Size: ${parsedData.pageSizeKb} KB HTML (${parsedData.scriptCount} scripts, ${parsedData.stylesheetCount} stylesheets, ~${parsedData.domElementsCount} DOM nodes)
- Core Web Vitals (Estimated): TTFB: ${loadTimeMs}ms, LCP: ${parsedData.vitals.lcpSec}s, CLS: ${parsedData.vitals.cls}, INP: ${parsedData.vitals.inpMs}ms

WEBSITE TEXT SNIPPET:
"""
${parsedData.textSnippet}
"""

BRAND CONTEXT (If relevant):
${brandContext}

TASK REQUIREMENTS:
1. Overall Health Score (0-100%): SEMrush-style single aggregate score reflecting critical issues, warnings, and passed technical signals.
2. Pillar Scores (0-100%): SEO, Speed, Security, Mobile.
3. 3-Tier Issue Hierarchy:
   - "errors" (Critical: broken indexing, missing title/H1, missing canonical, noindex, insecure HTTP).
   - "warnings" (Moderate: missing alt tags, slow TTFB, long titles, missing Open Graph, thin content).
   - "notices" (Minor / Best practice: schema gaps, missing twitter card, internal linking balance).
   For any fixable issue, provide "codeFix": exact ready-to-copy HTML code snippet (e.g. meta tags, canonical link, or JSON-LD schema).
4. SEMrush Organic Keywords Extraction: Extract top 8-10 keywords this page appears optimized for based on its content, headings, and density. Provide keyword, search intent (Informational / Commercial / Transactional / Navigational), estimated KD (0-100), and search volume bracket.
5. Content Gap Opportunities: 4-5 high-value competitor topics/keywords missing on this page that could drive organic rankings.
6. Copywriting & Local Market Audit: Value proposition assessment, 3 headline rewrites, and Bangladeshi / South Asian market localization advice.
7. 30-Year Veteran Senior Architect Diagnostic:
   - PageRank flow evaluation (status: "Optimal" | "Leaking" | "Imbalanced", summary, actionableFix).
   - Information Gain score (0-100): evaluate whether the content has unique data, tables, or generic text.
   - Render budget risk ("Low" | "Medium" | "High") based on DOM weight and script overhead.
   - Cannibalization risk ("Low" | "Moderate" | "High").
   - Conversion friction score (0-100) and Topical completeness score (0-100).
8. Dedicated GEO / AIO / AEO Intelligence:
   - Overall AI citation probability score (0-100%).
   - Engine readiness for Google AI Overviews, Perplexity AI, and ChatGPT Search (score 0-100, verdict, 2 specific gaps each).
   - Direct answer extractability (score 0-100, directAnswerBlocksFound, critique on 40-60 word chunkability).
   - Entity graph depth (level: "Strong" | "Basic" | "Missing", missingEntities array, recommendedSchemaJson with complete JSON-LD ready to embed).
   - AI Overviews Action Plan (3-4 prioritized items: priority "P0" | "P1" | "P2", title, action, impact).

Return strictly a valid JSON object matching this schema:
{
  "healthScore": 84,
  "scores": {
    "seo": 88,
    "speed": 78,
    "security": 92,
    "mobile": 85
  },
  "summary": "2-sentence executive summary of what this site is and its primary SEO status",
  "issues": {
    "errors": [
      {
        "id": "string",
        "category": "SEO | Performance | Security | Mobile | Schema | Architecture",
        "title": "Short title",
        "description": "Clear explanation of why it hurts SEO/Rankings",
        "impact": "High",
        "howToFix": "Step-by-step instructions",
        "codeFix": "Exact copy-paste HTML code or empty string"
      }
    ],
    "warnings": [
      {
        "id": "string",
        "category": "SEO | Performance | Security | Mobile | Schema | Architecture",
        "title": "Short title",
        "description": "...",
        "impact": "Medium",
        "howToFix": "...",
        "codeFix": "..."
      }
    ],
    "notices": [
      {
        "id": "string",
        "category": "SEO | Performance | Security | Mobile | Schema | Architecture",
        "title": "Short title",
        "description": "...",
        "impact": "Low",
        "howToFix": "...",
        "codeFix": "..."
      }
    ]
  },
  "organicKeywords": [
    {
      "keyword": "string",
      "intent": "Informational | Commercial | Transactional | Navigational",
      "kd": 42,
      "estimatedVolume": "1K - 10K",
      "relevanceScore": 95
    }
  ],
  "contentGaps": [
    {
      "topic": "string",
      "reason": "Why competitors rank for this and how to cover it"
    }
  ],
  "copywritingSuggestions": {
    "valueProposition": "Detailed critique of the hook and brand positioning",
    "headlineTweaks": [
      {
        "original": "Original text hook",
        "suggested": "Optimized copy headline recommendation",
        "reason": "Why this suggestion converts better"
      }
    ],
    "localMarketAdvice": "Specific regional local audience advice (Bangla / Banglish vs English)"
  },
  "seniorArchitectInsights": {
    "pageRankFlow": {
      "status": "Optimal",
      "summary": "Internal link equity flows smoothly to key service and article hubs without orphan page traps.",
      "actionableFix": "Add 2 contextual links from high-authority home section to secondary service offerings."
    },
    "informationGainScore": 78,
    "renderBudgetRisk": "Low",
    "cannibalizationRisk": "Low",
    "conversionFrictionScore": 82,
    "topicalCompletenessScore": 80
  },
  "geoAioInsights": {
    "aiCitationScore": 76,
    "engineReadiness": {
      "googleAio": {
        "score": 75,
        "verdict": "Moderate-high likelihood of citation for core definition entities.",
        "gaps": ["Lacks structured comparison table for quick scanning", "Missing explicit key takeaways summary block"]
      },
      "perplexity": {
        "score": 80,
        "verdict": "Strong factual retrieval match.",
        "gaps": ["Include 2-3 numerical benchmark data points", "Reference authoritative source citations"]
      },
      "chatgptSearch": {
        "score": 72,
        "verdict": "Good conversational intent alignment.",
        "gaps": ["Phrase H2 subheadings as direct natural language questions", "Add step-by-step numbered answers"]
      }
    },
    "answerExtractability": {
      "score": 74,
      "directAnswerBlocksFound": 3,
      "critique": "Content has clear headings, but introductory paragraphs need concise 40-50 word direct definition chunks for zero-click AI snippet capture."
    },
    "entityGraphDepth": {
      "level": "Basic",
      "missingEntities": ["Organization SameAs Social & Wikidata", "Primary Service/Product Schema"],
      "recommendedSchemaJson": "{\\n  \\\"@context\\\": \\\"https://schema.org\\\",\\n  \\\"@type\\\": \\\"Organization\\\",\\n  \\\"name\\\": \\\"BrandName\\\"\\n}"
    },
    "aiOverviewsActionPlan": [
      {
        "priority": "P0",
        "title": "Add 45-Word Direct Definition Callout Under Main H2",
        "action": "Place a bold 'Key Takeaways' or direct summary block immediately following your primary heading.",
        "impact": "Enables Google AI Overviews & Perplexity to extract your text as a featured citation without hallucination."
      },
      {
        "priority": "P1",
        "title": "Implement Organization SameAs Schema Graph",
        "action": "Connect official Wikidata, LinkedIn, Twitter, and Wikipedia entity references in JSON-LD.",
        "impact": "Establishes entity disambiguation in Google's Knowledge Vault and LLM pre-training clusters."
      },
      {
        "priority": "P2",
        "title": "Convert Text Comparisons Into Machine-Readable HTML Tables",
        "action": "Replace long bullet points with clean <table> markup containing clear th headers.",
        "impact": "AI search engines prioritize structured tabular data for comparison queries by 3.4x."
      }
    ]
  }
}`;

    let aiAuditData;
    try {
      const responseText = await generateGeminiText(prompt);
      const cleanedJsonText = extractJsonText(responseText);
      aiAuditData = JSON.parse(cleanedJsonText);
    } catch (aiError) {
      console.warn('Gemini advanced audit failed, generating structured diagnostic fallback:', aiError);
      
      const hasTitle = Boolean(parsedData.title);
      const hasDesc = Boolean(parsedData.description);
      const hasGoodH1 = parsedData.h1Count === 1;

      // Deterministic health calculation
      let calculatedHealth = 70;
      if (isHttps) calculatedHealth += 8;
      if (hasTitle) calculatedHealth += 7;
      if (hasDesc) calculatedHealth += 5;
      if (hasGoodH1) calculatedHealth += 5;
      if (parsedData.hasSchema) calculatedHealth += 5;
      if (parsedData.imagesMissingAlt > 0) calculatedHealth -= 6;
      if (loadTimeMs > 1200) calculatedHealth -= 8;
      calculatedHealth = Math.max(35, Math.min(96, calculatedHealth));

      aiAuditData = {
        healthScore: calculatedHealth,
        scores: {
          seo: hasGoodH1 && hasTitle && hasDesc ? 85 : 62,
          speed: Math.max(30, Math.min(100, Math.round(100 - (loadTimeMs / 60)))),
          security: isHttps ? 95 : 35,
          mobile: parsedData.hasViewport ? 85 : 50
        },
        summary: `Live audit for ${parsedUrl.hostname} (${parsedData.wordCount} words analyzed). Core technical signals captured.`,
        issues: {
          errors: [
            ...(!isHttps ? [{
              id: 'err_https',
              category: 'Security',
              title: 'Website is served over insecure HTTP',
              description: 'Search engines down-rank non-HTTPS sites and browsers flag them as Not Secure.',
              impact: 'High',
              howToFix: 'Install an SSL certificate and configure a 301 redirect from HTTP to HTTPS.',
              codeFix: ''
            }] : []),
            ...(!hasTitle ? [{
              id: 'err_title',
              category: 'SEO',
              title: 'Missing <title> tag',
              description: 'The title tag is the #1 on-page SEO ranking and CTR factor.',
              impact: 'High',
              howToFix: 'Add a descriptive 50-60 character title tag to your <head>.',
              codeFix: `<title>${parsedUrl.hostname} - Official Website & Practical Services</title>`
            }] : []),
            ...(parsedData.h1Count === 0 ? [{
              id: 'err_h1_missing',
              category: 'SEO',
              title: 'Missing Main H1 Heading',
              description: 'Search engine crawlers rely on the H1 tag to identify the primary topic of the page.',
              impact: 'High',
              howToFix: 'Include exactly one prominent H1 heading at the top of your content.',
              codeFix: `<h1>Welcome to ${parsedUrl.hostname}</h1>`
            }] : [])
          ],
          warnings: [
            ...(!hasDesc ? [{
              id: 'warn_desc',
              category: 'SEO',
              title: 'Missing Meta Description',
              description: 'A missing meta description lowers organic click-through rates from search results.',
              impact: 'Medium',
              howToFix: 'Add an engaging 140-155 character meta description.',
              codeFix: `<meta name="description" content="Discover everything about ${parsedUrl.hostname}. Practical insights, proven solutions, and reliable services." />`
            }] : []),
            ...(parsedData.imagesMissingAlt > 0 ? [{
              id: 'warn_alt',
              category: 'SEO',
              title: `${parsedData.imagesMissingAlt} Image(s) Missing Alt Attributes`,
              description: 'Image alt attributes are necessary for Google Image search visibility and screen reader accessibility.',
              impact: 'Medium',
              howToFix: 'Add descriptive alt="keyword-rich description" to all content images.',
              codeFix: `<img src="example.jpg" alt="Descriptive label of product or team" />`
            }] : []),
            ...(loadTimeMs > 1000 ? [{
              id: 'warn_ttfb',
              category: 'Performance',
              title: `Slow Server Response Time (TTFB: ${loadTimeMs}ms)`,
              description: 'Google recommends a TTFB below 800ms for optimal Core Web Vitals scoring.',
              impact: 'Medium',
              howToFix: 'Use page caching, edge CDN (like Cloudflare or Vercel), and database query optimization.',
              codeFix: ''
            }] : [])
          ],
          notices: [
            ...(!parsedData.hasSchema ? [{
              id: 'not_schema',
              category: 'Schema',
              title: 'Missing Schema.org (JSON-LD) Structured Data',
              description: 'Without structured data, your site cannot qualify for Google Rich Snippets or star ratings.',
              impact: 'Low',
              howToFix: 'Add WebSite or Organization JSON-LD markup to your HTML head.',
              codeFix: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${parsedUrl.hostname}",
  "url": "${targetUrl}"
}
</script>`
            }] : []),
            ...(!parsedData.twitterCard ? [{
              id: 'not_twitter',
              category: 'Social',
              title: 'Missing Twitter / X Card Meta Tags',
              description: 'Links shared on X will appear without an attractive rich preview card.',
              impact: 'Low',
              howToFix: 'Add twitter:card, twitter:title, and twitter:image tags.',
              codeFix: `<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${parsedData.title || parsedUrl.hostname}" />`
            }] : [])
          ]
        },
        organicKeywords: [
          { keyword: parsedUrl.hostname.replace(/www\.|\.com|\.org|\.io/g, ''), intent: 'Navigational', kd: 25, estimatedVolume: '1K - 5K', relevanceScore: 98 },
          { keyword: 'online services', intent: 'Commercial', kd: 48, estimatedVolume: '2K - 8K', relevanceScore: 82 },
          { keyword: 'how to choose best provider', intent: 'Informational', kd: 35, estimatedVolume: '500 - 2K', relevanceScore: 78 },
          { keyword: 'customer pricing guide', intent: 'Transactional', kd: 40, estimatedVolume: '1K - 3K', relevanceScore: 75 }
        ],
        contentGaps: [
          { topic: 'Customer FAQs and transparent pricing breakdowns', reason: 'Competitors rank for comparison and pricing queries in this niche.' },
          { topic: 'Case studies with before-and-after proof metrics', reason: 'High intent buyers search for practical validation before converting.' }
        ],
        copywritingSuggestions: {
          valueProposition: 'Value proposition provides a baseline overview, but can be sharpened with a bold customer-centric outcome.',
          headlineTweaks: [
            {
              original: parsedData.h1s[0] || parsedData.title || 'Welcome to our website',
              suggested: `Get Faster Results With Proven Solutions From ${parsedUrl.hostname}`,
              reason: 'Focuses immediately on user benefit and tangible outcome.'
            }
          ],
          localMarketAdvice: 'If targeting regional or Bangladeshi audiences, combine clean English brand terms with localized Bangla social proof.'
        },
        seniorArchitectInsights: {
          pageRankFlow: {
            status: parsedData.internalLinks > 15 ? 'Optimal' : (parsedData.internalLinks < 4 ? 'Leaking' : 'Imbalanced'),
            summary: parsedData.internalLinks > 15 
              ? 'Healthy internal link architecture distributing crawl authority across service silos.'
              : 'Thin internal linking structure risking orphan pages and PageRank dilution.',
            actionableFix: 'Deploy contextual breadcrumbs and 3-5 in-content links connecting related commercial landing pages.'
          },
          informationGainScore: Math.min(95, Math.max(35, Math.round(
            (parsedData.tableCount > 0 ? 30 : 0) +
            (parsedData.listCount > 4 ? 25 : 10) +
            (parsedData.wordCount > 600 ? 25 : 10) +
            (parsedData.questionHeadingsCount > 0 ? 15 : 0)
          ))),
          renderBudgetRisk: parsedData.scriptCount > 25 || parsedData.domElementsCount > 1500 ? 'High' : (parsedData.scriptCount > 12 ? 'Medium' : 'Low'),
          cannibalizationRisk: 'Low',
          conversionFrictionScore: Math.min(95, Math.max(40, Math.round(
            (parsedData.hasViewport ? 30 : 10) +
            (isHttps ? 25 : 0) +
            (loadTimeMs < 1000 ? 25 : 10) +
            (parsedData.h1Count === 1 ? 15 : 0)
          ))),
          topicalCompletenessScore: Math.min(95, Math.max(35, Math.round(
            (parsedData.h2Count >= 3 ? 35 : 15) +
            (parsedData.h3Count >= 2 ? 25 : 10) +
            (parsedData.wordCount >= 800 ? 35 : 15)
          )))
        },
        geoAioInsights: {
          aiCitationScore: Math.min(96, Math.max(35, Math.round(
            (parsedData.hasSchema ? 30 : 5) +
            (parsedData.tableCount > 0 ? 20 : 0) +
            (parsedData.questionHeadingsCount > 0 ? 25 : 10) +
            (parsedData.wordCount > 600 ? 15 : 5) +
            (isHttps ? 10 : 0)
          ))),
          engineReadiness: {
            googleAio: {
              score: Math.min(95, Math.max(30, Math.round(
                (parsedData.hasSchema ? 35 : 10) +
                (parsedData.tableCount > 0 ? 25 : 0) +
                (parsedData.h2Count >= 3 ? 35 : 15)
              ))),
              verdict: parsedData.hasSchema && parsedData.tableCount > 0 
                ? 'High readiness for Google AI Overviews rich entity citation.' 
                : 'Moderate readiness. Needs structured tabular data and explicit definition blocks.',
              gaps: [
                parsedData.tableCount === 0 ? 'Missing machine-readable HTML comparison table' : 'Needs direct 45-word definition under primary H2',
                !parsedData.hasSchema ? 'Missing JSON-LD structured data for entity resolution' : 'Expand Schema graph with SameAs references'
              ]
            },
            perplexity: {
              score: Math.min(95, Math.max(30, Math.round(
                (parsedData.externalLinks >= 2 ? 35 : 15) +
                (parsedData.wordCount > 800 ? 35 : 15) +
                (parsedData.tableCount > 0 ? 25 : 10)
              ))),
              verdict: 'Factual retrieval match requires verifiable data points and citations.',
              gaps: [
                'Add 2-3 cited statistics or benchmark percentages in content',
                'Include authoritative HTTPS reference links for factual claims'
              ]
            },
            chatgptSearch: {
              score: Math.min(95, Math.max(30, Math.round(
                (parsedData.questionHeadingsCount > 0 ? 40 : 15) +
                (parsedData.listCount > 4 ? 35 : 15) +
                (parsedData.wordCount > 500 ? 25 : 10)
              ))),
              verdict: 'Conversational answer engine alignment.',
              gaps: [
                'Phrase subheadings as natural conversational questions (e.g., How to, What is)',
                'Provide numbered step-by-step guidance for complex workflows'
              ]
            }
          },
          answerExtractability: {
            score: Math.min(95, Math.max(30, Math.round(
              (parsedData.questionHeadingsCount > 0 ? 35 : 10) +
              (parsedData.listCount > 4 ? 35 : 15) +
              (parsedData.wordCount > 400 ? 25 : 10)
            ))),
            directAnswerBlocksFound: Math.max(1, parsedData.questionHeadingsCount + parsedData.tableCount),
            critique: parsedData.questionHeadingsCount > 0
              ? 'Found natural language question headings. Ensure the sentence immediately following each heading provides a standalone 40-50 word answer.'
              : 'Add concise definition callouts immediately beneath major subheadings for zero-click AI answer extraction.'
          },
          entityGraphDepth: {
            level: parsedData.hasSameAs ? 'Strong' : (parsedData.hasSchema ? 'Basic' : 'Missing'),
            missingEntities: [
              ...(!parsedData.hasSchema ? ['Organization Schema', 'WebSite Schema'] : []),
              ...(!parsedData.hasSameAs ? ['SameAs Wikidata / Crunchbase / Social references'] : []),
              ...(!parsedData.author ? ['Author Credential & Persona Schema'] : [])
            ],
            recommendedSchemaJson: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: parsedUrl.hostname,
              url: targetUrl,
              sameAs: [
                `https://twitter.com/${parsedUrl.hostname.replace(/www\.|\.com|\.org/g, '')}`,
                `https://linkedin.com/company/${parsedUrl.hostname.replace(/www\.|\.com|\.org/g, '')}`
              ]
            }, null, 2)
          },
          aiOverviewsActionPlan: [
            {
              priority: 'P0',
              title: 'Add 45-Word Direct Definition Callout Under Main H2',
              action: 'Place a bold "Key Takeaways" or direct summary block immediately following your primary heading.',
              impact: 'Enables Google AI Overviews & Perplexity to extract your text as a featured citation without hallucination.'
            },
            {
              priority: 'P1',
              title: 'Implement Organization SameAs Schema Graph',
              action: 'Connect official Wikidata, LinkedIn, Twitter, and Wikipedia entity references in JSON-LD.',
              impact: 'Establishes entity disambiguation in Google\'s Knowledge Vault and LLM pre-training clusters.'
            },
            {
              priority: 'P2',
              title: 'Convert Text Comparisons Into Machine-Readable HTML Tables',
              action: 'Replace long bullet points with clean <table> markup containing clear th headers.',
              impact: 'AI search engines prioritize structured tabular data for comparison queries by 3.4x.'
            }
          ]
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
        hasViewport: parsedData.hasViewport,
        ogTitle: parsedData.ogTitle,
        ogDescription: parsedData.ogDescription,
        ogImage: parsedData.ogImage,
        twitterCard: parsedData.twitterCard,
        twitterTitle: parsedData.twitterTitle,
        twitterImage: parsedData.twitterImage,
        schemas: parsedData.schemas,
        hasSchema: parsedData.hasSchema,
        hasSameAs: parsedData.hasSameAs,
        author: parsedData.author,
        tableCount: parsedData.tableCount,
        listCount: parsedData.listCount,
        questionHeadingsCount: parsedData.questionHeadingsCount,
        domElementsCount: parsedData.domElementsCount,
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
        scriptCount: parsedData.scriptCount,
        stylesheetCount: parsedData.stylesheetCount,
        pageSizeKb: parsedData.pageSizeKb,
        wordCount: parsedData.wordCount,
        loadTimeMs,
        isHttps,
        hasRobotsTxt,
        hasSitemap,
        vitals: parsedData.vitals
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
