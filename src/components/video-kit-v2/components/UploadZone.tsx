/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileVideo, FileAudio, AlertCircle, Sparkles, Server, Link2, Video, Cloud } from 'lucide-react';
import { MediaUpload } from '../types';
import { mediaDB } from '../db';

interface UploadZoneProps {
  onUploadSuccess: (uploadData: MediaUpload) => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [mediaDuration, setMediaDuration] = useState<string>("Unknown");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<{ healthy: boolean; keyConfigured: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend server and API key configuration on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const res = await fetch("/api/video-kit-v2/health");
      const data = await res.json();
      setApiHealth({
        healthy: data.status === "healthy",
        keyConfigured: data.geminiKeyConfigured
      });
    } catch (err) {
      setApiHealth({
        healthy: false,
        keyConfigured: false
      });
    }
  };

  const steps = [
    "Uploading media bytes to workspace...",
    "Gemini is analyzing speech track dynamics...",
    "Detecting vocal languages and accents...",
    "Segmenting conversations with exact timing metadata...",
    "Structuring premium summary and key indexing topics..."
  ];

  // Rotate through simulated steps to entertain and keep user engaged while Gemini works
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev; // hold on last step until server returns
        });
      }, 5500);
    } else {
      setProcessingStep(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    const isVideo = selectedFile.type.startsWith("video/");
    const isAudio = selectedFile.type.startsWith("audio/");

    if (!isVideo && !isAudio) {
      setError("Supported file types are MP4, WebM, QuickTime, MP3, WAV, and M4A.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 45 * 1024 * 1024) {
      setError("For optimal processing inside this frame, max file size is limited to 45MB.");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Calculate duration using native browser media elements
    try {
      const element = document.createElement(isVideo ? "video" : "audio");
      element.src = URL.createObjectURL(selectedFile);
      element.preload = "metadata";
      element.onloadedmetadata = () => {
        const rawSeconds = Math.round(element.duration);
        if (!isNaN(rawSeconds) && isFinite(rawSeconds)) {
          const m = Math.floor(rawSeconds / 60);
          const s = rawSeconds % 60;
          setMediaDuration(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
          setMediaDuration("Unknown");
        }
        URL.revokeObjectURL(element.src);
      };
    } catch {
      setMediaDuration("Unknown");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStep(0);

    const formData = new FormData();
    formData.append("file", file);

    const fileType: 'video' | 'audio' = file.type.startsWith("video/") ? 'video' : 'audio';
    const uploadId = "up_" + Math.random().toString(36).substring(2, 11);

    try {
      // 1. Immediately store file Blob in client browser's IndexedDB
      // This is crucial to load/play the video locally in the browser later!
      await mediaDB.saveFile(uploadId, file);

      // 2. Query Express translation backend
      const response = await fetch("/api/video-kit-v2/transcribe", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let backendResult: any = null;

      if (!response.ok) {
        let errMsg = `Server responded with ${response.status} status.`;
        try {
          const errData = JSON.parse(responseText);
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {
          if (responseText.includes("<!doctype") || responseText.includes("<!DOCTYPE")) {
            errMsg = `Transcription failed: Server returned an HTML web page (Status ${response.status}). This can occur if the file size exceeds proxy limits or there is a server configuration error.`;
          } else if (responseText) {
            errMsg = responseText.substring(0, 200);
          }
        }
        throw new Error(errMsg);
      }

      try {
        backendResult = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Failed to parse server transcription response as valid JSON data.");
      }

      // Format byte sizes
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 1;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      };

      // 3. Craft final rich schema
      const richUpload: MediaUpload = {
        id: uploadId,
        fileName: file.name,
        fileSize: formatBytes(file.size),
        fileType,
        sourceKind: 'upload',
        duration: mediaDuration === "Unknown" ? "00:00" : mediaDuration,
        uploadedAt: new Date().toISOString(),
        status: 'completed',
        originalLanguage: backendResult.originalLanguage || "English",
        transcript: backendResult.transcript,
        summary: backendResult.summary,
        // Make sure we attach standard unique segment IDs for reactive translations matching
        segments: (backendResult.segments || []).map((seg: any, idx: number) => ({
          id: `seg_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          start: seg.start,
          end: seg.end,
          speaker: seg.speaker || `Speaker ${idx === 0 ? '1' : 'A'}`,
          text: seg.text
        })),
        topics: backendResult.topics || [],
        translations: {},
        creatorPackage: backendResult.creatorPackage
      };

      // 4. Reset state and callbacks
      setFile(null);
      onUploadSuccess(richUpload);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong in transcription.");
      // Attempt clean up of stored IDB file on complete block failure
      try {
        await mediaDB.deleteFile(uploadId);
      } catch {}
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranscribeUrl = async () => {
    const cleanUrl = remoteUrl.trim();
    if (!cleanUrl) {
      setError("Please paste a YouTube video URL or public Google Drive file link.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStep(0);

    const uploadId = "up_" + Math.random().toString(36).substring(2, 11);

    try {
      const response = await fetch("/api/video-kit-v2/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const responseText = await response.text();
      let backendResult: any = null;

      if (!response.ok) {
        let errMsg = `Server responded with ${response.status} status.`;
        try {
          const errData = JSON.parse(responseText);
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {
          if (responseText) errMsg = responseText.substring(0, 220);
        }
        throw new Error(errMsg);
      }

      try {
        backendResult = JSON.parse(responseText);
      } catch {
        throw new Error("Failed to parse server transcription response as valid JSON data.");
      }

      const remoteMedia = backendResult.remoteMedia || {};
      const richUpload: MediaUpload = {
        id: uploadId,
        fileName: remoteMedia.fileName || "Remote media",
        fileSize: remoteMedia.fileSize || "Remote",
        fileType: remoteMedia.fileType || "audio",
        sourceKind: remoteMedia.sourceKind || (cleanUrl.includes("youtu") ? "youtube" : "google_drive"),
        sourceUrl: cleanUrl,
        youtubeVideoId: remoteMedia.youtubeVideoId,
        duration: remoteMedia.duration || "00:00",
        uploadedAt: new Date().toISOString(),
        status: 'completed',
        originalLanguage: backendResult.originalLanguage || "English",
        transcript: backendResult.transcript,
        summary: backendResult.summary,
        segments: (backendResult.segments || []).map((seg: any, idx: number) => ({
          id: `seg_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          start: seg.start,
          end: seg.end,
          speaker: seg.speaker || `Speaker ${idx === 0 ? '1' : 'A'}`,
          text: seg.text
        })),
        topics: backendResult.topics || [],
        translations: {},
        creatorPackage: backendResult.creatorPackage
      };

      setRemoteUrl('');
      onUploadSuccess(richUpload);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while transcribing the remote link.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="upload-panel" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-800">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Transcribe Studio Upload
          </h2>
          <p className="mt-0.5 text-xs font-sans text-slate-400">Upload audio/video or paste YouTube/Google Drive links.</p>
        </div>

        {/* Server Connection Indicator */}
        <div id="api-status-pill" className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          {apiHealth === null ? (
            <span className="text-slate-400">Syncing...</span>
          ) : apiHealth.healthy && apiHealth.keyConfigured ? (
            <span className="text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              Gemini Active
            </span>
          ) : (
            <span className="text-amber-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
              Key Missing
            </span>
          )}
        </div>
      </div>

      {apiHealth && !apiHealth.keyConfigured && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">Gemini API Key missing</p>
            <p className="mt-1 text-[11px] text-amber-700/90 leading-relaxed">
              Your server is online but has no active <code className="bg-amber-100/80 px-1 rounded text-red-600">GEMINI_API_KEY</code> loaded.
              Please add your Gemini Key in the <b>Settings &gt; Secrets</b> panel on top of the AI Studio workspace.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 font-sans">
            <p className="font-semibold">Transcribe Studio Error</p>
            <p className="mt-0.5 text-[11px] text-red-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setInputMode('file')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition ${
            inputMode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          File Upload
        </button>
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition ${
            inputMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          YouTube / Drive Link
        </button>
      </div>

      {inputMode === 'url' ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {isProcessing ? (
            <div className="flex w-full max-w-xl flex-col items-center py-4 mx-auto">
              <div className="relative mb-4 h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-50 opacity-10"></div>
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
              <h3 className="animate-pulse font-display text-sm font-bold text-slate-800">Processing Remote Media</h3>
              <div className="mb-2 mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-center font-mono text-xs font-medium text-blue-600">
                Step {processingStep + 1} of {steps.length}: {steps[processingStep]}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="Paste YouTube URL or public Google Drive file link..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={handleTranscribeUrl}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                Transcribe Link
              </button>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 lg:col-span-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold">
                  <Video className="h-3.5 w-3.5 text-red-500" />
                  YouTube audio track
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold">
                  <Cloud className="h-3.5 w-3.5 text-blue-500" />
                  Public Google Drive media
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
        id="drag-drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-all sm:p-5 ${
          isProcessing ? 'pointer-events-none opacity-80' : ''
        } ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/40 shadow-xs' 
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/30'
        }`}
        >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="video/*,audio/*"
          onChange={handleChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex w-full max-w-xl flex-col items-center py-4">
            <div className="relative mb-4 h-12 w-12">
              {/* Spinning animated ring */}
              <div className="absolute inset-0 border-4 border-blue-50 rounded-full opacity-10"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h3 className="animate-pulse font-display text-sm font-bold text-slate-800">Processing Media File</h3>
            
            {/* Visual step description indicator progress */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-700 rounded-full"
                style={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 font-medium font-mono text-center">
              Step {processingStep + 1} of {steps.length}: {steps[processingStep]}
            </p>
          </div>
        ) : file ? (
          <div className="flex w-full flex-col items-center py-2 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="mb-3 rounded-xl border border-blue-100/30 bg-blue-50 p-3 text-blue-600 sm:mb-0">
              {file.type.startsWith("video/") ? (
                <FileVideo className="h-7 w-7" />
              ) : (
                <FileAudio className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0 flex-1 sm:px-4">
              <p className="max-w-full truncate font-bold text-slate-850">{file.name}</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-mono text-slate-400 sm:justify-start">
              <span>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
                <span>Duration: {mediaDuration}</span>
              </div>
            </div>

            <div className="mt-4 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Clear File
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTranscribe();
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Transcribe with Gemini
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-3 text-center sm:py-4">
            <div className="mb-3 rounded-xl bg-slate-50 p-3 text-blue-500 transition-colors hover:bg-blue-50">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="font-medium text-slate-700">Drag & drop files or <span className="text-blue-600 font-semibold underline">browse locally</span></p>
            <span className="text-xs text-slate-400 font-sans mt-1.5">Supports video/audio formats up to 45 MB</span>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

