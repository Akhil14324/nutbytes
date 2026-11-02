// Builds the nut texture atlas used by the 3D hero.
//
//   node scripts/build-nuts.mjs
//
// Reads every  ../assets/nuts/<type>-sheet*.jpg  (photos of one kind of nut laid
// out on a flat magenta backdrop), cuts each nut out, and packs the cutouts into
// public/nuts/atlas.webp + public/nuts/manifest.json.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "../assets/nuts";
const OUT = "public/nuts";
const CELL = 256;
const PAD = 8; // transparent gutter inside each cell, stops mip-map bleeding
const MAX_PER_TYPE = 10;
const ATLAS_W = 4096;
const ATLAS_H = 2048;
const DEBUG = process.env.DEBUG_NUTS === "1";

/** Cut every nut out of one sheet. Returns [{ buf, w, h }] (RGBA buffers). */
async function cutSheet(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const N = W * H;
  const mag = new Int16Array(N); // how magenta each pixel is: min(r,b) - g
  const pink = new Uint8Array(N); // backdrop candidate (bright magenta, or its dark shadow)
  for (let i = 0; i < N; i++) {
    const mn = Math.min(data[i * 3], data[i * 3 + 2]), g = data[i * 3 + 1];
    mag[i] = mn - g;
    pink[i] = mag[i] > 35 || (mn > 34 && mn > 2.3 * g) ? 1 : 0;
  }

  // 1. flood the backdrop in from the border. The backdrop (and its shadows) is a
  //    smooth magenta gradient, so we only step to a neighbour that is both
  //    magenta and almost the same colour. Nut edges are sharp jumps and stop it.
  const isBg = new Uint8Array(N);
  const q = new Int32Array(N);
  let qh = 0, qt = 0;
  const seed = (p) => {
    if (!isBg[p] && pink[p]) { isBg[p] = 1; q[qt++] = p; }
  };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  const STEP = 16;
  const diff = (a, b) =>
    Math.max(
      Math.abs(data[a * 3] - data[b * 3]),
      Math.abs(data[a * 3 + 1] - data[b * 3 + 1]),
      Math.abs(data[a * 3 + 2] - data[b * 3 + 2])
    );
  while (qh < qt) {
    const p = q[qh++];
    const x = p % W, y = (p / W) | 0;
    const nb = [];
    if (x > 0) nb.push(p - 1);
    if (x < W - 1) nb.push(p + 1);
    if (y > 0) nb.push(p - W);
    if (y < H - 1) nb.push(p + W);
    for (const n of nb) {
      if (!isBg[n] && pink[n] && diff(p, n) < STEP) { isBg[n] = 1; q[qt++] = n; }
    }
  }

  // 2. alpha: everything the flood did not reach is a nut. Pixels hugging the
  //    backdrop get a soft edge based on how pink they still are.
  const alpha = new Float32Array(N);
  const rgba = Buffer.alloc(N * 4);
  const R = 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      let a = 0;
      if (!isBg[i]) {
        a = 1;
        let near = false;
        for (let dy = -R; dy <= R && !near; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= H) continue;
          for (let dx = -R; dx <= R; dx++) {
            const xx = x + dx;
            if (xx >= 0 && xx < W && isBg[yy * W + xx]) { near = true; break; }
          }
        }
        if (near) {
          a = Math.min(1, Math.max(0, (95 - mag[i]) / 75));
          const spill = Math.max(0, mag[i] + 10);
          r = Math.max(0, r - spill * 0.9);
          b = Math.max(0, b - spill * 0.9);
        }
      }
      alpha[i] = a;
      rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = Math.round(a * 255);
    }
  }
  const W_ = W; // keep names used below
  void W_;

  // label connected components of the solid mask
  const label = new Int32Array(W * H);
  const stack = new Int32Array(W * H);
  const boxes = [];
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
      if (x > 0 && alpha[p - 1] >= 0.5 && !label[p - 1]) { label[p - 1] = id; stack[sp++] = p - 1; }
      if (x < W - 1 && alpha[p + 1] >= 0.5 && !label[p + 1]) { label[p + 1] = id; stack[sp++] = p + 1; }
      if (y > 0 && alpha[p - W] >= 0.5 && !label[p - W]) { label[p - W] = id; stack[sp++] = p - W; }
      if (y < H - 1 && alpha[p + W] >= 0.5 && !label[p + W]) { label[p + W] = id; stack[sp++] = p + W; }
    }
    boxes.push({ id, area, x0, y0, x1, y1 });
  }

  // ignore specks (watermarks, stray pixels): keep blobs of a plausible size
  const maxArea = boxes.reduce((m, b) => Math.max(m, b.area), 0);
  const keep = boxes.filter((b) => b.area > maxArea * 0.22);

  const cuts = [];
  for (const b of keep) {
    const m = 6;
    const x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m);
    const x1 = Math.min(W - 1, b.x1 + m), y1 = Math.min(H - 1, b.y1 + m);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const out = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const si = (y0 + y) * W + (x0 + x);
        const di = (y * w + x) * 4;
        // keep only this nut and its soft edge, never a neighbour
        let mine = label[si] === b.id;
        if (!mine && alpha[si] > 0) {
          for (let dy = -2; dy <= 2 && !mine; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const xx = x0 + x + dx, yy = y0 + y + dy;
              if (xx >= 0 && yy >= 0 && xx < W && yy < H && label[yy * W + xx] === b.id) { mine = true; break; }
            }
        }
        out[di] = rgba[si * 4]; out[di + 1] = rgba[si * 4 + 1]; out[di + 2] = rgba[si * 4 + 2];
        out[di + 3] = mine ? rgba[si * 4 + 3] : 0;
      }
    }
    cuts.push({ buf: out, w, h, area: b.area });
  }
  return cuts;
}

