import fs from "node:fs/promises";
import path from "node:path";
import { homeContentPath, pagesRoot } from "@/lib/content/paths";
import { getHomeContent } from "@/lib/content/home";
import { normalizeHomeContent, type HomeContent } from "@/lib/content/home-schema";

export async function readCmsHome(): Promise<HomeContent> {
  return getHomeContent();
}

/**
 * Validates a form submission and writes it whole.
 *
 * The file is written complete rather than as a patch, so what is on disk is
 * always the page as it will render — no merge to reason about when reading
 * the file in a diff before committing it.
 */
export async function updateCmsHome(input: unknown): Promise<HomeContent> {
  const content = normalizeHomeContent(input);
  await fs.mkdir(pagesRoot, { recursive: true });

  const file = homeContentPath();
  const temporary = path.join(pagesRoot, `.home.json.${process.pid}.tmp`);

  // The page reads this file at build time and the CMS rewrites it live: a
  // rename is atomic, so a reader never sees a half-written front page.
  await fs.writeFile(temporary, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  await fs.rename(temporary, file);

  return content;
}
