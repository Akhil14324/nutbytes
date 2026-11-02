import sharp from "sharp";
const [src, out, stepArg] = process.argv.slice(2);
const STEP = Number(stepArg || 5);
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;
const bright = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i*3], g = data[i*3+1], b = data[i*3+2];
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
  bright[i] = (mx > 205 && mx - mn < 22) ? 1 : 0; // near-white / light neutral
}
const isBg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
const seed = p => { if (!isBg[p] && bright[p]) { isBg[p] = 1; q[qt++] = p; } };
for (let x = 0; x < W; x++) { seed(x); seed((H-1)*W + x); }
for (let y = 0; y < H; y++) { seed(y*W); seed(y*W + W-1); }
const d = (a,b) => Math.max(Math.abs(data[a*3]-data[b*3]), Math.abs(data[a*3+1]-data[b*3+1]), Math.abs(data[a*3+2]-data[b*3+2]));
while (qh < qt) {
  const p = q[qh++]; const x = p % W, y = (p / W) | 0;
  const nb = []; if (x>0) nb.push(p-1); if (x<W-1) nb.push(p+1); if (y>0) nb.push(p-W); if (y<H-1) nb.push(p+W);
  for (const n of nb) if (!isBg[n] && bright[n] && d(p,n) < STEP) { isBg[n] = 1; q[qt++] = n; }
}
// keep only the biggest connected object (the bowl and what is in it); drop haze and shadows
const lab = new Int32Array(N); const st = new Int32Array(N); let best = 0, bestArea = 0, id = 0;
for (let s0 = 0; s0 < N; s0++) {
  if (isBg[s0] || lab[s0]) continue;
  id++; let sp = 0, area = 0; st[sp++] = s0; lab[s0] = id;
  while (sp) {
    const p = st[--sp]; area++; const x = p % W, y = (p / W) | 0;
    if (x>0 && !isBg[p-1] && !lab[p-1]) { lab[p-1]=id; st[sp++]=p-1; }
    if (x<W-1 && !isBg[p+1] && !lab[p+1]) { lab[p+1]=id; st[sp++]=p+1; }
    if (y>0 && !isBg[p-W] && !lab[p-W]) { lab[p-W]=id; st[sp++]=p-W; }
    if (y<H-1 && !isBg[p+W] && !lab[p+W]) { lab[p+W]=id; st[sp++]=p+W; }
  }
  if (area > bestArea) { bestArea = area; best = id; }
}
const rgba = Buffer.alloc(N*4);
for (let i = 0; i < N; i++) { rgba[i*4]=data[i*3]; rgba[i*4+1]=data[i*3+1]; rgba[i*4+2]=data[i*3+2]; rgba[i*4+3]= lab[i] === best ? 255 : 0; }
// soften the edge a touch, then trim to the object
const base = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
const alpha = await base.clone().extractChannel(3).blur(1.1).raw().toBuffer();
for (let i = 0; i < N; i++) rgba[i*4+3] = Math.min(255, Math.max(0, (alpha[i] - 40) * 1.4));
const png = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
await sharp(png).toFile(out);
const meta = await sharp(png).metadata();
console.log("cut size", meta.width + "x" + meta.height);
await sharp({ create: { width: meta.width, height: meta.height, channels: 3, background: "#fbf7f0" } }).composite([{ input: png }]).jpeg({quality:85}).toFile(out.replace(".png","-preview.jpg"));
console.log("bg fraction", (qt/N).toFixed(3));
