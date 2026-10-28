'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Settings2, 
  Play,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function BulkGeneratorPage() {
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Bulk Generator</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Generate hundreds of SEO articles in minutes.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs sm:text-sm font-semibold border border-white/5 transition-all">
            <Upload size={18} />
            Upload CSV
          </button>
          <button 
            onClick={() => setIsGenerating(true)}
            disabled={isGenerating}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold animate-glow shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            {isGenerating ? 'Starting Batch...' : 'Start Batch'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Keyword Input */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="text-primary" size={20} />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Target Keywords</h3>
          </div>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter one keyword per line (e.g. 'best seo tools 2024')"
            className="w-full h-80 bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all resize-none"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{keywords.split('\n').filter(k => k.trim()).length} keywords identified</span>
            <span>Estimated time: ~12 minutes</span>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Settings2 className="text-primary" size={20} />
              <h3 className="text-lg font-semibold text-white">Batch Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Model</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary/50">
                  <option>GPT-4o (High Quality)</option>
                  <option>Gemini 1.5 Pro</option>
                  <option>Claude 3.5 Sonnet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Language</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary/50">
                  <option>English (US)</option>
                  <option>Bengali</option>
                  <option>Spanish</option>
                  <option>German</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-sm text-white/80">Auto-post to WordPress</span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Current Queue</h3>
            <div className="space-y-3">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/60 truncate max-w-[150px]">best dog food brands...</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={14} /> Done
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white">how to train a cat...</span>
                <span className="flex items-center gap-1 text-primary animate-pulse">
                  <Clock size={14} /> Processing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
