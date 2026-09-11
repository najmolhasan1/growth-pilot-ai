import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export interface EmailRecipient {
  email: string;
  name?: string;
  company?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName?: string;
}

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface WebhookConfig {
  url: string;
}

export interface EmailSendRequestBody {
  provider: 'smtp' | 'resend' | 'sendgrid' | 'webhook';
  smtpConfig?: SmtpConfig;
  resendConfig?: ResendConfig;
  sendgridConfig?: SendGridConfig;
  webhookConfig?: WebhookConfig;
  subject: string;
  htmlContent: string;
  plainText?: string;
  recipients: EmailRecipient[];
  isTest?: boolean;
}

function interpolateVariables(template: string, recipient: EmailRecipient): string {
  const firstName = recipient.name ? recipient.name.trim().split(/\s+/)[0] : 'there';
  const fullName = recipient.name ? recipient.name.trim() : 'Valued Customer';
  const company = recipient.company || 'your business';

  return template
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*email\s*\}\}/gi, recipient.email)
    .replace(/\{\{\s*company\s*\}\}/gi, company);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const body: EmailSendRequestBody = await req.json();
    const {
      provider,
      smtpConfig,
      resendConfig,
      sendgridConfig,
      webhookConfig,
      subject,
      htmlContent,
      plainText,
      recipients,
      isTest,
    } = body;

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Email provider is required.' }, { status: 400 });
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Email subject line is required.' }, { status: 400 });
    }

    if (!htmlContent || !htmlContent.trim()) {
      return NextResponse.json({ success: false, error: 'Email content is required.' }, { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one recipient email is required.' }, { status: 400 });
    }

    // Limit batch size to prevent server timeout
    const cleanRecipients = recipients.slice(0, 100);
    const logs: Array<{ email: string; name?: string; status: 'sent' | 'failed'; error?: string; timestamp: string }> = [];
    let totalSent = 0;
    let failedCount = 0;

    // 1. SMTP Provider (Nodemailer)
    if (provider === 'smtp') {
      if (!smtpConfig || !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass || !smtpConfig.fromEmail) {
        return NextResponse.json(
          { success: false, error: 'Incomplete SMTP configuration. Host, user, password, and sender email are required.' },
          { status: 400 }
        );
      }

      const transporter = nodemailer.createTransport({
        host: smtpConfig.host.trim(),
        port: Number(smtpConfig.port) || 587,
        secure: smtpConfig.secure ?? (Number(smtpConfig.port) === 465),
        auth: {
          user: smtpConfig.user.trim(),
          pass: smtpConfig.pass.trim(),
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      // If test email or initial check, verify transporter
      if (isTest) {
        try {
          await transporter.verify();
        } catch (verifyErr) {
          return NextResponse.json(
            { success: false, error: `SMTP Connection Failed: ${(verifyErr as Error).message}` },
            { status: 400 }
          );
        }
      }

      const senderString = smtpConfig.fromName?.trim()
        ? `"${smtpConfig.fromName.trim()}" <${smtpConfig.fromEmail.trim()}>`
        : smtpConfig.fromEmail.trim();

      for (const rec of cleanRecipients) {
        if (!isValidEmail(rec.email)) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: 'Invalid email address format.', timestamp: new Date().toISOString() });
          continue;
        }

        try {
          const personalizedSubject = interpolateVariables(subject, rec);
          const personalizedHtml = interpolateVariables(htmlContent, rec);
          const personalizedText = plainText ? interpolateVariables(plainText, rec) : undefined;

          await transporter.sendMail({
            from: senderString,
            to: rec.name ? `"${rec.name}" <${rec.email}>` : rec.email,
            subject: personalizedSubject,
            html: personalizedHtml,
            text: personalizedText,
          });

          totalSent++;
          logs.push({ email: rec.email, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (sendErr) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: (sendErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    }

    // 2. Resend API
    else if (provider === 'resend') {
      if (!resendConfig || !resendConfig.apiKey || !resendConfig.fromEmail) {
        return NextResponse.json({ success: false, error: 'Resend API Key and From Email are required.' }, { status: 400 });
      }

      const fromFormatted = resendConfig.fromName?.trim()
        ? `${resendConfig.fromName.trim()} <${resendConfig.fromEmail.trim()}>`
        : resendConfig.fromEmail.trim();

      for (const rec of cleanRecipients) {
        if (!isValidEmail(rec.email)) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: 'Invalid email address format.', timestamp: new Date().toISOString() });
          continue;
        }

        try {
          const personalizedSubject = interpolateVariables(subject, rec);
          const personalizedHtml = interpolateVariables(htmlContent, rec);

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendConfig.apiKey.trim()}`,
            },
            body: JSON.stringify({
              from: fromFormatted,
              to: [rec.email],
              subject: personalizedSubject,
              html: personalizedHtml,
            }),
          });

          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.message || resData.error || `Resend error code ${res.status}`);
          }

          totalSent++;
          logs.push({ email: rec.email, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (resendErr) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: (resendErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    }

    // 3. SendGrid API
    else if (provider === 'sendgrid') {
      if (!sendgridConfig || !sendgridConfig.apiKey || !sendgridConfig.fromEmail) {
        return NextResponse.json({ success: false, error: 'SendGrid API Key and From Email are required.' }, { status: 400 });
      }

      for (const rec of cleanRecipients) {
        if (!isValidEmail(rec.email)) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: 'Invalid email address format.', timestamp: new Date().toISOString() });
          continue;
        }

        try {
          const personalizedSubject = interpolateVariables(subject, rec);
          const personalizedHtml = interpolateVariables(htmlContent, rec);

          const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sendgridConfig.apiKey.trim()}`,
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: rec.email, name: rec.name }] }],
              from: { email: sendgridConfig.fromEmail.trim(), name: sendgridConfig.fromName?.trim() || undefined },
              subject: personalizedSubject,
              content: [{ type: 'text/html', value: personalizedHtml }],
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`SendGrid API error (${res.status}): ${errorText.slice(0, 200)}`);
          }

          totalSent++;
          logs.push({ email: rec.email, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (sgErr) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: (sgErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    }

    // 4. Custom Webhook Dispatch
    else if (provider === 'webhook') {
      if (!webhookConfig || !webhookConfig.url) {
        return NextResponse.json({ success: false, error: 'Webhook URL is required.' }, { status: 400 });
      }

      try {
        const parsedUrl = new URL(webhookConfig.url);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          return NextResponse.json({ success: false, error: 'Invalid Webhook URL protocol.' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ success: false, error: 'Malformed Webhook URL.' }, { status: 400 });
      }

      for (const rec of cleanRecipients) {
        try {
          const payload = {
            event: 'email_campaign_dispatch',
            isTest: Boolean(isTest),
            recipient: rec,
            subject: interpolateVariables(subject, rec),
            html: interpolateVariables(htmlContent, rec),
            timestamp: new Date().toISOString(),
          };

          const res = await fetch(webhookConfig.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error(`Webhook responded with status ${res.status}`);

          totalSent++;
          logs.push({ email: rec.email, name: rec.name, status: 'sent', timestamp: new Date().toISOString() });
        } catch (hookErr) {
          failedCount++;
          logs.push({ email: rec.email, name: rec.name, status: 'failed', error: (hookErr as Error).message, timestamp: new Date().toISOString() });
        }
      }
    } else {
      return NextResponse.json({ success: false, error: `Unsupported provider: ${provider}` }, { status: 400 });
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
      { success: false, error: (globalErr as Error).message || 'Failed to dispatch email campaign.' },
      { status: 500 }
    );
  }
}
