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

export const waLink = (text: string) =>
  `https://wa.me/${SITE.wa}?text=${encodeURIComponent(text)}`;
