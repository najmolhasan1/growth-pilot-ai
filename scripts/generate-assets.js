const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.resolve(__dirname, '../public/images/favicon.png');
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Helper to create an ICO file from an array of PNG buffers with widths
function createIco(pngItems) {
  const count = pngItems.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const entries = [];
  for (const item of pngItems) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngItems.map(p => p.buffer)]);
}

async function run() {
  console.log('Reading source icon:', SOURCE_IMAGE);
  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error('Source image not found: ' + SOURCE_IMAGE);
  }

  const srcBuf = fs.readFileSync(SOURCE_IMAGE);

  // 1. Generate Web Favicons
  console.log('--- Generating Web Favicons ---');
  // Copy to public/favicon.png
  fs.writeFileSync(path.join(PROJECT_ROOT, 'public/favicon.png'), srcBuf);

  // 16x16, 32x32, 48x48 PNG buffers for ICO
  const p16 = await sharp(srcBuf).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const p32 = await sharp(srcBuf).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const p48 = await sharp(srcBuf).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  const icoBuf = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 },
  ]);

  fs.writeFileSync(path.join(PROJECT_ROOT, 'public/favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/app/favicon.ico'), icoBuf);
  console.log('Saved public/favicon.ico and src/app/favicon.ico');

  // Next.js standard App Router icons
  const iconPng32 = await sharp(srcBuf).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/app/icon.png'), iconPng32);

  // Apple touch icon (180x180) with brand background or clean padding
  const appleTouchBuf = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 10, g: 10, b: 12, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(srcBuf).resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toBuffer();

  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/app/apple-icon.png'), appleTouchBuf);
  fs.writeFileSync(path.join(PROJECT_ROOT, 'public/apple-touch-icon.png'), appleTouchBuf);
  console.log('Saved src/app/apple-icon.png and public/apple-touch-icon.png');

  // 2. Android App Launcher Icons
  console.log('--- Generating Android Mipmap Icons ---');
  const densities = [
    { name: 'mdpi', size: 48, fgSize: 108 },
    { name: 'hdpi', size: 72, fgSize: 162 },
    { name: 'xhdpi', size: 96, fgSize: 216 },
    { name: 'xxhdpi', size: 144, fgSize: 324 },
    { name: 'xxxhdpi', size: 192, fgSize: 432 },
  ];

  const resDir = path.join(PROJECT_ROOT, 'android/app/src/main/res');

  for (const d of densities) {
    const dir = path.join(resDir, `mipmap-${d.name}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // A) Adaptive foreground (ic_launcher_foreground.png):
    // fgSize canvas, logo centered inside ~66% safe zone
    const logoInner = Math.round(d.fgSize * 0.66);
    const logoBuf = await sharp(srcBuf)
      .resize(logoInner, logoInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const fgBuf = await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png()
    .toBuffer();

    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgBuf);

    // B) Legacy square/rounded launcher (ic_launcher.png):
    // dark background #0a0a0c with rounded corners
    const cornerRadius = Math.round(d.size * 0.22);
    const rectSvg = Buffer.from(
      `<svg width="${d.size}" height="${d.size}"><rect x="0" y="0" width="${d.size}" height="${d.size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#0a0a0c"/></svg>`
    );

    const legacyInner = Math.round(d.size * 0.72);
    const legacyLogoBuf = await sharp(srcBuf)
      .resize(legacyInner, legacyInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const launcherBuf = await sharp(rectSvg)
      .composite([{ input: legacyLogoBuf, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), launcherBuf);

    // C) Legacy round launcher (ic_launcher_round.png):
    const circleSvg = Buffer.from(
      `<svg width="${d.size}" height="${d.size}"><circle cx="${d.size / 2}" cy="${d.size / 2}" r="${d.size / 2}" fill="#0a0a0c"/></svg>`
    );

    const launcherRoundBuf = await sharp(circleSvg)
      .composite([{ input: legacyLogoBuf, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), launcherRoundBuf);

    console.log(`Updated mipmap-${d.name}`);
  }

  // 3. Android Splash Screens
  console.log('--- Generating Android Splash Screens ---');
  const splashDirs = fs.readdirSync(resDir).filter(d => d.startsWith('drawable'));
  for (const sd of splashDirs) {
    const splashFile = path.join(resDir, sd, 'splash.png');
    if (fs.existsSync(splashFile)) {
      const meta = await sharp(splashFile).metadata();
      const w = meta.width;
      const h = meta.height;
      // Logo size ~28% of smaller dimension, at least 96px
      const logoSize = Math.max(96, Math.round(Math.min(w, h) * 0.32));
      const splashLogo = await sharp(srcBuf)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      const splashOutput = await sharp({
        create: {
          width: w,
          height: h,
          channels: 4,
          background: { r: 3, g: 3, b: 3, alpha: 1 } // #030303
        }
      })
      .composite([{ input: splashLogo, gravity: 'center' }])
      .png()
      .toBuffer();

      fs.writeFileSync(splashFile, splashOutput);
      console.log(`Updated ${sd}/splash.png (${w}x${h})`);
    }
  }

  // 4. Update ic_launcher_background.xml
  console.log('--- Updating Android Launcher Background Color ---');
  const bgXmlPath = path.join(resDir, 'values/ic_launcher_background.xml');
  fs.writeFileSync(
    bgXmlPath,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0a0a0c</color>\n</resources>\n`
  );

  console.log('All icons and splash screens successfully updated!');
}

run().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
