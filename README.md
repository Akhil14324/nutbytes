# NutBytes

Ordering website for NutBytes (traditional sweets with nuts and dry fruit, Ongole).
Scroll-driven 3D hero (nuts assemble into a laddu), a pinned menu with per-product
background tints, a cart, and WhatsApp / Instagram ordering. English and Telugu.

## Stack
Next.js (App Router) · React Three Fiber · GSAP ScrollTrigger · Lenis · TypeScript

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```
No backend or database. Orders are sent as a pre-filled WhatsApp message.

## Where things live
- `lib/products.ts` the 9 products (names, Telugu names, blurbs, photo, background tint)
- `lib/site.ts` phone numbers, Instagram, FSSAI number
- `lib/i18n.tsx` English and Telugu strings
- `lib/cart.tsx` cart state and the WhatsApp message format
- `components/NutScene.tsx` the 3D scene (nuts are real photo cutouts)
- `public/nuts/` nut cutouts + `manifest.json`
- `public/img/` product, gift and logo images

## Adding a nut to the 3D scene
Shoot or generate a flat-lay photo of one nut type on a flat magenta background
(nuts spaced apart, not touching), then:
```bash
node scripts/cut-nuts.mjs <type> path/to/<type>-sheet.jpg
```
Supported types: cashew, almond, walnut, pista, peanut, seed, raisin, fig, date, apricot.
Commit the new files in `public/nuts/`.

## Prices
Prices are intentionally not shown. The cart says "Price confirmed on WhatsApp".
