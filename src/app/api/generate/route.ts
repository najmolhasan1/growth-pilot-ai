import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getWritingMode, OptimizationIntensity, WRITING_MODES, WritingMode, WritingModeId } from '@/lib/writing-modes';
import {
  extractOpenRouterJson,
  generateOpenRouterTextWithModelFallback,
  OPENROUTER_WRITING_MODEL,
  OPENROUTER_WRITING_MODELS,
} from '@/lib/openrouter';
import { generateGeminiText, GEMINI_TEXT_MODEL } from '@/lib/gemini';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface ResearchData {
  statistics?: string[];
  solutions?: string[];
  insights?: string[];
  lsiKeywords?: string[];
  researchedAt?: string;
  sources?: string[];
}

interface InternalArticle {
  title: string;
  slug: string;
}

interface GenerationPreferences {
  tone: string;
  language: string;
  formality: string;
  readingLevel: string;
  pointOfView: string;
  intensity: OptimizationIntensity;
}

interface ModeCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  category?: string;
}

interface ModeAudit {
  mode: string;
  mode_name: string;
  target: string;
  score: number;
  passed: number;
  total: number;
  checks: ModeCheck[];
}

function cleanOption(value: unknown, fallback: string, valid: string[]): string {
  return typeof value === 'string' && valid.includes(value.toLowerCase()) ? value.toLowerCase() : fallback;
}

function providerUnavailableMessage(error: unknown, stage: string): string {
  const detail = error instanceof Error ? error.message.toLowerCase() : '';
  if (detail.includes('openrouter_api_key') || detail.includes('openrouter')) {
    return `${stage} provider unavailable. Verify the OpenRouter API key, account balance and model access.`;
  }
  return `Failed to ${stage.toLowerCase()}. Verify your AI provider key and model configuration.`;
}

function currentPublishingContext() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Dhaka',
    }),
    year: now.getFullYear(),
  };
}

function normalizeBanglaDigits(value: string): string {
  return value.replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
}

function toBanglaDigits(value: string): string {
  return value.replace(/[0-9]/g, digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
}

function allowsHistoricalYears(keyword: string): boolean {
  return /\b20(?:0\d|1\d|2[0-5])\b|\bhistory\b|\bhistorical\b|\btrend over time\b/i.test(normalizeBanglaDigits(keyword));
}

async function generateWritingText(prompt: string, maxTokens: number): Promise<string> {
  try {
    const result = await generateOpenRouterTextWithModelFallback(prompt, {
      models: OPENROUTER_WRITING_MODELS,
      maxCompletionTokens: maxTokens,
      temperature: 0.35,
      title: 'GrowthPilot AI Article Writing',
      retries: 0,
    });
    return result.text;
  } catch (openRouterError) {
    console.error('OpenRouter writing failed, trying Gemini fallback:', openRouterError);
    return generateGeminiText(prompt);
  }
}

async function generateMetadata(keyword: string, mode: WritingMode, preferences: GenerationPreferences) {
  const publishingContext = currentPublishingContext();
  const yoastMetadataRequirements = mode.id === 'yoast'
    ? `Yoast metadata contract:
- Start seo_title with the exact focus keyword and keep it compact enough for a 580px title display.
- Include the exact focus keyword in meta_description and keep the description at 155 characters or less.
- Use a clean short slug containing the meaningful focus-keyphrase words, without stop words.
- Return distinct Open Graph fields and Article schema fields.`
    : '';
  const prompt = `You generate precise SEO metadata. Output only valid raw JSON, beginning with { and ending with }.
Do not invent ranking guarantees or unsupported statistics.
Current date: ${publishingContext.date}. The current year is ${publishingContext.year}.
Freshness requirement: Use ${publishingContext.year} for timely title or metadata framing. Do not mention 2024 or 2025 unless the focus keyword explicitly requests historical coverage.

Generate metadata for an article using the "${mode.name}" writing mode.
Focus keyword: "${keyword}"
Language: ${preferences.language}
Tone: ${preferences.tone}; formality: ${preferences.formality}; reading level: ${preferences.readingLevel}; point of view: ${preferences.pointOfView}.
Optimization intensity: ${preferences.intensity}.

Mode purpose: ${mode.auditTarget}
Mode instructions:
${mode.promptFocus}
${yoastMetadataRequirements}

Rules:
1. "seo_title": 50-60 characters where possible and include the keyword naturally.
2. "meta_description": maximum 155 characters and include the keyword naturally.
3. "slug": short, lowercase, hyphenated and relevant to the keyword.
4. "lsi_keywords": eight semantically relevant phrases that match search intent.
5. Table-of-contents headings must reflect this mode rather than generic filler.

Return exactly:
{
  "seo_title": "string",
  "meta_description": "string",
  "slug": "string",
  "og_title": "string",
  "og_description": "string",
  "schema_headline": "string",
  "schema_keywords": "string",
  "table_of_contents": ["section 1", "section 2", "section 3", "section 4", "section 5"],
  "lsi_keywords": ["term 1", "term 2", "term 3", "term 4", "term 5", "term 6", "term 7", "term 8"],
  "image_alts": ["description 1", "description 2"],
  "internal_links": ["topic 1", "topic 2", "topic 3"],
  "external_links": ["source type 1", "source type 2"]
}`;

  const raw = await generateWritingText(prompt, 1800);
  return JSON.parse(extractOpenRouterJson(raw)) as Record<string, unknown>;
}

const slugStopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'of', 'on', 'or', 'the', 'to', 'with']);

function toSlugWords(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
}

function buildYoastSlug(keyword: string): string {
  const contentWords = toSlugWords(keyword).filter(word => !slugStopWords.has(word));
  return (contentWords.length ? contentWords : toSlugWords(keyword)).join('-').slice(0, 75).replace(/-+$/g, '');
}

