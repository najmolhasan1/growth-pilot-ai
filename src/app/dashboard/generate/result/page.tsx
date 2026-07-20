'use client';

import { type MouseEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, Copy, Download, ArrowLeft,
  FileText, Link2, Image as ImageIcon, Code2, ExternalLink,
  Globe, Share2, RefreshCw, Briefcase, MessageCircle
} from 'lucide-react';
import { getWritingMode } from '@/lib/writing-modes';
import { copyTextSafely } from '@/lib/clipboard';
import {
  articleToMarkdown,
  articleToPlainText,
  articleFileBaseName,
  buildArticleHtml,
  buildDocx,
  buildWordHtmlDocument,
} from '@/lib/article-export';

interface SeoAudit {
  title_has_keyword: boolean;
  meta_under_155_chars: boolean;
  slug_is_clean: boolean;
  has_og_tags: boolean;
  has_schema: boolean;
  single_h1: boolean;
  keyword_in_h2_h3: boolean;
  paragraphs_under_150_words: boolean;
  has_table_of_contents: boolean;
  word_count_over_1500: boolean;
  keyword_in_first_100_words: boolean;
  keyword_density_1_to_2_percent: boolean;
  has_lsi_keywords: boolean;
  keyword_in_image_alt: boolean;
  keyword_in_conclusion: boolean;
  has_internal_link_placeholders: boolean;
  has_external_link_placeholders: boolean;
  has_images: boolean;
  has_media_presence: boolean;
  clean_url_structure: boolean;
}

interface ResultData {
  seo_title: string;
  meta_description: string;
  slug: string;
  og_tags: Record<string, string>;
  schema: Record<string, unknown>;
  table_of_contents: string[];
  lsi_keywords: string[];
  article_html: string;
  word_count: number;
  keyword_density_percent: number;
  images: Array<{ alt: string; caption: string }>;
  internal_link_placeholders: string[];
  external_link_placeholders: string[];
  seo_audit: SeoAudit;
  mode_audit?: ModeAudit;
  generation_settings?: GenerationSettings;
}

interface ModeAuditCheck {
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
  checks: ModeAuditCheck[];
}

interface GenerationSettings {
  requested_words: number;
  target_words: number;
  tone: string;
  language: string;
  formality: string;
  readingLevel: string;
  pointOfView: string;
  intensity: string;
  provider?: string;
  writing_model?: string;
  current_as_of?: string;
}

interface SocialSnippets {
  linkedin: string;
  facebook: string;
  twitter: string[];
}

interface StoredArticleResult {
  id: string;
  fullData?: { data: ResultData; keyword: string; mode?: string; mode_name?: string };
}

