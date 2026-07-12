export type WritingModeId =
  | 'fully-optimized'
  | 'rank-math'
  | 'semantic-nlp'
  | 'yoast'
  | 'hybrid'
  | 'hcu';

export type OptimizationIntensity = 'relaxed' | 'recommended' | 'strict';

export interface WritingMode {
  id: WritingModeId;
  name: string;
  shortName: string;
  tagline: string;
  publicCheckCount: string;
  measuredCheckCount: number;
  minimumWords: number;
  auditTarget: string;
  rules: string[];
  promptFocus: string;
}

export interface CheckpointGroup {
  title: string;
  checks: string[];
}

export const YOAST_CHECKPOINT_GROUPS: CheckpointGroup[] = [
  {
    title: 'Keyphrase Analysis',
    checks: [
      'Keyphrase density (1-2%)',
      'Keyphrase in introduction',
      'Keyphrase in conclusion',
      'Keyphrase distribution',
      'Keyphrase in 30%+ subheadings',
      'Synonym usage',
      'Keyphrase length check',
      'Duplicate keyphrase prevention',
      'Related keyphrases',
      'Keyphrase in first paragraph',
    ],
  },
  {
    title: 'Title & Meta Tags',
    checks: [
      'SEO title pixel width (<=580px)',
      'Keyphrase at title beginning',
      'Meta description length (<=155 chars)',
      'Meta uniqueness check',
      'Open Graph optimization',
      'Schema type selection',
      'Title uniqueness',
    ],
  },
  {
    title: 'Content Structure',
    checks: [
      'Single H1 check',
      'Subheading distribution (every 300 words)',
      'Paragraph length (<=150 words)',
      'Table of contents',
      'List inclusion',
      'Text structure analysis',
      'Cornerstone content marking',
    ],
  },
  {
    title: 'Readability',
    checks: [
      'Flesch reading ease (60+)',
      'Passive voice (<10%)',
      'Transition words (30%+)',
      'Sentence length (<=20 words)',
      'Consecutive sentences check',
      'Word complexity analysis',
    ],
  },
  {
    title: 'Links',
    checks: [
      'Minimum outbound links',
      'Minimum internal links',
      'Orphaned content check',
      'Competing links detection',
      'Link authority type',
      'Nofollow external option',
      'Internal linking suggestions',
      'Keyphrase-linked text',
    ],
  },
  {
    title: 'Images',
    checks: [
      'Images with ALT tags',
      'Keyphrase in ALT attribute',
      'Minimum image count',
      'ALT required enforcement',
    ],
  },
  {
    title: 'URL & Slug',
    checks: [
      'Keyphrase in slug',
      'Stop word removal',
      'Maximum slug length',
      'Clean URL structure',
    ],
  },
];

