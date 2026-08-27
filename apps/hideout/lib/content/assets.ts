import fs from "node:fs/promises";
import path from "node:path";

import { contentRoot } from "@/lib/content/paths";

const publicContentAssetsRoot = path.join(process.cwd(), "public", "content-assets");
const copiedExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
]);

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyAssets(fromDir: string, toDir: string) {
  if (!(await pathExists(fromDir))) return;

  const entries = await fs.readdir(fromDir, { withFileTypes: true });
  await fs.mkdir(toDir, { recursive: true });

  for (const entry of entries) {
    const source = path.join(fromDir, entry.name);
    const target = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyAssets(source, target);
      continue;
    }

    if (!copiedExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    await fs.copyFile(source, target);
  }
}

export async function syncContentAssets() {
  await fs.rm(publicContentAssetsRoot, { recursive: true, force: true });
  await copyAssets(
    path.join(contentRoot, "posts"),
    path.join(publicContentAssetsRoot, "posts"),
  );
  await copyAssets(
    path.join(contentRoot, "projects"),
    path.join(publicContentAssetsRoot, "projects"),
  );
  await copyAssets(
    path.join(contentRoot, "games"),
    path.join(publicContentAssetsRoot, "games"),
  );
}
