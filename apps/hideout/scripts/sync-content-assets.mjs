// Copies the images that live beside content into public/, and re-encodes the
// front-matter thumbnails to one size on the way through.
//
// Thumbnails come in as whatever the source was — a 1254×1254 logo, a 1280×720
// screenshot, a 3 MB animated GIF. Cards fit them all into the same box, so
// they are encoded to that box here instead: same dimensions, same format, a
// fraction of the bytes.

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

// Imported, not restated. thumbnail.ts is what the CSS fits into and it has
// always claimed this script reads it — but the numbers were typed again here,
// so the guarantee was prose and nothing would have caught the two drifting.
import {
  THUMB_HEIGHT,
  THUMB_WIDTH,
} from "../components/media/thumbnail.ts";

const root = process.cwd();
const contentRoot = path.join(root, "content");
const publicRoot = path.join(root, "public", "content-assets");

const COLLECTIONS = ["posts", "projects", "games"];

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

// SVG has no fixed resolution to normalise and rasterising it would only lose
// quality, so it is copied through as-is.
const resizableExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyAssets(fromDir, toDir) {
  if (!(await exists(fromDir))) return;

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

/** The `thumbnail:` a collection entry declares, as a path relative to it. */
async function readThumbnailRef(indexFile) {
  if (!(await exists(indexFile))) return null;

  const { data } = matter(await fs.readFile(indexFile, "utf8"));
  const ref = typeof data.thumbnail === "string" ? data.thumbnail : "";
  // A remote or absolute thumbnail is not ours to re-encode.
  if (!ref || /^(https?:|\/)/.test(ref)) return null;

  return ref.replace(/^\.\//, "");
}

/**
 * Re-encodes one thumbnail in place, inside public/.
 *
 * The content directory is never written to: it is the source of truth and
 * lives in git. Only the served copy changes.
 */
async function normaliseThumbnail(servedPath) {
  const extension = path.extname(servedPath).toLowerCase();
  if (!resizableExtensions.has(extension)) return null;
  if (!(await exists(servedPath))) return null;

  const before = (await fs.stat(servedPath)).size;

  // animated: true keeps a GIF a GIF. Several post thumbnails are short loops
  // and flattening them to a still would lose the thing that makes them work.
  const image = sharp(servedPath, { animated: true });
  const { width, height, pages } = await image.metadata();
  if (!width || !height) return null;

  const output = await image
    .resize(THUMB_WIDTH, THUMB_HEIGHT, {
      // fill stretches the source to the band instead of cropping it or
      // letterboxing it: nothing is cut off the top or bottom, and every
      // thumbnail reaches both edges of its card.
      fit: "fill",
    })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  const target = servedPath.replace(/\.[^.]+$/, ".webp");
  await fs.writeFile(target, output);
  // The original served copy is redundant once the page points at the new one.
  if (target !== servedPath) await fs.rm(servedPath, { force: true });

  return {
    before,
    after: output.length,
    animated: (pages ?? 1) > 1,
    from: `${width}×${height}`,
  };
}

async function normaliseCollection(collection) {
  const dir = path.join(contentRoot, collection);
  if (!(await exists(dir))) return [];

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    for (const name of ["index.mdx", "index.md"]) {
      const ref = await readThumbnailRef(path.join(dir, entry.name, name));
      if (!ref) continue;

      const served = path.join(publicRoot, collection, entry.name, ref);
      const result = await normaliseThumbnail(served);
      if (result) results.push({ slug: `${collection}/${entry.name}`, ...result });
      break;
    }
  }

  return results;
}

await fs.rm(publicRoot, { recursive: true, force: true });

for (const collection of COLLECTIONS) {
  await copyAssets(
    path.join(contentRoot, collection),
    path.join(publicRoot, collection),
  );
}

const normalised = (
  await Promise.all(COLLECTIONS.map(normaliseCollection))
).flat();

if (normalised.length > 0) {
  const before = normalised.reduce((sum, item) => sum + item.before, 0);
  const after = normalised.reduce((sum, item) => sum + item.after, 0);
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

  console.log(
    `Normalised ${normalised.length} thumbnails to ${THUMB_WIDTH}×${THUMB_HEIGHT} ` +
      `(${mb(before)} MB → ${mb(after)} MB)`,
  );
}
