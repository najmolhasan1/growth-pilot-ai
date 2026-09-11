import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { generateGeminiText } from '@/lib/gemini';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'website-audit-content-autofix', 10, 60000);
    if (limited) return limited;

    const body = await req.json();
    const content = (body.content || '').trim();
    const keyword = (body.keyword || '').trim() || 'SEO Optimization';
    const missingEntities = body.missingEntities || [];
    const missingQuestions = body.missingQuestions || [];

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Article content is required for auto-optimization.' },
        { status: 400 }
      );
    }

    const missingTermsList = missingEntities.map((e: any) => typeof e === 'string' ? e : e.term).filter(Boolean);
    const questionsList = missingQuestions.map((q: any) => typeof q === 'string' ? q : q.question).filter(Boolean);

    const prompt = `You are a World-Class SurferSEO / Clearscope Content Optimization Specialist.
Your task is to naturally rewrite and enrich the provided blog article to significantly boost its organic Google ranking (#1 SERP) and AI citation probability (Perplexity / ChatGPT Search Overviews).

Primary Target Keyword: "${keyword}"

Missing NLP Entities / Key Terms to naturally weave into the article:
${missingTermsList.slice(0, 10).map((t: string) => `- ${t}`).join('\n') || '- Generative Engine Optimization\n- Semantic Search\n- Schema Markup'}

Missing People-Also-Ask Questions to incorporate (either in headings, body, or a dedicated FAQ section):
${questionsList.slice(0, 4).map((q: string) => `- ${q}`).join('\n') || '- What is the main benefit?'}

CURRENT ARTICLE CONTENT:
"""
${content.slice(0, 10000)}
"""

REQUIREMENTS:
1. Preserve the author's original core voice, arguments, and Markdown formatting.
2. Naturally weave in the missing NLP entities where they make semantic sense — DO NOT keyword stuff.
3. Enhance heading hierarchy (H2, H3) and add a clear, bulleted "Key Takeaways" or concise "Frequently Asked Questions (FAQ)" section if not already present.
4. Output ONLY the updated, complete Markdown content. Do not include introductory notes, chat filler, or backticks enclosing the markdown unless the article itself has code blocks.`;

    let enrichedText = '';
    try {
      enrichedText = await generateGeminiText(prompt);
      // Clean up any outer markdown codeblock wrapper if present
      enrichedText = enrichedText.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    } catch (err: any) {
      console.warn('AI auto-fix generation failed, falling back to smart append:', err.message);
    }

    // Fallback if AI fails or returns empty
    if (!enrichedText || enrichedText.length < 50) {
      const addedFaq = `\n\n## Frequently Asked Questions & Key Takeaways\n\n` +
        questionsList.slice(0, 3).map((q: string) => `### ${q}\nUnderstanding this is essential for modern ${keyword}, improving topical authority, semantic search coverage, and generative AI citation grounding.`).join('\n\n') +
        `\n\n> **Key Takeaway:** By adopting structured data, tracking user intent, and adhering to generative engine optimization (GEO), websites achieve superior organic visibility and consistent AI overview citations.`;
      enrichedText = content + addedFaq;
    }

    return NextResponse.json({
      success: true,
      data: {
        enrichedContent: enrichedText,
        addedTerms: missingTermsList,
      },
    });
  } catch (error: any) {
    console.error('Content auto-fix error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to auto-optimize content.' },
      { status: 500 }
    );
  }
}
