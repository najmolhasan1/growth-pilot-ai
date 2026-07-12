/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Video, RefreshCcw, Monitor, Globe, Database, Wand2
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
    seoDescription: "Transform your video creation workflow using automated captioning and translation powered by Gemini. In this walkthrough, we demonstrate speaker separation, subtitle timing alignment, interactive seek controls, and multilingual transcript output.\n\nUpload your MP4 or MP3 file to generate accurate transcripts, viral title ideas, thumbnail hooks, chapter cuts, captions, and creator-ready metadata from the actual media.",
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
    <div id="application-layout" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 p-4 font-sans sm:p-5 xl:p-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative isolate overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-6 lg:px-7">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#172554)]" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">
                    <Video className="h-3.5 w-3.5" />
                    Video Kit V2
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
                    Gemini Powered
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Transcribe, translate, and turn videos into creator assets.
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                  Upload a local audio or video file, generate timestamped transcript data, then create titles, hooks, shorts ideas, chapters, hashtags, and SEO descriptions from the actual transcript.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-200 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <Database className="h-4 w-4 text-blue-200" />
                    Local media library
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <Globe className="h-4 w-4 text-emerald-200" />
                    Transcript translation
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <Wand2 className="h-4 w-4 text-amber-200" />
                    Creator package
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <a 
                  href="#upload-panel"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  New Transcribe
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset and restore the default Welcome Demo? Your other transcripts will remain.")) {
                      const alreadyHasDemo = uploads.some(u => u.id === DEMO_UPLOAD.id);
                      if (!alreadyHasDemo) {
                        setUploads(prev => [...prev, DEMO_UPLOAD]);
                      }
                      setSelectedUploadId(DEMO_UPLOAD.id);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="dashboard-stats-section">
          <DashboardStats uploads={uploads} />
        </section>

        <UploadZone onUploadSuccess={handleUploadSuccess} />

        <div className="min-w-0">
          {activeUpload ? (
            <Workspace 
              upload={activeUpload} 
              onUpdate={handleUpdateUpload}
              onDelete={handleDeleteUpload}
            />
          ) : (
            <div id="empty-workspace-card" className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-blue-500 shadow-sm">
                <Monitor className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No active transcription</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Select a media file from the library or upload a new one to generate captions, timestamps, summaries, translations, and creator assets.
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
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                Load Welcome Demo File
              </button>
            </div>
          )}
        </div>

        <FileList 
          uploads={uploads} 
          selectedId={selectedUploadId} 
          onSelect={setSelectedUploadId} 
          onDelete={handleDeleteUpload} 
        />
      </div>
    </div>
  );
}
