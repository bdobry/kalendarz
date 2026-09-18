// Deterministic, offline social cards. Source artwork stays editable; PNGs are build artifacts.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const colors = {
  paper: '#fafafa', ink: '#202024', muted: '#696974', line: '#dddde5',
  violet: '#5c5cff', lavender: '#eee9ff', lime: '#d9fa66', bridge: '#e8fca9',
  wave: '#596a26', teal: '#267572', tealLight: '#eaf5f2',
};
const fontFiles = ['Regular', 'Bold'].map(weight => resolve(projectRoot, `assets/brand/fonts/Inter-${weight}.ttf`));
const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const text = (x, y, value, size = 24, fill = colors.ink, weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Inter" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${escapeXml(value)}</text>`;
const rect = (x, y, width, height, fill, radius = 0, extra = '') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" ${extra}/>`;

function wave(x, y, width, direction = 1) {
  const segments = 8;
  const half = width / segments / 2;
  let path = `M${x} ${y}`;
  for (let i = 0; i < segments; i++) {
    path += `q${half / 2} ${-4 * direction} ${half} 0t${half} 0`;
  }
  return path;
}

function bridgeStrip(y) {
  const x = 730, width = 360, height = 72, dayWidth = width / 4;
  const top = wave(x + dayWidth, y, dayWidth);
  const bottom = wave(x + dayWidth, y + height, dayWidth);
  return `${rect(x, y, width, height, colors.lavender, 12)}
    <clipPath id="bridge"><path d="${top}V${y + height}${wave(x + dayWidth * 2, y + height, -dayWidth, -1).replace(/^M[^q]+/, '')}Z"/></clipPath>
    ${rect(x + dayWidth, y - 4, dayWidth, height + 8, colors.bridge, 0, 'clip-path="url(#bridge)"')}
    <path d="${top}M${x + dayWidth} ${y + height}${bottom.slice(bottom.indexOf('q'))}" stroke="${colors.wave}" stroke-width="2" fill="none"/>
    ${['CZ', 'PT', 'SO', 'ND'].map((day, i) => text(x + dayWidth * (i + 0.5), y + 43, day, 20, i === 1 ? colors.ink : colors.violet, 700, 'text-anchor="middle"')).join('')}`;
}

function ticket(content) {
  return `<g transform="rotate(3 910 316)">${rect(702, 149, 416, 350, colors.lavender, 26, `stroke="${colors.ink}" stroke-width="2"`)}</g>
    ${rect(700, 143, 420, 350, colors.ink, 26)}
    ${rect(700, 135, 420, 350, '#ffffff', 26, `stroke="${colors.ink}" stroke-width="2"`)}${content}`;
}

function cardContent(kind, year) {
  if (kind === 'donor') {
    return ticket(`${text(730, 181, 'TWÓJ RYTM DONACJI', 17, colors.muted, 700, 'letter-spacing="1.4"')}
      <path d="M1090 164c-8-13-25-2-15 10l15 14 15-14c10-12-7-23-15-10Z" fill="none" stroke="${colors.teal}" stroke-width="2.5"/>
      ${rect(730, 211, 170, 64, colors.tealLight, 14)}${text(815, 252, 'Krew', 28, colors.teal, 700, 'text-anchor="middle"')}
      ${rect(916, 211, 174, 64, colors.lavender, 14)}${text(1003, 252, 'Osocze', 28, colors.violet, 700, 'text-anchor="middle"')}
      ${['Kalendarz donacji', 'Odstępy i limity', 'Historia w jednym miejscu'].map((label, i) =>
        `${rect(730, 307 + i * 52, 25, 25, i === 0 ? colors.lime : colors.paper, 8)}${text(742.5, 325 + i * 52, i + 1, 14, colors.ink, 700, 'text-anchor="middle"')}${text(771, 327 + i * 52, label, 21)}`).join('')}`);
  }
  if (kind === 'year') {
    return ticket(`${text(730, 181, 'KALENDARZ DNI WOLNYCH', 17, colors.muted, 700, 'letter-spacing="1.2"')}
      ${rect(730, 211, 360, 120, colors.ink, 17)}${text(910, 305, year, 104, colors.lime, 700, 'text-anchor="middle" letter-spacing="-4"')}
      ${bridgeStrip(355)}${text(910, 460, 'Połącz święto z weekendem.', 20, colors.muted, 400, 'text-anchor="middle"')}`);
  }
  const planner = kind === 'planner';
  return ticket(`${text(730, 181, planner ? 'PRZYKŁADOWY PLAN' : 'TAK DZIAŁA MOSTEK', 17, colors.muted, 700, 'letter-spacing="1.5"')}
    ${text(730, 304, planner ? '9' : '4', 112, colors.ink, 700, 'letter-spacing="-5"')}
    ${text(828, 270, 'dni', 28, colors.ink, 700)}${text(828, 307, 'wolnego', 28, colors.ink, 700)}
    ${rect(1042, 229, 48, 48, colors.lime, 24)}<path d="M1066 239v28m-14-14h28m-24-10 20 20m0-20-20 20" stroke="${colors.ink}" stroke-width="2"/>
    ${planner ? `${rect(730, 355, 360, 72, colors.lavender, 12)}${rect(810, 355, 200, 72, colors.bridge, 0)}${text(910, 399, '5 dni urlopu + weekendy', 21, colors.ink, 700, 'text-anchor="middle"')}` : bridgeStrip(355)}
    ${text(910, 460, planner ? 'Więcej miejsca na odpoczynek.' : '1 dzień urlopu. 4 dni wolnego.', 20, colors.muted, 400, 'text-anchor="middle"')}`);
}

export function socialCardSvg(kind, year) {
  const copy = {
    home: { title: ['Nie robię.', 'Mam wolne.'], lines: ['Kalendarz dni wolnych.', 'Planer Twojego urlopu.'], footer: 'Święta · Długie weekendy · Twój urlop', tag: 'DOBRZE BYĆ OFF.' },
    year: { title: ['Długie', 'weekendy.'], lines: [`Sprawdź dni wolne w ${year}.`, 'Połącz święta z urlopem.'], footer: `Kalendarz ${year} · Święta · Planer urlopu`, tag: `${year}` },
    planner: { title: ['Planer', 'urlopu.'], lines: ['Twój bilans. Twoje przerwy.', 'Cały rok w jednym miejscu.'], footer: 'Bilans urlopu · Kalendarz · Plan wypoczynku', tag: 'CZAS NA WOLNE.' },
    donor: { title: ['Dobro', 'wraca.'], lines: ['Planer krwiodawcy.', 'Krew i osocze w jednym planie.'], footer: 'Terminy donacji · Kalendarz · Historia', tag: 'ZAPLANUJ DOBRO.' },
  }[kind];
  if (!copy || (kind === 'year' && !Number.isInteger(year))) throw new Error('Invalid social card');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <title>${escapeXml(`nierobie.pl — ${copy.title.join(' ')}`)}</title>
    ${rect(0, 0, 1200, 630, colors.paper)}
    ${text(64, 90, 'nierobie', 32, colors.ink, 700, 'letter-spacing="-1.3"')}${text(176, 90, '.pl', 32, colors.violet, 700, 'letter-spacing="-1.3"')}
    ${rect(875, 52, 245, 48, colors.lime, 24, `stroke="${colors.ink}" stroke-width="1.5"`)}${text(997.5, 83, copy.tag, 17, colors.ink, 700, 'text-anchor="middle" letter-spacing="1"')}
    ${text(64, 258, copy.title[0], 86, colors.ink, 700, 'letter-spacing="-4"')}
    ${text(64, 354, copy.title[1], 86, colors.violet, 700, 'letter-spacing="-4"')}
    ${copy.lines.map((line, i) => text(68, 421 + i * 37, line, 27, colors.muted)).join('')}
    ${cardContent(kind, year)}
    <path d="M64 535H1136" stroke="${colors.line}" stroke-width="1.5"/>
    ${text(64, 580, copy.footer, 21, colors.muted)}
    ${text(1136, 581, 'nierobie.pl ↗', 24, colors.ink, 700, 'text-anchor="end"')}
  </svg>`;
}

function rasterize(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles, loadSystemFonts: false },
  }).render().asPng();
}

// ICO entries contain lossless PNG images, preserving the small-size antialiasing.
export function pngsToIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(image => image.png)]);
}

export async function generateIcons(directory) {
  const output = resolve(directory);
  const svg = await readFile(resolve(projectRoot, 'public/icons/icon.svg'), 'utf8');
  await mkdir(resolve(output, 'icons'), { recursive: true });
  await writeFile(resolve(output, 'icons/icon.svg'), svg);
  await writeFile(resolve(output, 'favicon.svg'), svg);
  const sizes = [[16, 'favicon-16'], [32, 'favicon-32'], [48, 'favicon-48'], [96, 'favicon-96'], [180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']];
  const images = [];
  for (const [size, name] of sizes) {
    const png = rasterize(svg, size);
    await writeFile(resolve(output, `icons/${name}.png`), png);
    if (size <= 48) images.push({ size, png });
  }
  const ico = pngsToIco(images);
  await writeFile(resolve(output, 'icons/favicon.ico'), ico);
  await writeFile(resolve(output, 'favicon.ico'), ico);
  if (output !== resolve(projectRoot, 'public')) {
    await copyFile(resolve(projectRoot, 'public/site.webmanifest'), resolve(output, 'site.webmanifest'));
  }
}

export async function generateShareAssets({ directory, minYear, maxYear }) {
  if (!Number.isInteger(minYear) || !Number.isInteger(maxYear) || minYear > maxYear) throw new Error('Invalid year range');
  await generateIcons(directory);
  const ogDirectory = resolve(directory, 'og/v2');
  await mkdir(ogDirectory, { recursive: true });
  const cards = [['home', undefined], ['planner', undefined], ['donor', undefined],
    ...Array.from({ length: maxYear - minYear + 1 }, (_, i) => ['year', minYear + i])];
  for (const [kind, year] of cards) {
    const svg = socialCardSvg(kind, year);
    const png = rasterize(svg, 1200);
    await writeFile(resolve(ogDirectory, `${year ?? kind}.png`), png);
    // Existing shared URLs still get an up-to-date default when crawled again.
    if (kind === 'home') {
      await writeFile(resolve(directory, 'og/default.png'), png);
      await writeFile(resolve(directory, 'og/default.svg'), svg);
    }
  }
  console.log(`Generated ${cards.length} social images (1200×630) and brand icons.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== '--icons-only') throw new Error('Usage: node scripts/share-assets.mjs --icons-only [directory]');
  await generateIcons(process.argv[3] || resolve(projectRoot, 'public'));
}
