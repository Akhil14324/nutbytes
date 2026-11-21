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
No database. Orders are sent as a pre-filled WhatsApp message. Menu, offers and photos are edited at `/admin`, which saves to this GitHub repo (see Admin panel).

## Where things live
- `data/products.json` the menu (edited from `/admin`); `lib/products.ts` reads it
- `data/offers.json` offers shown in the banner (edited from `/admin`)
- `public/img/uploads/` photos uploaded from `/admin`
- `lib/site.ts` phone numbers, Instagram, FSSAI number
- `lib/i18n.tsx` English and Telugu strings
- `lib/cart.tsx` cart state and the WhatsApp message format
- `components/NutScene.tsx` the 3D scene (nuts are real photo cutouts)
- `public/nuts/` nut cutouts + `manifest.json`
- `public/img/` product, gift and logo images

## The nuts in the 3D scene
The nuts are real photos, cut out and packed into one texture (`public/nuts/atlas.webp`).
To add or change a nut, put a flat-lay photo on a flat magenta backdrop (nuts spaced
apart, not touching) in `assets/nuts/<type>-sheet.jpg` (a second sheet: `<type>-sheet-2.jpg`), then:
```bash
node scripts/build-nuts.mjs
```
Current types: cashew, almond, walnut, pista, peanut, seed, raisin, prune, fig, date, apricot.
A new type also needs a line in `TYPES` in `components/NutScene.tsx`.
The `assets/` folder is not in this repo; commit only the regenerated files in `public/nuts/`.

## Prices
Prices are intentionally not shown. The cart says "Price confirmed on WhatsApp".

## Admin panel (/admin)
The client logs in at `/admin` to manage the whole shop:
- **Products:** add, edit, reorder, remove, hide, or mark as sold out (shown with a label, can't be added to the cart)
- **Offers:** a banner line with an optional last day, and optionally a % discount for the whole shop, one
  collection or one product. The shop shows the old price crossed out; the cart, checkout and WhatsApp order use
  the offer price. Where two discounts overlap, the bigger one wins.
- **Collections, pack sizes, business details** (WhatsApp number, phone, email, delivery area, FSSAI)
- **Page text:** home page, About page and footer wording; the banner and About photos
- **FAQs** on the Customer Care page (`{deliveryArea}`, `{fssai}`, `{phoneDisplay}`, `{email}` fill in the current details)
- **Photos:** upload or delete (photos in use can't be deleted)

Everything is saved in `public/data/catalog.js`. **Publish changes** makes ONE commit to
this repo; Vercel redeploys and the site updates in about a minute. Every change is a Git commit,
so it can be undone from GitHub.

Set these in Vercel (Project > Settings > Environment Variables), then redeploy:
| Variable | What |
|---|---|
| `ADMIN_PASSWORD` | the password the client types |
| `ADMIN_SESSION_SECRET` | any random string, 32+ characters |
| `GITHUB_TOKEN` | fine-grained token, this repo only, permission **Contents: Read and write** |
| `GITHUB_REPO` | optional, default `Akhil14324/nutbytes` |
| `GITHUB_BRANCH` | optional, default `main` |

Without `GITHUB_TOKEN` (local dev) the panel saves to the project files instead, shown as "Local test mode".
Photos are shrunk to 1400px JPEG in the browser before upload. Tokens expire: renew it if saving starts failing.