// group sheets by type: <type>-sheet.jpg, <type>-sheet-2.jpg ...
const files = fs.readdirSync(SRC).filter((f) => /-sheet(-\d+)?\.(jpe?g|png)$/i.test(f)).sort();
const byType = {};
for (const f of files) (byType[f.split("-sheet")[0]] ||= []).push(path.join(SRC, f));

const sprites = []; // { type, buf, w, h }
for (const [type, list] of Object.entries(byType)) {
  let all = [];
  for (const f of list) {
    const cuts = await cutSheet(f);
    console.log(`  ${path.basename(f)}: ${cuts.length} nuts`);
    all = all.concat(cuts);
  }
  // spread the picks across all sheets
  const step = Math.max(1, all.length / MAX_PER_TYPE);
  const picked = [];
  for (let i = 0; i < Math.min(MAX_PER_TYPE, all.length); i++) picked.push(all[Math.floor(i * step)]);
  picked.forEach((c) => sprites.push({ type, ...c }));
  console.log(`${type}: using ${picked.length} of ${all.length}`);
}

const cols = Math.floor(ATLAS_W / CELL), rows = Math.floor(ATLAS_H / CELL);
if (sprites.length > cols * rows) throw new Error(`too many sprites (${sprites.length}) for the atlas`);

const composites = [];
const manifest = { atlas: "/nuts/atlas.webp", w: ATLAS_W, h: ATLAS_H, types: {} };
for (let i = 0; i < sprites.length; i++) {
  const s = sprites[i];
  const box = CELL - PAD * 2;
  const k = Math.min(1, box / Math.max(s.w, s.h));
  const w = Math.max(1, Math.round(s.w * k)), h = Math.max(1, Math.round(s.h * k));
  const png = await sharp(s.buf, { raw: { width: s.w, height: s.h, channels: 4 } })
    .resize(w, h, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  const cx = (i % cols) * CELL + Math.round((CELL - w) / 2);
  const cy = Math.floor(i / cols) * CELL + Math.round((CELL - h) / 2);
  composites.push({ input: png, left: cx, top: cy });
  (manifest.types[s.type] ||= []).push({
    u: cx / ATLAS_W,
    v: 1 - (cy + h) / ATLAS_H,
    uw: w / ATLAS_W,
    vh: h / ATLAS_H,
    aspect: h / w,
  });
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^cashew-\d+\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));
await sharp({ create: { width: ATLAS_W, height: ATLAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(composites)
  .webp({ quality: 90, alphaQuality: 100, effort: 5 })
  .toFile(path.join(OUT, "atlas.webp"));
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
console.log(`atlas: ${sprites.length} nuts, ${(fs.statSync(path.join(OUT, "atlas.webp")).size / 1024).toFixed(0)} KB`);

if (DEBUG) {
  // preview of the atlas on the page colour
  await sharp(path.join(OUT, "atlas.webp"))
    .flatten({ background: "#fbf7f0" })
    .resize(2048)
    .jpeg({ quality: 85 })
    .toFile(path.join(process.env.TEMP || ".", "atlas-preview.jpg"));
}
