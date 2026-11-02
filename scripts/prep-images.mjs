// Crops and cleans the client's source photos into web-ready images.
import sharp from "sharp";

const A = "../assets/";
const O = "public/img/";
const F = {
  p1: A + "WhatsApp Image 2026-11-02 at 11.22.29(1).jpeg", // laddu bowl A
  p2: A + "WhatsApp Image 2026-11-02 at 11.22.29(2).jpeg", // laddu bowl B
  ari: A + "WhatsApp Image 2026-11-02 at 11.22.29.jpeg", // ariselu plates
  box1: A + "WhatsApp Image 2026-11-02 at 11.22.30.jpeg", // yellow gift box
  box2: A + "WhatsApp Image 2026-11-02 at 11.22.31.jpeg", // white gift box
  menu: A + "WhatsApp Image 2026-11-02 at 11.30.31.jpeg", // festive poster
  logo: A + "logo.jpeg",
};

const jpg = (name, src, region, size, extra = (s) => s) =>
  extra(
    sharp(src)
      .extract(region)
      .resize(size, size, { fit: "cover" })
  )
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(O + name);

// Lift the grey studio backdrop to pure white so it melts into the ivory page.
const lift = (s) => s.linear(1.16, 2);

await Promise.all([
  jpg("laddu-1.jpg", F.p1, { left: 40, top: 320, width: 880, height: 880 }, 900, lift),
  jpg("laddu-2.jpg", F.p2, { left: 30, top: 300, width: 900, height: 900 }, 900, lift),
  jpg("ariselu-plain.jpg", F.ari, { left: 300, top: 200, width: 560, height: 560 }, 900),
  jpg("ariselu-sesame.jpg", F.ari, { left: 0, top: 110, width: 520, height: 520 }, 900),
  jpg("chikki.jpg", F.menu, { left: 40, top: 483, width: 208, height: 208 }, 700),
  jpg("sesame-fusion.jpg", F.menu, { left: 520, top: 640, width: 310, height: 190 }, 700, (s) => s),
  jpg("maharaja.jpg", F.menu, { left: 0, top: 800, width: 385, height: 170 }, 700),
  jpg("coconut.jpg", F.box2, { left: 396, top: 486, width: 170, height: 170 }, 700),
  jpg("peanut-laddu.jpg", F.box2, { left: 383, top: 672, width: 160, height: 160 }, 700),
]);

// Gift boxes: keep full frame, web size.
await sharp(F.box1).resize(1200).jpeg({ quality: 86, mozjpeg: true }).toFile(O + "gift-yellow.jpg");
await sharp(F.box2).resize(1200).jpeg({ quality: 86, mozjpeg: true }).toFile(O + "gift-white.jpg");
await sharp(F.p1).extract({ left: 40, top: 320, width: 880, height: 880 }).resize(1000).linear(1.16, 2).jpeg({ quality: 88, mozjpeg: true }).toFile(O + "hero-laddu.jpg");

// Logos: cut circles out of the watercolour backdrop.
async function circle(src, region, size, r, out) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#fff"/></svg>`
  );
  await sharp(src)
    .extract(region)
    .resize(size, size)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}
// wreath (outer ring of nuts)
await circle(F.logo, { left: 245, top: 25, width: 560, height: 560 }, 800, 392, O + "logo-wreath.png");
// inner badge (navy ring + wordmark)
await circle(F.logo, { left: 348, top: 128, width: 354, height: 354 }, 600, 296, O + "logo-badge.png");
console.log("done");
