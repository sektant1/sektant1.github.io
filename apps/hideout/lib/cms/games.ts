import fs from "node:fs/promises";
import { gameDir, gameIndexPath } from "@/lib/content/paths";
import { getAllGames, getGameBySlug } from "@/lib/content/games";
import {
  gameDocumentToPayload,
  normalizeGamePayload,
  serializeGame,
} from "@/lib/cms/validation";
import { preserveSidecarFiles } from "@/lib/cms/sidecar-files";
import { syncContentAssets } from "@/lib/content/assets";

export async function listCmsGames() {
  const games = await getAllGames({ includeDrafts: true });
  return games.map(gameDocumentToPayload);
}

export async function readCmsGame(slug: string) {
  const game = await getGameBySlug(slug, { includeDrafts: true });
  return game ? gameDocumentToPayload(game) : null;
}

export async function createCmsGame(input: unknown) {
  const payload = normalizeGamePayload(input);
  const existing = await getGameBySlug(payload.slug, { includeDrafts: true });
  if (existing) throw new Error(`Slug already exists: ${payload.slug}`);

  await fs.mkdir(gameDir(payload.slug), { recursive: true });
  await fs.writeFile(gameIndexPath(payload.slug), serializeGame(payload), "utf8");
  await syncContentAssets();
  return payload;
}

export async function updateCmsGame(currentSlug: string, input: unknown) {
  const payload = normalizeGamePayload(input);
  const existing = await getGameBySlug(currentSlug, { includeDrafts: true });
  if (!existing) throw new Error(`Game not found: ${currentSlug}`);

  // Renaming the slug moves the folder, and the screenshots beside index.mdx
  // have to move with it.
  await preserveSidecarFiles(gameDir(currentSlug), gameDir(payload.slug), async () => {
    if (payload.slug !== currentSlug) {
      const conflict = await getGameBySlug(payload.slug, { includeDrafts: true });
      if (conflict) throw new Error(`Slug already exists: ${payload.slug}`);
      await fs.rename(gameDir(currentSlug), gameDir(payload.slug));
    }

    await fs.mkdir(gameDir(payload.slug), { recursive: true });
    await fs.writeFile(gameIndexPath(payload.slug), serializeGame(payload), "utf8");
  });

  await syncContentAssets();
  return payload;
}

export async function deleteCmsGame(slug: string) {
  const existing = await getGameBySlug(slug, { includeDrafts: true });
  if (!existing) throw new Error(`Game not found: ${slug}`);

  await fs.rm(gameDir(slug), { recursive: true, force: true });
  await syncContentAssets();
  return { ok: true };
}
