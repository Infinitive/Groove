import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// 1. Master SVG with Squircle Plate (for desktop browser tabs, standalone SVG, and any-purpose icons)
const masterSquircleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <!-- Background Gradient (Subtle overhead studio lighting on dark matte) -->
    <linearGradient id="bgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#262629"/>
      <stop offset="25%" stop-color="#1C1C1F"/>
      <stop offset="65%" stop-color="#131315"/>
      <stop offset="100%" stop-color="#0A0A0C"/>
    </linearGradient>

    <!-- Top Rim Specular Highlight (Subtle chamfer highlight) -->
    <linearGradient id="rimGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
      <stop offset="15%" stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
    </linearGradient>

    <!-- Acoustic Waveform Ember Gradient -->
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFA238"/>
      <stop offset="25%" stop-color="#FF6616"/>
      <stop offset="70%" stop-color="#F04804"/>
      <stop offset="100%" stop-color="#D42C00"/>
    </linearGradient>

    <!-- Ambient Center Ember Glow -->
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#FF5A10" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="#FF5A10" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#FF5A10" stop-opacity="0"/>
    </radialGradient>

    <!-- Drop Shadow for Tactile Elevation -->
    <filter id="waveElevation" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.75"/>
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.5"/>
    </filter>

    <clipPath id="squircleClip">
      <rect width="512" height="512" rx="115" ry="115"/>
    </clipPath>
  </defs>

  <!-- Squircle Canvas -->
  <g clip-path="url(#squircleClip)">
    <!-- Base Matte Surface -->
    <rect width="512" height="512" fill="url(#bgGrad)"/>
    
    <!-- Ambient Heat & Overhead Light -->
    <circle cx="256" cy="256" r="210" fill="url(#centerGlow)"/>
    <ellipse cx="256" cy="30" rx="220" ry="120" fill="#FFFFFF" opacity="0.04"/>

    <!-- Tactile Acoustic Waveform -->
    <path d="M 0 256 L 50 256 C 74 256, 88 168, 108 168 C 132 168, 150 392, 176 392 C 204 392, 226 125, 256 125 C 286 125, 308 392, 336 392 C 362 392, 380 168, 404 168 C 424 168, 438 256, 462 256 L 512 256"
          fill="none"
          stroke="url(#waveGrad)"
          stroke-width="28"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#waveElevation)"/>

    <!-- Inner Rim Stroke Highlight -->
    <rect width="512" height="512" rx="115" ry="115" fill="none" stroke="url(#rimGrad)" stroke-width="2.5"/>
  </g>
</svg>`;

// 2. Full-Bleed Opaque Master SVG (for Maskable Android and Apple Touch Icons)
// Ensures no transparent corners or clipped borders occur when OS applies its own mask
const fullBleedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <!-- Background Gradient (Full bleed edge-to-edge dark matte) -->
    <linearGradient id="bgGradFull" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#242427"/>
      <stop offset="25%" stop-color="#1A1A1D"/>
      <stop offset="65%" stop-color="#121214"/>
      <stop offset="100%" stop-color="#08080A"/>
    </linearGradient>

    <!-- Acoustic Waveform Ember Gradient -->
    <linearGradient id="waveGradFull" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFA238"/>
      <stop offset="25%" stop-color="#FF6616"/>
      <stop offset="70%" stop-color="#F04804"/>
      <stop offset="100%" stop-color="#D42C00"/>
    </linearGradient>

    <!-- Ambient Center Ember Glow -->
    <radialGradient id="centerGlowFull" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#FF5A10" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="#FF5A10" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#FF5A10" stop-opacity="0"/>
    </radialGradient>

    <!-- Drop Shadow for Tactile Elevation -->
    <filter id="waveElevationFull" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.75"/>
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Full-bleed background rectangle -->
  <rect width="512" height="512" fill="url(#bgGradFull)"/>
  
  <!-- Subtle lighting accents -->
  <circle cx="256" cy="256" r="210" fill="url(#centerGlowFull)"/>
  <ellipse cx="256" cy="30" rx="220" ry="120" fill="#FFFFFF" opacity="0.04"/>

  <!-- Tactile Acoustic Waveform running edge-to-edge -->
  <path d="M 0 256 L 50 256 C 74 256, 88 168, 108 168 C 132 168, 150 392, 176 392 C 204 392, 226 125, 256 125 C 286 125, 308 392, 336 392 C 362 392, 380 168, 404 168 C 424 168, 438 256, 462 256 L 512 256"
        fill="none"
        stroke="url(#waveGradFull)"
        stroke-width="28"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#waveElevationFull)"/>
</svg>`;

async function buildAllIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Save master SVG icon
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterSquircleSvg);
  console.log('Saved public/icon.svg');

  const squircleBuffer = Buffer.from(masterSquircleSvg);
  const fullBleedBuffer = Buffer.from(fullBleedSvg);

  // 2. Generate Standard PWA icons (512x512, 192x192)
  await sharp(squircleBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  await sharp(squircleBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // 3. Generate Android Maskable Icon (512x512 with safe zone guarantee and full-bleed dark matte canvas)
  await sharp(fullBleedBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png');

  // 4. Generate Apple Touch Icons (Opaque full-bleed square as mandated by Apple HIG)
  await sharp(fullBleedBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png (180x180)');

  await sharp(fullBleedBuffer)
    .resize(152, 152)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon-152x152.png'));
  console.log('Generated public/apple-touch-icon-152x152.png (152x152)');

  await sharp(fullBleedBuffer)
    .resize(167, 167)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon-167x167.png'));
  console.log('Generated public/apple-touch-icon-167x167.png (167x167)');

  // 5. Generate Favicons (32x32, 16x16, 48x48)
  const fav16 = await sharp(squircleBuffer).resize(16, 16).png().toBuffer();
  const fav32 = await sharp(squircleBuffer).resize(32, 32).png().toBuffer();
  const fav48 = await sharp(squircleBuffer).resize(48, 48).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32);
  console.log('Generated public/favicon-16x16.png and favicon-32x32.png');

  // 6. Build Multi-resolution ICO (16x16, 32x32, 48x48)
  const icoImages = [
    { width: 16, height: 16, buffer: fav16 },
    { width: 32, height: 32, buffer: fav32 },
    { width: 48, height: 48, buffer: fav48 },
  ];

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(icoImages.length, 4);

  let offset = 6 + icoImages.length * 16;
  const entries = [];
  for (const img of icoImages) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width, 0);
    entry.writeUInt8(img.height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...entries, ...icoImages.map(i => i.buffer)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Generated public/favicon.ico (Multi-size 16/32/48 ICO container)');
}

buildAllIcons()
  .then(() => console.log('All icons generated successfully!'))
  .catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });
