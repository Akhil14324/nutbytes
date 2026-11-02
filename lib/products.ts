export type Product = {
  id: string;
  en: string;
  te: string;
  blurbEn: string;
  blurbTe: string;
  img: string;
  /** Background tint the menu section fades to while this item is showing. */
  tint: string;
};

export const WEIGHTS = ["250g", "500g", "1kg"] as const;
export type Weight = (typeof WEIGHTS)[number];

// NOTE: blurbs are first-draft copy for the client to review.
export const PRODUCTS: Product[] = [
  {
    id: "signature-dry-fruit-ladoo",
    en: "Our Signature Dry Fruit Ladoo",
    te: "సిగ్నేచర్ డ్రై ఫ్రూట్ లడ్డూ",
    blurbEn: "Almonds, pistachios, pumpkin seeds and figs, pressed into every bite.",
    blurbTe: "బాదం, పిస్తా, గుమ్మడి గింజలు, అంజీర్ — ప్రతి ముక్కలో.",
    img: "/img/laddu-1.jpg",
    tint: "#F7EBD3",
  },
  {
    id: "royal-nut-sunnunda",
    en: "Royal Nut Sunnunda",
    te: "రాయల్ నట్ సున్నుండ",
    blurbEn: "A rich, nutty sunnunda made the traditional way.",
    blurbTe: "సంప్రదాయ పద్ధతిలో చేసిన రిచ్ నట్ సున్నుండ.",
    img: "/img/laddu-2.jpg",
    tint: "#E8EDD6",
  },
  {
    id: "crunchy-peanut-laddu",
    en: "Crunchy Peanut Laddu",
    te: "క్రంచీ పల్లీ లడ్డు",
    blurbEn: "Crunchy peanuts and dry fruit in a round, bite-sized laddu.",
    blurbTe: "కరకరలాడే పల్లీలు, డ్రై ఫ్రూట్స్‌తో గుండ్రని లడ్డు.",
    img: "/img/peanut-laddu.jpg",
    tint: "#F4E6CC",
  },
  {
    id: "coconutty-ball",
    en: "Coconutty Ball",
    te: "కొబ్బరి బాల్",
    blurbEn: "A soft, sweet ball rolled in fresh coconut.",
    blurbTe: "కొబ్బరిలో చుట్టిన మృదువైన, తీయని బాల్.",
    img: "/img/coconut.jpg",
    tint: "#F6E4E0",
  },
  {
    id: "premium-peeled-peanut-chikki",
    en: "Premium Peeled Peanut Chikki",
    te: "ప్రీమియం పీల్డ్ పల్లీ చిక్కీ",
    blurbEn: "Peeled peanuts set into a crisp, golden chikki.",
    blurbTe: "తొక్క తీసిన పల్లీలతో కరకరలాడే బంగారు చిక్కీ.",
    img: "/img/chikki.jpg",
    tint: "#F3E3C4",
  },
  {
    id: "peanut-sesame-fusion",
    en: "Peanut Sesame Fusion",
    te: "పల్లీ నువ్వుల ఫ్యూజన్",
    blurbEn: "Peanuts and sesame together in one crunchy bite.",
    blurbTe: "పల్లీలు, నువ్వులు కలిసిన కరకరలాడే రుచి.",
    img: "/img/sesame-fusion.jpg",
    tint: "#EFE4D2",
  },
  {
    id: "dry-fruit-ariselu",
    en: "Dry Fruit Ariselu",
    te: "డ్రై ఫ్రూట్ అరిసెలు",
    blurbEn: "Traditional Andhra ariselu, made with dry fruit.",
    blurbTe: "డ్రై ఫ్రూట్స్‌తో చేసిన సంప్రదాయ ఆంధ్ర అరిసెలు.",
    img: "/img/ariselu-plain.jpg",
    tint: "#F3DDCB",
  },
  {
    id: "nuvvulu-coated-dry-fruit-ariselu",
    en: "Nuvvulu Coated Dry Fruit Ariselu",
    te: "నువ్వుల పూత డ్రై ఫ్రూట్ అరిసెలు",
    blurbEn: "Dry fruit ariselu with a crisp coat of sesame.",
    blurbTe: "నువ్వుల పూతతో డ్రై ఫ్రూట్ అరిసెలు.",
    img: "/img/ariselu-sesame.jpg",
    tint: "#F5E5C6",
  },
  {
    id: "maharaja-ariselu",
    en: "Maharaja Ariselu",
    te: "మహారాజా అరిసెలు",
    blurbEn: "Our grand ariselu, packed with seeds and nuts.",
    blurbTe: "గింజలు, నట్స్‌తో నిండిన మా ప్రత్యేక అరిసెలు.",
    img: "/img/maharaja.jpg",
    tint: "#F8E7B8",
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
