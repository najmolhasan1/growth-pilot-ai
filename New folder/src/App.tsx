/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Video, HelpCircle, RefreshCcw, ShieldAlert, Monitor, 
  LayoutDashboard, Server, Settings, Globe, FolderGit, Cpu, CheckCircle2 
} from 'lucide-react';
import { MediaUpload } from './types';
import DashboardStats from './components/DashboardStats';
import UploadZone from './components/UploadZone';
import FileList from './components/FileList';
import Workspace from './components/Workspace';
import { mediaDB } from './db';

const DEMO_UPLOAD: MediaUpload = {
  id: "demo_gemini_multimodal",
  fileName: "Welcome_Gemini_Multimodal_Demo.mp4",
  fileSize: "4.2 MB",
  fileType: 'video',
  duration: "00:15",
  uploadedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(), // 2.5 hours ago
  status: 'completed',
  originalLanguage: "English",
  transcript: "Speaker 1: Welcome to TranscribeStudio. This interactive playground demonstrates Gemini 3.5 Flash transcribing audio and video with speaker diarization on-the-fly.\n\nSpeaker A: Oh, writing structured subtitle coordinates is remarkably simple in JSON. Look how we can click timestamps to seek the player automatically, edit dialogues, and switch languages side by side.\n\nSpeaker 1: It has support for multiple languages. Try selecting Spanish or Japanese in the translator panel to see Gemini transcribe it instantly!",
  summary: "• Demonstrates TranscribeStudio's automated transcription and translation pipelines powered by Gemini.\n• Explores timeline seeker, micro subtitle edits, and side-by-side translated caption downloads.",
  segments: [
    {
      id: "demo_seg_1",
      start: "00:00",
      end: "00:05",
      speaker: "Speaker 1",
      text: "Welcome to TranscribeStudio. This interactive playground demonstrates Gemini 3.5 Flash transcribing audio and video with speaker diarization on-the-fly."
    },
    {
      id: "demo_seg_2",
      start: "00:06",
      end: "00:11",
      speaker: "Speaker A",
      text: "Oh, writing structured subtitle coordinates is remarkably simple in JSON. Look how we can click timestamps to seek player seek, edit dialogues, and switch languages."
    },
    {
      id: "demo_seg_3",
      start: "00:12",
      end: "00:15",
      speaker: "Speaker 1",
      text: "It has support for multiple languages. Try selecting Spanish or Japanese in the translator panel to see Gemini transcribe it instantly!"
    }
  ],
  topics: ["Gemini AI", "Diarization", "Subtitles", "Interactive Seeker"],
  translations: {
    "es": {
      language: "Spanish",
      langCode: "es",
      fullTranscript: "Speaker 1: Bienvenido a TranscribeStudio. Este patio de recreo interactivo demuestra la transcripción de audio y video de Gemini 3.5 con diarización sobre la marcha.\n\nSpeaker A: Oh, escribir coordenadas de subtítulos estructurados es notablemente simple en JSON. Vea cómo podemos hacer clic en las marcas de tiempo para buscar automáticamente, editar diálogos y cambiar de idioma.\n\nSpeaker 1: Cuenta con soporte para múltiples idiomas. Intente seleccionar español o japonés en el panel de traducción para que Gemini lo transcriba al instante.",
      segments: [
        { segmentId: "demo_seg_1", translatedText: "Bienvenido a TranscribeStudio. Este patio de recreo interactivo demuestra la transcripción de audio y video de Gemini 3.5 con diarización sobre la marcha." },
        { segmentId: "demo_seg_2", translatedText: "Oh, escribir coordenadas de subtítulos estructurados es notablemente simple en JSON. Vea cómo podemos hacer clic en las marcas de tiempo para buscar automáticamente, editar diálogos y cambiar de idioma." },
        { segmentId: "demo_seg_3", translatedText: "Cuenta con soporte para múltiples idiomas. Intente seleccionar español o japonés en el panel de traducción para que Gemini lo transcriba al instante." }
      ]
    }
  },
  creatorPackage: {
    thumbnailTexts: [
      "AI DOES IT IN 10s! 😱",
      "No More Manual Typing!",
      "Secret To Viral Videos"
    ],
    titles: [
      "How I Transcribe Entire Podcasts Instantly with Gemini 3.5",
      "The Secret to Multi-Language Video Translations in Seconds",
      "Meet the Smartest Audio Transcription Engine in 2026",
      "Is Manual Video Captioning Officially Dead?",
      "Automate Your YouTube Subtitles Using This Custom Workspace"
    ],
    seoDescription: "🚀 Transform your video creation workflow using our ultimate automated captioning and translation tool powered by Gemini! In this walk-through, we demonstrate automatic speaker separation (diarization), JSON subtitle timing alignments, and interactive seek controls.\n\n🔥 Want to replicate this? Upload your MP4/MP3 and generate descriptions, viral titles, thumbnail ideas, chapter cuts, and multiple languages instantly.\n\nTIMESTAMPS:\n00:00 - Introduction & Diarization Demo\n00:06 - Clickable Playback Seek Elements \n00:12 - Global Language Translation Pipeline\n\nFind more resources and join our community! Don't forget to like, subscribe, and share.\n\n#AI #Transcription #SEO #YouTubeSecrets #Creators",
    hashtags: ["#AI", "#ScribeStudio", "#Diarization", "#ViralGrowth"],
    videoTags: [
      "AI subtitle generator",
      "podcast transcription guide",
      "Gemini 3.5 Flash",
      "automatic diarization tool",
      "YouTube video SEO checklist",
      "timestamp clips planner",
      "viral reels maker",
      "ScribeStudio demo",
      "convert audio to srt"
    ],
    viralReels: [
      {
        timestamp: "00:00 - 00:05",
        peakHook: "Auto-transcribe any video and separate human voices instantly with AI!",
        whyViral: "Starts with an energetic, visual hook solving an expensive problem for creators: boring transcription. High audience retention."
      },
      {
        timestamp: "00:06 - 00:11",
        peakHook: "Clicking timed JSON subtitles to automatically jump player seek times!",
        whyViral: "Awesome showcase of responsive interaction. Educational design audiences love smooth, elegant timeline alignment tricks."
      }
    ],
    clipSuggestions: [
      {
        title: "How Timed Captions Solve Low Audience Attention Spans",
        timestamp: "00:00 - 00:05",
        summary: "An in-depth segment highlighting the psychology of kinetic on-screen captions for modern YouTube content viewers."
      },
      {
        title: "Unlocking Global Audiences with Single-Click translation Channels",
        timestamp: "00:12 - 00:15",
        summary: "Why deploying multi-lingual translations (Spanish, Japanese, Arabic, Hind) is the #1 easiest trick to multiply your analytics."
      }
    ],
    chapters: [
      { timestamp: "00:00", title: "Introduction & Diarization Demo" },
      { timestamp: "00:06", title: "Clickable Playback Seek System" },
      { timestamp: "00:12", title: "Global Language Translation Pipeline" }
    ]
  }
};

