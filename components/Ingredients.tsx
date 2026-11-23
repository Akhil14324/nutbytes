"use client";

import Image from "next/image";

const INGREDIENTS = [
  ["Almonds", "/img/bite-nut.webp"],
  ["Cashews", "/img/hero-dry-fruits.png"],
  ["Pistachios", "/img/bite-seed.webp"],
  ["Golden raisins", "/img/bite-coconut.webp"],
  ["Pure ghee", "/img/products/ghee-ariselu.webp"],
  ["Sesame", "/img/bite-seed.webp"],
];

export default function Ingredients() {
  return <section className="ingredients" aria-labelledby="ingredients-title">
    <div className="ingredients-heading"><p className="ingredient-kicker">Good things go in</p><h2 id="ingredients-title" className="section-title">Real ingredients. Nothing to hide.</h2><p>Dry fruits, crunchy nuts, seeds and pure ghee, chosen for every batch.</p></div>
    <div className="ingredient-orbit" aria-label="Our ingredients">
      <div className="orbit-ring" />
      {INGREDIENTS.map(([name, image], index) => <div className="ingredient-item" key={name} style={{ "--i": index } as React.CSSProperties}><div className="ingredient-photo"><Image src={image} alt="" fill sizes="120px" /></div><span>{name}</span></div>)}
      <div className="orbit-center">Simple<br />ingredients</div>
    </div>
  </section>;
}
