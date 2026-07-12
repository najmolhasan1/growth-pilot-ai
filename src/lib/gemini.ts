import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function generateGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const models = Array.from(new Set([GEMINI_TEXT_MODEL, 'gemini-2.5-flash-lite']));
  let finalError: unknown;

  for (const modelName of models) {
    const model = client.getGenerativeModel({ model: modelName });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        finalError = error;
        const detail = error instanceof Error ? error.message : '';
        const transient = detail.includes('503') || detail.toLowerCase().includes('high demand');
        if (!transient) break;
        await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
  }

  throw finalError instanceof Error ? finalError : new Error('Gemini text generation failed.');
}

export function extractJsonText(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('The AI response did not contain valid JSON.');
  }
  return text.slice(start, end + 1);
}
