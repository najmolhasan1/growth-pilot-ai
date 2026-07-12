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
    <div id="stats-container" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {/* Total Uploads */}
      <div id="stat-total-uploads" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-sm">
        <div className="rounded-xl border border-blue-100/30 bg-blue-50 p-2.5 text-blue-600">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Uploads</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-bold text-slate-900">{totalFiles}</span>
            <span className="text-[10px] text-blue-600 font-bold font-mono">FILES</span>
          </div>
        </div>
      </div>

      {/* Total Duration */}
      <div id="stat-total-duration" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-sm">
        <div className="rounded-xl border border-emerald-100/30 bg-emerald-50 p-2.5 text-emerald-600">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">Transcribed Time</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-bold text-slate-900">{formatTotalDuration(totalDurationSeconds)}</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">+12%</span>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div id="stat-total-videos" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-sm">
        <div className="rounded-xl border border-purple-100/30 bg-purple-50 p-2.5 text-purple-600">
          <Video className="h-4 w-4" />
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">Video Tracks</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-bold text-slate-900">{videoCount}</span>
            <span className="text-[10px] text-purple-500 font-bold font-mono">MP4</span>
          </div>
        </div>
      </div>

      {/* Audios */}
      <div id="stat-total-audios" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-sm">
        <div className="rounded-xl border border-amber-100/30 bg-amber-50 p-2.5 text-amber-600">
          <Music className="h-4 w-4" />
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">Audio Tracks</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-bold text-slate-900">{audioCount}</span>
            <span className="text-[10px] text-amber-500 font-bold font-mono">WAV</span>
          </div>
        </div>
      </div>

      {/* Active Translations */}
      <div id="stat-total-translations" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-sans shadow-xs transition-all hover:shadow-sm">
        <div className="rounded-xl border border-sky-100/30 bg-sky-50 p-2.5 text-sky-600">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">Languages</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-bold text-slate-900">{totalTranslations}</span>
            <span className="text-[10px] text-sky-500 font-bold font-mono">NEW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
