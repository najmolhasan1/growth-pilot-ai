/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Video, Music, Calendar, Trash2, Globe, FileClock, ChevronRight } from 'lucide-react';
import { MediaUpload } from '../types';

interface FileListProps {
  uploads: MediaUpload[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FileList({ uploads, selectedId, onSelect, onDelete }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'video' | 'audio'>('all');

  // Filter uploads based on text search and file type selection
  const filteredUploads = uploads.filter((u) => {
    const matchesSearch = u.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.originalLanguage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileFilter === 'all' || u.fileType === fileFilter;
    return matchesSearch && matchesType;
  });

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "Just now";
    }
  };

  return (
    <div id="file-list-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
            <FileClock className="w-5 h-5 text-blue-600" />
            Transcription Library
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">Manage and organize processed transcripts, summaries and translated audio assets</p>
        </div>

        {/* Filter Pill Selectors */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFileFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              fileFilter === 'all'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFileFilter('video')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              fileFilter === 'video'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Videos
          </button>
          <button
            type="button"
            onClick={() => setFileFilter('audio')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              fileFilter === 'audio'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Audios
          </button>
        </div>
      </div>

      {/* Interactive Search Field */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search transcripts, filenames, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Uploads List Container */}
      <div id="library-list" className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-3">
        {filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl">
            <Search className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No transcripts found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs px-4">
              {uploads.length === 0 
                ? "Drag and drop a video file above to trigger your first transaction transcription." 
                : "No items match your active search or filter tags."}
            </p>
          </div>
        ) : (
          filteredUploads.map((u) => {
            const isSelected = u.id === selectedId;
            const translationCodes = Object.keys(u.translations || {});

            return (
              <div
                key={u.id}
                onClick={() => onSelect(u.id)}
                className={`group relative border rounded-lg p-4 transition-all cursor-pointer flex items-center justify-between ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500' 
                    : 'border-slate-150 hover:border-slate-250 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start space-x-3.5 min-w-0 pr-6">
                  {/* Media Type Indicator */}
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    u.fileType === 'video' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100/20' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100/20'
                  }`}>
                    {u.fileType === 'video' ? <Video className="w-4.5 h-4.5" /> : <Music className="w-4.5 h-4.5" />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-805 text-sm truncate pr-2 group-hover:text-blue-600 transition-colors">
                      {u.fileName}
                    </p>
                    
                    {/* Meta Indicators */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400 font-mono mt-1">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {formatDate(u.uploadedAt)}
                      </span>
                      <span>•</span>
                      <span className="bg-slate-105 text-slate-600 font-medium shrink-0">
                        {u.duration}
                      </span>
                      <span>•</span>
                      <span className="bg-blue-50 text-blue-700/90 font-sans font-semibold text-[10px] px-1.5 py-0.5 rounded shrink-0">
                        {u.originalLanguage}
                      </span>
                    </div>

                    {/* Active translations flag row */}
                    {translationCodes.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <Globe className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-[10px] text-emerald-600 font-medium">Translated:</span>
                        <div className="flex gap-1">
                          {translationCodes.map((code) => {
                            const name = u.translations[code]?.language || code;
                            return (
                              <span 
                                key={code} 
                                title={name}
                                className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100"
                              >
                                {code.toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(u.id);
                    }}
                    title="Delete item"
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${
                    isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                  }`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
