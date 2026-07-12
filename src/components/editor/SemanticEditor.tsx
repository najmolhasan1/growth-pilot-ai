'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Zap,
  Target,
  FileCode,
  ShieldAlert,
  Cpu,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

const seoModes = [
  { id: 'fully-optimized', name: 'Fully SEO Optimized', icon: Target, color: 'text-blue-400' },
  { id: 'rank-math', name: 'Rank Math Optimized', icon: FileCode, color: 'text-emerald-400' },
  { id: 'semantic-nlp', name: 'Semantic NLP SEO', icon: Cpu, color: 'text-purple-400' },
  { id: 'yoast', name: 'Yoast SEO Optimized', icon: BarChart, color: 'text-orange-400' },
  { id: 'hybrid', name: 'Hybrid Maximum SEO', icon: Zap, color: 'text-indigo-400' },
  { id: 'hcu', name: 'HCU Optimized', icon: ShieldAlert, color: 'text-red-400' },
];

export default function SemanticEditor() {
  const [content, setContent] = useState('');
  const [selectedMode, setSelectedMode] = useState('fully-optimized');
  const [score, setScore] = useState(65);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (content.length > 0) {
      // Show immediate feedback while the debounced analysis is pending.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setScore(Math.min(100, 65 + Math.floor(content.length / 50)));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [content, selectedMode]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-[80vh]">
      {/* Main Editor Area */}
      <div className="xl:col-span-3 space-y-6">
        {/* Mode Selector */}
        <div className="flex flex-wrap gap-3 mb-4">
          {seoModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                selectedMode === mode.id 
                ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' 
                : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <mode.icon size={16} className={selectedMode === mode.id ? mode.color : ''} />
              <span className="text-sm font-medium">{mode.name}</span>
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8 min-h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <input 
              type="text" 
              placeholder="Enter focus keyword as title..."
              className="text-3xl font-bold bg-transparent border-none outline-none text-white w-full placeholder:text-white/20"
            />
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold animate-glow">
                <Sparkles size={20} />
                Generate Article
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing or let AI generate the content..."
            className="flex-1 bg-transparent border-none outline-none text-lg leading-relaxed text-foreground resize-none placeholder:text-muted-foreground/30 min-h-[500px]"
          />
        </div>
      </div>

      {/* SEO Sidebar */}
      <aside className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart size={18} className="text-primary" />
              SEO Score
            </h3>
            <div className="text-2xl font-bold text-primary">{score}</div>
          </div>
          
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {seoModes.find(m => m.id === selectedMode)?.name} Checklist
            </h4>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  {i < 4 ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-400 shrink-0" />
                  )}
                  <span className="text-sm text-white/80">
                    Rule #{i} for {selectedMode.split('-').join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Layers size={18} className="text-primary" />
            Entity Analysis
          </h3>
          <div className="space-y-2">
            {['Expertise', 'Experience', 'Authority', 'Trust'].map(entity => (
              <div key={entity} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-xs text-white/60">{entity} Signal</span>
                <div className="w-12 h-1 bg-primary/30 rounded-full">
                  <div className="w-2/3 h-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-primary text-sm font-medium"
          >
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Re-calculating for {selectedMode}...
          </motion.div>
        )}
      </aside>
    </div>
  );
}
