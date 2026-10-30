'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Sparkles, RefreshCw, Palette, Image as ImageIcon, Sliders } from 'lucide-react';

interface AdBannerStudioProps {
  productName: string;
  brandName: string;
  offerText: string;
  priceText: string;
}

export default function AdBannerStudio({
  productName = 'Ultra AMOLED Smartwatch',
  brandName = 'GrowthPilot Store',
  offerText = 'Cash on Delivery Available',
  priceText = '৳2,450',
}: AdBannerStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('1:1');
  const [headline, setHeadline] = useState(productName);
  const [tagline, setTagline] = useState('প্রিমিয়াম কোয়ালিটি • সীমিত স্টক অফার');
  const [brand, setBrand] = useState(brandName);
  const [badge, setBadge] = useState(offerText);
  const [price, setPrice] = useState(priceText);
  const [theme, setTheme] = useState<'lime' | 'coral' | 'cyan' | 'dark'>('lime');

  // Redraw canvas whenever inputs change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === '1:1' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    // Theme color palettes
    const themes = {
      lime: { bg: '#080A06', accent: '#D4F54C', text: '#FFFFFF', sub: '#A0B080', border: '#253510' },
      coral: { bg: '#0C0706', accent: '#FF5533', text: '#FFFFFF', sub: '#B08078', border: '#401812' },
      cyan: { bg: '#050A0B', accent: '#3EE0D2', text: '#FFFFFF', sub: '#78B0B0', border: '#123A36' },
      dark: { bg: '#0A0A0C', accent: '#FFFFFF', text: '#FFFFFF', sub: '#888899', border: '#222228' },
    };

    const currentTheme = themes[theme];

    // Background fill
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle Radial Glow
    const gradient = ctx.createRadialGradient(width / 2, height * 0.45, 50, width / 2, height * 0.45, width * 0.6);
    gradient.addColorStop(0, currentTheme.accent + '25'); // 15% opacity glow
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Outer Border
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Brand Name Pill (Top Center)
    ctx.fillStyle = '#141418';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 180, 70, 360, 60, 30);
    ctx.fill();
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = currentTheme.accent;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(brand.toUpperCase(), width / 2, 108);

    // Headline Text
    ctx.fillStyle = currentTheme.text;
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';

    // Word wrap headline
    const words = headline.split(' ');
    let line = '';
    let y = 200;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 160 && i > 0) {
        ctx.fillText(line.trim(), width / 2, y);
        line = words[i] + ' ';
        y += 75;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), width / 2, y);

    // Subtitle Tagline
    ctx.fillStyle = currentTheme.sub;
    ctx.font = '32px sans-serif';
    ctx.fillText(tagline, width / 2, y + 60);

    // Center Product Showcase Box
    const boxY = y + 110;
    const boxH = aspectRatio === '1:1' ? 440 : 850;
    ctx.fillStyle = '#101115';
    ctx.beginPath();
    ctx.roundRect(100, boxY, width - 200, boxH, 40);
    ctx.fill();
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center Product Mock Icon or Illustration
    ctx.fillStyle = currentTheme.accent + '15';
    ctx.beginPath();
    ctx.arc(width / 2, boxY + boxH / 2, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = currentTheme.accent;
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText('⚡', width / 2, boxY + boxH / 2 + 25);

    // Badge Banner (e.g. Cash on Delivery Available)
    const badgeY = boxY + boxH - 90;
    ctx.fillStyle = currentTheme.accent;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 240, badgeY, 480, 65, 32);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(badge, width / 2, badgeY + 43);

    // Bottom Bar: Price & CTA
    const bottomY = aspectRatio === '1:1' ? 950 : 1720;

    // Price Pill
    ctx.fillStyle = '#1A1C22';
    ctx.beginPath();
    ctx.roundRect(100, bottomY, 360, 80, 24);
    ctx.fill();
    ctx.strokeStyle = currentTheme.accent + '40';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = currentTheme.text;
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(price, 280, bottomY + 52);

    // CTA Button
    ctx.fillStyle = currentTheme.accent;
    ctx.beginPath();
    ctx.roundRect(width - 480, bottomY, 380, 80, 24);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('অর্ডার করুন ➔', width - 290, bottomY + 52);
  }, [aspectRatio, headline, tagline, brand, badge, price, theme]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ad_Creative_${brand.replace(/\s+/g, '_')}_${aspectRatio.replace(':', 'x')}_${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="rounded-3xl border border-[#1E2026] bg-[#111215] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2026]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#D4F54C]" />
            <span>Interactive Ad Banner Designer & Visual Studio</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Auto-render and export 1080x1080 (Feed) or 1080x1920 (Reels/Stories) PNG banners ready for Meta & TikTok Ads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['1:1', '9:16'] as const).map(ratio => (
            <button
              key={ratio}
              type="button"
              onClick={() => setAspectRatio(ratio)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                aspectRatio === ratio ? 'bg-[#D4F54C] text-black' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {ratio === '1:1' ? '1:1 Square (Feed)' : '9:16 Story/Reel'}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="px-4 py-1.5 rounded-lg bg-[#D4F54C] hover:bg-[#C2E338] text-black text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download size={14} />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase">Visual Theme Preset</label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {[
                { id: 'lime', label: 'Cyber Lime', color: '#D4F54C' },
                { id: 'coral', label: 'F-Commerce Coral', color: '#FF5533' },
                { id: 'cyan', label: 'Tech Teal', color: '#3EE0D2' },
                { id: 'dark', label: 'Matte Obsidian', color: '#E5E5E5' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as any)}
                  className={`p-2 rounded-xl border text-center text-[10px] font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    theme === t.id ? 'border-[#D4F54C] bg-white/10 text-white' : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase">Headline Text</label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase">Tagline / Sub-Text</label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-white/50 uppercase">Price Badge</label>
              <input
                type="text"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-white/50 uppercase">Offer Badge</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase">Brand Name Overlay</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Live Canvas Preview Column */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/50 border border-[#1E2026]">
          <div className="text-[11px] font-mono text-white/40 mb-3 flex items-center gap-2">
            <span>Render Mode: HTML5 2D Canvas</span>
            <span>•</span>
            <span className="text-[#D4F54C]">{aspectRatio === '1:1' ? '1080x1080 (HD)' : '1080x1920 (HD)'}</span>
          </div>

          <div className="max-h-[500px] flex items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-2xl">
            <canvas
              ref={canvasRef}
              className="max-h-[480px] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