export const WRITING_MODES: WritingMode[] = [
  {
    id: 'fully-optimized',
    name: 'Fully SEO Optimized',
    shortName: 'Fully SEO',
    tagline: 'Standard on-page SEO foundation',
    publicCheckCount: '20',
    measuredCheckCount: 20,
    minimumWords: 1500,
    auditTarget: 'Core SEO readiness',
    rules: [
      'Focus keyword in title, intro and headings',
      'Metadata, Open Graph and Article schema',
      'Table of contents and clean structure',
      'Natural keyword coverage and related terms',
      'Useful links and image ALT guidance',
      'Clear FAQ and actionable closing section',
    ],
    promptFocus: `Build an excellent standard SEO article.
- Use one H1, a table of contents, descriptive H2/H3 headings and a practical FAQ.
- Place the focus keyword naturally in the title, introduction, at least one subheading and final action-oriented paragraph.
- Include helpful internal and external HTML links and image elements with descriptive ALT text.`,
  },
  {
    id: 'rank-math',
    name: 'Rank Math Optimized',
    shortName: 'Rank Math',
    tagline: 'Score-focused keyword placement',
    publicCheckCount: '27',
    measuredCheckCount: 27,
    minimumWords: 1500,
    auditTarget: 'Rank Math-style on-page signals',
    rules: [
      'Keyword in SEO title, URL and first 10%',
      'Keyword in subheadings and image ALT',
      'Internal and external link coverage',
      'Table of contents and media presence',
      'Specific title framing where truthful',
      'Natural 1-2% keyword coverage',
    ],
    promptFocus: `Optimize for Rank Math-style checks without keyword stuffing.
- Put the keyword in the SEO title, slug, first 10% of body text, an H2/H3, image ALT text and final paragraph.
- Include a table of contents, at least two useful internal links and two authoritative external links.
- Prefer a specific title with a year or number when truthful and useful.`,
  },
  {
    id: 'semantic-nlp',
    name: 'Semantic NLP SEO',
    shortName: 'Semantic NLP',
    tagline: 'Entity-based topical coverage',
    publicCheckCount: '15',
    measuredCheckCount: 15,
    minimumWords: 1800,
    auditTarget: 'Entity and topic coverage',
    rules: [
      'Intent and entity map coverage',
      'Related entities and co-occurrence terms',
      'Semantic relationship explanations',
      'Definitions suitable for snippets',
      'Topical gaps answered in FAQs',
      'Sources supporting factual claims',
    ],
    promptFocus: `Write an entity-rich semantic SEO article.
- Add <section data-semantic="entity-map"><h2>Entity Map</h2>...</section> describing major related entities.
- Add <section data-semantic="relationships"><h2>How the Concepts Connect</h2>...</section> with subject-relationship-object explanations.
- Cover adjacent questions, definitions, comparisons and cited evidence rather than repeating the keyword.`,
  },
  {
    id: 'yoast',
    name: 'Yoast SEO Optimized',
    shortName: 'Yoast SEO',
    tagline: 'Readable, green-light structure',
    publicCheckCount: '46',
    measuredCheckCount: 46,
    minimumWords: 1500,
    auditTarget: 'Yoast-style SEO and readability',
    rules: [
      '10 keyphrase analysis checks',
      '7 title and meta tag checks',
      '7 content structure checks',
      '6 readability checks',
      '8 link checks',
      '4 image checks and 4 URL checks',
    ],
    promptFocus: `Optimize for Yoast-style SEO and readability checks.
- Put the exact focus keyphrase in the opening paragraph, conclusion, image ALT text and at least 30% of H2/H3 headings, with natural 1-2% distribution.
- Keep paragraphs below 150 words; place useful subheadings no more than roughly 300 words apart; use concise active-voice sentences and common wording.
- Use transition words naturally across sections; include a table of contents, lists, at least two images with ALT text, and a clearly marked cornerstone section.
- Include at least two internal links and two authoritative external links; link the keyphrase once to a relevant internal page without competing repeated anchors.`,
  },
  {
    id: 'hybrid',
    name: 'Hybrid Maximum SEO',
    shortName: 'Hybrid Max',
    tagline: 'SEO, readability and semantic depth',
    publicCheckCount: '22+',
    measuredCheckCount: 22,
    minimumWords: 2500,
    auditTarget: 'Combined advanced optimization',
    rules: [
      'Rank Math-style keyword targeting',
      'Yoast-style readability discipline',
      'Entity map and topical relationships',
      'Evidence, links, FAQ and schema readiness',
      'Detailed comparison or decision framework',
      'High-depth original recommendations',
    ],
    promptFocus: `Combine rigorous on-page SEO, readability and semantic depth.
- Follow Rank Math-style placement and Yoast-style short, readable paragraphs.
- Include <section data-semantic="entity-map"><h2>Entity Map</h2>...</section> and <section data-hcu="experience"><h2>Practical Experience</h2>...</section>.
- Include a comparison table, evidence-linked claims, a detailed FAQ and an original decision framework.`,
  },
  {
    id: 'hcu',
    name: 'HCU Recovery Mode',
    shortName: 'HCU',
    tagline: 'Helpful content and information gain',
    publicCheckCount: '26',
    measuredCheckCount: 26,
    minimumWords: 2000,
    auditTarget: 'Helpful-content quality signals',
    rules: [
      'Specific audience and problem definition',
      'Experience-based practical guidance',
      'Evidence-linked claims and caveats',
      'Original information-gain section',
      'No filler or unsupported promises',
      'Clear decision and next-step advice',
    ],
    promptFocus: `Prioritize helpful-content quality and information gain over keyword repetition.
- Add <section data-hcu="experience"><h2>Practical Experience</h2>...</section> with concrete workflows, limitations and mistakes to avoid.
- Add <section data-hcu="information-gain"><h2>What Most Guides Miss</h2>...</section> with useful distinctions.
- Cite authoritative external sources for factual claims, state uncertainty honestly and avoid exaggerated guarantees.`,
  },
];

export function getWritingMode(value: unknown): WritingMode {
  return WRITING_MODES.find(mode => mode.id === value) || WRITING_MODES[0];
}
