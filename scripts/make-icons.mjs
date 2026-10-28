// Genera los íconos PNG de la PWA (placeholder pixel art de un yunque) sin dependencias.
// Uso: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// Grilla 16×16: . fondo, o brasa, a yunque, h martillo (mango), m martillo (cabeza), s chispa
const ART = [
  '................',
  '..........mmm...',
  '.....s....mmm...',
  '...s.......h....',
  '......s...h.....',
  '.........h......',
  '..aaaaaaaaaaaa..',
  '.aaaaaaaaaaaaaa.',
  '...aaaaaaaaaa...',
  '.....aaaaaa.....',
  '......aaaa......',
  '......aaaa......',
  '....aaaaaaaa....',
  '...aaaaaaaaaa...',
  '..oooooooooooo..',
  '................',
];
const COLORS = {
  '.': [27, 20, 32], o: [255, 122, 45], a: [92, 98, 110], h: [139, 90, 43], m: [195, 204, 214], s: [255, 208, 77],
};

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size) {
  const scale = size / 16;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const ch = ART[Math.floor(y / scale)][Math.floor(x / scale)];
      const [r, g, b] = COLORS[ch];
      const i = y * (size * 3 + 1) + 1 + x * 3;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
for (const size of [192, 512]) writeFileSync(`public/icons/icon-${size}.png`, png(size));

const rects = ART.flatMap((row, y) => [...row].map((ch, x) => (ch === '.' ? '' : `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${COLORS[ch].join(',')})"/>`))).join('');
writeFileSync('public/icons/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="rgb(27,20,32)"/>${rects}</svg>\n`);
console.log('Íconos generados en public/icons');
