'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Search, ArrowUpRight,
  Trash2, RefreshCw, Plus
} from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  keyword: string;
  date: string;
  wordCount: number;
  status: 'published' | 'draft';
  slug: string;
  fullData?: unknown;
}

interface ScheduledArticle {
  id: string;
  title: string;
  keyword?: string;
  date: string;
  wordCount?: number;
  status: 'planned' | 'generated' | 'published';
  slug?: string;
  fullData?: unknown;
}

export default function MyArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadArticles() {
    try {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.articles)) {
          setArticles(data.articles);
          return;
        }
      } catch {
        console.warn('Supabase article library unavailable; using browser-local library.');
      }

      const generatedStore = JSON.parse(localStorage.getItem('generated_articles') || '[]') as Article[];
      const schedule = JSON.parse(localStorage.getItem('content_schedule') || '[]') as ScheduledArticle[];
      
      const combined: Article[] = [...generatedStore];
      schedule.forEach(p => {
        if ((p.status === 'generated' || p.status === 'published') && !combined.some(a => a.title === p.title)) {
          combined.push({
            id: p.id, title: p.title, keyword: p.keyword || 'Auto-Pilot', date: p.date, wordCount: p.wordCount || 0,
            status: p.status === 'published' ? 'published' : 'draft', slug: p.slug || '#', fullData: p.fullData || null
          });
        }
      });

      setArticles(combined);
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Hydrate the browser-local article library after client mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadArticles();
  }, []);

  const handleViewReport = (id: string) => {
    // Navigate to the dedicated result page which acts as a full SEO Report
    router.push(`/dashboard/generate/result?id=${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently delete this article report?')) {
      const updated = articles.filter(a => a.id !== id);
      setArticles(updated);
      localStorage.setItem('generated_articles', JSON.stringify(updated.filter(a => a.fullData)));
      fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => console.warn('Supabase article delete failed.'));
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-[#020617]">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3 text-white">
            <FileText className="text-blue-400" /> Article Library
          </h1>
          <p className="text-sm text-white/40 mt-1">Access all your generated SEO reports and content drafts.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" placeholder="Search reports..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-10 text-sm text-white w-64 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <Link href="/dashboard/generate" className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
            <Plus size={20} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
           <RefreshCw className="text-blue-400 animate-spin mb-4" size={32} />
           <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Loading Library...</p>
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                <th className="px-6 py-4">Article / Report</th>
                <th className="px-6 py-4">Focus Keyword</th>
                <th className="px-6 py-4">Generation Date</th>
                <th className="px-6 py-4">Length</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="px-6 py-5">
                    <button onClick={() => handleViewReport(article.id)} className="flex flex-col text-left group-hover:opacity-80 transition-all">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{article.title}</span>
                      <span className="text-[10px] text-white/20 mt-1 uppercase tracking-tighter">Click to open full report</span>
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-white/60 bg-white/5 px-2 py-1 rounded-lg border border-white/5">{article.keyword}</span>
                  </td>
                  <td className="px-6 py-5 text-xs text-white/40">{article.date}</td>
                  <td className="px-6 py-5 text-xs text-white/60 font-mono">{article.wordCount} words</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewReport(article.id)}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-sm"
                        title="Open Full Report"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)}
                        className="p-2.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10 text-center">
          <FileText size={48} className="text-white/10 mb-6" />
          <h3 className="text-lg font-bold text-white/60">No articles in your library</h3>
          <p className="text-sm text-white/20 mt-2 mb-8 max-w-xs mx-auto">Generate your first AI-powered SEO article to see it here.</p>
          <Link href="/dashboard/generate" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">
            Start Generating
          </Link>
        </div>
      )}
    </div>
  );
}