function compactText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 3).trimEnd()}...`;
}

function fallbackMetadata(keyword: string, mode: WritingMode, preferences: GenerationPreferences): Record<string, unknown> {
  const publishingContext = currentPublishingContext();
  const cleanKeyword = keyword.trim();
  const title = compactText(`${cleanKeyword}: ${publishingContext.year} Practical Guide`, 60);
  const description = compactText(`${cleanKeyword}: learn current steps, examples, SEO structure, and practical decisions for ${publishingContext.year}.`, 155);
  const lsiKeywords = Array.from(new Set([
    `${cleanKeyword} guide`,
    `${cleanKeyword} roadmap`,
    `${cleanKeyword} strategy`,
    `${cleanKeyword} examples`,
    `${cleanKeyword} best practices`,
    `${cleanKeyword} checklist`,
    `${cleanKeyword} trends`,
    `${cleanKeyword} tools`,
  ]));

  return {
    seo_title: title,
    meta_description: description,
    slug: buildYoastSlug(cleanKeyword),
    og_title: title,
    og_description: description,
    schema_headline: title,
    schema_keywords: [cleanKeyword, ...lsiKeywords].join(', '),
    schema_type: 'Article',
    table_of_contents: [
      `${cleanKeyword} overview`,
      `${cleanKeyword} current landscape`,
      `${cleanKeyword} practical strategy`,
      `${cleanKeyword} implementation checklist`,
      `${cleanKeyword} FAQ`,
    ],
    lsi_keywords: lsiKeywords,
    image_alts: [
      `${cleanKeyword} ${publishingContext.year} overview`,
      `${cleanKeyword} practical workflow`,
      `${cleanKeyword} implementation details`,
      `${cleanKeyword} key highlights`,
    ],
    internal_links: [
      `${cleanKeyword} fundamentals`,
      `${cleanKeyword} roadmap`,
      `${mode.name} content checklist`,
    ],
    external_links: [
      'Google helpful content guidance',
      'Schema.org Article documentation',
    ],
    metadata_fallback: true,
    metadata_fallback_reason: `AI metadata unavailable; generated deterministic ${preferences.language} metadata locally.`,
  };
}

function normalizeYoastMetadata(metadata: Record<string, unknown>, keyword: string): Record<string, unknown> {
  const titleTail = typeof metadata.seo_title === 'string'
    ? metadata.seo_title.replace(new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:|-]?\\s*`, 'i'), '').trim()
    : '';
  const seoTitle = compactText(`${keyword}: ${titleTail || 'A Practical Guide'}`, 60);
  const sourceDescription = typeof metadata.meta_description === 'string' ? metadata.meta_description : '';
  const metaDescription = sourceDescription.toLowerCase().includes(keyword.toLowerCase())
    ? compactText(sourceDescription, 155)
    : compactText(`${keyword}: ${sourceDescription || 'Learn the essential steps, examples, and practical choices for better results.'}`, 155);

  return {
    ...metadata,
    seo_title: seoTitle,
    meta_description: metaDescription,
    slug: buildYoastSlug(keyword),
    og_title: typeof metadata.og_title === 'string' ? metadata.og_title : seoTitle,
    og_description: typeof metadata.og_description === 'string' ? metadata.og_description : metaDescription,
    schema_headline: typeof metadata.schema_headline === 'string' ? metadata.schema_headline : seoTitle,
    schema_keywords: typeof metadata.schema_keywords === 'string' ? metadata.schema_keywords : keyword,
    schema_type: 'Article',
    lsi_keywords: Array.isArray(metadata.lsi_keywords) ? metadata.lsi_keywords : [],
    image_alts: Array.isArray(metadata.image_alts) && metadata.image_alts.length >= 3
      ? metadata.image_alts
      : [`${keyword} overview`, `${keyword} practical workflow`, `${keyword} implementation details`, `${keyword} key highlights`],
    internal_links: Array.isArray(metadata.internal_links) && metadata.internal_links.length >= 2
      ? metadata.internal_links
      : [`${keyword} fundamentals`, `${keyword} practical guide`],
    external_links: Array.isArray(metadata.external_links) && metadata.external_links.length >= 2
      ? metadata.external_links
      : ['Official documentation source', 'Independent research source'],
  };
}

function normalizeFreshMetadata(metadata: Record<string, unknown>, keyword: string): Record<string, unknown> {
  if (allowsHistoricalYears(keyword)) return metadata;
  const currentYear = String(currentPublishingContext().year);
  const currentBanglaYear = toBanglaDigits(currentYear);
  const updateYear = (value: unknown) => typeof value === 'string'
    ? value
      .replace(/\b20(?:0\d|1\d|2[0-5])\b/g, currentYear)
      .replace(/২০(?:[০-১][০-৯]|২[০-৫])/g, currentBanglaYear)
    : value;
  return {
    ...metadata,
    seo_title: updateYear(metadata.seo_title),
    meta_description: updateYear(metadata.meta_description),
    og_title: updateYear(metadata.og_title),
    og_description: updateYear(metadata.og_description),
    schema_headline: updateYear(metadata.schema_headline),
  };
}

function hasStaleYearReference(articleHtml: string, keyword: string): boolean {
  const normalized = normalizeBanglaDigits(getText(articleHtml));
  return !allowsHistoricalYears(keyword) && /\b20(?:0\d|1\d|2[0-4])\b/.test(normalized);
}

