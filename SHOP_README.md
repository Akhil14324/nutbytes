# NutBytes shop (HTML, CSS and JavaScript)

A static storefront for NutBytes – Healthy Snacking. No build step and no framework.

## Open it

Double-click `index.html`, or serve the folder with any static server, for example from the project root:

```
npx serve shop
```

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home: hero, benefits, collections, about, footer |
| `products.html` | All snacks, with collection filters, search (`?q=`) and sorting |
| `product.html?id=…` | Product details, pack size, quantity, add to cart, WhatsApp order |
| `cart.html` | Change pack size and quantity, remove items, automatic totals |
| `checkout.html` | Customer details, delivery address, payment choice, validation |
| `order-confirmation.html?id=…` | Order summary and "Send Order on WhatsApp" |
| `login.html` | Log in / register, and the customer's orders |
| `about.html` | Our story |
| `help.html` | FAQs, order & delivery, returns & refunds, track an order |

## Edit content

- **Prices, products, collections and contact details:** `js/data.js`. The prices there are **samples** and must be replaced before launch. The email address comes from the design mock-up and needs confirming.
- **Colours, fonts and spacing:** the variables at the top of `css/styles.css`.
- **Header and footer:** `js/layout.js` (shared by every page).

## Before going live

There is no server yet, so:

- The cart, accounts and orders are saved in the customer's own browser (localStorage). Passwords are stored only as SHA-256 hashes, but this is not real account security. Connect a backend before relying on accounts.
- An order reaches NutBytes only when the customer taps **Send Order on WhatsApp** on the confirmation page. The message is typed in for them (WhatsApp Web on computers, the WhatsApp app on phones).
- No online payment is taken; customers choose cash on delivery or UPI on confirmation.

## Images

`img/` holds WebP images. The hero gift box, snack bites, nuts, flowers and packaging were cut out of the design mock-up; `img/products/` are the menu photos from the main site, resized. Replace them with NutBytes' own photography for the best quality.
