import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Where the content lives.
 *  - Production: the GitHub repo. One commit per publish; Vercel redeploys from it.
 *  - Local dev without GITHUB_TOKEN: the project folder itself, so /admin can be tried offline.
 */
const REPO = process.env.GITHUB_REPO || "Akhil14324/nutbytes";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
export const LOCAL = !TOKEN;

const API = `https://api.github.com/repos/${REPO}`;

async function gh(pathname: string, init?: RequestInit) {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status} on ${pathname}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function readFile(file: string): Promise<string | null> {
  if (LOCAL) {
    try {
      return await fs.readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), file), "utf8");
    } catch {
      return null;
    }
  }
  const res = await fetch(`${API}/contents/${file}?ref=${BRANCH}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} reading ${file}`);
  return res.text();
}

export async function listDir(dir: string): Promise<string[]> {
  if (LOCAL) {
    try {
      return (await fs.readdir(path.join(/*turbopackIgnore: true*/ process.cwd(), dir))).map((f) => `${dir}/${f}`);
    } catch {
      return [];
    }
  }
  try {
    const r = (await gh(`/contents/${dir}?ref=${BRANCH}`)) as { path: string; type: string }[];
    return r.filter((f) => f.type === "file").map((f) => f.path);
  } catch (e) {
    if (String(e).includes("GitHub 404")) return [];
    throw e;
  }
}

export type Change = {
  /** files to create or replace: repo path to base64 content */
  put: Record<string, string>;
  /** repo paths to delete */
  del: string[];
  message: string;
};

export async function commit({ put, del, message }: Change) {
  if (LOCAL) {
    for (const [file, b64] of Object.entries(put)) {
      const full = path.join(/*turbopackIgnore: true*/ process.cwd(), file);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, Buffer.from(b64, "base64"));
    }
    for (const file of del) await fs.rm(path.join(/*turbopackIgnore: true*/ process.cwd(), file), { force: true });
    return;
  }

  // one commit for everything, so Vercel builds once
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  const headSha: string = ref.object.sha;
  const head = await gh(`/git/commits/${headSha}`);

  const tree: { path: string; mode: string; type: string; sha: string | null }[] = [];
  for (const [file, b64] of Object.entries(put)) {
    const blob = await gh(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: b64, encoding: "base64" }),
    });
    tree.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
  }
  for (const file of del) tree.push({ path: file, mode: "100644", type: "blob", sha: null });

  const newTree = await gh(`/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: head.tree.sha, tree }),
  });
  const made = await gh(`/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
  });
  await gh(`/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: made.sha }),
  });
}
