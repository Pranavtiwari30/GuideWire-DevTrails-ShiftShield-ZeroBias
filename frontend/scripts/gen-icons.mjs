/**
 * Generates ShiftShield PWA icons from an inline SVG.
 * Run: node scripts/gen-icons.mjs
 * Requires: sharp (npm install -D sharp)
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/icons");
mkdirSync(OUT, { recursive: true });

// Shield icon SVG with ShiftShield colors
const shieldSvg = (size, padding = 0) => {
  const s = size;
  const p = padding;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#171717"/>
  <g transform="translate(${s / 2}, ${s / 2})">
    <!-- Shield shape -->
    <path
      d="M0,${-(s * 0.35 - p)} L${-(s * 0.28 - p)},${-(s * 0.18 - p)}
         L${-(s * 0.28 - p)},${s * 0.05}
         Q${-(s * 0.28 - p)},${s * 0.22} 0,${s * 0.35 - p}
         Q${s * 0.28 - p},${s * 0.22} ${s * 0.28 - p},${s * 0.05}
         L${s * 0.28 - p},${-(s * 0.18 - p)} Z"
      fill="#00aaff"
      opacity="0.15"
      stroke="#00aaff"
      stroke-width="${s * 0.015}"
    />
    <!-- SS lettermark -->
    <text
      x="0" y="${s * 0.08}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="system-ui, -apple-system, sans-serif"
      font-weight="900"
      font-size="${s * 0.22}"
      fill="#00aaff"
      letter-spacing="-1"
    >SS</text>
  </g>
</svg>`.trim();
};

const sizes = [
  { name: "icon-192.png",          size: 192, padding: 0  },
  { name: "icon-512.png",          size: 512, padding: 0  },
  { name: "icon-180.png",          size: 180, padding: 0  },
  { name: "icon-maskable-512.png", size: 512, padding: 80 }, // safe-zone padding for maskable
];

for (const { name, size, padding } of sizes) {
  const svg = Buffer.from(shieldSvg(size, padding));
  await sharp(svg)
    .png()
    .toFile(resolve(OUT, name));
  console.log(`✓ ${name}`);
}

console.log(`\nIcons written to public/icons/`);
