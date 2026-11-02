import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Photo credits | NutBytes",
  description: "Credits and licences for the photographs used on the NutBytes website.",
};

const BY_SA_4 = { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" };
const BY_SA_3 = { name: "CC BY-SA 3.0", url: "https://creativecommons.org/licenses/by-sa/3.0/" };

const PHOTOS = [
  {
    item: "Premium Peeled Peanut Chikki",
    title: "Peanut Chikki",
    author: "Zeel Patel",
    page: "https://commons.wikimedia.org/wiki/File:Peanut_Chikki.JPG",
    license: BY_SA_4,
  },
  {
    item: "Peanut Sesame Fusion",
    title: "Peanut chikki, a popular foodstuff of jaggery and peanut",
    author: "Sarangbombatkar",
    page: "https://commons.wikimedia.org/wiki/File:Peanut_chikki,_a_popular_foodstuff_of_jaggery_and_peanut_is_available_commercially_all_over_India.jpg",
    license: BY_SA_4,
  },
  {
    item: "Crunchy Peanut Laddu",
    title: "Groundnut ladoo",
    author: "MariappanSanthy",
    page: "https://commons.wikimedia.org/wiki/File:Groundnut_ladoo.JPG",
    license: BY_SA_4,
  },
  {
    item: "Coconutty Ball",
    title: "Coconut ladoo, Assam",
    author: "Baby Devi 26",
    page: "https://commons.wikimedia.org/wiki/File:Coconut_ladoo,_Assam.jpg",
    license: BY_SA_4,
  },
  {
    item: "Maharaja Ariselu",
    title: "Ariselu",
    author: "T.sujatha",
    page: "https://commons.wikimedia.org/wiki/File:Ariselu.jpg",
    license: BY_SA_3,
  },
];

export default function Credits() {
  return (
    <main className="credits">
      <p>
        <Link href="/">&larr; Back to NutBytes</Link>
      </p>
      <h1>Photo credits</h1>
      <p>
        The photographs of our laddus, ariselu, gift boxes and logo are NutBytes&apos; own. The photos below are
        illustrative images from Wikimedia Commons, shared under Creative Commons licences. They were cropped and
        resized for this website.
      </p>
      <ul>
        {PHOTOS.map((p) => (
          <li key={p.item}>
            <b>{p.item}</b>
            <a href={p.page} target="_blank" rel="noopener noreferrer">
              {p.title}
            </a>{" "}
            by {p.author}, licensed under{" "}
            <a href={p.license.url} target="_blank" rel="noopener noreferrer">
              {p.license.name}
            </a>
            .
          </li>
        ))}
      </ul>
    </main>
  );
}
