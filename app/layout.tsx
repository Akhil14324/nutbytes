import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Noto_Sans_Telugu, Noto_Serif_Telugu } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const teSans = Noto_Sans_Telugu({
  variable: "--font-te-sans",
  subsets: ["telugu"],
  display: "swap",
});

const teSerif = Noto_Serif_Telugu({
  variable: "--font-te-serif",
  subsets: ["telugu"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nutbytes.in"),
  title: "NutBytes | Traditional sweets with nuts and dry fruit, Ongole",
  description:
    "Healthy snacking from Ongole. Laddus, chikki and ariselu with nuts and dry fruit in every bite. No processed sugar, no maida. Order on WhatsApp.",
  openGraph: {
    title: "NutBytes | Healthy snacking",
    description: "Traditional sweets with nuts and dry fruit in every bite. Order on WhatsApp.",
    url: "https://nutbytes.in",
    siteName: "NutBytes",
    images: ["/img/hero-laddu.jpg"],
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${teSans.variable} ${teSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
