import { NextResponse } from 'next/server';

export interface SmsRecipient {
  phone: string;
  name?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface HttpGatewayConfig {
  gatewayType: 'bulksmsbd' | 'greenweb' | 'generic';
  apiUrl: string;
  apiKey: string;
  senderId?: string;
  method?: 'GET' | 'POST';
}

export interface WebhookConfig {
  url: string;
}

export interface SmsSendRequestBody {
  provider: 'twilio' | 'http_gateway' | 'webhook';
  twilioConfig?: TwilioConfig;
  httpGatewayConfig?: HttpGatewayConfig;
  webhookConfig?: WebhookConfig;
  message: string;
  recipients: SmsRecipient[];
  isTest?: boolean;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '').trim();
}

function interpolateSms(template: string, recipient: SmsRecipient): string {
  const firstName = recipient.name ? recipient.name.trim().split(/\s+/)[0] : 'there';
  const fullName = recipient.name ? recipient.name.trim() : 'Customer';
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*phone\s*\}\}/gi, recipient.phone);
}

export async function POST(req: Request) {
  try {
    const body: SmsSendRequestBody = await req.json();
    const {
      provider,
      twilioConfig,
      httpGatewayConfig,
      webhookConfig,
      message,
      recipients,
      isTest,
    } = body;

    if (!provider) {
      return NextResponse.json({ success: false, error: 'SMS Provider is required.' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'SMS Message body is required.' }, { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one recipient phone number is required.' }, { status: 400 });
    }

    const cleanRecipients = recipients.slice(0, 100);
    const logs: Array<{ phone: string; name?: string; status: 'sent' | 'failed'; error?: string; timestamp: string }> = [];
    let totalSent = 0;
    let failedCount = 0;

    // 1. Twilio SMS
    if (provider === 'twilio') {
      if (!twilioConfig || !twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.fromNumber) {
        return NextResponse.json(
          { success: false, error: 'Twilio Account SID, Auth Token, and From Number are required.' },
          { status: 400 }
        );
      }

      const sid = twilioConfig.accountSid.trim();
      const token = twilioConfig.authToken.trim();
      const from = twilioConfig.fromNumber.trim();
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const authHeader = `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;

      for (const rec of cleanRecipients) {
        const cleanPhone = normalizePhone(rec.phone);
        if (cleanPhone.length < 8) {
          failedCount++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'failed', error: 'Invalid phone number format.', timestamp: new Date().toISOString() });
          continue;
        }

        try {
          const personalizedText = interpolateSms(message, rec);
          const params = new URLSearchParams();
          params.append('To', cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`);
          params.append('From', from);
          params.append('Body', personalizedText);

          const res = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: authHeader,
            },
            body: params.toString(),
          });

          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.message || `Twilio error ${resData.code || res.status}`);
          }

          totalSent++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (twilioErr) {
          failedCount++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'failed', error: (twilioErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    }

    // 2. HTTP SMS Gateway (Bangladesh & Global)
    else if (provider === 'http_gateway') {
      if (!httpGatewayConfig || !httpGatewayConfig.apiUrl || !httpGatewayConfig.apiKey) {
        return NextResponse.json(
          { success: false, error: 'Gateway API URL and API Key are required.' },
          { status: 400 }
        );
      }

      const { gatewayType, apiUrl, apiKey, senderId, method = 'GET' } = httpGatewayConfig;

      for (const rec of cleanRecipients) {
        let cleanPhone = normalizePhone(rec.phone);
        if (cleanPhone.length < 8) {
          failedCount++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'failed', error: 'Invalid phone number.', timestamp: new Date().toISOString() });
          continue;
        }

        // Standardize Bangladesh numbers if 11 digits starting with 01
        if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
          cleanPhone = `88${cleanPhone}`;
        }

        try {
          const personalizedText = interpolateSms(message, rec);
          let targetUrl = apiUrl.trim();

          if (gatewayType === 'bulksmsbd') {
            const query = new URLSearchParams({
              api_key: apiKey.trim(),
              type: 'text',
              number: cleanPhone,
              senderid: senderId?.trim() || '',
              message: personalizedText,
            });
            targetUrl = `${targetUrl.split('?')[0]}?${query.toString()}`;
          } else if (gatewayType === 'greenweb') {
            const query = new URLSearchParams({
              token: apiKey.trim(),
              to: cleanPhone,
              message: personalizedText,
            });
            targetUrl = `${targetUrl.split('?')[0]}?${query.toString()}`;
          } else {
            // Generic HTTP Gateway
            const query = new URLSearchParams({
              api_key: apiKey.trim(),
              to: cleanPhone,
              sender_id: senderId?.trim() || '',
              message: personalizedText,
            });
            targetUrl = `${targetUrl.split('?')[0]}?${query.toString()}`;
          }

          const res = await fetch(targetUrl, {
            method: method.toUpperCase(),
            headers: { 'Accept': 'application/json, text/plain, */*' },
          });

          const resText = await res.text();
          if (!res.ok) {
            throw new Error(`Gateway returned HTTP ${res.status}: ${resText.slice(0, 100)}`);
          }

          // Check common BD gateway failure responses
          if (resText.toLowerCase().includes('invalid api') || resText.toLowerCase().includes('error_code') || resText.toLowerCase().includes('insufficient balance')) {
            throw new Error(`Gateway response error: ${resText.slice(0, 120)}`);
          }

          totalSent++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (gwErr) {
          failedCount++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'failed', error: (gwErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    }

    // 3. Custom Webhook
    else if (provider === 'webhook') {
      if (!webhookConfig || !webhookConfig.url) {
        return NextResponse.json({ success: false, error: 'Webhook URL is required.' }, { status: 400 });
      }

      for (const rec of cleanRecipients) {
        try {
          const payload = {
            event: 'sms_campaign_dispatch',
            isTest: Boolean(isTest),
            recipient: rec,
            message: interpolateSms(message, rec),
            timestamp: new Date().toISOString(),
          };

          const res = await fetch(webhookConfig.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error(`Webhook responded with status ${res.status}`);

          totalSent++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (hookErr) {
          failedCount++;
          logs.push({ phone: rec.phone, name: rec.name, status: 'failed', error: (hookErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    } else {
      return NextResponse.json({ success: false, error: `Unsupported SMS provider: ${provider}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      totalSent,
      failedCount,
      totalRecipients: cleanRecipients.length,
      logs,
    });
  } catch (globalErr) {
    return NextResponse.json(
      { success: false, error: (globalErr as Error).message || 'Failed to dispatch SMS campaign.' },
      { status: 500 }
    );
  }
}
