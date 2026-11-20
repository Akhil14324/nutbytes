import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "nb_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

const secret = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SESSION_SECRET is not set (16+ characters).");
  return s;
};

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function passwordOk(input: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) throw new Error("ADMIN_PASSWORD is not set.");
  // compare HMACs so length differences do not leak
  const k = "pw-compare";
  const a = createHmac("sha256", k).update(input).digest("base64url");
  const b = createHmac("sha256", k).update(real).digest("base64url");
  return same(a, b);
}

export function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function tokenOk(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !same(sig, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}

export async function isAdmin() {
  try {
    return tokenOk((await cookies()).get(COOKIE)?.value);
  } catch {
    return false;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
