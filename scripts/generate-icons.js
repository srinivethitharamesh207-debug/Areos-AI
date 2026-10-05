import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    rawData[rowStart] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelStart = rowStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32
    let c = ~0;
    for (let i = 4; i < 8 + len; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    c = ~c;
    buf.writeInt32BE(c, 8 + len);
    return buf;
  }

  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = createChunk('IDAT', deflated);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

function iconDraw(x, y, w, h) {
  // Center: (w/2, h/2)
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w * 0.45);
  const dy = (y - cy) / (h * 0.45);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background obsidian
  if (dist > 1.0) {
    return [8, 11, 16, 255]; // #080B10
  }

  // Astroid / 4-point star for sparkle
  const ax = Math.abs(x - cx) / (w * 0.35);
  const ay = Math.abs(y - cy) / (h * 0.35);
  const star = Math.sqrt(ax) + Math.sqrt(ay);

  if (star <= 1.0) {
    // Gradient: Cyan (#22D3EE) to Purple (#A78BFA)
    const factor = (x + y) / (w + h);
    const r = Math.round(34 * (1 - factor) + 167 * factor);
    const g = Math.round(211 * (1 - factor) + 139 * factor);
    const b = Math.round(238 * (1 - factor) + 250 * factor);
    return [r, g, b, 255];
  }

  // Border glow
  if (dist > 0.88 && dist <= 0.98) {
    return [34, 211, 238, 200];
  }

  return [17, 22, 29, 255]; // card bg #11161D
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192, iconDraw));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512, iconDraw));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), createPNG(512, 512, iconDraw));
console.log('Icons generated successfully in public/icons/');
