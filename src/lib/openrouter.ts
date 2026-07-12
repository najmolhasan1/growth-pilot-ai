export const OPENROUTER_KEYWORD_MODEL =
  process.env.OPENROUTER_KEYWORD_MODEL || 'perplexity/sonar-pro-search';
export const OPENROUTER_RESEARCH_MODEL =
  process.env.OPENROUTER_RESEARCH_MODEL || 'perplexity/sonar-pro-search';
export const OPENROUTER_RESEARCH_MODELS = Array.from(new Set([
  ...(process.env.OPENROUTER_RESEARCH_MODELS || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean),
  OPENROUTER_RESEARCH_MODEL,
  'perplexity/sonar-pro',
  'perplexity/sonar',
]));
export const OPENROUTER_WRITING_MODEL =
  process.env.OPENROUTER_WRITING_MODEL || 'anthropic/claude-sonnet-4.6';
export const OPENROUTER_WRITING_MODELS = Array.from(new Set([
  ...(process.env.OPENROUTER_WRITING_MODELS || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean),
  OPENROUTER_WRITING_MODEL,
  'anthropic/claude-sonnet-4.5',
  'google/gemini-2.5-pro',
  'openai/gpt-5-mini',
]));

interface OpenRouterMessage {
  content?: string | Array<{ type?: string; text?: string }>;
}

interface OpenRouterResponse {
  choices?: Array<{ message?: OpenRouterMessage }>;
  error?: { message?: string };
}

interface OpenRouterRequestOptions {
  model: string;
  maxCompletionTokens: number;
  temperature?: number;
  title: string;
  retries?: number;
}

export async function generateOpenRouterText(
  prompt: string,
  options: OpenRouterRequestOptions,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const attempts = (options.retries ?? 1) + 1;
  let finalError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_PUBLIC_URL || 'http://localhost:3000',
          'X-Title': options.title,
        },
        body: JSON.stringify({
          model: options.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.2,
          max_completion_tokens: options.maxCompletionTokens,
        }),
      });

      const data = await response.json() as OpenRouterResponse;
      if (!response.ok) {
        throw new Error(data.error?.message || `OpenRouter request failed (${response.status}).`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content.map(item => item.text || '').join('');
      }
      throw new Error('OpenRouter returned no text response.');
    } catch (error) {
      finalError = error;
      if (attempt + 1 < attempts) {
        await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
  }
  throw finalError instanceof Error ? finalError : new Error('OpenRouter request failed.');
}

export async function generateOpenRouterTextWithModelFallback(
  prompt: string,
  options: Omit<OpenRouterRequestOptions, 'model'> & { models: string[] },
): Promise<{ text: string; model: string }> {
  const errors: string[] = [];

  for (const model of options.models) {
    try {
      const text = await generateOpenRouterText(prompt, {
        ...options,
        model,
        retries: options.retries ?? 1,
      });
      return { text, model };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenRouter error';
      errors.push(`${model}: ${message}`);

      if (/key limit exceeded|insufficient credits|invalid api key|missing authentication/i.test(message)) {
        break;
      }
    }
  }

  throw new Error(`All OpenRouter models failed. ${errors.join(' | ')}`);
}

export async function generateKeywordResearchJson(prompt: string): Promise<string> {
  return generateOpenRouterText(prompt, {
    model: OPENROUTER_KEYWORD_MODEL,
    maxCompletionTokens: 1800,
    temperature: 0.2,
    title: 'GrowthPilot AI Keyword Research',
  });
}

export function extractOpenRouterJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('OpenRouter response did not contain JSON.');
  }
  return text.slice(start, end + 1);
}