const auditLabels: Record<string, string> = {
  title_has_keyword: 'SEO title has focus keyword',
  meta_under_155_chars: 'Meta description ≤155 chars',
  slug_is_clean: 'Clean URL slug',
  has_og_tags: 'Open Graph tags present',
  has_schema: 'Schema markup (JSON-LD)',
  single_h1: 'Single H1 tag',
  keyword_in_h2_h3: 'Keyword in H2/H3 headings',
  paragraphs_under_150_words: 'Paragraphs ≤150 words',
  has_table_of_contents: 'Table of contents',
  word_count_over_1500: 'Word count 1500+',
  keyword_in_first_100_words: 'Keyword in first 100 words',
  keyword_density_1_to_2_percent: 'Keyword density 1-2%',
  has_lsi_keywords: 'LSI keywords integrated',
  keyword_in_image_alt: 'Keyword in image ALT tags',
  keyword_in_conclusion: 'Keyword in closing paragraph',
  has_internal_link_placeholders: 'Internal links included',
  has_external_link_placeholders: 'External source links included',
  has_images: 'Images with ALT text',
  has_media_presence: 'Media presence',
  clean_url_structure: 'Clean URL structure',
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<{ data: ResultData; keyword: string; mode?: string; mode_name?: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'article' | 'seo' | 'meta' | 'schema' | 'social'>('article');
  const [socialSnippets, setSocialSnippets] = useState<SocialSnippets | null>(null);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    
    if (!articleId) {
      router.push('/dashboard/generate');
      return;
    }

    let cancelled = false;

    async function loadArticle() {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        const data = await response.json();
        if (!cancelled && response.ok && data.success && data.article) {
          setResult(data.article);
          return;
        }
      } catch {
        console.warn('Supabase article load failed; trying browser-local copy.');
      }

      const saved = JSON.parse(localStorage.getItem('generated_articles') || '[]') as StoredArticleResult[];
      const schedule = JSON.parse(localStorage.getItem('content_schedule') || '[]') as StoredArticleResult[];
      const article = saved.find(a => a.id === articleId) || schedule.find(a => a.id === articleId);

      if (!cancelled && article && article.fullData) {
        setResult(article.fullData);
      } else if (!cancelled) {
        router.push('/dashboard/generate');
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handlePublish = async () => {
    if (!result) return;
    
    const wpUrl = sessionStorage.getItem('wp_url');
    const wpUser = sessionStorage.getItem('wp_user');
    const wpPass = sessionStorage.getItem('wp_pass');

    if (!wpUrl || !wpUser || !wpPass) {
      alert('Please configure your WordPress settings first!');
      router.push('/dashboard/wordpress');
      return;
    }

    setPublishing(true);
    setPublishStatus('idle');

    try {
      const res = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.data.seo_title,
          content: result.data.article_html,
          url: wpUrl,
          username: wpUser,
          appPassword: wpPass
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPublishStatus('success');
      } else {
        setPublishStatus('error');
        alert(data.error || 'Failed to publish');
      }
    } catch (err) {
      setPublishStatus('error');
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const generateSocial = async () => {
    if (!result) return;
    setGeneratingSocial(true);
    setSocialError('');
    try {
      const res = await fetch('/api/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: result.data.seo_title,
          summary: result.data.meta_description,
          articleText: plainTextArticle(),
          language: result.data.generation_settings?.language || 'English',
        }),
      });
      const data = await res.json();
      if (data.success && data.snippets) {
        const twitter = Array.isArray(data.snippets.twitter)
          ? data.snippets.twitter.map((tweet: unknown) => String(tweet))
          : [String(data.snippets.twitter || '')].filter(Boolean);
        setSocialSnippets({
          linkedin: String(data.snippets.linkedin || ''),
          facebook: String(data.snippets.facebook || ''),
          twitter,
        });
        setActiveTab('social');
      } else {
        setSocialError(data.error || 'Failed to generate social snippets.');
        setActiveTab('social');
      }
    } catch (err) {
      console.error(err);
      setSocialError('Social snippets could not be generated. Please retry.');
      setActiveTab('social');
    } finally {
      setGeneratingSocial(false);
    }
  };

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading result...</p>
      </div>
    </div>
  );

  const { data, keyword } = result;
  const auditEntries = Object.entries(data.seo_audit) as [string, boolean][];
  const passCount = auditEntries.filter(([, v]) => v).length;
  const currentMode = data.mode_audit?.mode_name || result.mode_name || getWritingMode(result.mode).name;
  const visibleScore = data.mode_audit?.score ?? Math.round((passCount / auditEntries.length) * 100);
  const visiblePassed = data.mode_audit?.passed ?? passCount;
  const visibleTotal = data.mode_audit?.total ?? auditEntries.length;
  const auditGroups = data.mode_audit
    ? Array.from(new Set(data.mode_audit.checks.map(check => check.category || 'Checks')))
    : [];

  const copyText = async (text: string, label: string) => {
    const successful = await copyTextSafely(text);
    if (successful) {
      setCopyError('');
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
      return;
    }

    setCopied('');
    setCopyError(label);
    setTimeout(() => setCopyError(''), 2500);
  };

  const exportArticle = {
    title: data.seo_title,
    description: data.meta_description,
    slug: data.slug || 'article',
    html: data.article_html,
    ogTags: data.og_tags,
    schema: data.schema,
  };
  const plainTextArticle = () => articleToPlainText(data.article_html);
  const exportFileName = articleFileBaseName(exportArticle.slug);
  const prepareDownload = (event: MouseEvent<HTMLAnchorElement>, blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob);
    event.currentTarget.href = url;
    event.currentTarget.download = `${exportFileName}.${extension}`;
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/generate')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-xl font-black">{data.seo_title}</h1>
            <p className="text-xs text-white/40 mt-0.5">Keyword: <span className="text-blue-400">{keyword}</span> | {data.word_count} words | {currentMode}</p>
            {data.generation_settings?.writing_model && (
              <p className="text-[10px] text-emerald-400/80 mt-1">
                {data.generation_settings.provider} writing: {data.generation_settings.writing_model} | Current as of {data.generation_settings.current_as_of}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePublish} disabled={publishing || publishStatus === 'success'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              publishStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-blue-500 hover:text-white'
            }`}>
            {publishing ? <RefreshCw size={13} className="animate-spin" /> : publishStatus === 'success' ? <CheckCircle2 size={13} /> : <Globe size={13} />}
            {publishing ? 'Publishing...' : publishStatus === 'success' ? 'Published as Draft' : 'Publish to WordPress'}
          </button>
          <button onClick={generateSocial} disabled={generatingSocial}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 border border-blue-600/30 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50">
            {generatingSocial ? <RefreshCw size={13} className="animate-spin" /> : <Share2 size={13} />} Social Snippets
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-sm font-bold">Copy & Download Article</p>
            <p className="text-[11px] text-white/40 mt-0.5">Export clean text, web HTML, Markdown or Microsoft Word files.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => copyText(plainTextArticle(), 'text')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
              <Copy size={13} /> {copied === 'text' ? 'Text Copied!' : copyError === 'text' ? 'Copy blocked' : 'Copy Text'}
            </button>
            <button onClick={() => copyText(data.article_html, 'html')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
              <Code2 size={13} /> {copied === 'html' ? 'HTML Copied!' : copyError === 'html' ? 'Copy blocked' : 'Copy HTML'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href="#" download={`${exportFileName}.txt`}
            onClick={event => prepareDownload(event, new Blob([plainTextArticle()], { type: 'text/plain;charset=utf-8' }), 'txt')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:border-blue-400/40 hover:bg-blue-500/10 transition-all">
            <Download size={13} /> Plain Text (.txt)
          </a>
          <a href="#" download={`${exportFileName}.html`}
            onClick={event => prepareDownload(event, new Blob([buildArticleHtml(exportArticle)], { type: 'text/html;charset=utf-8' }), 'html')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:border-blue-400/40 hover:bg-blue-500/10 transition-all">
            <Download size={13} /> HTML (.html)
          </a>
          <a href="#" download={`${exportFileName}.docx`}
            onClick={event => prepareDownload(event, buildDocx(exportArticle), 'docx')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
            <Download size={13} /> Word (.docx)
          </a>
          <a href="#" download={`${exportFileName}.doc`}
            onClick={event => prepareDownload(event, new Blob([buildWordHtmlDocument(exportArticle)], { type: 'application/msword;charset=utf-8' }), 'doc')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:border-blue-400/40 hover:bg-blue-500/10 transition-all">
            <Download size={13} /> Word (.doc)
          </a>
          <a href="#" download={`${exportFileName}.md`}
            onClick={event => prepareDownload(event, new Blob([articleToMarkdown(data.article_html)], { type: 'text/markdown;charset=utf-8' }), 'md')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:border-blue-400/40 hover:bg-blue-500/10 transition-all">
            <Download size={13} /> Markdown (.md)
          </a>
        </div>
      </div>

      {/* SEO Score Banner */}
      <div className={`mb-6 p-5 rounded-2xl border flex items-center justify-between flex-wrap gap-4 ${visibleScore >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : visibleScore >= 70 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
        <div>
          <p className="text-2xl font-black">{visibleScore}% <span className="text-sm font-medium text-white/60">{currentMode} Validation</span></p>
          <p className={`text-xs font-bold mt-1 ${visibleScore >= 90 ? 'text-emerald-400' : visibleScore >= 70 ? 'text-blue-400' : 'text-orange-400'}`}>
            {visiblePassed}/{visibleTotal} measurable mode signals passed. Review failed items before publishing.
          </p>
        </div>
        <div className="flex gap-4 text-center">
          <div><p className="text-lg font-black text-blue-400">{data.word_count}</p><p className="text-[10px] text-white/40">Words</p></div>
          <div><p className="text-lg font-black text-violet-400">{data.keyword_density_percent?.toFixed(1) || '~1.5'}%</p><p className="text-[10px] text-white/40">Density</p></div>
          <div><p className="text-lg font-black text-emerald-400">{data.lsi_keywords?.length || 0}</p><p className="text-[10px] text-white/40">LSI Keys</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { id: 'article', label: 'Article Preview', icon: FileText },
          { id: 'seo', label: 'SEO Audit', icon: CheckCircle2 },
          { id: 'meta', label: 'Meta & OG Tags', icon: Link2 },
          { id: 'schema', label: 'Schema JSON-LD', icon: Code2 },
          { id: 'social', label: 'Social Snippets', icon: Share2 },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${activeTab === tab.id ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2">
          {activeTab === 'article' && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <p className="text-xs text-white/40 ml-2 font-mono">article-preview.html</p>
                </div>
                <button onClick={() => copyText(data.article_html, 'article')}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
                  <Copy size={11} /> {copied === 'article' ? 'Copied!' : copyError === 'article' ? 'Copy blocked' : 'Copy HTML'}
                </button>
              </div>
              <iframe
                srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 17px;
    line-height: 1.8;
    color: #1a1a2e;
    background: #ffffff;
    padding: 48px 56px;
    max-width: 860px;
    margin: 0 auto;
  }
  h1 {
    font-size: 2.2em;
    font-weight: 800;
    color: #0f0f23;
    line-height: 1.2;
    margin-bottom: 20px;
    border-bottom: 3px solid #4f46e5;
    padding-bottom: 16px;
  }
  h2 {
    font-size: 1.5em;
    font-weight: 700;
    color: #1e1b4b;
    margin-top: 40px;
    margin-bottom: 14px;
    padding-left: 14px;
    border-left: 4px solid #4f46e5;
  }
  h3 {
    font-size: 1.15em;
    font-weight: 600;
    color: #312e81;
    margin-top: 28px;
    margin-bottom: 10px;
  }
  h4 { font-size: 1em; font-weight: 600; margin-top: 20px; margin-bottom: 8px; color: #3730a3; }
  p { margin-bottom: 18px; color: #2d2d44; }
  ul, ol { margin: 14px 0 18px 28px; }
  ul { list-style-type: disc; }
  ol { list-style-type: decimal; }
  li { margin-bottom: 8px; color: #2d2d44; }
  li::marker { color: #4f46e5; font-weight: bold; }
  strong { color: #0f0f23; font-weight: 700; }
  em { font-style: italic; color: #4338ca; }
  a { color: #4f46e5; text-decoration: underline; text-underline-offset: 3px; }
  a:hover { color: #3730a3; }
  blockquote {
    margin: 28px 0;
    padding: 18px 24px;
    background: #eef2ff;
    border-left: 5px solid #4f46e5;
    border-radius: 0 12px 12px 0;
    color: #3730a3;
    font-style: italic;
  }
  blockquote strong { color: #3730a3; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 28px 0;
    font-size: 0.9em;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  thead { background: #4f46e5; color: white; }
  thead th {
    padding: 14px 18px;
    text-align: left;
    font-weight: 700;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  tbody tr { border-bottom: 1px solid #e5e7eb; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:nth-child(even) { background: #f5f3ff; }
  tbody td { padding: 12px 18px; color: #374151; }
  img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 24px 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    display: block;
  }
  .toc {
    background: #f0f4ff;
    border: 1px solid #c7d2fe;
    border-radius: 14px;
    padding: 24px 28px;
    margin: 28px 0;
  }
  .toc h2 {
    font-size: 1.05em;
    color: #4338ca;
    border: none;
    padding: 0;
    margin-top: 0;
    margin-bottom: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .toc ul { margin: 0; list-style: none; padding: 0; }
  .toc li { margin-bottom: 6px; counter-increment: toc; }
  .toc li::before { content: "→ "; color: #4f46e5; font-weight: bold; }
  .toc a { color: #4338ca; text-decoration: none; font-weight: 500; }
  .toc a:hover { text-decoration: underline; }
  hr { border: none; border-top: 2px solid #e5e7eb; margin: 36px 0; }
  code {
    background: #f1f5f9;
    color: #7c3aed;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.88em;
    font-family: 'Courier New', monospace;
  }
  pre {
    background: #1e1b4b;
    color: #c7d2fe;
    padding: 20px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 20px 0;
    font-size: 0.85em;
  }
</style>
</head>
<body>
${data.article_html || '<p>No content generated.</p>'}
</body>
</html>`}
                style={{ width: '100%', height: '800px', border: 'none', background: 'white' }}
                title="Article Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}


          {activeTab === 'seo' && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              {data.mode_audit && (
                <div className="mb-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-bold">{data.mode_audit.mode_name} Validation</p>
                      <p className="text-xs text-white/40 mt-1">{data.mode_audit.target}</p>
                    </div>
                    <span className="text-xs font-black text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                      {data.mode_audit.score}%
                    </span>
                  </div>
                  {auditGroups.map(group => (
                    <div key={group} className="mb-5 last:mb-0">
                      {group !== 'Checks' && (
                        <p className="text-xs font-bold text-white/65 mb-2">{group}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {data.mode_audit?.checks.filter(check => (check.category || 'Checks') === group).map(check => (
                          <div key={check.id} className={`px-4 py-3 rounded-xl border ${check.passed ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-orange-500/5 border-orange-500/15'}`}>
                            <div className="flex items-center gap-2">
                              {check.passed ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-orange-400 shrink-0" />}
                              <span className="text-xs font-medium text-white/80">{check.label}</span>
                            </div>
                            <p className="text-[10px] text-white/35 mt-1 ml-5">{check.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm font-bold mb-5">Core SEO Audit Checklist</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {auditEntries.map(([key, val]) => (
                  <div key={key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${val ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                    {val ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-red-400 shrink-0" />}
                    <span className={`text-xs font-medium ${val ? 'text-white/80' : 'text-white/40'}`}>{auditLabels[key] || key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-4">
              {[
                { label: 'SEO Title', value: data.seo_title, copyKey: 'title' },
                { label: 'Meta Description', value: data.meta_description, copyKey: 'meta' },
                { label: 'URL Slug', value: `/${data.slug}`, copyKey: 'slug' },
              ].map(item => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{item.label}</p>
                    <button onClick={() => copyText(item.value, item.copyKey)}
                      className="text-[10px] text-white/30 hover:text-white flex items-center gap-1 transition-colors">
                      <Copy size={10} /> {copied === item.copyKey ? 'Copied!' : copyError === item.copyKey ? 'Copy blocked' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-white font-medium">{item.value}</p>
                  {item.label === 'Meta Description' && (
                    <p className={`text-[10px] mt-1.5 ${(item.value || '').length > 155 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(item.value || '').length}/155 chars
                    </p>
                  )}
                </div>
              ))}
              {/* OG Tags */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Open Graph Tags</p>
                <div className="space-y-2">
                  {Object.entries(data.og_tags || {}).map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-xs">
                      <span className="text-blue-400 font-mono shrink-0">{k}</span>
                      <span className="text-white/60">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              {!socialSnippets && !generatingSocial && (
                <div className="text-center py-20 bg-white/[0.03] border border-white/[0.07] rounded-3xl">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Share2 className="text-blue-400" size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Social Media Auto-Pilot</h3>
                  <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">Generate tailored posts for LinkedIn, Facebook, and Twitter based on your article.</p>
                  {socialError && (
                    <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5 max-w-md mx-auto">
                      {socialError}
                    </p>
                  )}
                  <button onClick={generateSocial}
                    className="px-8 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all flex items-center gap-2 mx-auto">
                    Generate Snippets Now
                  </button>
                </div>
              )}

              {generatingSocial && (
                <div className="text-center py-20 bg-white/[0.03] border border-white/[0.07] rounded-3xl">
                  <RefreshCw className="text-blue-400 animate-spin mx-auto mb-4" size={32} />
                  <p className="text-sm font-bold">AI is crafting your social posts...</p>
                </div>
              )}

              {socialSnippets && (
                <div className="grid grid-cols-1 gap-6">
                  {/* LinkedIn */}
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0077b5]/10 rounded-lg flex items-center justify-center">
                          <Briefcase size={16} className="text-[#0077b5]" />
                        </div>
                        <span className="text-sm font-bold">LinkedIn Post</span>
                      </div>
                      <button onClick={() => copyText(socialSnippets.linkedin, 'li')}
                        className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors">
                        <Copy size={12} /> {copied === 'li' ? 'Copied!' : copyError === 'li' ? 'Copy blocked' : 'Copy Post'}
                      </button>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{socialSnippets.linkedin}</p>
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#1877f2]/10 rounded-lg flex items-center justify-center">
                          <Share2 size={16} className="text-[#1877f2]" />
                        </div>
                        <span className="text-sm font-bold">Facebook Post</span>
                      </div>
                      <button onClick={() => copyText(socialSnippets.facebook, 'fb')}
                        className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors">
                        <Copy size={12} /> {copied === 'fb' ? 'Copied!' : copyError === 'fb' ? 'Copy blocked' : 'Copy Post'}
                      </button>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{socialSnippets.facebook}</p>
                    </div>
                  </div>

                  {/* Twitter */}
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                          <MessageCircle size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-bold">X (Twitter) Thread</span>
                      </div>
                      <button onClick={() => copyText(socialSnippets.twitter.join('\n\n---\n\n'), 'tw')}
                        className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors">
                        <Copy size={12} /> {copied === 'tw' ? 'Copied Thread' : copyError === 'tw' ? 'Copy blocked' : 'Copy Thread'}
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      {socialSnippets.twitter.map((tweet: string, idx: number) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 relative">
                          <span className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <p className="text-xs text-white/80 leading-relaxed">{tweet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
                <p className="text-xs font-bold text-white/50">JSON-LD Schema Markup</p>
                <button onClick={() => copyText(JSON.stringify(data.schema, null, 2), 'schema')}
                  className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                  <Copy size={11} /> {copied === 'schema' ? 'Copied!' : copyError === 'schema' ? 'Copy blocked' : 'Copy'}
                </button>
              </div>
              <pre className="p-5 text-xs text-emerald-300 font-mono overflow-auto max-h-96 leading-relaxed">
                {JSON.stringify(data.schema, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Meta */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Quick Stats</p>
            <div className="space-y-3">
              {[
                { label: 'Word Count', value: data.word_count, ok: data.word_count >= 1500 },
                { label: 'Keyword Density', value: `${data.keyword_density_percent?.toFixed(1) || '~1.5'}%`, ok: true },
                { label: 'Meta Chars', value: `${(data.meta_description || '').length}/155`, ok: (data.meta_description || '').length <= 155 },
                { label: 'Images', value: data.images?.length || 0, ok: (data.images?.length || 0) > 0 },
                { label: 'LSI Keywords', value: data.lsi_keywords?.length || 0, ok: (data.lsi_keywords?.length || 0) >= 5 },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className="text-white/50">{s.label}</span>
                  <span className={`font-bold ${s.ok ? 'text-emerald-400' : 'text-red-400'}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LSI Keywords */}
          {data.lsi_keywords?.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">LSI Keywords Used</p>
              <div className="flex flex-wrap gap-1.5">
                {data.lsi_keywords.map((kw, i) => (
                  <span key={i} className="text-[10px] bg-violet-500/15 text-violet-300 px-2.5 py-1 rounded-full font-medium">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* TOC */}
          {data.table_of_contents?.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Table of Contents</p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {data.table_of_contents.map((item, i) => (
                  <li key={i} className="text-xs text-white/60">{item}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Link Placeholders */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Link Placeholders</p>
            <div className="space-y-2">
              {data.internal_link_placeholders?.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-blue-300">
                  <Link2 size={10} className="shrink-0" /> Internal: {l}
                </div>
              ))}
              {data.external_link_placeholders?.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-emerald-300">
                  <ExternalLink size={10} className="shrink-0" /> External: {l}
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          {data.images?.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Image Suggestions</p>
              <div className="space-y-2">
                {data.images.map((img, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <ImageIcon size={10} className="text-white/30 mt-0.5 shrink-0" />
                    <span className="text-white/50">ALT: {img.alt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
