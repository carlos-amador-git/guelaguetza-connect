import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG base con el logo "G" de Guelaguetza
const createSvg = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const radius = maskable ? 0 : size * 0.125;
  const fontSize = innerSize * 0.45;
  const textY = size / 2 + fontSize * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" fill="#D9006C" rx="${radius}"/>
    <text x="${size/2}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">G</text>
  </svg>`;
};

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  for (const size of sizes) {
    const svg = createSvg(size);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));

    console.log(`Generated icon-${size}.png`);
  }

  // Maskable icon (con padding para safe area)
  const maskableSvg = createSvg(512, true);
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(join(iconsDir, 'icon-maskable-512.png'));
  console.log('Generated icon-maskable-512.png');

  // Apple touch icon
  const appleSvg = createSvg(180);
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Favicon
  const faviconSvg = createSvg(32);
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(join(iconsDir, 'favicon-32.png'));
  console.log('Generated favicon-32.png');

  console.log('\\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
