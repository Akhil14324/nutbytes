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
import { CATALOG_FILE, parseCatalog, serializeCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Please log in again." }, { status: 401 });

const IMG = /\.(jpg|jpeg|png|webp)$/i;

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    const [file, shop, uploads] = await Promise.all([
      readFile(CATALOG_FILE),
      listDir("public/img/products"),
      listDir("public/img/uploads"),
    ]);
    const { products, offers } = parseCatalog(file);
    return NextResponse.json({
      products,
      offers,
      // site-relative paths like img/products/x.webp
      photos: [...shop, ...uploads].filter((p) => IMG.test(p)).map((p) => p.replace(/^public\//, "")),
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

    // never delete a photo the shop still uses
    const used = new Set(products.map((p) => `public/${p.img}`));
    const del = deletes.filter((d) => !used.has(d));

    // new photos always go into the library, even if no product uses them yet
    const put: Record<string, string> = {
      [CATALOG_FILE]: Buffer.from(serializeCatalog({ products, offers })).toString("base64"),
    };
    for (const u of uploads) put[u.path] = u.data;

    await commit({ put, del, message: "Update shop products and offers from admin panel" });
    return NextResponse.json({ ok: true, mode: LOCAL ? "local" : "github" });
  } catch (e) {
    if (e instanceof Invalid) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Saving failed. Nothing was changed." }, { status: 500 });
  }
}
