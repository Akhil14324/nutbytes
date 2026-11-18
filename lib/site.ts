export const SITE = {
  name: "NutBytes",
  wa: "919000242480",
  waDisplay: "90002 42480",
  phone2: "919948120300",
  phone2Display: "99481 20300",
  instagram: "https://www.instagram.com/nutbytes/",
  instagramDm: "https://ig.me/m/nutbytes",
  handle: "@nutbytes",
  fssai: "20126171000742",
  place: "Ongole, Andhra Pradesh",
};

/**
 * True on laptops and desktops, false on phones and tablets.
 * Only call this in the browser (event handlers, effects).
 */
export function isDesktop() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|Silk/i.test(ua)) return false;
  // iPadOS reports itself as a Mac, but has a touch screen
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return false;
  return true;
}

/**
 * A WhatsApp chat link with the message already typed in.
 *   desktop: the official WhatsApp Web site (web.whatsapp.com). The customer scans
 *            WhatsApp's own QR code with their phone if they are not logged in yet,
 *            and nothing needs to be installed on the computer.
 *   phone:   wa.me, which opens the WhatsApp app the customer already has.
 */
export const waLink = (text: string, opts: { phone?: string; desktop?: boolean } = {}) => {
  const phone = opts.phone ?? SITE.wa;
  const msg = encodeURIComponent(text);
  return opts.desktop
    ? `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`
    : `https://wa.me/${phone}?text=${msg}`;
};
