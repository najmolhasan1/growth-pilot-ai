/**
 * fetchSystemConfig — Loads trial limits from the server-side Supabase config.
 * Falls back to localStorage (set by old admin panel) or hardcoded defaults.
 */
export interface SystemConfig {
  trial_seo_word_limit: number;
  trial_keyword_limit: number;
  trial_marketing_limit: number;
}

const DEFAULTS: SystemConfig = {
  trial_seo_word_limit: 5000,
  trial_keyword_limit: 3,
  trial_marketing_limit: 3,
};

let cachedConfig: SystemConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60_000; // 60 seconds

export async function fetchSystemConfig(): Promise<SystemConfig> {
  // Return cached value if still fresh
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig;
  }

  try {
    const res = await fetch('/api/admin/config', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        const config: SystemConfig = {
          trial_seo_word_limit: Number(data.config.trial_seo_word_limit) || DEFAULTS.trial_seo_word_limit,
          trial_keyword_limit: Number(data.config.trial_keyword_limit) || DEFAULTS.trial_keyword_limit,
          trial_marketing_limit: Number(data.config.trial_marketing_limit) || DEFAULTS.trial_marketing_limit,
        };
        cachedConfig = config;
        cacheExpiry = Date.now() + CACHE_TTL;
        return config;
      }
    }
  } catch {
    // Network error — fall through to localStorage fallback
  }

  // Fallback to localStorage (legacy admin panel values)
  if (typeof window !== 'undefined') {
    return {
      trial_seo_word_limit: parseInt(localStorage.getItem('trial_seo_word_limit') || '0') || DEFAULTS.trial_seo_word_limit,
      trial_keyword_limit: parseInt(localStorage.getItem('trial_keyword_limit') || '0') || DEFAULTS.trial_keyword_limit,
      trial_marketing_limit: parseInt(localStorage.getItem('trial_marketing_limit') || '0') || DEFAULTS.trial_marketing_limit,
    };
  }

  return DEFAULTS;
}