async function generateArticleHTML(
  keyword: string,
  metadata: Record<string, unknown>,
  wordCount: number,
  mode: WritingMode,
  preferences: GenerationPreferences,
  research?: ResearchData,
  revisionInstructions = '',
) {
  const publishingContext = currentPublishingContext();
  const toc = (metadata.table_of_contents as string[] || []).join(', ');
  const lsi = research?.lsiKeywords?.join(', ') || (metadata.lsi_keywords as string[] || []).join(', ');
  const internalArticles = (metadata.internal_links_pool as InternalArticle[]) || [];
  const internalLinks = internalArticles.length > 0
    ? internalArticles.map(article => `${article.title}: https://learn.programming-hero.com/blog/${article.slug}`).join('\n')
    : 'No internal URLs supplied; do not fabricate internal URLs.';
  const yoastArticleContract = mode.id === 'yoast'
    ? `YOAST 46-CHECK ARTICLE CONTRACT:
- Use the exact keyphrase naturally at 1-2% density, in the first paragraph, final paragraph and at least 30% of H2/H3 headings.
- Put an H2 or H3 at least every 300 words, keep every paragraph below 150 words, and use primarily sentences of 20 words or fewer.
- Target a Flesch reading ease above 60 by using plain words and short, direct sentences.
- Use natural transition cues appropriate to the selected language in at least one-third of sentences; avoid passive voice and complex words.
- Wrap one substantial core section in <section data-cornerstone="true">...</section>.
- Include at least two images with non-empty ALT text; at least one ALT must contain the exact keyphrase.
- Include two distinct internal links from the supplied URLs and two HTTPS authority-source links with rel="nofollow noopener".
- Use the focus keyphrase as the anchor text for one relevant internal link and avoid repeated links to the same destination.`
    : '';
  const languageQuality = preferences.language.toLowerCase() === 'bengali'
    ? `LANGUAGE QUALITY:
- Write in natural, conversational, and humanized Bangla (Banglish style) as spoken and written colloquially by people in Bangladesh. Avoid stiff, textbook, or overly formal "Shuddho" Bangla.
- Brand names, AI models, software/tool names, programming languages, and tech acronyms (e.g., Claude, ChatGPT, Gemini, SEO, API, Python, WordPress, React, HTML) MUST strictly remain in their original English script (e.g., write "Claude" and "ChatGPT", NOT "ক্লদ" or "চ্যাটজিপিটি").
- Common everyday English nouns/verbs widely used in conversational Bangla (e.g., career, roadmap, website, details, update, tutorial, marketing, tips, link) should be transliterated into Bangla script (e.g., ক্যারিয়ার, রোডম্যাপ, ওয়েবসাইট, ডিটেইলস, আপডেট, টিউটোরিয়াল, মার্কেটিং, টিপস, লিঙ্ক) or kept in English script.
- Do not insert English filler headings or English transition sentences into a Bangla article.
- Use natural, smooth Bangla transitions (such as "তবে", "ফলে", "এছাড়া", "যেমন", "সবশেষে", "আসল কথা হলো", "তাই বলে") rather than bookish or textbook transitions.`
    : `LANGUAGE QUALITY:
- Write natural ${preferences.language} prose with varied, human editorial flow rather than repetitive AI-style filler.
- Prefer concrete examples, careful caveats and source-backed explanation over generic claims.`;

  const sharedInstructions = `You are an experienced SEO editor writing one part of a single in-depth article.
Write only a valid HTML fragment for your assigned part. Do not return markdown, commentary, <html>, <head> or <body>.
Avoid generic AI filler and unsupported claims. Use concrete explanation, trade-offs, practical steps and sourced evidence.
Write in ${preferences.language}. ${languageQuality}
Current date: ${publishingContext.date}; current year: ${publishingContext.year}.
Freshness: use verified ${publishingContext.year} information when available; use a sourced 2025 data point only when explicitly labelled as the latest available evidence; never use 2024 or older data as current.
Focus keyword: "${keyword}". Writing mode: ${mode.name}. Tone=${preferences.tone}; formality=${preferences.formality}; reading level=${preferences.readingLevel}; point of view=${preferences.pointOfView}.
Mode requirements: ${mode.promptFocus}
${yoastArticleContract}
Planned topics: ${toc}
Available internal links: ${internalLinks}
Research notes: ${research ? `Collected: ${research.researchedAt || publishingContext.date}. Statistics: ${(research.statistics || []).join(' | ')}. Insights: ${(research.insights || []).join(' | ')}. Solutions: ${(research.solutions || []).join(' | ')}. Sources: ${(research.sources || []).join(' | ')}. Related terms: ${lsi}. Cite at least one supplied source URL exactly in the article. If statistics are supplied, accurately discuss at least one in the article and table.` : `No verified current research was returned; do not invent facts or statistics. Related terms: ${lsi}.`}
${revisionInstructions}`;
  const sectionPlans = [
    {
      minimumWords: Math.ceil(wordCount * 0.3),
      instructions: `Write the opening part only. Begin with one <h1>, then a hero <img> with ALT text containing the focus keyword, a substantial introduction, and a <nav class="toc"> table of contents. Add two informative H2 sections that establish context, audience needs and why the topic matters. Use the exact focus keyword naturally in the first paragraph. Close every tag in this fragment.`,
    },
    {
      minimumWords: Math.ceil(wordCount * 0.42),
      instructions: `Write the analytical middle part only. Begin with <section data-cornerstone="true"> and close it. Cover current developments, evidence, limitations and practical decision factors in depth. Include one useful <table> with comparison or action criteria, two distinct <img> tags representing relevant visual data or diagrams with descriptive ALT text in different subheadings, at least two supplied internal links, and supported source citations where factual claims occur. Use multiple clear H2/H3 headings. Close every tag in this fragment.`,
    },
    {
      minimumWords: Math.ceil(wordCount * 0.34),
      instructions: `Write the final part only. Include a step-by-step action plan, one final <img> representing a summary workflow or roadmap with descriptive ALT text, realistic recommendations, an FAQ with useful answers, and a Sources/তথ্যসূত্র section containing at least two authoritative HTTPS links with rel="nofollow noopener". End with a substantial conclusion paragraph containing the focus keyword. Do not add another H1. Close every tag in this fragment.`,
    },
  ];
  const perSectionYoastInstructions = mode.id === 'yoast'
    ? `For this assigned fragment specifically:
- Use the exact focus keyphrase naturally approximately once per 80-110 words and distribute those uses across paragraphs.
- Include the exact focus keyphrase in at least one-third of any H2/H3 headings you create.
- Include a natural transition cue in at least one-third of sentences, using ${preferences.language.toLowerCase() === 'bengali' ? 'Bangla cues such as "তবে", "ফলে", "এছাড়া", "যেমন" or "সবশেষে"' : 'cues in the selected language'}.`
    : '';
  const fragments = await Promise.all(sectionPlans.map(section => generateWritingText(
    `${sharedInstructions}
Your fragment must contain at least ${section.minimumWords} words and must not repeat another article part.
${perSectionYoastInstructions}
ASSIGNED PART:
${section.instructions}`,
    preferences.language.toLowerCase() === 'bengali' ? 8500 : 5500,
  )));

  return fragments
    .map(fragment => fragment.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim())
    .join('\n');
}

