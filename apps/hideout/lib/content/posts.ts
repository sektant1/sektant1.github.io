import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  normalizeExistingAssetRef,
  postIndexPath,
  postsRoot,
} from "@/lib/content/paths";
import type {
  PostDocument,
  PostMeta,
  PostSeriesMeta,
  PostSeriesSummary,
  PostStatus,
} from "@/lib/content/types";
import { readingTime } from "@/lib/mdx/reading-time";

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

function asTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function asStatus(value: unknown): PostStatus {
  return value === "draft" ? "draft" : "published";
}

function asPostSeries(value: unknown): PostSeriesMeta | undefined {
  if (!value || typeof value !== "object") return undefined;

  const input = value as Record<string, unknown>;
  const id = asString(input.id).trim();
  const title = asString(input.title).trim();
  const rawOrder = input.order;
  const order =
    typeof rawOrder === "number"
      ? rawOrder
      : typeof rawOrder === "string"
        ? Number.parseInt(rawOrder, 10)
        : NaN;

  if (!id || !title || !Number.isFinite(order)) return undefined;
  return { id, title, order };
}

export function parsePostFile(raw: string, slugFallback: string, absolutePath: string): PostDocument {
  const parsed = matter(raw);
  const meta: PostMeta = {
    title: asString(parsed.data.title, slugFallback),
    slug: asString(parsed.data.slug, slugFallback),
    description: asString(parsed.data.description),
    date: asString(parsed.data.date, new Date().toISOString().slice(0, 10)),
    status: asStatus(parsed.data.status),
    tags: asTags(parsed.data.tags),
    thumbnail: asString(parsed.data.thumbnail) || undefined,
    readingTime: readingTime(parsed.content),
    series: asPostSeries(parsed.data.series),
  };

  return {
    meta,
    body: parsed.content.trim(),
    absolutePath,
    assetBasePath: path.dirname(absolutePath),
  };
}

export async function getAllPosts({ includeDrafts = false }: { includeDrafts?: boolean } = {}) {
  await fs.mkdir(postsRoot, { recursive: true });
  const entries = await fs.readdir(postsRoot, { withFileTypes: true });
  const posts: PostDocument[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = postIndexPath(entry.name);
    if (!(await exists(file))) continue;
    const raw = await fs.readFile(file, "utf8");
    const post = parsePostFile(raw, entry.name, file);
    if (!includeDrafts && post.meta.status !== "published") continue;
    posts.push(post);
  }

  return posts.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export async function getPostBySlug(slug: string, { includeDrafts = false }: { includeDrafts?: boolean } = {}) {
  const file = postIndexPath(slug);
  if (!(await exists(file))) return null;
  const raw = await fs.readFile(file, "utf8");
  const post = parsePostFile(raw, slug, file);
  if (!includeDrafts && post.meta.status !== "published") return null;
  return post;
}

export function publicPostMeta(post: PostDocument): PostMeta {
  return {
    ...post.meta,
    thumbnail: normalizeExistingAssetRef(
      "posts",
      post.meta.slug,
      post.meta.thumbnail,
    ),
  };
}

export async function getPublicPostMetas() {
  const posts = await getAllPosts();
  return posts.map(publicPostMeta);
}

export async function getPostsBySeries(
  seriesId: string,
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
  const posts = await getAllPosts({ includeDrafts });

  return posts
    .filter((post) => post.meta.series?.id === seriesId)
    .sort((a, b) => {
      const orderDelta = (a.meta.series?.order ?? 0) - (b.meta.series?.order ?? 0);
      if (orderDelta !== 0) return orderDelta;
      return a.meta.date.localeCompare(b.meta.date);
    });
}

export async function getAllSeries({
  includeDrafts = false,
}: { includeDrafts?: boolean } = {}): Promise<PostSeriesSummary[]> {
  const posts = await getAllPosts({ includeDrafts });
  const groups = new Map<string, PostDocument[]>();

  for (const post of posts) {
    const series = post.meta.series;
    if (!series) continue;
    const list = groups.get(series.id) ?? [];
    list.push(post);
    groups.set(series.id, list);
  }

  return Array.from(groups.entries())
    .map(([id, docs]) => {
      const ordered = [...docs].sort((a, b) => {
        const orderDelta = (a.meta.series?.order ?? 0) - (b.meta.series?.order ?? 0);
        if (orderDelta !== 0) return orderDelta;
        return a.meta.date.localeCompare(b.meta.date);
      });

      const metas = ordered.map(publicPostMeta);
      const latestPost = [...metas].sort((a, b) => b.date.localeCompare(a.date))[0];
      const firstPost = metas[0];
      const tags = Array.from(new Set(metas.flatMap((post) => post.tags))).sort();

      return {
        id,
        title: ordered[0]?.meta.series?.title ?? id,
        posts: metas,
        count: metas.length,
        firstPost,
        latestPost,
        description: firstPost?.description ?? latestPost?.description,
        tags,
      };
    })
    .sort((a, b) => {
      const latestA = a.latestPost?.date ?? "";
      const latestB = b.latestPost?.date ?? "";
      return latestB.localeCompare(latestA);
    });
}

export async function getSeriesById(seriesId: string) {
  const allSeries = await getAllSeries();
  return allSeries.find((series) => series.id === seriesId) ?? null;
}

export async function getSeriesContextForPost(post: PostDocument) {
  const series = post.meta.series;
  if (!series) return null;

  const posts = await getPostsBySeries(series.id);
  const index = posts.findIndex((entry) => entry.meta.slug === post.meta.slug);

  return {
    series,
    posts: posts.map((entry) => publicPostMeta(entry)),
    currentIndex: index,
    previous: index > 0 ? publicPostMeta(posts[index - 1]) : null,
    next: index >= 0 && index < posts.length - 1 ? publicPostMeta(posts[index + 1]) : null,
  };
}
