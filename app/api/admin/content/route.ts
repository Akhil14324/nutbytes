import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { commit, listDir, LOCAL, readFile } from "@/lib/admin/store";
import {
  cleanDeletes,
  cleanOffers,
  cleanProducts,
  cleanUploads,
  Invalid,
} from "@/lib/admin/validate";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Please log in again." }, { status: 401 });

const IMG = /\.(jpg|jpeg|png|webp)$/i;

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    const [products, offers, menu, uploads] = await Promise.all([
      readFile("data/products.json"),
      readFile("data/offers.json"),
      listDir("public/img/menu"),
      listDir("public/img/uploads"),
    ]);
    return NextResponse.json({
      products: JSON.parse(products ?? "[]"),
      offers: JSON.parse(offers ?? "[]"),
      photos: [...menu, ...uploads].filter((p) => IMG.test(p)).map((p) => p.replace(/^public/, "")),
      mode: LOCAL ? "local" : "github",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load the content." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const products = cleanProducts(body.products);
    const offers = cleanOffers(body.offers);
    const uploads = cleanUploads(body.uploads);
    const deletes = cleanDeletes(body.deletes);

    // never delete a photo the menu still uses
    const used = new Set(products.map((p) => `public${p.img}`));
    const del = deletes.filter((d) => !used.has(d));

    // new photos always go into the library, even if no item uses them yet
    const put: Record<string, string> = {
      "data/products.json": Buffer.from(JSON.stringify(products, null, 2) + "\n").toString("base64"),
      "data/offers.json": Buffer.from(JSON.stringify(offers, null, 2) + "\n").toString("base64"),
    };
    for (const u of uploads) put[u.path] = u.data;

    await commit({ put, del, message: "Update menu and offers from admin panel" });
    return NextResponse.json({ ok: true, mode: LOCAL ? "local" : "github" });
  } catch (e) {
    if (e instanceof Invalid) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Saving failed. Nothing was changed." }, { status: 500 });
  }
}
