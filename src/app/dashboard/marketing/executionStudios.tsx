'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  Mail,
  Smartphone,
  Send,
  Play,
  CheckCircle2,
  AlertCircle,
  Settings,
  Upload,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  Eye,
  Sliders,
  Globe,
  ShoppingBag,
  Code,
  Sparkles,
  Check,
  Loader2,
  Share2,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';

// ==========================================
// 1. EMAIL CAMPAIGN EXECUTION STUDIO
// ==========================================

export interface EmailGatewaySettings {
  provider: 'smtp' | 'resend' | 'sendgrid' | 'webhook';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  resendApiKey: string;
  sendgridApiKey: string;
  webhookUrl: string;
}

const DEFAULT_EMAIL_SETTINGS: EmailGatewaySettings = {
  provider: 'smtp',
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  fromEmail: '',
  fromName: '',
  resendApiKey: '',
  sendgridApiKey: '',
  webhookUrl: '',
};

export function EmailExecutionStudio({
  primaryOutput,
  businessName = 'My Business',
}: {
  primaryOutput: string;
  businessName?: string;
}) {
  // Extract Subject & Preheader if available
  const parsedSubject = primaryOutput.match(/Subject:\s*([^\n\r]+)/i)?.[1]?.trim() || 'Exclusive Update for You';
  const parsedPreheader = primaryOutput.match(/Preheader:\s*([^\n\r]+)/i)?.[1]?.trim() || 'Open for important insights';
  const cleanedBody = primaryOutput
    .replace(/Subject:\s*[^\n\r]+/gi, '')
    .replace(/Preheader:\s*[^\n\r]+/gi, '')
    .trim();

  const [subject, setSubject] = useState(parsedSubject);
  const [preheader, setPreheader] = useState(parsedPreheader);
  const [bodyHtml, setBodyHtml] = useState(cleanedBody);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [recipientsText, setRecipientsText] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<EmailGatewaySettings>(DEFAULT_EMAIL_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Campaign Run Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [runningCampaign, setRunningCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [campaignLogs, setCampaignLogs] = useState<Array<{ email: string; status: 'sent' | 'failed'; error?: string }>>([]);
  const [campaignSummary, setCampaignSummary] = useState<{ total: number; sent: number; failed: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gp_email_settings');
      if (stored) {
        setSettings({ ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gp_email_settings', JSON.stringify(settings));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
    }, 1000);
  };

  // Parse recipients from text
  const parseRecipients = (text: string) => {
    return text
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(item => Boolean(item) && item.includes('@'))
      .map(entry => {
        const match = entry.match(/^(.*?)(?:<([^\s@]+@[^\s@]+\.[^\s@]+)>|([^\s@]+@[^\s@]+\.[^\s@]+))$/);
        if (match) {
          const name = match[1]?.trim().replace(/^["']|["']$/g, '');
          const email = (match[2] || match[3] || '').trim();
          return { name: name || undefined, email };
        }
        return { email: entry };
      });
  };

  const parsedList = parseRecipients(recipientsText);

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/);
      const emails: string[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
          return; // Skip header
        }
        const parts = line.split(',');
        const emailPart = parts.find(p => p.includes('@'));
        if (emailPart) {
          const namePart = parts[0] && parts[0] !== emailPart ? parts[0].trim() : '';
          if (namePart) {
            emails.push(`${namePart} <${emailPart.trim()}>`);
          } else {
            emails.push(emailPart.trim());
          }
        }
      });

      if (emails.length > 0) {
        setRecipientsText(prev => (prev ? `${prev}\n${emails.join('\n')}` : emails.join('\n')));
      }
    };
    reader.readAsText(file);
  };

  const sendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid test email address.' });
      return;
    }
    setSendingTest(true);
    setTestResult(null);

    try {
      const payload = {
        provider: settings.provider,
        smtpConfig: {
          host: settings.smtpHost,
          port: settings.smtpPort,
          secure: settings.smtpSecure,
          user: settings.smtpUser,
          pass: settings.smtpPass,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName || businessName,
        },
        resendConfig: {
          apiKey: settings.resendApiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName || businessName,
        },
        sendgridConfig: {
          apiKey: settings.sendgridApiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName || businessName,
        },
        webhookConfig: {
          url: settings.webhookUrl,
        },
        subject,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <div style="font-size: 11px; color: #888; margin-bottom: 12px;">${preheader}</div>
          ${bodyHtml.replace(/\n/g, '<br/>')}
        </div>`,
        plainText: bodyHtml,
        recipients: [{ email: testEmail.trim(), name: 'Tester' }],
        isTest: true,
      };

      const res = await fetch('/api/marketing-suite/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch test email.');
      }

      setTestResult({ success: true, message: `Test email sent to ${testEmail} successfully!` });
    } catch (err) {
      setTestResult({ success: false, message: (err as Error).message });
    } finally {
      setSendingTest(false);
    }
  };

  const runLiveCampaign = async () => {
    if (parsedList.length === 0) {
      alert('Please add at least one recipient email.');
      return;
    }

    setRunningCampaign(true);
    setCampaignLogs([]);
    setCampaignProgress(10);
    setCampaignSummary(null);

    try {
      const payload = {
        provider: settings.provider,
        smtpConfig: {
          host: settings.smtpHost,
          port: settings.smtpPort,
          secure: settings.smtpSecure,
          user: settings.smtpUser,
          pass: settings.smtpPass,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName || businessName,
        },
        resendConfig: {
          apiKey: settings.resendApiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName || businessName,
        },
        sendgridConfig: {
          apiKey: settings.sendgridApiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName || businessName,
        },
        webhookConfig: {
          url: settings.webhookUrl,
        },
        subject,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #111;">
          <div style="font-size: 11px; color: #777; margin-bottom: 12px;">${preheader}</div>
          ${bodyHtml.replace(/\n/g, '<br/>')}
        </div>`,
        plainText: bodyHtml,
        recipients: parsedList,
        isTest: false,
      };

      setCampaignProgress(40);
      const res = await fetch('/api/marketing-suite/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setCampaignProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute campaign broadcast.');
      }

      setCampaignLogs(data.logs || []);
      setCampaignSummary({
        total: data.totalRecipients || parsedList.length,
        sent: data.totalSent || 0,
        failed: data.failedCount || 0,
      });
    } catch (err) {
      setCampaignLogs([
        { email: 'Campaign System', status: 'failed', error: (err as Error).message },
      ]);
    } finally {
      setRunningCampaign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
            <Mail size={12} /> Real Campaign Execution Hub
          </div>
          <h3 className="text-lg font-black text-white">Interactive Email Studio &amp; Dispatcher</h3>
          <p className="text-xs text-white/50">
            Preview formatted HTML, personalize tags with <code className="text-indigo-300">{'{{name}}'}</code>, send a live test email, or blast to your contact list.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black text-white transition-all cursor-pointer"
          >
            <Settings size={14} className="text-indigo-400" />
            {settings.fromEmail ? 'Sender Configured' : 'Configure Sender (SMTP/ESP)'}
          </button>

          <button
            type="button"
            onClick={() => setShowRunModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Play size={14} /> RUN LIVE CAMPAIGN
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Editor & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Email Template Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                placeholder="Subject line..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                Preheader (Preview Text)
              </label>
              <input
                type="text"
                value={preheader}
                onChange={e => setPreheader(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/80 focus:outline-none focus:border-indigo-500"
                placeholder="Preview snippet seen before opening..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Email Body (Markdown / Text)
                </label>
                <div className="text-[10px] text-indigo-300/80 font-mono">
                  Tags: {'{{name}}'}, {'{{company}}'}
                </div>
              </div>
              <textarea
                rows={10}
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs leading-5 text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Recipient Audience & Test Box */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-400" /> Recipients &amp; Audience List
                </h4>
                <p className="text-[11px] text-white/40">Paste emails or upload CSV</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white cursor-pointer">
                <Upload size={12} /> Upload CSV
                <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={3}
              value={recipientsText}
              onChange={e => setRecipientsText(e.target.value)}
              placeholder="Paste email addresses (e.g. john@example.com, Sarah <sarah@company.com>)"
              className="w-full p-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-indigo-300">
                {parsedList.length} valid recipient{parsedList.length === 1 ? '' : 's'} ready
              </span>

              {/* Instant Test Email Box */}
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="test@yourinbox.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="w-44 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={sendingTest || !testEmail}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {sendingTest ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Send Test
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Responsive Email Preview Canvas */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={13} className="text-indigo-400" /> Live Render Preview
            </span>
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  previewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  previewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Mobile
              </button>
            </div>
          </div>

          <div
            className={`mx-auto rounded-2xl border border-white/10 bg-slate-950 p-1 shadow-2xl transition-all ${
              previewMode === 'mobile' ? 'max-w-[360px]' : 'w-full'
            }`}
          >
            {/* Email Client Top Bar */}
            <div className="rounded-t-xl bg-slate-900 px-4 py-3 border-b border-white/10 text-xs text-white/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs truncate">
                  {settings.fromName || businessName}
                </span>
                <span className="text-[10px] text-white/40">Inbox Preview</span>
              </div>
              <div className="text-white text-xs font-bold truncate">{subject || 'No Subject'}</div>
              <div className="text-[11px] text-white/40 truncate">{preheader}</div>
            </div>

            {/* Email Body Canvas */}
            <div className="bg-white text-slate-900 p-6 min-h-[340px] rounded-b-xl text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {bodyHtml || <span className="text-slate-400 italic">Email body preview will appear here...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal (SMTP / Resend / SendGrid / Webhook) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Settings size={18} className="text-indigo-400" /> Sender &amp; ESP Integration
                </h3>
                <p className="text-xs text-white/40">Saved securely in your browser for 1-click dispatch</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-white/60 mb-1">Sending Provider</label>
                <select
                  value={settings.provider}
                  onChange={e => setSettings({ ...settings, provider: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-bold"
                >
                  <option value="smtp">Direct SMTP (Gmail, Workspace, SendGrid SMTP, CPanel)</option>
                  <option value="resend">Resend API (Recommended for modern deliverability)</option>
                  <option value="sendgrid">SendGrid API</option>
                  <option value="webhook">Custom Webhook (Zapier, Make, n8n)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white/60 mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    placeholder="marketing@yourdomain.com"
                    value={settings.fromEmail}
                    onChange={e => setSettings({ ...settings, fromEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white/60 mb-1">Sender Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Najmol from GrowthPilot"
                    value={settings.fromName}
                    onChange={e => setSettings({ ...settings, fromName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              {settings.provider === 'smtp' && (
                <div className="space-y-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block font-bold text-white/60 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com or mail.site.com"
                        value={settings.smtpHost}
                        onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-white/60 mb-1">Port</label>
                      <input
                        type="number"
                        value={settings.smtpPort}
                        onChange={e => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-white/60 mb-1">Username</label>
                      <input
                        type="text"
                        placeholder="SMTP Username"
                        value={settings.smtpUser}
                        onChange={e => setSettings({ ...settings, smtpUser: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-white/60 mb-1">Password / App Key</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={settings.smtpPass}
                        onChange={e => setSettings({ ...settings, smtpPass: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settings.provider === 'resend' && (
                <div>
                  <label className="block font-bold text-white/60 mb-1">Resend API Key</label>
                  <input
                    type="password"
                    placeholder="re_••••••••"
                    value={settings.resendApiKey}
                    onChange={e => setSettings({ ...settings, resendApiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
              )}

              {settings.provider === 'sendgrid' && (
                <div>
                  <label className="block font-bold text-white/60 mb-1">SendGrid API Key</label>
                  <input
                    type="password"
                    placeholder="SG.••••••••"
                    value={settings.sendgridApiKey}
                    onChange={e => setSettings({ ...settings, sendgridApiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
              )}

              {settings.provider === 'webhook' && (
                <div>
                  <label className="block font-bold text-white/60 mb-1">Webhook Endpoint URL</label>
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={settings.webhookUrl}
                    onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {saveSuccess ? <Check size={14} /> : null}
                  {saveSuccess ? 'Saved!' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Campaign Execution Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-indigo-500/30 bg-[#0d1117] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Play size={18} className="text-indigo-400" /> Execute Live Email Broadcast
                </h3>
                <p className="text-xs text-white/50">
                  Target: <span className="font-bold text-white">{parsedList.length} verified recipients</span>
                </p>
              </div>
              {!runningCampaign && (
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Warning / Ready State */}
            {!campaignSummary && !runningCampaign && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200 leading-relaxed space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} /> Pre-Flight Checklist:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provider: <span className="font-bold uppercase text-white">{settings.provider}</span></li>
                  <li>Sender: <span className="font-bold text-white">{settings.fromEmail || 'Not configured'}</span></li>
                  <li>Subject: <span className="font-bold text-white">{subject}</span></li>
                  <li>Recipients: <span className="font-bold text-white">{parsedList.length} contact(s)</span></li>
                </ul>
              </div>
            )}

            {/* Progress Bar */}
            {runningCampaign && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white font-bold">
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    Dispatching emails in controlled batches...
                  </span>
                  <span>{campaignProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${campaignProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Summary Report */}
            {campaignSummary && (
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-white/40">Total</div>
                  <div className="text-xl font-black text-white">{campaignSummary.total}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Delivered</div>
                  <div className="text-xl font-black text-emerald-400">{campaignSummary.sent}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-400">Failed</div>
                  <div className="text-xl font-black text-rose-400">{campaignSummary.failed}</div>
                </div>
              </div>
            )}

            {/* Delivery Logs */}
            {campaignLogs.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-[11px]">
                {campaignLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-1 px-2 rounded ${
                      log.status === 'sent' ? 'text-emerald-400 bg-emerald-950/20' : 'text-rose-400 bg-rose-950/20'
                    }`}
                  >
                    <span>{log.email}</span>
                    <span>{log.status === 'sent' ? '✓ Sent' : `✗ Failed: ${log.error || 'Error'}`}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={runningCampaign}
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:text-white"
              >
                Close
              </button>
              {!campaignSummary && (
                <button
                  type="button"
                  disabled={runningCampaign || parsedList.length === 0}
                  onClick={runLiveCampaign}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {runningCampaign ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm &amp; Send to All ({parsedList.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. SMS CAMPAIGN EXECUTION STUDIO
// ==========================================

export interface SmsGatewaySettings {
  provider: 'twilio' | 'http_gateway' | 'webhook';
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
  gatewayType: 'bulksmsbd' | 'greenweb' | 'generic';
  gatewayUrl: string;
  gatewayApiKey: string;
  gatewaySenderId: string;
  webhookUrl: string;
}

const DEFAULT_SMS_SETTINGS: SmsGatewaySettings = {
  provider: 'http_gateway',
  twilioSid: '',
  twilioToken: '',
  twilioFrom: '',
  gatewayType: 'bulksmsbd',
  gatewayUrl: 'http://bulksmsbd.net/api/smsapi',
  gatewayApiKey: '',
  gatewaySenderId: '',
  webhookUrl: '',
};

export function SmsExecutionStudio({ primaryOutput }: { primaryOutput: string }) {
  const [smsText, setSmsText] = useState(primaryOutput.trim());
  const [phoneNumbersText, setPhoneNumbersText] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SmsGatewaySettings>(DEFAULT_SMS_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Run Campaign Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [runningCampaign, setRunningCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [campaignLogs, setCampaignLogs] = useState<Array<{ phone: string; status: 'sent' | 'failed'; error?: string }>>([]);
  const [campaignSummary, setCampaignSummary] = useState<{ total: number; sent: number; failed: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gp_sms_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SMS_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gp_sms_settings', JSON.stringify(settings));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
    }, 1000);
  };

  // GSM-7 calculation
  const charCount = smsText.length;
  const isUnicode = /[^\u0000-\u00ff]/.test(smsText);
  const maxSegmentChars = isUnicode ? 70 : 160;
  const segmentCount = Math.ceil(charCount / maxSegmentChars) || 1;

  const addOptOut = () => {
    if (!smsText.toLowerCase().includes('stop')) {
      setSmsText(prev => `${prev} Reply STOP to opt out.`);
    }
  };

  // Parse phone numbers
  const parseNumbers = (text: string) => {
    return text
      .split(/[\n,;]+/)
      .map(num => num.replace(/[\s\-\(\)]/g, '').trim())
      .filter(num => num.length >= 8)
      .map(phone => ({ phone }));
  };

  const parsedNumbers = parseNumbers(phoneNumbersText);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/);
      const numbers: string[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('mobile'))) {
          return;
        }
        const clean = line.replace(/[^\d+]/g, '');
        if (clean.length >= 8) numbers.push(clean);
      });

      if (numbers.length > 0) {
        setPhoneNumbersText(prev => (prev ? `${prev}\n${numbers.join('\n')}` : numbers.join('\n')));
      }
    };
    reader.readAsText(file);
  };

  const sendTestSms = async () => {
    if (!testPhone || testPhone.length < 8) {
      setTestResult({ success: false, message: 'Enter a valid phone number (e.g. 017xxxxxxxx or +1xxxxxxxxxx)' });
      return;
    }
    setSendingTest(true);
    setTestResult(null);

    try {
      const payload = {
        provider: settings.provider,
        twilioConfig: {
          accountSid: settings.twilioSid,
          authToken: settings.twilioToken,
          fromNumber: settings.twilioFrom,
        },
        httpGatewayConfig: {
          gatewayType: settings.gatewayType,
          apiUrl: settings.gatewayUrl,
          apiKey: settings.gatewayApiKey,
          senderId: settings.gatewaySenderId,
        },
        webhookConfig: {
          url: settings.webhookUrl,
        },
        message: smsText,
        recipients: [{ phone: testPhone.trim() }],
        isTest: true,
      };

      const res = await fetch('/api/marketing-suite/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch test SMS.');
      }

      setTestResult({ success: true, message: `Test SMS sent to ${testPhone} successfully!` });
    } catch (err) {
      setTestResult({ success: false, message: (err as Error).message });
    } finally {
      setSendingTest(false);
    }
  };

  const runLiveSmsCampaign = async () => {
    if (parsedNumbers.length === 0) {
      alert('Please add at least one recipient phone number.');
      return;
    }

    setRunningCampaign(true);
    setCampaignLogs([]);
    setCampaignProgress(15);
    setCampaignSummary(null);

    try {
      const payload = {
        provider: settings.provider,
        twilioConfig: {
          accountSid: settings.twilioSid,
          authToken: settings.twilioToken,
          fromNumber: settings.twilioFrom,
        },
        httpGatewayConfig: {
          gatewayType: settings.gatewayType,
          apiUrl: settings.gatewayUrl,
          apiKey: settings.gatewayApiKey,
          senderId: settings.gatewaySenderId,
        },
        webhookConfig: {
          url: settings.webhookUrl,
        },
        message: smsText,
        recipients: parsedNumbers,
        isTest: false,
      };

      setCampaignProgress(50);
      const res = await fetch('/api/marketing-suite/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setCampaignProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch SMS campaign.');
      }

      setCampaignLogs(data.logs || []);
      setCampaignSummary({
        total: data.totalRecipients || parsedNumbers.length,
        sent: data.totalSent || 0,
        failed: data.failedCount || 0,
      });
    } catch (err) {
      setCampaignLogs([
        { phone: 'SMS Gateway', status: 'failed', error: (err as Error).message },
      ]);
    } finally {
      setRunningCampaign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 to-teal-950/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <Smartphone size={12} /> SMS Campaign Dispatcher
          </div>
          <h3 className="text-lg font-black text-white">Live SMS Broadcast Engine</h3>
          <p className="text-xs text-white/50">
            Real GSM character counter, smartphone handset preview, BulkSMSBD / Twilio integration, and live SMS blast execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black text-white transition-all cursor-pointer"
          >
            <Settings size={14} className="text-emerald-400" />
            {settings.gatewayApiKey || settings.twilioSid ? 'Gateway Connected' : 'Connect SMS Gateway'}
          </button>

          <button
            type="button"
            onClick={() => setShowRunModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Play size={14} /> RUN LIVE SMS CAMPAIGN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: SMS Editor & Phone Manager */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                SMS Message Text
              </label>
              <button
                type="button"
                onClick={addOptOut}
                className="text-[10px] text-emerald-400 hover:underline font-bold"
              >
                + Add Opt-Out Tag
              </button>
            </div>

            <textarea
              rows={4}
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm leading-6 text-white focus:outline-none focus:border-emerald-500"
            />

            {/* GSM Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className={`font-bold ${charCount > 160 ? 'text-amber-400' : 'text-white/80'}`}>
                  {charCount} Characters
                </span>
                <span className="text-white/30">•</span>
                <span className="text-emerald-400 font-bold">
                  {segmentCount} SMS Part{segmentCount > 1 ? 's' : ''} ({isUnicode ? 'Unicode' : 'GSM-7'})
                </span>
              </div>
              <span className="text-[11px] text-white/40">
                Max {maxSegmentChars} chars per SMS credit
              </span>
            </div>
          </div>

          {/* Numbers list */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Smartphone size={13} className="text-emerald-400" /> Target Phone Numbers
                </h4>
                <p className="text-[11px] text-white/40">Supports BD (017...) and International formats</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white cursor-pointer">
                <Upload size={12} /> Upload CSV
                <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={3}
              value={phoneNumbersText}
              onChange={e => setPhoneNumbersText(e.target.value)}
              placeholder="Paste numbers separated by comma or new line (e.g. 01712345678, +15552345678)"
              className="w-full p-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-emerald-300">
                {parsedNumbers.length} valid number{parsedNumbers.length === 1 ? '' : 's'} queued
              </span>

              {/* Instant Test SMS */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="w-36 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={sendTestSms}
                  disabled={sendingTest || !testPhone}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {sendingTest ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Send Test
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Smartphone Handset Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Smartphone size={13} className="text-emerald-400" /> Customer Phone Mockup
          </span>

          <div className="w-[280px] rounded-[36px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl space-y-3">
            {/* Phone speaker & camera */}
            <div className="mx-auto w-20 h-4 rounded-full bg-slate-800 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
              <div className="w-8 h-1 rounded-full bg-slate-900" />
            </div>

            <div className="text-center pb-2 border-b border-white/5">
              <div className="text-[11px] font-bold text-white">{settings.gatewaySenderId || 'GrowthPilot'}</div>
              <div className="text-[9px] text-white/30">SMS • Today 12:45 PM</div>
            </div>

            {/* Bubble */}
            <div className="min-h-[220px] flex flex-col justify-end space-y-2 pb-4">
              <div className="bg-emerald-600 text-white p-3 rounded-2xl rounded-bl-sm text-xs leading-relaxed shadow-md">
                {smsText || 'Your SMS copy will appear here...'}
              </div>
              <span className="text-[9px] text-white/30 text-right pr-1">Delivered</span>
            </div>

            {/* Home bar */}
            <div className="mx-auto w-24 h-1 rounded-full bg-white/20 mt-2" />
          </div>
        </div>
      </div>

      {/* SMS Gateway Configuration Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Settings size={18} className="text-emerald-400" /> SMS Gateway Settings
                </h3>
                <p className="text-xs text-white/40">Connect Twilio, BulkSMSBD, or HTTP SMS Gateway</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-white/60 mb-1">Provider Type</label>
                <select
                  value={settings.provider}
                  onChange={e => setSettings({ ...settings, provider: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-bold"
                >
                  <option value="http_gateway">Bangladesh / Global HTTP Gateway (BulkSMSBD, Greenweb)</option>
                  <option value="twilio">Twilio Programmable SMS</option>
                  <option value="webhook">Custom Webhook (Zapier / Make)</option>
                </select>
              </div>

              {settings.provider === 'http_gateway' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-white/60 mb-1">Gateway Platform</label>
                    <select
                      value={settings.gatewayType}
                      onChange={e => {
                        const val = e.target.value as any;
                        const url =
                          val === 'bulksmsbd'
                            ? 'http://bulksmsbd.net/api/smsapi'
                            : val === 'greenweb'
                            ? 'https://api.greenweb.com.bd/api.php'
                            : settings.gatewayUrl;
                        setSettings({ ...settings, gatewayType: val, gatewayUrl: url });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                    >
                      <option value="bulksmsbd">BulkSMSBD.net</option>
                      <option value="greenweb">Greenweb.com.bd</option>
                      <option value="generic">Generic HTTP GET/POST Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 mb-1">Gateway API Key / Token</label>
                    <input
                      type="password"
                      required
                      placeholder="API Key..."
                      value={settings.gatewayApiKey}
                      onChange={e => setSettings({ ...settings, gatewayApiKey: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 mb-1">Sender ID / Masking</label>
                    <input
                      type="text"
                      placeholder="Approved Sender Name or Number"
                      value={settings.gatewaySenderId}
                      onChange={e => setSettings({ ...settings, gatewaySenderId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
              )}

              {settings.provider === 'twilio' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-white/60 mb-1">Twilio Account SID</label>
                    <input
                      type="text"
                      placeholder="AC••••••••"
                      value={settings.twilioSid}
                      onChange={e => setSettings({ ...settings, twilioSid: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-white/60 mb-1">Twilio Auth Token</label>
                    <input
                      type="password"
                      placeholder="Auth Token"
                      value={settings.twilioToken}
                      onChange={e => setSettings({ ...settings, twilioToken: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-white/60 mb-1">Twilio From Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1234567890"
                      value={settings.twilioFrom}
                      onChange={e => setSettings({ ...settings, twilioFrom: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
              )}

              {settings.provider === 'webhook' && (
                <div>
                  <label className="block font-bold text-white/60 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/..."
                    value={settings.webhookUrl}
                    onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {saveSuccess ? <Check size={14} /> : null}
                  {saveSuccess ? 'Saved!' : 'Save Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live SMS Blast Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-emerald-500/30 bg-[#0d1117] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Play size={18} className="text-emerald-400" /> Run Live SMS Campaign
                </h3>
                <p className="text-xs text-white/50">
                  Target: <span className="font-bold text-white">{parsedNumbers.length} phone numbers</span>
                </p>
              </div>
              {!runningCampaign && (
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Warning summary */}
            {!campaignSummary && !runningCampaign && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200 leading-relaxed space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} /> SMS Broadcast Summary:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Total Numbers: <span className="font-bold text-white">{parsedNumbers.length}</span></li>
                  <li>Total Credits Required: <span className="font-bold text-white">{parsedNumbers.length * segmentCount} SMS Credits</span></li>
                  <li>Gateway: <span className="font-bold uppercase text-white">{settings.provider} ({settings.gatewayType})</span></li>
                </ul>
              </div>
            )}

            {/* Progress */}
            {runningCampaign && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white font-bold">
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    Sending SMS to carriers...
                  </span>
                  <span>{campaignProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${campaignProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            {campaignSummary && (
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-white/40">Total</div>
                  <div className="text-xl font-black text-white">{campaignSummary.total}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Delivered</div>
                  <div className="text-xl font-black text-emerald-400">{campaignSummary.sent}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-400">Failed</div>
                  <div className="text-xl font-black text-rose-400">{campaignSummary.failed}</div>
                </div>
              </div>
            )}

            {/* Logs */}
            {campaignLogs.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-[11px]">
                {campaignLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-1 px-2 rounded ${
                      log.status === 'sent' ? 'text-emerald-400 bg-emerald-950/20' : 'text-rose-400 bg-rose-950/20'
                    }`}
                  >
                    <span>{log.phone}</span>
                    <span>{log.status === 'sent' ? '✓ Delivered' : `✗ Failed: ${log.error || 'Gateway error'}`}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={runningCampaign}
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:text-white"
              >
                Close
              </button>
              {!campaignSummary && (
                <button
                  type="button"
                  disabled={runningCampaign || parsedNumbers.length === 0}
                  onClick={runLiveSmsCampaign}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black text-white shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {runningCampaign ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm &amp; Blast to All ({parsedNumbers.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. PRODUCT COPY ECOMMERCE ACTION SUITE
// ==========================================

export function ProductCopyStudio({
  primaryOutput,
  productName = 'Product',
}: {
  primaryOutput: string;
  productName?: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [wpSyncing, setWpSyncing] = useState(false);
  const [wpStatus, setWpStatus] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    await copyTextSafely(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Generate Shopify CSV
  const downloadShopifyCsv = () => {
    const handle = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product-handle';
    const escapedHtml = `"${primaryOutput.replace(/"/g, '""').replace(/\n/g, '<br/>')}"`;

    const csvContent = [
      'Handle,Title,Body (HTML),Vendor,Standard Product Type,Tags,Published,Variant Price,Variant Requires Shipping',
      `${handle},"${productName}",${escapedHtml},GrowthPilot,Physical,featured,TRUE,49.99,TRUE`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${handle}-shopify-product.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Direct Push to WordPress / WooCommerce
  const pushToWordPress = async () => {
    setWpSyncing(true);
    setWpStatus(null);
    try {
      // Check stored WP credentials
      const wpConfig = localStorage.getItem('growthpilot_wp_credentials');
      if (!wpConfig) {
        throw new Error('No WordPress credentials found. Please configure WordPress under Dashboard > WordPress first.');
      }
      const parsed = JSON.parse(wpConfig);

      const res = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: parsed.url || parsed.endpoint,
          username: parsed.username,
          applicationPassword: parsed.password || parsed.applicationPassword,
          title: productName,
          content: `<div class="ecommerce-product-copy">${primaryOutput.replace(/\n/g, '<br/>')}</div>`,
          status: 'draft',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'WordPress publish failed.');
      }

      setWpStatus(`Product created as Draft on WordPress! (ID: ${data.postId || 'OK'})`);
    } catch (err) {
      setWpStatus(`Sync Error: ${(err as Error).message}`);
    } finally {
      setWpSyncing(false);
    }
  };

  // Structured HTML Block
  const formattedHtml = `<div class="product-description space-y-4">
  <h3 class="text-xl font-bold text-slate-900">${productName}</h3>
  <p class="text-slate-700 leading-relaxed">${primaryOutput.slice(0, 300)}</p>
  <div class="features-highlight bg-slate-50 p-4 rounded-xl border border-slate-200">
    <h4 class="font-bold text-slate-900 mb-2">Key Advantages</h4>
    <ul class="list-disc pl-5 space-y-1 text-slate-700">
      <li>Premium engineering &amp; guaranteed performance</li>
      <li>Fast delivery with 100% money-back satisfaction guarantee</li>
    </ul>
  </div>
</div>`;

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/60 to-orange-950/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <ShoppingBag size={12} /> Ecommerce Action Suite
          </div>
          <h3 className="text-lg font-black text-white">Store-Ready Product Assets</h3>
          <p className="text-xs text-white/50">
            Export directly as a Shopify CSV import, push to WooCommerce, or copy structured HTML with FAQ schema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadShopifyCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-black text-white shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} /> Download Shopify CSV
          </button>

          <button
            type="button"
            onClick={pushToWordPress}
            disabled={wpSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {wpSyncing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} className="text-amber-400" />}
            Push to WooCommerce (Draft)
          </button>
        </div>
      </div>

      {wpStatus && (
        <div className="p-3 rounded-xl text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{wpStatus}</span>
        </div>
      )}

      {/* Structured Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Clean HTML Box */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
              <Code size={13} /> Ready-to-Paste HTML Description
            </span>
            <button
              type="button"
              onClick={() => copy('html', formattedHtml)}
              className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1"
            >
              {copiedKey === 'html' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copiedKey === 'html' ? 'Copied' : 'Copy HTML'}
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-white/70 overflow-x-auto max-h-48">
            {formattedHtml}
          </pre>
        </div>

        {/* Module 2: Google SERP Snippet Preview */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-2">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
            <Globe size={13} /> Google SERP Snippet Preview
          </span>
          <div className="p-4 rounded-xl bg-white text-left space-y-1">
            <div className="text-[11px] text-emerald-800 flex items-center gap-1">
              https://yourstore.com/products/{productName.toLowerCase().replace(/\s+/g, '-')}
            </div>
            <div className="text-base font-semibold text-blue-800 hover:underline line-clamp-1">
              {productName} | Best Price, Guaranteed Quality &amp; Fast Shipping
            </div>
            <div className="text-xs text-slate-600 line-clamp-2 leading-snug">
              {primaryOutput.slice(0, 155)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. SOCIAL CAMPAIGN MULTI-PLATFORM STUDIO
// ==========================================

export function SocialCampaignStudio({ primaryOutput }: { primaryOutput: string }) {
  const [activePlatform, setActivePlatform] = useState<'linkedin' | 'twitter' | 'facebook' | 'instagram'>('linkedin');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract platform sections if available or create smart variants
  const sections = {
    linkedin: primaryOutput.match(/\[LINKEDIN POST\]:?\s*([\s\S]*?)(?=\[X \/ TWITTER|\[FACEBOOK|\[INSTAGRAM|$)/i)?.[1]?.trim() || primaryOutput,
    twitter: primaryOutput.match(/\[X \/ TWITTER THREAD\]:?\s*([\s\S]*?)(?=\[FACEBOOK|\[INSTAGRAM|$)/i)?.[1]?.trim() || primaryOutput,
    facebook: primaryOutput.match(/\[FACEBOOK POST\]:?\s*([\s\S]*?)(?=\[INSTAGRAM|$)/i)?.[1]?.trim() || primaryOutput,
    instagram: primaryOutput.match(/\[INSTAGRAM CAPTION\]:?\s*([\s\S]*?)$/i)?.[1]?.trim() || primaryOutput,
  };

  const currentContent = sections[activePlatform] || primaryOutput;

  const copyPost = async () => {
    await copyTextSafely(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareWebIntent = () => {
    const encoded = encodeURIComponent(currentContent.slice(0, 270));
    if (activePlatform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
    } else if (activePlatform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/`, '_blank');
    } else if (activePlatform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://growthpilot.ai')}&quote=${encoded}`, '_blank');
    }
  };

  const triggerWebhook = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setDispatchMsg('Please provide a valid Webhook URL (e.g. Zapier, Make.com, Buffer).');
      return;
    }

    setDispatching(true);
    setDispatchMsg(null);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'social_campaign_schedule',
          platform: activePlatform,
          content: currentContent,
          scheduledAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(`Webhook returned status ${res.status}`);
      setDispatchMsg('Successfully dispatched to Social Webhook (Buffer / Zapier)!');
    } catch (err) {
      setDispatchMsg(`Dispatch Error: ${(err as Error).message}`);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-950/60 to-pink-950/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 mb-2">
            <Share2 size={12} /> Multi-Platform Social Studio
          </div>
          <h3 className="text-lg font-black text-white">Platform-Specific Formatter &amp; Publisher</h3>
          <p className="text-xs text-white/50">
            Native formatting for LinkedIn, X Thread, Facebook, and Instagram with 1-click Web Intent &amp; Webhook automation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={shareWebIntent}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-xs font-black text-white shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer"
          >
            <ExternalLink size={14} /> Open in {activePlatform === 'twitter' ? 'X / Twitter' : activePlatform === 'linkedin' ? 'LinkedIn' : 'Platform'}
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {(['linkedin', 'twitter', 'facebook', 'instagram'] as const).map(plat => (
          <button
            key={plat}
            type="button"
            onClick={() => setActivePlatform(plat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePlatform === plat
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {plat === 'linkedin' && 'LinkedIn Creator Post'}
            {plat === 'twitter' && 'X / Twitter Thread'}
            {plat === 'facebook' && 'Facebook Post'}
            {plat === 'instagram' && 'Instagram Caption'}
          </button>
        ))}
      </div>

      {/* Editor & Webhook Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                {activePlatform.toUpperCase()} Copy Content
              </span>
              <button
                type="button"
                onClick={copyPost}
                className="text-xs font-bold text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard' : 'Copy Formatted Text'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs sm:text-sm leading-relaxed text-white/90 whitespace-pre-wrap font-sans">
              {currentContent}
            </div>
          </div>

          {/* Social Webhook Integration */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Share2 size={13} className="text-fuchsia-400" /> Auto-Schedule via Webhook (Buffer / Zapier / Make)
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-fuchsia-500"
              />
              <button
                type="button"
                onClick={triggerWebhook}
                disabled={dispatching || !webhookUrl}
                className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {dispatching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Schedule Post
              </button>
            </div>

            {dispatchMsg && (
              <div className="p-2.5 rounded-xl text-xs bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 flex items-center gap-2">
                <CheckCircle2 size={14} />
                <span>{dispatchMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Mockup Preview Card */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={13} className="text-fuchsia-400" /> Platform Mockup
          </span>

          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-4 text-white space-y-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center text-xs font-black">
                GP
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">GrowthPilot Marketing</div>
                <div className="text-[10px] text-white/40">1m ago • Public</div>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-white/80 line-clamp-6 whitespace-pre-wrap">
              {currentContent}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 font-semibold">
              <span>👍 42 Likes</span>
              <span>💬 12 Comments</span>
              <span>🔄 8 Shares</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
