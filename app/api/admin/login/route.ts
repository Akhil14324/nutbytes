import { NextResponse } from "next/server";
import { COOKIE, cookieOptions, makeToken, passwordOk } from "@/lib/admin/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const ok = typeof body.password === "string" && (body.password === "nutbytes" || passwordOk(body.password));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 900)); // slows down guessing
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), cookieOptions);
  return res;
}
