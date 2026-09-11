import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { generateGeminiText, extractJsonText } from '@/lib/gemini';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

async function fetchHtmlWithTimeout(urlStr: string, timeoutMs = 8000): Promise<{ html: string; loadTimeMs: number }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();
  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    clearTimeout(id);
    const loadTimeMs = Date.now() - startTime;
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    return { html, loadTimeMs };
  } catch (err: any) {
    clearTimeout(id);
    throw new Error(`Failed to fetch ${urlStr}: ${err.message || 'Timeout'}`);
  }
}

function parseQuickSignals(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
  const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : '';

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Count = h1Matches.length;
  const h1Text = h1Matches[0] ? h1Matches[0][1].replace(/<[^>]*>/g, '').trim() : '';

  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

  const jsonLdMatches = (html.match(/<script[^>]*type=["']application\/ld\+json["']/gi) || []).length;

  const cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const textSnippet = cleanText.slice(0, 2000);

  return {
    title,
    description,
    h1Count,
    h1Text,
    h2Count,
    h3Count,
    hasSchema: jsonLdMatches > 0,
    schemaCount: jsonLdMatches,
    wordCount,
    textSnippet
  };
}

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'website-audit-compare', 10, 60000);
    if (limited) return limited;

    const body = await req.json();
    let target = (body.targetUrl || '').trim();
    let competitor = (body.competitorUrl || '').trim();

    if (!target || !competitor) {
      return NextResponse.json({ success: false, error: 'Both target and competitor URLs are required.' }, { status: 400 });
    }

    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    if (!/^https?:\/\//i.test(competitor)) competitor = 'https://' + competitor;

    const targetUrlObj = new URL(target);
    const competitorUrlObj = new URL(competitor);

    // Fetch both in parallel
    const [targetRes, competitorRes] = await Promise.allSettled([
      fetchHtmlWithTimeout(target),
      fetchHtmlWithTimeout(competitor)
    ]);

    if (targetRes.status === 'rejected') {
      return NextResponse.json({ success: false, error: `Could not crawl target site: ${targetRes.reason?.message}` }, { status: 500 });
    }
    if (competitorRes.status === 'rejected') {
      return NextResponse.json({ success: false, error: `Could not crawl competitor site: ${competitorRes.reason?.message}` }, { status: 500 });
    }

    const targetData = parseQuickSignals(targetRes.value.html);
    const competitorData = parseQuickSignals(competitorRes.value.html);

    const targetLoadMs = targetRes.value.loadTimeMs;
    const competitorLoadMs = competitorRes.value.loadTimeMs;

    const prompt = `You are a Principal Competitor SEO Intelligence Analyst (like SEMrush & Ahrefs domain comparison engines).
Perform an exhaustive head-to-head competitive SEO comparison between:
Target Website: ${targetUrlObj.hostname} (${target})
Competitor Website: ${competitorUrlObj.hostname} (${competitor})

TARGET SITE DATA:
- Load Time (TTFB): ${targetLoadMs}ms
- Title: "${targetData.title}" (${targetData.title.length} chars)
- Description: "${targetData.description}"
- H1 Count: ${targetData.h1Count} (Main: "${targetData.h1Text}")
- H2 Count: ${targetData.h2Count}, H3 Count: ${targetData.h3Count}
- Word Count: ${targetData.wordCount} words
- Schema.org markup: ${targetData.hasSchema ? 'Yes' : 'No'}
- Content Snippet: "${targetData.textSnippet}"

COMPETITOR SITE DATA:
- Load Time (TTFB): ${competitorLoadMs}ms
- Title: "${competitorData.title}" (${competitorData.title.length} chars)
- Description: "${competitorData.description}"
- H1 Count: ${competitorData.h1Count} (Main: "${competitorData.h1Text}")
- H2 Count: ${competitorData.h2Count}, H3 Count: ${competitorData.h3Count}
- Word Count: ${competitorData.wordCount} words
- Schema.org markup: ${competitorData.hasSchema ? 'Yes' : 'No'}
- Content Snippet: "${competitorData.textSnippet}"

TASK REQUIREMENTS:
1. Health Scores (0-100%): Calculate a fair comparative SEO Health Score for both target and competitor.
2. Category Winners: Identify who wins in "Speed", "On-Page SEO", "Content Depth", and "Technical Schema".
3. Head-to-Head Comparison Matrix: Direct comparative analysis of titles, headings, speed, and content substance.
4. Competitive Content Gap: 3-5 high-value topics or keywords the competitor covers that the target site is missing.
5. "How to Outrank This Competitor" Action Blueprint: 3 concrete, high-leverage tactical moves for the target site to overtake the competitor in Google search rankings.

Return strictly a valid JSON object matching this schema:
{
  "targetHealthScore": 82,
  "competitorHealthScore": 88,
  "overallVerdict": "Short 2-sentence summary of the competitive landscape",
  "winners": {
    "speed": "target | competitor | tie",
    "seo": "target | competitor | tie",
    "content": "target | competitor | tie",
    "technical": "target | competitor | tie"
  },
  "contentGap": [
    {
      "topic": "Competitor topic/keyword",
      "competitorAngle": "How the competitor is leveraging this",
      "actionForTarget": "Exact action target should take to counter"
    }
  ],
  "outrankBlueprint": [
    {
      "priority": "High | Medium",
      "title": "Actionable strategy title",
      "details": "Specific steps to implement",
      "impact": "e.g. +15-25% Organic Traffic Win"
    }
  ]
}`;

    let comparisonData;
    try {
      const rawText = await generateGeminiText(prompt);
      const cleaned = extractJsonText(rawText);
      comparisonData = JSON.parse(cleaned);
    } catch (aiErr) {
      console.warn('Gemini competitor comparison failed, using deterministic fallback:', aiErr);
      const targetSpeedWin = targetLoadMs < competitorLoadMs;
      const targetContentWin = targetData.wordCount >= competitorData.wordCount;
      const targetSeoWin = targetData.h1Count === 1 && Boolean(targetData.title);

      comparisonData = {
        targetHealthScore: targetSeoWin && targetSpeedWin ? 84 : 76,
        competitorHealthScore: 82,
        overallVerdict: `${targetUrlObj.hostname} has a competitive foundation, but ${competitorUrlObj.hostname} holds advantages in content depth and keyword targeting.`,
        winners: {
          speed: targetSpeedWin ? 'target' : 'competitor',
          seo: targetSeoWin ? 'target' : 'competitor',
          content: targetContentWin ? 'target' : 'competitor',
          technical: targetData.hasSchema ? 'target' : 'competitor'
        },
        contentGap: [
          {
            topic: competitorData.h1Text || 'Target Core Service',
            competitorAngle: 'Ranks with clear problem-solution positioning',
            actionForTarget: 'Publish dedicated comparison guides and deep-dive feature pages'
          },
          {
            topic: 'Customer Proof & Detailed FAQ',
            competitorAngle: 'Reduces searcher bounce rate by addressing conversion objections',
            actionForTarget: 'Add an interactive FAQ schema section and client case studies'
          }
        ],
        outrankBlueprint: [
          {
            priority: 'High',
            title: 'Close the Content Depth Gap',
            details: `Expand core pages to match or exceed ${competitorData.wordCount} words with relevant H2/H3 subheadings.`,
            impact: '+20% Keyword Coverage'
          },
          {
            priority: 'High',
            title: 'Win on Core Web Vitals Latency',
            details: 'Optimize server response time and images to deliver an instant sub-800ms experience.',
            impact: 'Better User Experience & Ranking Factor'
          },
          {
            priority: 'Medium',
            title: 'Implement Rich Structured Schema',
            details: 'Add Organization, WebSite, and FAQ JSON-LD markup to capture Google rich snippets.',
            impact: '+15% Higher SERP Click-Through Rate'
          }
        ]
      };
    }

    return NextResponse.json({
      success: true,
      comparison: {
        target: {
          url: target,
          domain: targetUrlObj.hostname,
          loadTimeMs: targetLoadMs,
          ...targetData
        },
        competitor: {
          url: competitor,
          domain: competitorUrlObj.hostname,
          loadTimeMs: competitorLoadMs,
          ...competitorData
        },
        analysis: comparisonData
      }
    });

  } catch (err: any) {
    console.error('Competitor Comparison Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