export default function App() {
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);

  // 1. Initial hydration from client storage
  useEffect(() => {
    const raw = localStorage.getItem("transcribe_uploads");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUploads(parsed);
          setSelectedUploadId(parsed[0].id);
        } else {
          setUploads([DEMO_UPLOAD]);
          setSelectedUploadId(DEMO_UPLOAD.id);
        }
      } catch {
        setUploads([DEMO_UPLOAD]);
        setSelectedUploadId(DEMO_UPLOAD.id);
      }
    } else {
      setUploads([DEMO_UPLOAD]);
      setSelectedUploadId(DEMO_UPLOAD.id);
    }

    // Spin IndexedDB open
    mediaDB.init().catch(err => {
      console.warn("IndexedDB system storage initialization problem:", err);
    });
  }, []);

  // 2. Continuous syncing back on records modify
  useEffect(() => {
    if (uploads.length > 0) {
      localStorage.setItem("transcribe_uploads", JSON.stringify(uploads));
    } else {
      localStorage.removeItem("transcribe_uploads");
    }
  }, [uploads]);

  const handleUploadSuccess = (newUpload: MediaUpload) => {
    setUploads((prev) => [newUpload, ...prev]);
    setSelectedUploadId(newUpload.id);
  };

  const handleUpdateUpload = (updated: MediaUpload) => {
    setUploads((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  };

  const handleDeleteUpload = async (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    if (selectedUploadId === id) {
      setSelectedUploadId(null);
    }
    // Delete file binary payload from local browser IndexedDB
    try {
      await mediaDB.deleteFile(id);
    } catch (err) {
      console.error("IndexedDB erase trouble", err);
    }
  };

  const activeUpload = uploads.find((u) => u.id === selectedUploadId) || null;

  return (
    <div id="application-layout" className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      
      {/* 1. Left Sidebar Navigation Panel (from Professional Polish template style) */}
      <aside className="w-64 bg-slate-900 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-800 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/65">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Video className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-base tracking-tight font-display">LinguistAI</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">Scribe Studio</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm">
            <LayoutDashboard className="w-4.5 h-4.5" />
            Dashboard Focus
          </a>
          <a href="#library-list" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white rounded-lg text-sm font-medium transition-colors">
            <FolderGit className="w-4.5 h-4.5" />
            Media Library
          </a>
          <a href="#upload-panel" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white rounded-lg text-sm font-medium transition-colors">
            <Cpu className="w-4.5 h-4.5" />
            Gemini Pipeline
          </a>
          <a href="#workspace-container" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white rounded-lg text-sm font-medium transition-colors">
            <Globe className="w-4.5 h-4.5" />
            Translations Panel
          </a>
        </nav>

        {/* Professional Usage Limits Widget */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs uppercase font-semibold">Workspace Limit</span>
              <span className="text-white text-xs font-bold">82%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 w-[82%] h-full"></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">24.6 / 30 transcription hours left</p>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header of Professional Polish Layout */}
        <header id="main-header" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-800 font-display">Scribe Workspace</h1>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">AIS-Prod</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm("Are you sure you want to reset and restore the default Welcome Demo? Your other transcripts will remain.")) {
                  const alreadyHasDemo = uploads.some(u => u.id === DEMO_UPLOAD.id);
                  if (!alreadyHasDemo) {
                    setUploads(prev => [...prev, DEMO_UPLOAD]);
                  }
                  setSelectedUploadId(DEMO_UPLOAD.id);
                }
              }}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 border border-slate-200 hover:border-blue-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-all"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>

            {/* Custom dynamically colored Avatar badge indicating the user */}
            <div className="flex items-center gap-2">
              <div title="mdnajmolh569@gmail.com" className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-xs overflow-hidden shrink-0">
                <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white uppercase select-none">
                  MD
                </div>
              </div>
              <span className="text-xs font-medium text-slate-600 hidden md:inline truncate max-w-[130px]">
                mdnajmolh569@...
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Slate Workspace Area wrapper */}
        <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-[1400px] w-full mx-auto font-sans">
          
          {/* Welcome title message dynamically colored */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                Welcome back, Alex
              </h2>
              <p className="text-sm text-slate-500 font-sans">
                You have {uploads.length === 0 ? "no active" : `${uploads.filter(u => u.status === 'processing').length} processing and ${uploads.filter(u => u.status === 'completed').length} completed`} transcriptions in your database workspace.
              </p>
            </div>
            
            <a 
              href="#upload-panel"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50 hover:bg-blue-700 hover:shadow-blue-300/60 active:scale-95 transition-all text-center self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              New Transcribe
            </a>
          </div>

          {/* Metric Dashboard Stats block */}
          <section id="dashboard-stats-section">
            <DashboardStats uploads={uploads} />
          </section>

          {/* Core Interactive Layout Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Upload Controls & Library lists (5 cols) */}
            <div className="xl:col-span-5 space-y-8">
              <UploadZone onUploadSuccess={handleUploadSuccess} />
              <FileList 
                uploads={uploads} 
                selectedId={selectedUploadId} 
                onSelect={setSelectedUploadId} 
                onDelete={handleDeleteUpload} 
              />
            </div>

            {/* Right Column: Visual Editor & Workspaces (7 cols) */}
            <div className="xl:col-span-7">
              {activeUpload ? (
                <Workspace 
                  upload={activeUpload} 
                  onUpdate={handleUpdateUpload}
                  onDelete={handleDeleteUpload}
                />
              ) : (
                <div id="empty-workspace-card" className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-xs flex flex-col items-center justify-center">
                  <div className="p-4 bg-slate-50 text-blue-500 rounded-3xl mb-5 border border-slate-200 shadow-xs">
                    <Monitor className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-800">No active transcription</h3>
                  <p className="text-sm text-slate-400 font-sans mt-2 max-w-sm">
                    Select a video file from your Library library, or drop a new one to generate captions, timestamps, summaries, and translations.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const exists = uploads.some(u => u.id === DEMO_UPLOAD.id);
                      if (!exists) {
                        setUploads(prev => [DEMO_UPLOAD, ...prev]);
                      }
                      setSelectedUploadId(DEMO_UPLOAD.id);
                    }}
                    className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Load Welcome Demo File
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
