import { NextResponse } from 'next/server';

type ProductImageRequest = {
  language?: string;
  brandProfile?: Record<string, string>;
  inputs?: Record<string, string>;
  prompt?: string;
  aspectRatio?: string;
};

type ProductImage = {
  id: string;
  label: string;
  prompt: string;
  mimeType: string;
  dataUrl: string;
  model?: string;
};

type OpenRouterImage = {
  type?: string;
  image_url?: { url?: string };
  imageUrl?: { url?: string };
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      images?: OpenRouterImage[];
    };
  }>;
  error?: { message?: string };
};

const OPENROUTER_IMAGE_MODELS = Array.from(new Set([
  ...(process.env.OPENROUTER_IMAGE_MODELS || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean),
  process.env.OPENROUTER_IMAGE_MODEL || '',
  'google/gemini-3.1-flash-image-preview',
  'google/gemini-2.5-flash-image',
  'black-forest-labs/flux.2-pro',
  'black-forest-labs/flux.2-flex',
  'sourceful/riverflow-v2-standard-preview',
].filter(Boolean)));

const POLLINATIONS_MODEL = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';

function sanitizeRecord(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object') return {};
  return Object.entries(input as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value.slice(0, 4000) : '';
    return acc;
  }, {});
}

function cleanAspectRatio(value?: string) {
  return ['1:1', '4:3', '3:4', '16:9', '9:16'].includes(value || '') ? value! : '1:1';
}

function buildPrompts(body: ProductImageRequest) {
  const inputs = sanitizeRecord(body.inputs);
  const brand = sanitizeRecord(body.brandProfile);
  const productName = inputs.productName || inputs.product || brand.productService || 'the product';
  const productDetails = inputs.productDetails || inputs.notes || brand.productService || 'key product details are not fully documented';
  const audience = inputs.audience || brand.audience || 'target buyers';
  const visualGoal = inputs.visualGoal || 'premium, realistic, conversion-focused product photography';
  const platforms = inputs.platforms || inputs.platform || 'ecommerce, social media, and ads';
  const constraints = inputs.constraints || brand.brandVoice || 'clean, trustworthy, realistic, no distracting props';
  const base = [
    `Product: ${productName}.`,
    `Details: ${productDetails}.`,
    `Audience: ${audience}.`,
    `Visual goal: ${visualGoal}.`,
    `Use cases: ${platforms}.`,
    `Brand and production notes: ${constraints}.`,
    'Create realistic product photography, not illustration or generic AI art.',
    'Keep the product accurate, premium, sharp, well lit, and commercially usable.',
    'No text, no watermark, no logo hallucination, no distorted product, no extra fingers, no unrealistic shadows.',
  ].join(' ');

  if (body.prompt?.trim()) {
    return [{ label: 'Custom prompt', prompt: `${body.prompt.trim()}\n\n${base}` }];
  }

  return [
    {
      label: 'Ecommerce Hero',
      prompt: `${base} Clean studio packshot, centered product, soft diffused lighting, natural shadow, neutral off-white background, crisp ecommerce hero composition, enough empty space for website layout.`,
    },
    {
      label: 'Lifestyle Use',
      prompt: `${base} Lifestyle product photo in a believable real-world environment for ${audience}, warm natural light, practical props, premium but authentic mood, product clearly visible as the main subject.`,
    },
    {
      label: 'Social Ad Creative',
      prompt: `${base} Scroll-stopping social ad product photo, strong tasteful contrast, bold visual hierarchy, clean negative space for ad copy, product large and clear, optimized for ${platforms}.`,
    },
    {
      label: 'Detail Close-Up',
      prompt: `${base} Macro close-up product photography showing texture, material, feature details, packaging, or craftsmanship, shallow depth of field, realistic texture, premium lighting.`,
    },
  ];
}

function dataUrlMimeType(dataUrl: string) {
  return dataUrl.match(/^data:([^;]+);base64,/i)?.[1] || 'image/png';
}

function dimensionsForAspectRatio(aspectRatio: string) {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '4:3':
      return { width: 1024, height: 768 };
    case '3:4':
      return { width: 768, height: 1024 };
    default:
      return { width: 1024, height: 1024 };
  }
}

async function generatePollinationsImage(prompt: string, aspectRatio: string) {
  const { width, height } = dimensionsForAspectRatio(aspectRatio);
  const params = new URLSearchParams({
    model: POLLINATIONS_MODEL,
    width: String(width),
    height: String(height),
    nologo: 'true',
    safe: 'true',
    private: 'true',
  });
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'image/png,image/jpeg,image/webp,*/*',
      'User-Agent': 'GrowthPilot-AI/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Pollinations image request failed (${response.status}).`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw new Error('Pollinations returned a non-image response.');
  }

  const bytes = Buffer.from(await response.arrayBuffer()).toString('base64');
  return {
    dataUrl: `data:${contentType};base64,${bytes}`,
    model: `pollinations/${POLLINATIONS_MODEL}`,
  };
}

async function generateOpenRouterImage(prompt: string, aspectRatio: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const errors: string[] = [];
  for (const model of OPENROUTER_IMAGE_MODELS) {
    const modelModalities = model.startsWith('google/')
      ? [['image', 'text'], ['image']]
      : [['image']];

    for (const modalities of modelModalities) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_PUBLIC_URL || 'http://localhost:3000',
            'X-Title': 'GrowthPilot AI Product Photography',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: `Generate exactly one realistic product photography image from this brief. Return an image output.\n\n${prompt}`,
              },
            ],
            modalities,
            stream: false,
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: '1K',
            },
          }),
        });

        const data = await response.json() as OpenRouterResponse;
        if (!response.ok) {
          throw new Error(data.error?.message || `OpenRouter image request failed (${response.status}).`);
        }

        const images = data.choices?.[0]?.message?.images || [];
        const dataUrl = images
          .map(image => image.image_url?.url || image.imageUrl?.url || '')
          .find(url => url.startsWith('data:image/'));

        if (!dataUrl) {
          throw new Error('OpenRouter returned no image data.');
        }

        return { dataUrl, model };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown OpenRouter image error';
        errors.push(`${model} (${modalities.join('+')}): ${message}`);
        if (/key limit exceeded|insufficient credits|invalid api key|missing authentication/i.test(message)) {
          throw new Error(message);
        }
      }
    }
  }

  throw new Error(`All OpenRouter image models failed. ${errors.join(' | ')}`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ProductImageRequest;
    const prompts = buildPrompts(body);
    const aspectRatio = cleanAspectRatio(body.aspectRatio);
    const images: ProductImage[] = [];
    const providers: string[] = [];

    for (const item of prompts) {
      let generated: { dataUrl: string; model: string };
      try {
        generated = await generateOpenRouterImage(item.prompt, aspectRatio);
        providers.push('openrouter');
      } catch {
        generated = await generatePollinationsImage(item.prompt, aspectRatio);
        providers.push('pollinations');
      }

      images.push({
        id: `${Date.now()}-${images.length}`,
        label: item.label,
        prompt: item.prompt,
        mimeType: dataUrlMimeType(generated.dataUrl),
        dataUrl: generated.dataUrl,
        model: generated.model,
      });
    }

    return NextResponse.json({
      success: true,
      provider: providers.includes('openrouter') ? 'openrouter' : 'pollinations',
      model: images[0]?.model || POLLINATIONS_MODEL,
      images,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
