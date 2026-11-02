// Cuts individual nuts out of a photo sheet shot on flat magenta.
//   node scripts/cut-nuts.mjs <type> <path-to-sheet>
// Writes public/nuts/<type>-<n>.png and updates public/nuts/manifest.json
import sharp from "sharp";
import fs from "node:fs";

const [type, src] = process.argv.slice(2);
if (!type || !src) throw new Error("usage: cut-nuts.mjs <type> <sheet>");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = 4;
const alpha = new Float32Array(W * H);

for (let i = 0; i < W * H; i++) {
  const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2];
  const m = Math.min(r, b) - g; // how magenta the pixel is
  // nut pixels have m < 0; backdrop and its shadow have m > 100
  const a = Math.min(1, Math.max(0, (30 - m) / 38));
  alpha[i] = a;
  const spill = m + 25;
  if (spill > 0) {
    // despill the magenta fringe on edge pixels
    data[i * C] = Math.max(0, r - spill * 0.95);
    data[i * C + 2] = Math.max(0, b - spill * 0.95);
  }
}

// label connected components of the solid mask
const label = new Int32Array(W * H);
const boxes = [];
const stack = new Int32Array(W * H);
for (let s = 0; s < W * H; s++) {
  if (alpha[s] < 0.5 || label[s]) continue;
  const id = boxes.length + 1;
  let sp = 0, area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
  stack[sp++] = s; label[s] = id;
  while (sp) {
    const p = stack[--sp];
    const x = p % W, y = (p / W) | 0;
    area++;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    for (const q of [p - 1, p + 1, p - W, p + W]) {
      if (q < 0 || q >= W * H) continue;
      if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue;
      if (alpha[q] >= 0.5 && !label[q]) { label[q] = id; stack[sp++] = q; }
    }
  }
  boxes.push({ id, area, x0, y0, x1, y1 });
}

const keep = boxes.filter((b) => b.area > 2500);
const dir = "public/nuts/";
fs.mkdirSync(dir, { recursive: true });
const manifestPath = dir + "manifest.json";
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
manifest[type] = [];

let n = 0;
for (const b of keep) {
  const pad = 6;
  const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad);
  const x1 = Math.min(W - 1, b.x1 + pad), y1 = Math.min(H - 1, b.y1 + pad);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y0 + y) * W + (x0 + x);
      const di = (y * w + x) * 4;
      // keep only this nut (and its soft edge); drop neighbours and shadows
      const near = alpha[si] > 0 && (label[si] === b.id || isNear(si, b.id));
      out[di] = data[si * C]; out[di + 1] = data[si * C + 1]; out[di + 2] = data[si * C + 2];
      out[di + 3] = near ? Math.round(alpha[si] * 255) : 0;
    }
  }
  const name = `${type}-${n}.png`;
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(dir + name);
  manifest[type].push({ file: "/nuts/" + name, w, h });
  n++;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`${type}: cut ${n} nuts`);

function isNear(si, id) {
  // soft-edge pixel belongs to this nut if a solid pixel of it is within 2px
  const x = si % W, y = (si / W) | 0;
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      if (label[yy * W + xx] === id) return true;
    }
  return false;
}
