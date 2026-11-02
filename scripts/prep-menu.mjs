// Frames every menu photo as the same 6:5 landscape and upscales it for sharp display.
//   node scripts/prep-menu.mjs        (needs ../assets and ../assets/stock, which are not in the repo)
import sharp from "sharp";

const A = "../assets/";
const S = "../assets/stock/";
const OUT = "public/img/menu/";
const W = 1800, H = 1500;

// box = [left, top, width, height] in source pixels, or fractions (<= 1) of the source
const JOBS = [
  { id: "signature-dry-fruit-ladoo", src: A + "WhatsApp Image 2026-11-02 at 11.22.29(1).jpeg", box: [0, 345, 960, 800], lift: true },
  { id: "royal-nut-sunnunda", src: A + "WhatsApp Image 2026-11-02 at 11.22.29(2).jpeg", box: [0, 340, 960, 800], lift: true },
  { id: "crunchy-peanut-laddu", src: S + "peanutladdu.jpg", box: [0.08, 0, 0.816, 0.715] },
  { id: "coconutty-ball", src: S + "coconut.jpg", box: [0.01, 0, 0.98, 1] },
  { id: "premium-peeled-peanut-chikki", src: S + "chikki.jpg", box: [0.1, 0.12, 0.79, 0.88] },
  { id: "peanut-sesame-fusion", src: S + "sesame.jpg", box: [0.02, 0, 0.9, 1] },
  { id: "dry-fruit-ariselu", src: A + "WhatsApp Image 2026-11-02 at 11.22.29.jpeg", box: [270, 230, 660, 550] },
  { id: "nuvvulu-coated-dry-fruit-ariselu", src: A + "WhatsApp Image 2026-11-02 at 11.22.29.jpeg", box: [0, 130, 560, 467] },
  { id: "maharaja-ariselu", src: S + "maharaja.jpg", box: [0, 0.03, 1, 0.96] },
];

for (const j of JOBS) {
  const meta = await sharp(j.src).metadata();
  const [l, t, w, h] = j.box.map((v, i) => (v <= 1 ? Math.round(v * (i % 2 ? meta.height : meta.width)) : v));
  let img = sharp(j.src).extract({ left: l, top: t, width: w, height: h });
  if (j.lift) img = img.linear(1.1, 2); // studio-grey backdrop to white
  await img
    .resize(W, H, { fit: "cover", kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.7, m2: 1.6 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(OUT + j.id + ".jpg");
  console.log(j.id, `${w}x${h} -> ${W}x${H}`);
}