function injectRealImageUrls(html: string, fallbackKeyword: string): string {
  return html.replace(/<img\b([^>]*)\/?>/gi, (fullTag, attributes: string) => {
    const altMatch = attributes.match(/\balt=["']([^"']*)["']/i);
    const altText = altMatch ? altMatch[1].trim() : '';

    const srcMatch = attributes.match(/\bsrc=["']([^"']*)["']/i);
    const srcText = srcMatch ? srcMatch[1].trim() : '';

    const isPlaceholder = !srcText || 
                          srcText.startsWith('data:') || 
                          srcText.includes('placeholder') || 
                          srcText.includes('via.placeholder.com') ||
                          !srcText.startsWith('http') ||
                          /unsplash\.com|pexels\.com|pixabay\.com/i.test(srcText);

    if (isPlaceholder) {
      const prompt = altText || fallbackKeyword || 'high quality illustration';
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=720&nologo=true`;
      
      let newAttributes = attributes;
      if (srcMatch) {
        newAttributes = attributes.replace(/\bsrc=["']([^"']*)["']/i, `src="${imageUrl}"`);
      } else {
        newAttributes = `${attributes.trim()} src="${imageUrl}"`;
      }
      
      if (!altMatch) {
        newAttributes = `${newAttributes.trim()} alt="${fallbackKeyword || 'article image'}"`;
      }

      return `<img ${newAttributes.trim()} />`;
    }

    return fullTag;
  });
}

function normalizeGeneratedMarkup(articleHtml: string, keyword: string): string {
  const withRealImages = injectRealImageUrls(articleHtml, keyword);
  const normalizedExternalLinks = withRealImages.replace(/<a\b([^>]*href=["']https?:\/\/(?!learn\.programming-hero\.com)[^>]*?)>/gi, fullTag => {
    if (/\brel=["'][^"']*\bnofollow\b/i.test(fullTag)) return fullTag;
    if (/\brel=["']/i.test(fullTag)) {
      return fullTag.replace(/\brel=["']([^"']*)["']/i, 'rel="nofollow noopener $1"');
    }
    return fullTag.replace(/>$/, ' rel="nofollow noopener">');
  });
  const linkedInternalDestinations = new Set<string>();
  return normalizedExternalLinks.replace(
    /<a\b([^>]*\bhref=["'](https?:\/\/learn\.programming-hero\.com\/blog\/[^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi,
    (fullAnchor, _attributes: string, destination: string, anchorText: string) => {
      if (linkedInternalDestinations.has(destination)) return anchorText;
      linkedInternalDestinations.add(destination);
      return fullAnchor;
    },
  );
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureYoastSubheadingCoverage(articleHtml: string, keyword: string): string {
  const headings = Array.from(articleHtml.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi));
  const keywordLower = keyword.toLowerCase();
  const matchingHeadings = headings.filter(heading => getText(heading[1]).toLowerCase().includes(keywordLower)).length;
  let additionsNeeded = Math.max(0, Math.ceil(headings.length * 0.3) - matchingHeadings);
  if (additionsNeeded === 0) return articleHtml;

  const escapedKeyword = escapeHtmlText(keyword);
  return articleHtml.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (heading, level: string, attributes: string, content: string) => {
      if (additionsNeeded === 0 || getText(content).toLowerCase().includes(keywordLower)) return heading;
      additionsNeeded -= 1;
      return `<h${level}${attributes}>${content}: ${escapedKeyword}</h${level}>`;
    },
  );
}

function ensureYoastRelatedTermUsage(articleHtml: string, relatedTerms: string[]): string {
  const articleText = getText(articleHtml).toLowerCase();
  const usableTerm = relatedTerms.find(term => term.trim() && !articleText.includes(term.toLowerCase()));
  if (!usableTerm || relatedTerms.some(term => term.trim() && articleText.includes(term.toLowerCase()))) {
    return articleHtml;
  }
  const escapedTerm = escapeHtmlText(usableTerm);
  return articleHtml.replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/i,
    (_heading, attributes: string, content: string) => `<h2${attributes}>${content} (${escapedTerm})</h2>`,
  );
}

function countOccurrences(text: string, searchText: string): number {
  if (!searchText) return 0;
  let count = 0;
  let position = 0;
  while ((position = text.indexOf(searchText, position)) !== -1) {
    count += 1;
    position += searchText.length;
  }
  return count;
}

function getText(articleHtml: string): string {
  return articleHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countArticleWords(articleHtml: string): number {
  return getText(articleHtml).split(/\s+/).filter(Boolean).length;
}

function getArticleQualityIssues(articleHtml: string, minimumWords: number, mode: WritingMode, research?: ResearchData): string[] {
  const issues: string[] = [];
  const words = countArticleWords(articleHtml);
  if (words < minimumWords) {
    issues.push(`Article has ${words} words but must contain at least ${minimumWords} words.`);
  }
  const pairedTags = ['h1', 'h2', 'h3', 'p', 'nav', 'ul', 'ol', 'li', 'section', 'table', 'tr', 'td', 'th'];
  for (const tag of pairedTags) {
    const opened = (articleHtml.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const closed = (articleHtml.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (opened !== closed) {
      issues.push(`HTML is incomplete: ${tag} tags are not balanced.`);
      break;
    }
  }
  if (!/<table\b/i.test(articleHtml)) {
    issues.push('A useful comparison or decision table is missing.');
  }
  if (!/(sources|references|তথ্যসূত্র|উৎস)/i.test(getText(articleHtml))) {
    issues.push('A visible sources section is missing.');
  }
  if ((research?.sources || []).length > 0 && !research?.sources?.some(source => articleHtml.includes(source))) {
    issues.push('The article does not cite any supplied verified research source.');
  }
  if ((research?.statistics || []).length > 0 && !/\b202[56]\b/.test(normalizeBanglaDigits(getText(articleHtml)))) {
    issues.push('The article does not incorporate current sourced evidence from the research.');
  }
  if (mode.id === 'yoast' && !articleHtml.includes('data-cornerstone="true"')) {
    issues.push('The cornerstone section marker is missing.');
  }
  return issues;
}

function runSeoAudit(metadata: Record<string, unknown>, articleHtml: string, keyword: string, wordCount: number) {
  const kw = keyword.toLowerCase();
  const text = articleHtml.toLowerCase();
  const plainText = getText(articleHtml);
  const words = plainText.split(/\s+/).filter(Boolean);
  const first100 = words.slice(0, 100).join(' ').toLowerCase();
  const paragraphs = Array.from(articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), match =>
    getText(match[1]).toLowerCase(),
  );
  const closingText = paragraphs.at(-1) || '';
  const density = wordCount > 0 ? (countOccurrences(plainText.toLowerCase(), kw) / wordCount) * 100 : 0;
  const anchorUrls = Array.from(articleHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi), match => match[1]);

  return {
    title_has_keyword: ((metadata.seo_title as string) || '').toLowerCase().includes(kw),
    meta_under_155_chars: ((metadata.meta_description as string) || '').length <= 155,
    slug_is_clean: /^[a-z0-9-]+$/.test((metadata.slug as string) || ''),
    has_og_tags: !!(metadata.og_title && metadata.og_description),
    has_schema: !!metadata.schema_headline,
    single_h1: (articleHtml.match(/<h1\b/gi) || []).length === 1,
    keyword_in_h2_h3: (articleHtml.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/gi) || []).some(heading =>
      heading.toLowerCase().includes(kw),
    ),
    paragraphs_under_150_words: paragraphs.length > 0 && paragraphs.every(paragraph =>
      paragraph.split(/\s+/).filter(Boolean).length <= 150,
    ),
    has_table_of_contents: articleHtml.includes('class="toc"') || text.includes('table of contents'),
    word_count_over_1500: wordCount >= 1500,
    keyword_in_first_100_words: first100.includes(kw),
    keyword_density_1_to_2_percent: density >= 0.8 && density <= 2.5,
    has_lsi_keywords: (metadata.lsi_keywords as string[] || []).length >= 5,
    keyword_in_image_alt: articleHtml.toLowerCase().includes(`alt="${kw}`) || articleHtml.toLowerCase().includes(`alt='${kw}`),
    keyword_in_conclusion: closingText.includes(kw),
    has_internal_link_placeholders: anchorUrls.some(url => url.includes('learn.programming-hero.com/blog/')),
    has_external_link_placeholders: anchorUrls.some(url => url.startsWith('http') && !url.includes('learn.programming-hero.com')),
    has_images: /<img\b/i.test(articleHtml),
    has_media_presence: /<(img|video)\b/i.test(articleHtml),
    clean_url_structure: !!metadata.slug,
  };
}

function makeCheck(id: string, label: string, passed: boolean, detail: string, category?: string): ModeCheck {
  return { id, label, passed, detail, category };
}

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const withoutSilentE = cleaned.replace(/e$/, '');
  return Math.max(1, (withoutSilentE.match(/[aeiouy]+/g) || []).length);
}

function getFleschReadingEase(words: string[], sentences: string[]): number {
  if (!words.length || !sentences.length) return 0;
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  return 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
}

function buildModeAudit(
  mode: WritingMode,
  seoAudit: Record<string, boolean>,
  metadata: Record<string, unknown>,
  articleHtml: string,
  keyword: string,
  wordCount: number,
  existingArticles: InternalArticle[],
  language: string,
): ModeAudit {
  const text = getText(articleHtml).toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const words = getText(articleHtml).split(/\s+/).filter(Boolean);
  const h2Count = (articleHtml.match(/<h2\b/gi) || []).length;
  const headings = Array.from(articleHtml.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi), match => getText(match[1]).toLowerCase());
  const images = Array.from(articleHtml.matchAll(/<img\b([^>]*)>/gi), match => match[1]);
  const imageAlts = images.map(attributes => attributes.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim() || '');
  const internalLinks = articleHtml.match(/<a\b[^>]*href=["'][^"']*learn\.programming-hero\.com\/blog\//gi) || [];
  const externalLinks = articleHtml.match(/<a\b[^>]*href=["']https?:\/\/(?!learn\.programming-hero\.com)[^"']+/gi) || [];
  const anchors = Array.from(articleHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi), match => ({
    attributes: match[1],
    text: getText(match[2]).toLowerCase(),
    href: match[1].match(/\bhref=["']([^"']+)["']/i)?.[1] || '',
  }));
  const externalAnchors = anchors.filter(anchor => /^https?:\/\//i.test(anchor.href) && !anchor.href.includes('learn.programming-hero.com'));
  const internalAnchors = anchors.filter(anchor => anchor.href.includes('learn.programming-hero.com/blog/'));
  const paragraphs = Array.from(articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), match => getText(match[1]));
  const sentences = getText(articleHtml).split(/[.!?।]+/).map(sentence => sentence.trim()).filter(Boolean);
  const averageSentenceWords = sentences.length
    ? sentences.reduce((total, sentence) => total + sentence.split(/\s+/).length, 0) / sentences.length
    : 999;
  const transitionPattern = language.toLowerCase() === 'bengali'
    ? /(প্রথমত|দ্বিতীয়ত|তবে|উদাহরণ হিসেবে|উদাহরণস্বরূপ|যেমন|অন্যদিকে|ফলে|এর ফলে|এ কারণে|এই কারণে|তাই|এছাড়া|পাশাপাশি|সবশেষে|পরিশেষে|এরপর)/g
    : /\b(because|however|for example|as a result|therefore|first|next|finally|also|although|instead|meanwhile)\b/gi;
  const transitionCount = (text.match(transitionPattern) || []).length;
  const paragraphLengths = paragraphs.map(paragraph => paragraph.split(/\s+/).filter(Boolean).length);
  const sentenceStarts = sentences.map(sentence => sentence.split(/\s+/).slice(0, 2).join(' ').toLowerCase());
  const uniqueStarts = new Set(sentenceStarts);
  const passiveCount = (text.match(/\b(is|are|was|were|be|been|being)\s+\w+(ed|en)\b/g) || []).length;
  const transitionSentences = sentences.filter(sentence => {
    if (language.toLowerCase() === 'bengali') {
      return /(প্রথমত|দ্বিতীয়ত|তবে|উদাহরণ হিসেবে|উদাহরণস্বরূপ|যেমন|অন্যদিকে|ফলে|এর ফলে|এ কারণে|এই কারণে|তাই|এছাড়া|পাশাপাশি|সবশেষে|পরিশেষে|এরপর)/.test(sentence);
    }
    return /\b(because|however|for example|as a result|therefore|first|next|finally|also|although|instead|meanwhile)\b/i.test(sentence);
  }).length;
  const complexWords = words.filter(word => countSyllables(word) >= 4).length;
  const fleschScore = language.toLowerCase() === 'english' ? getFleschReadingEase(words, sentences) : null;
  const title = String(metadata.seo_title || '');
  const metaDescription = String(metadata.meta_description || '');
  const slug = String(metadata.slug || '');
  const slugWords = toSlugWords(slug);
  const keywordSlugWords = toSlugWords(keyword).filter(word => !slugStopWords.has(word));
  const relatedKeyphrases = Array.isArray(metadata.lsi_keywords) ? metadata.lsi_keywords.map(item => String(item).toLowerCase()) : [];
  const sectionSize = Math.max(1, Math.ceil(words.length / 3));
  const thirds = [0, 1, 2].map(index => words.slice(index * sectionSize, (index + 1) * sectionSize).join(' ').toLowerCase());
  const externalHosts = new Set(externalAnchors.map(anchor => {
    try { return new URL(anchor.href).hostname; } catch { return ''; }
  }).filter(Boolean));
  const bannedPhrase = /\b(unlock the potential|in conclusion|in today's digital age|guaranteed ranking|rank #1|first page guaranteed|100% guaranteed)\b/i;
  const signals: Record<string, ModeCheck> = {};
  const add = (id: string, label: string, passed: boolean, detail = label) => {
    signals[id] = makeCheck(id, label, passed, detail);
  };

  add('title_keyword', 'Focus keyword in SEO title', seoAudit.title_has_keyword);
  add('meta_length', 'Meta description within 155 characters', seoAudit.meta_under_155_chars);
  add('slug_clean', 'Clean URL slug', seoAudit.slug_is_clean);
  add('og_tags', 'Open Graph metadata present', seoAudit.has_og_tags);
  add('schema', 'Article schema metadata present', seoAudit.has_schema);
  add('single_h1', 'Exactly one H1', seoAudit.single_h1);
  add('heading_keyword', 'Keyword appears in an H2 or H3', seoAudit.keyword_in_h2_h3);
  add('short_paragraphs', 'Paragraphs stay below 150 words', seoAudit.paragraphs_under_150_words);
  add('toc', 'Table of contents included', seoAudit.has_table_of_contents);
  add('minimum_depth', `${mode.minimumWords}+ word depth target`, wordCount >= mode.minimumWords);
  add('keyword_intro', 'Keyword appears in first 100 words', seoAudit.keyword_in_first_100_words);
  add('density', 'Natural keyword density range', seoAudit.keyword_density_1_to_2_percent);
  add('lsi', 'Semantic keyword set provided', seoAudit.has_lsi_keywords);
  add('alt', 'Keyword included in image ALT text', seoAudit.keyword_in_image_alt);
  add('closing_keyword', 'Keyword appears in closing paragraph', seoAudit.keyword_in_conclusion);
  add('internal_link', 'Internal link included', seoAudit.has_internal_link_placeholders);
  add('external_link', 'External source link included', seoAudit.has_external_link_placeholders);
  add('image', 'Image element included', seoAudit.has_images);
  add('media', 'Media element included', seoAudit.has_media_presence);
  add('faq', 'FAQ section included', /\bfaq\b|frequently asked/i.test(text));
  add('two_internal', 'At least two internal links', internalLinks.length >= 2);
  add('two_external', 'At least two external source links', externalLinks.length >= 2);
  add('two_images', 'At least three images', images.length >= 3);
  add('three_h2', 'At least three H2 sections', h2Count >= 3);
  add('five_h2', 'At least five H2 sections', h2Count >= 5);
  add('step_guide', 'Step-by-step guidance included', /\bstep[- ]by[- ]step\b|\bsteps?\b/i.test(text));
  add('list', 'List-based guidance included', /<(ul|ol)\b/i.test(articleHtml));
  add('table', 'Comparison or decision table included', /<table\b/i.test(articleHtml));
  add('blockquote', 'Expert or evidence callout included', /<blockquote\b/i.test(articleHtml));
  add('entity_map', 'Entity map section included', articleHtml.includes('data-semantic="entity-map"'));
  add('relationships', 'Semantic relationships section included', articleHtml.includes('data-semantic="relationships"'));
  add('experience', 'Practical experience section included', articleHtml.includes('data-hcu="experience"'));
  add('information_gain', 'Information gain section included', articleHtml.includes('data-hcu="information-gain"'));
  add('source_evidence', 'Evidence is linked to external sources', externalLinks.length >= 2);
  add('no_promises', 'No unsupported ranking guarantee language', !bannedPhrase.test(text));
  add('readable_sentences', 'Average sentence length is readable', averageSentenceWords <= 24);
  add('concise_sentences', 'Average sentence length is concise', averageSentenceWords <= 20);
  add('transitions_four', 'At least four transition cues', transitionCount >= 4);
  add('transitions_eight', 'Strong transition-word distribution', transitionCount >= 8);
  add('varied_starts', 'Sentence openings are varied', sentences.length === 0 || uniqueStarts.size / sentences.length >= 0.7);
  add('low_passive', 'Limited passive voice pattern', sentences.length === 0 || passiveCount / sentences.length <= 0.1);
  add('brief_paragraphs', 'Average paragraph length is concise', paragraphLengths.length > 0 && paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length <= 80);
  add('paragraph_depth', 'Enough developed paragraphs for readability analysis', paragraphs.length >= 8);
  add('heading_distribution', 'Subheadings distribute content', h2Count >= 4 && paragraphs.length >= h2Count);
  add('definition', 'Topic definition or explanation included', /\b(is a|refers to|means|defined as|what is)\b/i.test(text));
  add('comparison', 'Comparison language included', /\b(compare|comparison|versus| vs\.?|difference)\b/i.test(text));
  add('audience', 'Specific audience guidance included', /\bwho this is for|for teams|for beginners|for professionals|audience\b/i.test(text));
  add('limitations', 'Limitations or trade-offs discussed', /\blimitation|trade-off|drawback|caveat|avoid\b/i.test(text));
  add('action', 'Next action or recommendation included', /\bnext step|recommend|start by|action\b/i.test(text));
  add('freshness', 'Current-year relevance signaled', /\b2026\b/.test(text));

  if (mode.id === 'yoast') {
    const yoastChecks: ModeCheck[] = [];
    const addYoast = (category: string, id: string, label: string, passed: boolean, detail: string) => {
      yoastChecks.push(makeCheck(id, label, passed, detail, category));
    };
    const headingKeyphraseRatio = headings.length
      ? headings.filter(heading => heading.includes(keywordLower)).length / headings.length
      : 0;
    const firstParagraph = (paragraphs[0] || '').toLowerCase();
    const titleApproxPixels = title.length * 9;
    const internalSuggestions = Array.isArray(metadata.internal_links) ? metadata.internal_links.length : 0;
    const titleDuplicate = existingArticles.some(article => article.title.toLowerCase() === title.toLowerCase());
    const keyphraseDuplicate = existingArticles.some(article => article.title.toLowerCase().includes(keywordLower));

    addYoast('Keyphrase Analysis', 'yoast_density', 'Keyphrase density (1-2%)', seoAudit.keyword_density_1_to_2_percent, 'Measured from article body occurrences.');
    addYoast('Keyphrase Analysis', 'yoast_intro', 'Keyphrase in introduction', seoAudit.keyword_in_first_100_words, 'Exact focus keyphrase must appear in the opening 100 words.');
    addYoast('Keyphrase Analysis', 'yoast_conclusion', 'Keyphrase in conclusion', seoAudit.keyword_in_conclusion, 'Exact focus keyphrase must appear in the closing paragraph.');
    addYoast('Keyphrase Analysis', 'yoast_distribution', 'Keyphrase distribution', thirds.every(section => section.includes(keywordLower)), 'Checks presence across beginning, middle and ending thirds.');
    addYoast('Keyphrase Analysis', 'yoast_subheading_ratio', 'Keyphrase in 30%+ subheadings', headingKeyphraseRatio >= 0.3, `${Math.round(headingKeyphraseRatio * 100)}% of H2/H3 headings contain the keyphrase.`);
    addYoast('Keyphrase Analysis', 'yoast_synonyms', 'Synonym usage', relatedKeyphrases.some(phrase => text.includes(phrase)), 'At least one supplied related keyphrase must occur in content.');
    addYoast('Keyphrase Analysis', 'yoast_keyphrase_length', 'Keyphrase length check', keyword.trim().split(/\s+/).length <= 6, 'Focus keyphrase is measured against a six-word usability maximum.');
    addYoast('Keyphrase Analysis', 'yoast_duplicate_keyphrase', 'Duplicate keyphrase prevention', !keyphraseDuplicate, 'Compared with titles in the available existing-article index.');
    addYoast('Keyphrase Analysis', 'yoast_related_keyphrases', 'Related keyphrases', relatedKeyphrases.length >= 5, 'At least five semantic related phrases provided.');
    addYoast('Keyphrase Analysis', 'yoast_first_paragraph', 'Keyphrase in first paragraph', firstParagraph.includes(keywordLower), 'Exact focus keyphrase checked in the first paragraph.');

    addYoast('Title & Meta Tags', 'yoast_title_width', 'SEO title pixel width (<=580px)', titleApproxPixels <= 580, `Approximate rendered title width: ${titleApproxPixels}px.`);
    addYoast('Title & Meta Tags', 'yoast_title_beginning', 'Keyphrase at title beginning', title.toLowerCase().startsWith(keywordLower), 'SEO title must begin with the exact focus keyphrase.');
    addYoast('Title & Meta Tags', 'yoast_meta_length', 'Meta description length (<=155 chars)', metaDescription.length <= 155, `Meta description length: ${metaDescription.length} characters.`);
    addYoast('Title & Meta Tags', 'yoast_meta_unique', 'Meta uniqueness check', metaDescription.toLowerCase() !== title.toLowerCase(), 'Description is distinct from this title; cross-site duplicates require stored meta inventory.');
    addYoast('Title & Meta Tags', 'yoast_open_graph', 'Open Graph optimization', seoAudit.has_og_tags, 'Open Graph title and description are present.');
    addYoast('Title & Meta Tags', 'yoast_schema_type', 'Schema type selection', metadata.schema_type === 'Article' || seoAudit.has_schema, 'Article schema metadata is selected.');
    addYoast('Title & Meta Tags', 'yoast_title_unique', 'Title uniqueness', !titleDuplicate, 'Compared with titles in the available existing-article index.');

    addYoast('Content Structure', 'yoast_single_h1', 'Single H1 check', seoAudit.single_h1, 'Article body must have exactly one H1.');
    addYoast('Content Structure', 'yoast_heading_spacing', 'Subheading distribution (every 300 words)', headings.length >= Math.ceil(wordCount / 300), `${headings.length} H2/H3 headings for ${wordCount} words.`);
    addYoast('Content Structure', 'yoast_paragraph_length', 'Paragraph length (<=150 words)', seoAudit.paragraphs_under_150_words, 'Every paragraph is checked against 150 words.');
    addYoast('Content Structure', 'yoast_toc', 'Table of contents', seoAudit.has_table_of_contents, 'A navigable table of contents is present.');
    addYoast('Content Structure', 'yoast_list', 'List inclusion', /<(ul|ol)\b/i.test(articleHtml), 'At least one structured list is present.');
    addYoast('Content Structure', 'yoast_structure', 'Text structure analysis', h2Count >= 5 && /\bfaq\b|frequently asked/i.test(text), 'Requires five H2 sections and an FAQ block.');
    addYoast('Content Structure', 'yoast_cornerstone', 'Cornerstone content marking', articleHtml.includes('data-cornerstone="true"'), 'Requires a core section marked data-cornerstone="true".');

    addYoast('Readability', 'yoast_flesch', 'Flesch reading ease (60+)', fleschScore === null || fleschScore >= 60, fleschScore === null ? 'Flesch is English-only; non-English content uses remaining readability checks.' : `Calculated Flesch score: ${fleschScore.toFixed(1)}.`);
    addYoast('Readability', 'yoast_passive', 'Passive voice (<10%)', sentences.length > 0 && passiveCount / sentences.length < 0.1, `${passiveCount} passive-pattern sentences detected from ${sentences.length}.`);
    addYoast('Readability', 'yoast_transitions', 'Transition words (30%+)', sentences.length > 0 && transitionSentences / sentences.length >= 0.3, `${Math.round((transitionSentences / Math.max(1, sentences.length)) * 100)}% of sentences include a transition cue.`);
    addYoast('Readability', 'yoast_sentence_length', 'Sentence length (<=20 words)', averageSentenceWords <= 20, `Average sentence length: ${averageSentenceWords.toFixed(1)} words.`);
    addYoast('Readability', 'yoast_consecutive', 'Consecutive sentences check', sentences.length > 0 && uniqueStarts.size / sentences.length >= 0.7, 'Checks repeated sentence openings.');
    addYoast('Readability', 'yoast_complexity', 'Word complexity analysis', words.length > 0 && complexWords / words.length <= 0.1, `${Math.round((complexWords / Math.max(1, words.length)) * 100)}% complex-word estimate.`);

    addYoast('Links', 'yoast_outbound', 'Minimum outbound links', externalAnchors.length >= 2, `${externalAnchors.length} external links found; minimum is two.`);
    addYoast('Links', 'yoast_internal', 'Minimum internal links', internalAnchors.length >= 2, `${internalAnchors.length} internal links found; minimum is two.`);
    addYoast('Links', 'yoast_orphaned', 'Orphaned content check', internalAnchors.length >= 2, 'Internal outbound links prevent isolation; inbound orphan status requires a published-site crawl.');
    addYoast('Links', 'yoast_competing', 'Competing links detection', new Set(internalAnchors.map(anchor => anchor.href)).size === internalAnchors.length, 'Checks distinct internal destination targets; a cited external source may be referenced more than once.');
    addYoast('Links', 'yoast_authority', 'Link authority type', externalHosts.size >= 2, 'Requires HTTPS external references from at least two distinct hosts.');
    addYoast('Links', 'yoast_nofollow', 'Nofollow external option', externalAnchors.length >= 2 && externalAnchors.every(anchor => /\brel=["'][^"']*\bnofollow\b/i.test(anchor.attributes)), 'External links include rel="nofollow".');
    addYoast('Links', 'yoast_suggestions', 'Internal linking suggestions', internalSuggestions >= 2, `${internalSuggestions} internal-link suggestions returned in metadata.`);
    addYoast('Links', 'yoast_anchor', 'Keyphrase-linked text', internalAnchors.some(anchor => anchor.text.includes(keywordLower)), 'One internal anchor must contain the focus keyphrase.');

    addYoast('Images', 'yoast_image_alt', 'Images with ALT tags', imageAlts.length >= 3 && imageAlts.every(Boolean), `${imageAlts.filter(Boolean).length} images with ALT text found.`);
    addYoast('Images', 'yoast_alt_keyphrase', 'Keyphrase in ALT attribute', imageAlts.some(alt => alt.toLowerCase().includes(keywordLower)), 'At least one ALT text includes the focus keyphrase.');
    addYoast('Images', 'yoast_image_count', 'Minimum image count', images.length >= 3, `${images.length} image elements found; minimum is three.`);
    addYoast('Images', 'yoast_alt_enforced', 'ALT required enforcement', images.length > 0 && images.length === imageAlts.filter(Boolean).length, 'Every generated image must have non-empty ALT text.');

    addYoast('URL & Slug', 'yoast_slug_keyphrase', 'Keyphrase in slug', keywordSlugWords.length > 0 && keywordSlugWords.every(word => slugWords.includes(word)), 'Meaningful focus-keyphrase words must occur in slug.');
    addYoast('URL & Slug', 'yoast_stop_words', 'Stop word removal', !slugWords.some(word => slugStopWords.has(word)), 'Common stop words are removed from the generated slug.');
    addYoast('URL & Slug', 'yoast_slug_length', 'Maximum slug length', slug.length <= 75, `Slug length: ${slug.length} characters.`);
    addYoast('URL & Slug', 'yoast_clean_url', 'Clean URL structure', seoAudit.slug_is_clean, 'Slug uses lowercase URL-safe characters and hyphens.');

    if (yoastChecks.length !== mode.measuredCheckCount) {
      throw new Error('Invalid Yoast audit catalog configuration.');
    }
    const yoastPassed = yoastChecks.filter(check => check.passed).length;
    return {
      mode: mode.id,
      mode_name: mode.name,
      target: mode.auditTarget,
      score: Math.round((yoastPassed / yoastChecks.length) * 100),
      passed: yoastPassed,
      total: yoastChecks.length,
      checks: yoastChecks,
    };
  }

  const catalog: Record<WritingModeId, string[]> = {
    'fully-optimized': [
      'title_keyword', 'meta_length', 'slug_clean', 'og_tags', 'schema', 'single_h1', 'heading_keyword',
      'short_paragraphs', 'toc', 'minimum_depth', 'keyword_intro', 'density', 'lsi', 'alt',
      'closing_keyword', 'internal_link', 'external_link', 'image', 'media', 'faq',
    ],
    'rank-math': [
      'title_keyword', 'meta_length', 'slug_clean', 'og_tags', 'schema', 'single_h1', 'heading_keyword',
      'short_paragraphs', 'toc', 'minimum_depth', 'keyword_intro', 'density', 'lsi', 'alt',
      'closing_keyword', 'internal_link', 'external_link', 'image', 'media', 'faq', 'two_internal',
      'two_external', 'two_images', 'three_h2', 'step_guide', 'list', 'freshness',
    ],
    'semantic-nlp': [
      'minimum_depth', 'keyword_intro', 'toc', 'short_paragraphs', 'lsi', 'entity_map', 'relationships',
      'source_evidence', 'definition', 'comparison', 'faq', 'table', 'three_h2', 'external_link', 'action',
    ],
    yoast: [],
    hybrid: [
      'title_keyword', 'meta_length', 'slug_clean', 'schema', 'keyword_intro', 'heading_keyword', 'density',
      'toc', 'minimum_depth', 'short_paragraphs', 'two_internal', 'two_external', 'two_images', 'faq',
      'entity_map', 'experience', 'table', 'source_evidence', 'readable_sentences', 'limitations',
      'action', 'no_promises',
    ],
    hcu: [
      'minimum_depth', 'short_paragraphs', 'toc', 'keyword_intro', 'density', 'faq', 'two_external',
      'source_evidence', 'experience', 'information_gain', 'no_promises', 'audience', 'limitations',
      'action', 'readable_sentences', 'varied_starts', 'low_passive', 'brief_paragraphs', 'step_guide',
      'list', 'table', 'blockquote', 'external_link', 'heading_distribution', 'freshness', 'comparison',
    ],
  };
  const checks = catalog[mode.id].map(id => signals[id]);
  if (checks.length !== mode.measuredCheckCount || checks.some(check => !check)) {
    throw new Error(`Invalid ${mode.name} audit catalog configuration.`);
  }

  const passed = checks.filter(check => check.passed).length;
  return {
    mode: mode.id,
    mode_name: mode.name,
    target: mode.auditTarget,
    score: Math.round((passed / checks.length) * 100),
    passed,
    total: checks.length,
    checks,
  };
}

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'generate', 5, 60_000);
    if (limited) return limited;

    const body = await req.json();
    const {
      keyword,
      mode: requestedMode = 'fully-optimized',
      wordCount: requestedWordCount = 1500,
      language = 'English',
      tone = 'informative',
      research,
    } = body;

    if (typeof keyword !== 'string' || !keyword.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }
    if (typeof requestedMode !== 'string' || !WRITING_MODES.some(mode => mode.id === requestedMode)) {
      return NextResponse.json({ error: 'Unknown writing mode' }, { status: 400 });
    }
    if (keyword.length > 200 || !Number.isInteger(requestedWordCount) || requestedWordCount < 500 || requestedWordCount > 5000) {
      return NextResponse.json({ error: 'Invalid generation settings' }, { status: 400 });
    }

    const selectedMode = getWritingMode(requestedMode);
    const wordCount = Math.max(requestedWordCount, selectedMode.minimumWords);
    const preferences: GenerationPreferences = {
      language: typeof language === 'string' ? language.slice(0, 40) : 'English',
      tone: typeof tone === 'string' ? tone.slice(0, 30) : 'informative',
      formality: cleanOption(body.formality, 'balanced', ['casual', 'balanced', 'formal']),
      readingLevel: cleanOption(body.readingLevel, 'general', ['simple', 'general', 'expert']),
      pointOfView: cleanOption(body.pointOfView, 'second person', ['second person', 'first person', 'third person']),
      intensity: cleanOption(body.intensity, 'recommended', ['relaxed', 'recommended', 'strict']) as OptimizationIntensity,
    };

    let existingArticles: InternalArticle[] = [];
    try {
      const filePath = path.join(process.cwd(), 'src/data/existing_articles.json');
      existingArticles = JSON.parse(fs.readFileSync(filePath, 'utf8')) as InternalArticle[];
    } catch (error) {
      console.error('Failed to load existing articles:', error);
    }

    let metadata: Record<string, unknown>;
    try {
      metadata = await generateMetadata(keyword.trim(), selectedMode, preferences);
      metadata = normalizeFreshMetadata(metadata, keyword.trim());
      if (selectedMode.id === 'yoast') {
        metadata = normalizeYoastMetadata(metadata, keyword.trim());
      }
      const suppliedRelatedTerms = (research as ResearchData | undefined)?.lsiKeywords || [];
      metadata.lsi_keywords = Array.from(new Set([
        ...((metadata.lsi_keywords as string[] | undefined) || []),
        ...suppliedRelatedTerms,
      ]));
      metadata.internal_links_pool = existingArticles;
    } catch (error) {
      console.error('Metadata generation failed:', error);
      metadata = fallbackMetadata(keyword.trim(), selectedMode, preferences);
      metadata = normalizeFreshMetadata(metadata, keyword.trim());
      if (selectedMode.id === 'yoast') {
        metadata = normalizeYoastMetadata(metadata, keyword.trim());
      }
      const suppliedRelatedTerms = (research as ResearchData | undefined)?.lsiKeywords || [];
      metadata.lsi_keywords = Array.from(new Set([
        ...((metadata.lsi_keywords as string[] | undefined) || []),
        ...suppliedRelatedTerms,
      ]));
      metadata.internal_links_pool = existingArticles;
    }

    let articleHtml: string;
    try {
      articleHtml = normalizeGeneratedMarkup(await generateArticleHTML(
        keyword.trim(),
        metadata,
        wordCount,
        selectedMode,
        preferences,
        research as ResearchData | undefined,
      ), keyword.trim());
      if (selectedMode.id === 'yoast') {
        articleHtml = ensureYoastSubheadingCoverage(articleHtml, keyword.trim());
        articleHtml = ensureYoastRelatedTermUsage(articleHtml, (metadata.lsi_keywords as string[] | undefined) || []);
      }
    } catch (error) {
      console.error('Article generation failed:', error);
      return NextResponse.json({ error: providerUnavailableMessage(error, 'Article generation') }, { status: 503 });
    }

    let qualityIssues = getArticleQualityIssues(articleHtml, wordCount, selectedMode, research as ResearchData | undefined);
    if (hasStaleYearReference(articleHtml, keyword.trim())) {
      qualityIssues.push('The draft contains outdated pre-2025 year references for a current-topic article.');
    }
    if (qualityIssues.length > 0) {
      try {
        articleHtml = normalizeGeneratedMarkup(await generateArticleHTML(
          keyword.trim(),
          metadata,
          wordCount,
          selectedMode,
          preferences,
          research as ResearchData | undefined,
          `QUALITY REWRITE REQUIRED: The previous draft is not publishable because:
- ${qualityIssues.join('\n- ')}
Return a full replacement article in ${preferences.language}. It must be complete, natural, deeply researched, source-backed, valid HTML, and at least ${wordCount} words. Do not patch or append filler to the previous draft.`,
        ), keyword.trim());
        if (selectedMode.id === 'yoast') {
          articleHtml = ensureYoastSubheadingCoverage(articleHtml, keyword.trim());
          articleHtml = ensureYoastRelatedTermUsage(articleHtml, (metadata.lsi_keywords as string[] | undefined) || []);
        }
      } catch (qualityError) {
        console.error('Article quality rewrite failed:', qualityError);
        return NextResponse.json({ error: 'Failed to produce a complete article that satisfies the selected length and structure. Please retry.' }, { status: 503 });
      }
    }

    qualityIssues = getArticleQualityIssues(articleHtml, wordCount, selectedMode, research as ResearchData | undefined);
    if (hasStaleYearReference(articleHtml, keyword.trim())) {
      qualityIssues.push('The draft contains outdated pre-2025 year references for a current-topic article.');
    }
    if (qualityIssues.length > 0) {
      return NextResponse.json(
        { error: `Generated draft was rejected: ${qualityIssues.join(' ')}` },
        { status: 503 },
      );
    }

    const plainText = getText(articleHtml);
    const actualWordCount = plainText.split(/\s+/).filter(Boolean).length;
    const seoAudit = runSeoAudit(metadata, articleHtml, keyword.trim(), actualWordCount);
    const modeAudit = buildModeAudit(selectedMode, seoAudit, metadata, articleHtml, keyword.trim(), actualWordCount, existingArticles, preferences.language);

    const keywordCount = countOccurrences(plainText.toLowerCase(), keyword.trim().toLowerCase());
    const keywordDensity = actualWordCount > 0 ? Number(((keywordCount / actualWordCount) * 100).toFixed(2)) : 0;

    const data = {
      seo_title: metadata.seo_title as string,
      meta_description: metadata.meta_description as string,
      slug: metadata.slug as string,
      og_tags: {
        'og:title': metadata.og_title as string,
        'og:description': metadata.og_description as string,
        'og:type': 'article',
        'og:image': 'https://via.placeholder.com/1200x630',
      },
      schema: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: metadata.schema_headline as string,
        description: metadata.meta_description as string,
        keywords: metadata.schema_keywords as string,
      },
      table_of_contents: metadata.table_of_contents as string[],
      lsi_keywords: metadata.lsi_keywords as string[],
      article_html: articleHtml,
      word_count: actualWordCount,
      keyword_density_percent: keywordDensity,
      images: (metadata.image_alts as string[] || []).map(alt => ({ alt, caption: alt })),
      internal_link_placeholders: metadata.internal_links as string[],
      external_link_placeholders: metadata.external_links as string[],
      seo_audit: seoAudit,
      mode_audit: modeAudit,
      generation_settings: {
        requested_words: requestedWordCount,
        target_words: wordCount,
        provider: 'OpenRouter with Gemini fallback',
        writing_model: `${OPENROUTER_WRITING_MODEL} / fallback ${GEMINI_TEXT_MODEL}`,
        current_as_of: currentPublishingContext().date,
        ...preferences,
      },
    };

    return NextResponse.json({
      success: true,
      data,
      keyword: keyword.trim(),
      mode: selectedMode.id,
      mode_name: selectedMode.name,
    });
  } catch (error: unknown) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
