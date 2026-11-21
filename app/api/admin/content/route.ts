import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { commit, listDir, LOCAL, readFile } from "@/lib/admin/store";
import {
  cleanCollections,
  cleanContent,
  cleanDeletes,
  cleanOffers,
  cleanProducts,
  cleanSite,
  cleanUploads,
  cleanWeights,
  IMG_OK,
  Invalid,
} from "@/lib/admin/validate";
import { CATALOG_FILE, parseCatalog, serializeCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Please log in again." }, { status: 401 });

// logos, icons and the responsive copies of the banner are part of the design, not content photos
const HIDDEN = /^img\/(logo|favicon|apple-touch|og\.|hero-banner-)/;

/** Every photo the admin can pick: uploads first, then product photos, then site photos. */
async function listPhotos() {
  const [uploads, products, root] = await Promise.all([
    listDir("public/img/uploads"),
    listDir("public/img/products"),
    listDir("public/img"),
  ]);
  return [...uploads, ...products, ...root]
    .map((p) => p.replace(/^public\//, ""))
    .filter((p) => IMG_OK.test(p) && !HIDDEN.test(p));
}

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    const [file, photos] = await Promise.all([readFile(CATALOG_FILE), listPhotos()]);
    return NextResponse.json({ ...parseCatalog(file), photos, mode: LOCAL ? "local" : "github" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load the content." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const uploads = cleanUploads(body.uploads);
    const deletes = cleanDeletes(body.deletes);

    // photos that will exist after this save: the library, plus new uploads, minus deletions
    const library = new Set(await listPhotos());
    for (const u of uploads) library.add(u.path.replace(/^public\//, ""));
    for (const d of deletes) library.delete(d.replace(/^public\//, ""));

    const collections = cleanCollections(body.collections, library);
    const catalog = {
      products: cleanProducts(body.products, collections, library),
      offers: cleanOffers(body.offers),
      site: cleanSite(body.site),
      collections,
      weights: cleanWeights(body.weights),
      content: cleanContent(body.content, library),
    };

    const put: Record<string, string> = {
      [CATALOG_FILE]: Buffer.from(serializeCatalog(catalog)).toString("base64"),
    };
    // new photos always go into the library, even if nothing uses them yet
    for (const u of uploads) put[u.path] = u.data;

    await commit({ put, del: deletes, message: "Update the website from the admin panel" });
    return NextResponse.json({ ok: true, mode: LOCAL ? "local" : "github" });
  } catch (e) {
    if (e instanceof Invalid) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Saving failed. Nothing was changed." }, { status: 500 });
  }
}
