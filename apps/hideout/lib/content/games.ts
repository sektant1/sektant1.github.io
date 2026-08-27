import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  gameIndexPath,
  gamesRoot,
  normalizeExistingAssetRef,
} from "@/lib/content/paths";
import type { GameDocument, GameMeta, PostStatus } from "@/lib/content/types";

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function asVisibility(value: unknown): PostStatus {
  return value === "draft" ? "draft" : "published";
}

export function parseGameFile(
  raw: string,
  slugFallback: string,
  absolutePath: string,
): GameDocument {
  const parsed = matter(raw);
  const meta: GameMeta = {
    title: asString(parsed.data.title, slugFallback),
    slug: asString(parsed.data.slug, slugFallback),
    description: asString(parsed.data.description),
    date: asString(parsed.data.date, new Date().toISOString().slice(0, 10)),
    tags: asStringArray(parsed.data.tags),
    thumbnail: asString(parsed.data.thumbnail) || undefined,
    engine: asString(parsed.data.engine) || undefined,
    platforms: asStringArray(parsed.data.platforms),
    playHref: asString(parsed.data.playHref) || undefined,
    downloadHref: asString(parsed.data.downloadHref) || undefined,
    storeHref: asString(parsed.data.storeHref) || undefined,
    repo: asString(parsed.data.repo) || undefined,
    status: asString(parsed.data.status) || undefined,
    jam: asString(parsed.data.jam) || undefined,
    visibility: asVisibility(parsed.data.visibility),
  };

  return {
    meta,
    body: parsed.content.trim(),
    absolutePath,
    assetBasePath: path.dirname(absolutePath),
  };
}

/** Rewrites a front-matter asset path to the copy served from public/. */
function withPublicThumbnail(game: GameDocument): GameDocument {
  return {
    ...game,
    meta: {
      ...game.meta,
      thumbnail: normalizeExistingAssetRef(
        "games",
        game.meta.slug,
        game.meta.thumbnail,
      ),
    },
  };
}

export async function getGameBySlug(
  slug: string,
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<GameDocument | null> {
  const file = gameIndexPath(slug);
  if (!(await exists(file))) return null;

  const game = parseGameFile(await fs.readFile(file, "utf8"), slug, file);
  if (!includeDrafts && game.meta.visibility !== "published") return null;
  return withPublicThumbnail(game);
}

export async function getAllGames({
  includeDrafts = false,
}: { includeDrafts?: boolean } = {}) {
  // The directory may not exist yet on a fresh checkout, and an empty games
  // page is a better answer than a build that fails.
  await fs.mkdir(gamesRoot, { recursive: true });
  const entries = await fs.readdir(gamesRoot, { withFileTypes: true });
  const games: GameDocument[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = gameIndexPath(entry.name);
    if (!(await exists(file))) continue;

    const game = parseGameFile(
      await fs.readFile(file, "utf8"),
      entry.name,
      file,
    );
    if (!includeDrafts && game.meta.visibility !== "published") continue;
    games.push(game);
  }

  return games
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date))
    .map(withPublicThumbnail);
}
