/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Video, Music, Clock, Globe, FileText } from 'lucide-react';
import { MediaUpload } from '../types';

interface DashboardStatsProps {
  uploads: MediaUpload[];
}

export default function DashboardStats({ uploads }: DashboardStatsProps) {
  const totalFiles = uploads.length;
  const videoCount = uploads.filter((u) => u.fileType === 'video').length;
  const audioCount = uploads.filter((u) => u.fileType === 'audio').length;

  // Calculate total duration in seconds from segments or static meta
  const totalDurationSeconds = uploads.reduce((acc, u) => {
    // If we have duration formatted as "MM:SS", parse it
    if (u.duration && u.duration !== 'Unknown') {
      const parts = u.duration.split(':').map(Number);
      if (parts.length === 2) {
        return acc + parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        return acc + parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    return acc;
  }, 0);

  // Format total duration beautifully
  const formatTotalDuration = (totalSecs: number) => {
    if (totalSecs === 0) return '0m 0s';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m ${s}s`;
  };

  // Get total translation count (count keys in the translations mapping)
  const totalTranslations = uploads.reduce((acc, u) => {
    return acc + Object.keys(u.translations || {}).length;
  }, 0);

  return (
    <div id="stats-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {/* Total Uploads */}
      <div id="stat-total-uploads" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4 transition-all hover:shadow-sm">
        <div className="p-3.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100/30">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Total Uploads</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 font-display">{totalFiles}</span>
            <span className="text-[10px] text-blue-600 font-bold font-mono">FILES</span>
          </div>
        </div>
      </div>

      {/* Total Duration */}
      <div id="stat-total-duration" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4 transition-all hover:shadow-sm">
        <div className="p-3.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100/30">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Transcribed Time</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 font-display">{formatTotalDuration(totalDurationSeconds)}</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">+12%</span>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div id="stat-total-videos" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4 transition-all hover:shadow-sm">
        <div className="p-3.5 bg-purple-50 rounded-lg text-purple-600 border border-purple-100/30">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Video Tracks</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 font-display">{videoCount}</span>
            <span className="text-[10px] text-purple-500 font-bold font-mono">MP4</span>
          </div>
        </div>
      </div>

      {/* Audios */}
      <div id="stat-total-audios" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4 transition-all hover:shadow-sm">
        <div className="p-3.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100/30">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Audio Tracks</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 font-display">{audioCount}</span>
            <span className="text-[10px] text-amber-500 font-bold font-mono">WAV</span>
          </div>
        </div>
      </div>

      {/* Active Translations */}
      <div id="stat-total-translations" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4 transition-all hover:shadow-sm font-sans">
        <div className="p-3.5 bg-sky-50 rounded-lg text-sky-600 border border-sky-100/30">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Languages</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 font-display">{totalTranslations}</span>
            <span className="text-[10px] text-sky-500 font-bold font-mono">NEW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
