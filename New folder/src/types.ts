/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubtitleSegment {
  id: string;
  start: string; // e.g. "00:12"
  end: string;   // e.g. "00:20"
  speaker: string;
  text: string;
}

export interface TranslationData {
  language: string; // e.g. "Spanish", "French"
  langCode: string; // e.g. "es", "fr"
  fullTranscript: string;
  segments: {
    segmentId: string;
    translatedText: string;
  }[];
}

export interface CreatorPackage {
  thumbnailTexts: string[];
  titles: string[];
  seoDescription: string;
  hashtags: string[];
  videoTags: string[];
  viralReels: {
    timestamp: string; // e.g. "01:25 - 02:10"
    peakHook: string; // e.g. "Why AI is lying to you"
    whyViral: string; 
  }[];
  clipSuggestions: {
    title: string;
    timestamp: string; // e.g. "05:00 - 11:30"
    summary: string;
  }[];
  chapters: {
    timestamp: string; // e.g. "00:00"
    title: string;
  }[];
}

export interface MediaUpload {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: 'video' | 'audio';
  duration: string; // e.g., "02:15" or "Unknown"
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  originalLanguage: string;
  transcript: string;
  summary: string;
  segments: SubtitleSegment[];
  topics: string[];
  error?: string;
  translations: {
    [langCode: string]: TranslationData;
  };
  creatorPackage?: CreatorPackage;
}

export interface DashboardStats {
  totalFiles: number;
  totalDurationSeconds: number;
  videoCount: number;
  audioCount: number;
  translatedCount: number;
}
