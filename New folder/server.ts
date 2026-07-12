import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parse middle-ware
app.use(express.json({ limit: "50mb" }));

// Configure Multer for file uploads directly to disk (this streams bytes to disk, avoiding RAM-hogging buffers and OOM process termination)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, (file.fieldname || "media") + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Generous 100MB video/audio boundary limit
  }
});

// Lazy-initialized Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured in the workspace Secrets. Please set it under Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. Diagnostics endpoint
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "healthy",
    geminiKeyConfigured: hasKey,
    timestamp: new Date().toISOString()
  });
});

// 2. Transcription API (multimodal audio/video processing and transcription)
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  let tempFilePath = "";
  let uploadResult: any = null;
  let ai: any = null;

  try {
    ai = getGeminiClient();

    if (!req.file) {
      return res.status(400).json({ error: "No media file uploaded." });
    }

    const { path: filePath, mimetype, originalname } = req.file;
    tempFilePath = filePath;

    // 2. Upload using Gemini Files API (safely chunked and streamed for files up to 2GB)
    uploadResult = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: mimetype,
      },
    });

    // 3. Poll file processing state until active (Crucial for video/audio processing)
    let fileState = await ai.files.get({ name: uploadResult.name });
    let attempts = 0;
    while (fileState.state === "PROCESSING" && attempts < 40) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      fileState = await ai.files.get({ name: uploadResult.name });
      attempts++;
    }

    if (fileState.state === "FAILED") {
      throw new Error("Gemini media file metadata processing has failed.");
    }

    const systemInstruction = 
      "You are a stellar audio and video transcription AI. Your task is to transcribe the provided media file with highest precision. " +
      "Identify speaker switches (e.g., 'Speaker A', 'Speaker B', or by name if introduced/inferred) and partition the transcription " +
      "into clean, logical subtitle-styled segments with start and end timestamps. The timestamps must be in MM:SS (or HH:MM:SS) format. " +
      "Also provide a core concise summary of the file discussions, extract key topics/tags, " +
      "and generate a fully optimized YouTube Creator Package (featuring thumbnail text ideas, high-CTR potential video titles, an SEO keyword description, hashtags, video tags, viral reels suggestions, 5-7 minute sub-video cuts, and YouTube chapter timestamps). " +
      "You must output the transcription strictly to the provided JSON schema.";

    const prompt = `Please transcribe this file (${originalname}). First detect the primary language used in the file, then create the verbatim transcription, logical subtitle-style segments, a bulleted executive summary, key topics discussed, and full social creator details. Preserve exact names, jargon, and metrics.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType,
          }
        },
        prompt
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalLanguage: {
              type: Type.STRING,
              description: "The primary language detected in the video/audio (e.g., English, Spanish, Arabic, Hindi, French, Italian, German, Japanese)."
            },
            transcript: {
              type: Type.STRING,
              description: "The complete connected verbatim transcription string."
            },
            summary: {
              type: Type.STRING,
              description: "An elegant, bulleted summary of what was discussed, highlighting major takeaways."
            },
            segments: {
              type: Type.ARRAY,
              description: "Logical subtitle-like transcription segments.",
              items: {
                type: Type.OBJECT,
                properties: {
                  start: {
                    type: Type.STRING,
                    description: "Start timestamp of this segment, formatted as MM:SS (e.g., '00:05')."
                  },
                  end: {
                    type: Type.STRING,
                    description: "End timestamp of this segment, formatted as MM:SS (e.g., '00:12')."
                  },
                  speaker: {
                    type: Type.STRING,
                    description: "Speaker tag or name (e.g., 'Speaker 1', 'John Doe')."
                  },
                  text: {
                    type: Type.STRING,
                    description: "The precise text transcribed in this specific segment."
                  }
                },
                required: ["start", "end", "speaker", "text"]
              }
            },
            topics: {
              type: Type.ARRAY,
              description: "3 to 6 key tags or topics discussed.",
              items: {
                type: Type.STRING
              }
            },
            creatorPackage: {
              type: Type.OBJECT,
              description: "Optimized social sharing and SEO suggestions for the video creator.",
              properties: {
                thumbnailTexts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "At least 3 bold, high-curiosity texts (max 4-5 words) to overlay on YouTube thumbnails."
                },
                titles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "At least 5 viral, high click-through-rate (CTR) video titles."
                },
                seoDescription: {
                  type: Type.STRING,
                  description: "An SEO-friendly video description containing keyword-rich explanations, call to actions, and chapters."
                },
                hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 to 5 highly relevant hashtags with standard '#' symbol."
                },
                videoTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "10 to 15 search keywords for the video tagging input."
                },
                viralReels: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timestamp: { type: Type.STRING, description: "MM:SS - MM:SS duration of the viral quote or peak clip." },
                      peakHook: { type: Type.STRING, description: "The powerful quote, question or visual punch of this clip." },
                      whyViral: { type: Type.STRING, description: "Explanation of psychological hook or viral potential." }
                    },
                    required: ["timestamp", "peakHook", "whyViral"]
                  }
                },
                clipSuggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Clipped video title." },
                      timestamp: { type: Type.STRING, description: "Start-End timer like MM:SS - MM:SS corresponding to the 5-7 minute segment." },
                      summary: { type: Type.STRING, description: "Short summary of this clip's topic." }
                    },
                    required: ["title", "timestamp", "summary"]
                  }
                },
                chapters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timestamp: { type: Type.STRING, description: "Exact start mark format like 'MM:SS' or '05:32' for the chapter." },
                      title: { type: Type.STRING, description: "Chapter outline label (e.g., 'Introduction' or 'The Gemini Solution')." }
                    },
                    required: ["timestamp", "title"]
                  }
                }
              },
              required: ["thumbnailTexts", "titles", "seoDescription", "hashtags", "videoTags", "viralReels", "clipSuggestions", "chapters"]
            }
          },
          required: ["originalLanguage", "transcript", "summary", "segments", "topics", "creatorPackage"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from the transcription model.");
    }

    // Strip markdown code block accents if they somehow slipped into the response
    let cleanText = resultText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const transcriptionData = JSON.parse(cleanText);
    return res.json(transcriptionData);

  } catch (error: any) {
    console.error("Transcription error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to process media file transcription." 
    });
  } finally {
    // 4. Always safely clean up temporary disk and Gemini File API resources in finally block
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }
    if (ai && uploadResult && uploadResult.name) {
      try {
        await ai.files.delete({ name: uploadResult.name });
      } catch (err) {
        console.error("Failed to delete File from Gemini cloud store:", err);
      }
    }
  }
});

// 3. Multi-language Translation API (reuses existing transcription text chunks for extreme speed & efficiency)
app.post("/api/translate", async (req, res) => {
  try {
    const { segments, targetLanguage, targetLanguageCode } = req.body;
    if (!segments || !Array.isArray(segments) || !targetLanguage) {
      return res.status(400).json({ error: "Invalid request payload. Please specify segments and targetLanguage." });
    }

    const ai = getGeminiClient();

    const systemInstruction = 
      `You are a top-tier translation AI specializing in subtitle translation. ` +
      `Your task is to translate the user's audio segments into ${targetLanguage}. ` +
      `You must preserve the meaning, context, humor, technical jargon, and tone in the translation. ` +
      `Maintain direct parity with each segment's ID so we can match them perfectly. ` +
      `Output the response strictly according to the requested JSON schema.`;

    const prompt = 
      `Please translate the following timeline segments into the language: ${targetLanguage}. ` +
      `Make sure the translations are fluid, natural, and accurately capture the full intent. ` +
      `Segments to translate:\n${JSON.stringify(segments, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullTranscript: {
              type: Type.STRING,
              description: "The complete, connected translated transcript text block."
            },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  segmentId: {
                    type: Type.STRING,
                    description: "The corresponding ID of the original segment."
                  },
                  translatedText: {
                    type: Type.STRING,
                    description: "The fully translated text of that segment."
                  }
                },
                required: ["segmentId", "translatedText"]
              }
            }
          },
          required: ["fullTranscript", "segments"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from translation model.");
    }

    const translationData = JSON.parse(resultText.trim());
    return res.json(translationData);

  } catch (error: any) {
    console.error("Translation error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to translate transcript segments." 
    });
  }
});

// 4. YouTube Creator Package Generator API
app.post("/api/generate-creator-package", async (req, res) => {
  try {
    const { transcript, summary, topics, fileName } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript data for content extraction." });
    }

    const ai = getGeminiClient();

    const systemInstruction = 
      "You are a stellar viral digital marketing strategist and YouTube SEO expert. " +
      "Your goal is to extract highly engaging, viral-ready YouTube metadata and social sharing suggestions " +
      "from the provided audio/video dialogue transcript.";

    const prompt = 
      `Analyze the following media transcript and summary, then output our viral YouTube Creator Package.\n\n` +
      `File Name: ${fileName || "video.mp4"}\n` +
      `Topics Discussed: ${JSON.stringify(topics || [])}\n\n` +
      `Summary:\n${summary || ""}\n\n` +
      `Transcript:\n${transcript}\n\n` +
      `Generate formatting suggestions for:\n` +
      `1. thumbnailTexts: At least 3 bold, high-curiosity texts (max 4-5 words) to overlay on YouTube thumbnails.\n` +
      `2. titles: At least 5 viral, high-CTR titles (incorporating hook, curiosity gap, or listicle styles).\n` +
      `3. seoDescription: A professional, YouTube search-friendly description with a brief hook, structured summaries, and social disclaimer headings.\n` +
      `4. hashtags: Array of 3-5 trending hashtags starting with standard '#'.\n` +
      `5. videoTags: Array of 10-15 relevant search terms or tags.\n` +
      `6. viralReels: 3-5 viral 30-60 second reels/shorts clip suggestions, including exact start/end MM:SS range, the peak hook statement, and why it'd go viral.\n` +
      `7. clipSuggestions: 3-4 sub-video cuts (each 5-7 minutes) for split content or highlights channels, with MM:SS ranges, direct catchy title, and sub-summary.\n` +
      `8. chapters: Complete YouTube timestamps format mapping major segment shifts chronologically.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thumbnailTexts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Bold, punchy texts (4-5 words max) for overlays on YouTube thumbnails."
            },
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5 high click-through-rate (CTR) video titles."
            },
            seoDescription: {
              type: Type.STRING,
              description: "An SEO-friendly video description containing keyword-rich explanations."
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 highly relevant hashtags with standard '#' symbol."
            },
            videoTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "10 to 15 search keywords for the video tagging input."
            },
            viralReels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "MM:SS - MM:SS duration of the viral quote or peak clip." },
                  peakHook: { type: Type.STRING, description: "The powerful quote, question or visual punch of this clip." },
                  whyViral: { type: Type.STRING, description: "Explanation of psychological hook or viral potential." }
                },
                required: ["timestamp", "peakHook", "whyViral"]
              }
            },
            clipSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Clipped video title." },
                  timestamp: { type: Type.STRING, description: "Start-End timer like MM:SS - MM:SS corresponding to the 5-7 minute segment." },
                  summary: { type: Type.STRING, description: "Short summary of this clip's topic." }
                },
                required: ["title", "timestamp", "summary"]
              }
            },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "Exact start mark format like 'MM:SS' or '05:32' for the chapter." },
                  title: { type: Type.STRING, description: "Chapter outline label (e.g., 'Introduction' or 'The Gemini Solution')." }
                },
                required: ["timestamp", "title"]
              }
            }
          },
          required: ["thumbnailTexts", "titles", "seoDescription", "hashtags", "videoTags", "viralReels", "clipSuggestions", "chapters"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Creator Package generator.");
    }

    let cleanText = resultText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const packageData = JSON.parse(cleanText);
    return res.json(packageData);

  } catch (error: any) {
    console.error("Creator Package Generator error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate YouTube SEO creator package." 
    });
  }
});

// Global Error Handler Middleware (ensures any routing or middleware errors like Multer file limit return clean JSON instead of default HTML)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Global Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "An unexpected server-side error occurred while processing your request."
  });
});

// Setup Vite Dev server in Development, or Serve Static Build in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TranscribeStudio] Server successfully listening at http://localhost:${PORT}`);
  });
}

startServer();
