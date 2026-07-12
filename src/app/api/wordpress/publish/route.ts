import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { enforceRateLimit } from '@/lib/rate-limit';

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();

  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

async function getSafeWordPressEndpoint(rawUrl: string): Promise<URL | null> {
  let siteUrl: URL;

  try {
    siteUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password) {
    return null;
  }

  const hostname = siteUrl.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return null;
  }

  let addresses: { address: string }[];
  try {
    addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true });
  } catch {
    return null;
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    return null;
  }

  siteUrl.pathname = `${siteUrl.pathname.replace(/\/+$/, '')}/wp-json/wp/v2/posts`;
  siteUrl.search = '';
  siteUrl.hash = '';
  return siteUrl;
}

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'wordpress-publish', 10, 60_000);
    if (limited) return limited;

    const { title, content, url, username, appPassword, categories, tags } = await req.json();

    if (!title || !content || !url || !username || !appPassword) {
      return NextResponse.json({ success: false, error: 'Missing required credentials or content' }, { status: 400 });
    }

    const apiUrl = await getSafeWordPressEndpoint(url);
    if (!apiUrl) {
      return NextResponse.json(
        { success: false, error: 'Use a public HTTPS WordPress site URL.' },
        { status: 400 },
      );
    }

    const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        title,
        content,
        status: 'draft', // Always publish as draft for safety
        categories: categories || [],
        tags: tags || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WP API Error:', data);
      return NextResponse.json({ success: false, error: data.message || 'Failed to publish to WordPress' }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      postId: data.id, 
      postUrl: data.link 
    });
  } catch (error) {
    console.error('WP Publish Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
