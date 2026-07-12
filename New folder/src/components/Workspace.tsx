/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, Globe, FileText, Download, Check, Edit2, 
  Sparkles, Save, BookOpen, Clock, ListFilter, Trash2, ListChecks, HelpCircle,
  Video, Copy, ExternalLink, Flame, Scissors, RefreshCcw
} from 'lucide-react';
import { MediaUpload, SubtitleSegment, TranslationData } from '../types';
import { mediaDB } from '../db';

interface WorkspaceProps {
  upload: MediaUpload;
  onUpdate: (updated: MediaUpload) => void;
  onDelete: (id: string) => void;
}

const LANGUAGES_POOL = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ko', name: 'Korean' },
];

export default function Workspace({ upload, onUpdate, onDelete }: WorkspaceProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'segments' | 'transcript' | 'summary' | 'creatorKit'>('segments');
  const [viewLanguage, setViewLanguage] = useState<'original' | string>('original');
  const [targetLangCode, setTargetLangCode] = useState('es');
  
  // Editing states
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(upload.transcript);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editedSegmentText, setEditedSegmentText] = useState("");
  const [editedSegmentSpeaker, setEditedSegmentSpeaker] = useState("");
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // YouTube Creator Package state hooks
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [kitError, setKitError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const handleGenerateCreatorKit = async () => {
    setIsGeneratingKit(true);
    setKitError(null);

    try {
      const response = await fetch("/api/generate-creator-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: upload.transcript,
          summary: upload.summary,
          topics: upload.topics,
          fileName: upload.fileName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = "Failed to generate Creator Kit.";
        try {
          const errJSON = JSON.parse(errorText);
          if (errJSON && errJSON.error) errMsg = errJSON.error;
        } catch {
          if (errorText) errMsg = errorText.substring(0, 150);
        }
        throw new Error(errMsg);
      }

      const packageData = await response.json();
      
      onUpdate({
        ...upload,
        creatorPackage: packageData
      });

    } catch (err: any) {
      console.error(err);
      setKitError(err.message || "An unexpected error occurred while generating YouTube Creator Kit.");
    } finally {
      setIsGeneratingKit(false);
    }
  };

  // Time-tracking player sync states
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const segmentRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // 1. Recover standard Blob source on upload select and register locally as objectUrl
  useEffect(() => {
    let activeUrl = "";
    
    const loadMediaFile = async () => {
      try {
        const fileBlob = await mediaDB.getFile(upload.id);
        if (fileBlob) {
          activeUrl = URL.createObjectURL(fileBlob);
          setMediaUrl(activeUrl);
        } else if (upload.id === "demo_gemini_multimodal") {
          // Play a pristine public Google sample video directly
          setMediaUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
        } else {
          setMediaUrl(null);
        }
      } catch (err) {
        console.error("IndexedDB load failure:", err);
        setMediaUrl(null);
      }
    };

    loadMediaFile();
    setViewLanguage('original');
    setEditedTranscript(upload.transcript);

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [upload.id]);

  // Sync edits if full upload transcript propagates updates
  useEffect(() => {
    setEditedTranscript(upload.transcript);
  }, [upload.transcript]);

  // Handle active spotlight highlight for subtitle timing synchronization
  const parseTimeToSeconds = (timeStr: string): number => {
    try {
      const parts = timeStr.split(':').map(Number);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    const currSecs = mediaRef.current.currentTime;
    setCurrentTime(currSecs);

    // Dynamic search matching segments
    const currentSegments = viewLanguage === 'original' 
      ? upload.segments 
      : getTranslatedSegmentsList();

    const active = currentSegments.find((seg) => {
      const start = parseTimeToSeconds(seg.start);
      const end = parseTimeToSeconds(seg.end);
      return currSecs >= start && currSecs <= end;
    });

    if (active && active.id !== activeSegmentId) {
      setActiveSegmentId(active.id);
      // Auto-scroll to active timeline piece
      segmentRefs.current[active.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  const jumpToSegmentTimes = (timeStr: string) => {
    const targetSeconds = parseTimeToSeconds(timeStr);
    if (mediaRef.current) {
      mediaRef.current.currentTime = targetSeconds;
      mediaRef.current.play().catch(() => {});
    }
  };

  // 2. Transcription Editing callbacks
  const saveFullTranscriptEdit = () => {
    onUpdate({
      ...upload,
      transcript: editedTranscript
    });
    setIsEditingTranscript(false);
  };

  const startSegmentEdit = (seg: SubtitleSegment, currentText: string) => {
    setEditingSegmentId(seg.id);
    setEditedSegmentText(currentText);
    setEditedSegmentSpeaker(seg.speaker);
  };

  const saveSegmentEdit = (segmentId: string) => {
    if (viewLanguage === 'original') {
      const updatedSegments = upload.segments.map((seg) => {
        if (seg.id === segmentId) {
          return { ...seg, speaker: editedSegmentSpeaker, text: editedSegmentText };
        }
        return seg;
      });

      // Recalculate contiguous transcript string on the fly if original language segment changes
      const updatedTranscript = updatedSegments.map(s => `${s.speaker}: ${s.text}`).join("\n\n");

      onUpdate({
        ...upload,
        segments: updatedSegments,
        transcript: updatedTranscript
      });
    } else {
      // Edit translation segment
      const langData = upload.translations[viewLanguage];
      if (langData) {
        const updatedLangSegments = langData.segments.map((s) => {
          if (s.segmentId === segmentId) {
            return { ...s, translatedText: editedSegmentText };
          }
          return s;
        });

        const updatedFullTranscript = updatedLangSegments.map((s) => {
          const orig = upload.segments.find(o => o.id === s.segmentId);
          return `${orig?.speaker || 'Speaker'}: ${s.translatedText}`;
        }).join("\n\n");

        onUpdate({
          ...upload,
          translations: {
            ...upload.translations,
            [viewLanguage]: {
              ...langData,
              fullTranscript: updatedFullTranscript,
              segments: updatedLangSegments
            }
          }
        });
      }
    }

    setEditingSegmentId(null);
  };

  // 3. Translate with Gemini callback (uses the rapid, segmented structure)
  const handleTranslateCall = async () => {
    const targetLang = LANGUAGES_POOL.find(l => l.code === targetLangCode);
    if (!targetLang) return;

    setIsTranslating(true);
    setTranslationError(null);

    // Minimize input payload by sending only required segment texts to model
    const payloadSegments = upload.segments.map(s => ({
      id: s.id,
      text: s.text
    }));

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: payloadSegments,
          targetLanguage: targetLang.name,
          targetLanguageCode: targetLang.code
        })
      });

      const responseText = await response.text();
      let result: any = null;

      if (!response.ok) {
        let errMsg = `Translation error.`;
        try {
          const errData = JSON.parse(responseText);
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {
          if (responseText.includes("<!doctype") || responseText.includes("<!DOCTYPE")) {
            errMsg = `Translation failed: Server returned an HTML web page (Status ${response.status}).`;
          } else if (responseText) {
            errMsg = responseText.substring(0, 200);
          }
        }
        throw new Error(errMsg);
      }

      try {
        result = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Failed to parse translation response from the server.");
      }

      const newTranslation: TranslationData = {
        language: targetLang.name,
        langCode: targetLang.code,
        fullTranscript: result.fullTranscript,
        segments: result.segments.map((s: any) => ({
          segmentId: s.segmentId,
          translatedText: s.translatedText
        }))
      };

      // Propagation back to main page state
      onUpdate({
        ...upload,
        translations: {
          ...upload.translations,
          [targetLang.code]: newTranslation
        }
      });

      // Automatically focus display view language on new translation
      setViewLanguage(targetLang.code);

    } catch (err: any) {
      console.error(err);
      setTranslationError(err.message || "Failed to complete multi-language transcription translation.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Get active rendering segments
  const getTranslatedSegmentsList = (): SubtitleSegment[] => {
    const langData = upload.translations[viewLanguage];
    if (!langData) return upload.segments;

    return upload.segments.map((orig) => {
      const transSeg = langData.segments.find(s => s.segmentId === orig.id);
      return {
        ...orig,
        text: transSeg ? transSeg.translatedText : orig.text
      };
    });
  };

  const getActiveTranscriptText = (): string => {
    if (viewLanguage === 'original') return upload.transcript;
    return upload.translations[viewLanguage]?.fullTranscript || upload.transcript;
  };

  // 4. Download and Subtitle files formatter utils (WebVTT, SRT, Text, JSON)
  const formatSubTime = (mmSs: string, isVtt: boolean): string => {
    const parts = mmSs.split(':').map(Number);
    let h = 0, m = 0, s = 0;
    if (parts.length === 2) {
      m = parts[0];
      s = parts[1];
    } else if (parts.length === 3) {
      h = parts[0];
      m = parts[1];
      s = parts[2];
    }
    const msMarker = isVtt ? '.' : ',';
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${msMarker}000`;
  };

  const downloadFile = (content: string, mimeType: string, extension: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = upload.fileName.replace(/\.[^/.]+$/, "");
    const langSuffix = viewLanguage === 'original' ? '' : `_${viewLanguage}`;
    link.download = `${sanitizedName}${langSuffix}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerTxtExport = () => {
    downloadFile(getActiveTranscriptText(), 'text/plain', 'txt');
  };

  const triggerSrtExport = () => {
    const activeSegments = getTranslatedSegmentsList();
    const contents = activeSegments.map((seg, idx) => {
      const start = formatSubTime(seg.start, false);
      const end = formatSubTime(seg.end, false);
      return `${idx + 1}\n${start} --> ${end}\n${seg.speaker}: ${seg.text}\n`;
    }).join("\n");

    downloadFile(contents, 'text/srt', 'srt');
  };

  const triggerVttExport = () => {
    const activeSegments = getTranslatedSegmentsList();
    const contents = "WEBVTT\n\n" + activeSegments.map((seg, idx) => {
      const start = formatSubTime(seg.start, true);
      const end = formatSubTime(seg.end, true);
      return `${idx + 1}\n${start} --> ${end}\n${seg.speaker}: ${seg.text}\n`;
    }).join("\n");

    downloadFile(contents, 'text/vtt', 'vtt');
  };

  const triggerJsonExport = () => {
    const dataString = JSON.stringify(upload, null, 2);
    downloadFile(dataString, 'application/json', 'json');
  };

  const activeSegments = getTranslatedSegmentsList();

  return (
    <div id="workspace-container" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 font-sans">
      
      {/* Workspace Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 font-sans">
        <div>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-blue-100/30">Active Workspace</span>
          <h1 className="text-xl lg:text-2xl font-bold font-display text-slate-900 mt-2 truncate max-w-xl">{upload.fileName}</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Size: {upload.fileSize} • Duration: {upload.duration} • Uploaded: {new Date(upload.uploadedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Download File Formats Action dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active View Language Toggle Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50 text-xs font-semibold">
            <button
               type="button"
               onClick={() => setViewLanguage('original')}
               className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                 viewLanguage === 'original' 
                   ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50' 
                   : 'text-slate-500 hover:text-slate-800'
               }`}
            >
              Original ({upload.originalLanguage})
            </button>
            {Object.keys(upload.translations).map((code) => (
              <button
                 key={code}
                 type="button"
                 onClick={() => setViewLanguage(code)}
                 className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                   viewLanguage === code 
                     ? 'bg-white text-emerald-600 shadow-xs border border-slate-200/50 font-extrabold' 
                     : 'text-slate-505 hover:text-slate-800'
                 }`}
              >
                {upload.translations[code].language}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-slate-700">
            <button
              type="button"
              onClick={triggerTxtExport}
              title="Download Transcript (TXT)"
              className="px-2.5 py-1.5 hover:bg-white text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              TXT
            </button>
            <button
              type="button"
              onClick={triggerSrtExport}
              title="Download YouTube/VLC SRT Captions"
              className="px-2.5 py-1.5 hover:bg-white text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              SRT
            </button>
            <button
              type="button"
              onClick={triggerVttExport}
              title="Download WebVTT Captions"
              className="px-2.5 py-1.5 hover:bg-white text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              VTT
            </button>
            <button
              type="button"
              onClick={triggerJsonExport}
              title="Export complete JSON metadata"
              className="px-2.5 py-1.5 hover:bg-white text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              JSON
            </button>
          </div>

          <button
            type="button"
            onClick={() => onDelete(upload.id)}
            title="Delete this workspace data"
            className="p-2 border border-slate-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Native Video Player & Multi-Language Translate Module (5 cols) */}
        <div id="media-translation-block" className="xl:col-span-5 space-y-6">
          
          <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video relative group border border-slate-900 shadow-md">
            {mediaUrl ? (
              upload.fileType === 'video' ? (
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={mediaUrl}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-white space-y-4">
                  <div className="p-4 bg-blue-500/20 text-blue-400 rounded-full animate-pulse border border-blue-500/10">
                    <Volume2 className="w-10 h-10" />
                  </div>
                  <p className="font-semibold text-slate-200">Play audio transcription track</p>
                  <audio
                    ref={mediaRef as React.RefObject<HTMLAudioElement>}
                    src={mediaUrl}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    className="w-[90%] mx-auto mt-4"
                  />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 font-sans">
                <HelpCircle className="w-12 h-12 text-slate-700 mb-3" />
                <p className="font-bold text-slate-300">File not captured</p>
                <p className="text-xs text-slate-650 max-w-xs mt-1">This workspace metadata remains, but the original source video file was deleted on disk or is unavailable.</p>
              </div>
            )}
          </div>

          {/* Dynamic Interactive Translation panel (Primary Feature) */}
          <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5 mt-4">
            <h3 className="font-bold text-slate-700 font-display flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-blue-600" />
              Translate with Gemini
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Select target languages. Gemini translates dialogue chunks seamlessly, matching timestamps instantly.
            </p>

            <div className="flex gap-2 mt-4">
              <select
                value={targetLangCode}
                onChange={(e) => setTargetLangCode(e.target.value)}
                disabled={isTranslating}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-blue-450 font-medium"
              >
                {LANGUAGES_POOL.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    Translate to: {lang.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleTranslateCall}
                disabled={isTranslating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs shrink-0 flex items-center gap-1.5 transition-all disabled:opacity-80 disabled:pointer-events-none cursor-pointer"
              >
                {isTranslating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                    Working...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Translate
                  </>
                )}
              </button>
            </div>

            {translationError && (
              <p className="text-xs font-semibold text-red-500 mt-2 font-sans">{translationError}</p>
            )}

            {/* Translation instructions hints */}
            <div className="mt-4 pt-4 border-t border-slate-250/50 flex gap-2 text-[10px] text-slate-400 leading-relaxed font-sans">
              <ListChecks className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Once translated, subtitles update instantly on timeline cards, and are available for multi-lingual download.</span>
            </div>
          </div>

          {/* AI Insights & Topics Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="font-bold text-slate-700 font-display text-sm tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Extracted Topics
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {upload.topics.map((topic, i) => (
                <span 
                  key={i}
                  className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-blue-100/25 font-sans"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Active workspace display view panels (7 cols) */}
        <div id="content-display-block" className="xl:col-span-7 flex flex-col min-h-[640px] xl:h-[680px] border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          
          {/* Segment display sub-tabs selectors */}
          <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between px-3 py-2 shrink-0 gap-1.5">
            <div className="flex flex-wrap space-x-1 gap-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('segments')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'segments'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Sub-Segments ({activeSegments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'transcript'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Full Transcript
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                AI Executive Summary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('creatorKit')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'creatorKit'
                    ? 'bg-white text-red-650 shadow-xs border border-slate-200/50 font-bold'
                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50/10'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-red-550" />
                YouTube Creator Kit
              </button>
            </div>
          </div>

          {/* Active rendering block body */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            
            {/* VIEW 1: Subtitle Segments with exact Timing synchronizations */}
            {activeTab === 'segments' && (
              <div className="space-y-3.5">
                {activeSegments.map((seg) => {
                  const isActive = seg.id === activeSegmentId;
                  const isCurrentEditing = editingSegmentId === seg.id;

                  return (
                    <div
                      key={seg.id}
                      ref={(el) => { segmentRefs.current[seg.id] = el; }}
                      className={`group border rounded-lg p-3.5 transition-all ${
                        isActive 
                          ? 'border-blue-500 bg-blue-50/10 shadow-xs ring-1 ring-blue-500' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {/* Interactive time button */}
                          <button
                            type="button"
                            onClick={() => jumpToSegmentTimes(seg.start)}
                            title="Jump video to this timestamp"
                            className={`px-2 py-1 rounded font-mono text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isActive 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {seg.start} - {seg.end}
                          </button>

                          {/* Editable Speaker */}
                          {isCurrentEditing ? (
                            <input
                              type="text"
                              value={editedSegmentSpeaker}
                              onChange={(e) => setEditedSegmentSpeaker(e.target.value)}
                              className="bg-white border border-slate-200 text-xs font-bold px-2 py-0.5 rounded text-slate-800 max-w-[120px]"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-700 font-sans tracking-wide">
                              {seg.speaker}
                            </span>
                          )}
                        </div>

                        {/* Interactive edit trigger */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isCurrentEditing ? (
                            <button
                              type="button"
                              onClick={() => saveSegmentEdit(seg.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startSegmentEdit(seg, seg.text)}
                              title="Edit caption spelling"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Paragraph Text area representing subtitles */}
                      {isCurrentEditing ? (
                        <textarea
                          rows={2}
                          value={editedSegmentText}
                          onChange={(e) => setEditedSegmentText(e.target.value)}
                          className="w-full text-sm text-slate-700 bg-white border border-slate-250 rounded-lg p-2 focus:outline-hidden focus:border-blue-450 focus:ring-1 focus:ring-blue-450"
                        />
                      ) : (
                        <p className={`text-sm leading-relaxed ${isActive ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                          {seg.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: Complete Text Full Transcript */}
            {activeTab === 'transcript' && (
              <div className="h-full flex flex-col font-sans">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Verbatim Dialogue Raw</span>
                  {isEditingTranscript ? (
                    <button
                      type="button"
                      onClick={saveFullTranscriptEdit}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedTranscript(getActiveTranscriptText());
                        setIsEditingTranscript(true);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Transcript
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  {isEditingTranscript ? (
                    <textarea
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                      className="w-full h-[320px] text-sm text-slate-705 border border-slate-250 rounded-lg p-3 focus:outline-hidden focus:border-blue-450 focus:ring-1 focus:ring-blue-450 font-sans leading-relaxed"
                    />
                  ) : (
                    <div className="text-sm text-slate-650 whitespace-pre-line leading-relaxed px-1">
                      {getActiveTranscriptText()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: AI Executive Bullet Summary list */}
            {activeTab === 'summary' && (
              <div className="font-sans px-2">
                <h3 className="text-sm font-bold font-display text-slate-800 mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Gemini Smart Takeaways
                </h3>
                
                <div className="bg-slate-50/70 rounded-lg p-5 border border-slate-200 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {upload.summary}
                </div>
              </div>
            )}

            {/* VIEW 4: YouTube Social Creator Studio Package */}
            {activeTab === 'creatorKit' && (
              <div className="space-y-6 px-1 py-1">
                {!upload.creatorPackage ? (
                  <div className="text-center py-16 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 shadow-2xs">
                    <Video className="w-12 h-12 text-red-550 mx-auto mb-3 animate-pulse" />
                    <h3 className="font-bold text-slate-800 text-base">YouTube Viral Creator Kit</h3>
                    <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      This transcription record does not have creator optimization metadata yet. Generate high CTR headlines, thumbnail hooks, chapter cuts, tags, and viral shorts details block instantly using Gemini!
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateCreatorKit}
                      disabled={isGeneratingKit}
                      className="mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 mx-auto disabled:opacity-85 cursor-pointer"
                    >
                      {isGeneratingKit ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                          Analyzing & Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-white text-white" />
                          Generate Creator Package
                        </>
                      )}
                    </button>
                    {kitError && (
                      <p className="text-xs font-semibold text-red-500 mt-3">{kitError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* Aligned Match status indicator */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50/40 p-4 rounded-xl border border-red-100/30">
                      <div>
                        <span className="text-[9px] bg-red-600 text-white font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">SEO Matches Active</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">Scribe Creator Package is Active!</h4>
                        <p className="text-xs text-slate-500">Optimized utilizing clickable timestamps seek, tag exports, and visual previews.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateCreatorKit}
                        disabled={isGeneratingKit}
                        className="text-xs bg-white text-slate-700 font-semibold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 shrink-0 hover:border-red-200 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCcw className="w-3 h-3 text-red-500" />
                        Regenerate Package
                      </button>
                    </div>

                    {/* Element 1: Visual Thumbnail Text Suggestions */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-red-500 shrink-0" />
                        Thumbnail Overlays Suggestion
                      </h4>
                      <p className="text-[11px] text-slate-450 mb-3 leading-tight">These bold overlays give your custom thumbnail graphics a high click-through rate.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {upload.creatorPackage.thumbnailTexts.map((text, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleCopyToClipboard(text, `thumb-${idx}`)}
                            className="group relative bg-[#0d0909] p-5 rounded-xl border border-red-950/40 text-center flex flex-col items-center justify-center min-h-[92px] cursor-pointer hover:border-red-500 hover:shadow-sm transition-all active:scale-[0.98]"
                          >
                            <span className="font-sans text-[7px] text-red-400 font-bold uppercase tracking-widest mb-1.5">SUGGESTION {idx + 1}</span>
                            <span className="font-sans font-black text-xs text-yellow-500 tracking-tight uppercase leading-snug select-none group-hover:text-yellow-450 transition-colors">
                              "{text}"
                            </span>
                            <div className="absolute top-1.5 right-1.5 text-[8px] bg-black/50 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800 font-bold">
                              {copiedText === `thumb-${idx}` ? "COPIED" : "COPY"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Element 2: Viral Title Formulations */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
                        Viral & Highly Magnetic Title Suggestions
                      </h4>
                      <div className="space-y-2">
                        {upload.creatorPackage.titles.map((title, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleCopyToClipboard(title, `title-${idx}`)}
                            className="bg-slate-50 hover:bg-slate-100/50 border border-slate-205/30 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all active:translate-y-[0.5px]"
                          >
                            <div className="flex gap-2.5 items-start min-w-0">
                              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-600 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-xs font-bold text-slate-800 leading-snug min-w-0">{title}</p>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <span className="hidden md:inline bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px]">High CTR</span>
                              <span className="border border-slate-200 bg-white px-1.5 py-0.5 rounded font-mono">
                                {copiedText === `title-${idx}` ? "COPIED" : "COPY"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Element 3: YouTube Chapters Timestamp Seek */}
                    <div>
                      <div className="flex justify-between items-center mb-2.5">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-red-500 shrink-0" />
                            YouTube Timestamps & Timeline cuts
                          </h4>
                          <p className="text-[11px] text-slate-450 leading-tight mt-0.5">Play the video from any chapter by clicking its timestamp below.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const chaptersStr = upload.creatorPackage?.chapters.map(c => `${c.timestamp} ${c.title}`).join("\n") || "";
                            handleCopyToClipboard(chaptersStr, 'chapters-formatted');
                          }}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedText === 'chapters-formatted' ? "Copied!" : "Copy Index Block"}
                        </button>
                      </div>

                      <div className="border border-slate-150/60 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden shadow-2xs">
                        {upload.creatorPackage.chapters.map((chap, idx) => (
                          <div key={idx} className="p-2.5 bg-white hover:bg-slate-50/55 flex items-center justify-between text-xs transition-colors">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => jumpToSegmentTimes(chap.timestamp)}
                                className="px-2 py-0.5 text-[10px] font-mono font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white rounded transition-all flex items-center gap-0.5 cursor-pointer"
                              >
                                <Play className="w-2 h-2 fill-current" />
                                {chap.timestamp}
                              </button>
                              <span className="font-semibold text-slate-700">
                                {chap.title}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-wider">Outline Segment</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Element 4: Viral reels / shorts suggestions with timestamps */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-red-500 shrink-0" />
                        Viral Reels/Shorts Highlights (With Timestamps)
                      </h4>
                      <p className="text-[11px] text-slate-450 mb-3 leading-tight">Extract 30-60 second highlights with customized peak hooks to reuse on social media loops.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {upload.creatorPackage.viralReels.map((reel, idx) => (
                          <div key={idx} className="bg-slate-50/30 border border-slate-150 rounded-xl p-4 hover:border-red-100 transition-all shadow-3xs space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-0.5">
                                <Flame className="w-3.5 h-3.5" />
                                Clip Short #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const startParts = reel.timestamp.split("-")[0].trim();
                                  jumpToSegmentTimes(startParts);
                                }}
                                className="text-[10px] font-mono font-extrabold text-slate-600 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded transition-all flex items-center gap-0.5 cursor-pointer"
                              >
                                <Play className="w-2 h-2 fill-current" />
                                Seek {reel.timestamp}
                              </button>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Trigger statement / Hook phrase</span>
                              <p className="text-xs font-bold text-slate-850 italic mt-0.5 leading-tight">
                                "{reel.peakHook}"
                              </p>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Viral explanation</span>
                              <p className="text-[11px] text-slate-605 mt-0.5 leading-normal">
                                {reel.whyViral}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Element 5: 5-7 min auxiliary Clips/Sub-Videos (highlights channel content) */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-red-500 shrink-0" />
                        5-7 min Clips Suggestion (for highlight segments)
                      </h4>
                      <p className="text-[11px] text-slate-450 mb-3 leading-tight">For podcasters or long videos, clip and separate these standalone 5-7 minute structural segments.</p>
                      <div className="space-y-2.5">
                        {upload.creatorPackage.clipSuggestions.map((clip, idx) => (
                          <div key={idx} className="bg-slate-50 hover:bg-slate-100/30 border border-slate-150 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all hover:border-red-100">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Segment {idx + 1}</span>
                                <span className="text-[11px] font-mono font-bold text-red-600">{clip.timestamp}</span>
                              </div>
                              <h5 className="font-bold text-slate-800 text-xs mt-1 truncate">{clip.title}</h5>
                              <p className="text-[11px] text-slate-500 leading-normal font-sans line-clamp-1">{clip.summary}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const startPart = clip.timestamp.split("-")[0].trim();
                                jumpToSegmentTimes(startPart);
                              }}
                              className="text-[10px] bg-white text-red-600 hover:bg-neutral-50 hover:text-red-700 font-bold px-3 py-1.5 border border-slate-200 hover:border-red-200 rounded-md transition-all shrink-0 flex items-center gap-1 self-end sm:self-auto"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              View Segment
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Element 6: Full SEO Description and Metadata Export fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                      <div className="lg:col-span-8 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            YouTube Description Copy Template
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(upload.creatorPackage?.seoDescription || "", 'desc-formatted')}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedText === 'desc-formatted' ? "Copied!" : "Copy Description"}
                          </button>
                        </div>
                        <textarea
                          readOnly
                          rows={11}
                          value={upload.creatorPackage.seoDescription}
                          className="w-full text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 font-mono leading-relaxed focus:outline-hidden select-all"
                        />
                      </div>

                      <div className="lg:col-span-4 space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Hashtags</span>
                            <button
                              type="button"
                              onClick={() => {
                                const hashStr = upload.creatorPackage?.hashtags.join(" ") || "";
                                handleCopyToClipboard(hashStr, 'hash-copied');
                              }}
                              className="text-[9px] text-slate-400 hover:text-red-600 font-bold"
                            >
                              {copiedText === 'hash-copied' ? "CORRECT!" : "Copy All"}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {upload.creatorPackage.hashtags.map((h, i) => (
                              <span key={i} className="text-[10px] bg-red-50 text-red-600 border border-red-100/30 px-2 py-0.5 rounded font-bold">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Search Tags</span>
                            <button
                              type="button"
                              onClick={() => {
                                const tagsStr = upload.creatorPackage?.videoTags.join(", ") || "";
                                handleCopyToClipboard(tagsStr, 'tags-copied');
                              }}
                              className="text-[9px] text-slate-400 hover:text-red-600 font-bold"
                            >
                              {copiedText === 'tags-copied' ? "Copied!" : "Copy String"}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-[140px] overflow-y-auto">
                            {upload.creatorPackage.videoTags.map((tag, i) => (
                              <span key={i} className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
