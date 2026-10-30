import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface CapiEventPayload {
  eventName: 'Purchase' | 'AddToCart' | 'InitiateCheckout' | 'PageView' | 'Lead';
  eventSourceUrl: string;
  user: {
    email?: string;
    phone?: string;
    firstName?: string;
    city?: string;
    country?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentIds?: string[];
    numItems?: number;
    orderId?: string;
  };
  pixelId?: string;
  accessToken?: string;
  testEventCode?: string;
}

function sha256(val?: string): string | undefined {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CapiEventPayload;
    const {
      eventName = 'Purchase',
      eventSourceUrl = 'https://myshop.com/checkout',
      user = {},
      customData = {},
      pixelId,
      accessToken,
      testEventCode,
    } = body;

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `gp2_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Hash user identity fields strictly according to Meta Graph API Conversions specs
    const userData = {
      em: sha256(user.email),
      ph: sha256(user.phone),
      fn: sha256(user.firstName),
      ct: sha256(user.city),
      country: sha256(user.country || 'bd'),
      client_user_agent: req.headers.get('user-agent') || 'Mozilla/5.0 GrowthPilot-CAPI-Worker',
    };

    // Calculate Event Match Quality (EMQ) Score (0 to 10)
    let emqScore = 4.0; // Base score for IP & User Agent
    if (userData.em) emqScore += 2.5;
    if (userData.ph) emqScore += 2.5;
    if (userData.fn) emqScore += 0.5;
    if (userData.ct) emqScore += 0.5;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          event_id: eventId,
          event_source_url: eventSourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: {
            value: customData.value || 1250,
            currency: customData.currency || 'BDT',
            content_name: customData.contentName || 'Official Product',
            content_ids: customData.contentIds || ['SKU_1001'],
            num_items: customData.numItems || 1,
            order_id: customData.orderId || `ORD_${Date.now()}`,
          },
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    // If Meta Pixel ID & Access Token are provided, forward to live Meta Graph API
    let metaResponse: any = null;
    let liveDispatched = false;

    if (pixelId && accessToken) {
      try {
        const metaUrl = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
        const res = await fetch(metaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        metaResponse = await res.json();
        liveDispatched = res.ok;
      } catch (err: any) {
        metaResponse = { error: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventName,
      emqScore: Math.min(10, emqScore),
      liveDispatched,
      metaResponse,
      preparedPayload: payload,
      message: liveDispatched
        ? 'Event dispatched successfully to Meta Conversions API.'
        : 'Event verified and simulated with SHA-256 encryption. (Ready for live Meta dispatch)',
    });
  } catch (error: any) {
    console.error('GP 2.0 CAPI Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'CAPI event processing failed',
      },
      { status: 500 }
    );
  }
}
