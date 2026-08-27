import fs from "node:fs/promises";
import path from "node:path";
import type { PostMeta } from "@/lib/content/types";
import type { PostSearchHit } from "@/lib/search/types";

const generatedPostSearchPath = path.join(process.cwd(), "public", "search", "posts.json");

export async function getPostSearchHits(posts: PostMeta[]): Promise<PostSearchHit[]> {
  try {
    const raw = await fs.readFile(generatedPostSearchPath, "utf8");
    const parsed = JSON.parse(raw);
    if (isPostSearchHitArray(parsed)) return parsed;
  } catch {
    // Fall back to page metadata so local development is not blocked by a missing generated file.
  }

  return posts.map(postMetaToSearchHit);
}

function postMetaToSearchHit(post: PostMeta, index: number): PostSearchHit {
  const snippet = post.description || post.readingTime || "";
  return {
    id: `${post.slug}-${index}`,
    href: `/posts/${post.slug}`,
    title: post.title,
    date: post.date,
    tags: post.tags,
    snippet,
    text: [post.title, post.description, post.date, post.readingTime, ...post.tags]
      .filter(Boolean)
      .join(" "),
  };
}

function isPostSearchHitArray(value: unknown): value is PostSearchHit[] {
  return Array.isArray(value) && value.every(isPostSearchHit);
}

function isPostSearchHit(value: unknown): value is PostSearchHit {
  if (!value || typeof value !== "object") return false;
  const hit = value as Record<string, unknown>;
  return (
    typeof hit.id === "string" &&
    typeof hit.href === "string" &&
    typeof hit.title === "string" &&
    Array.isArray(hit.tags) &&
    hit.tags.every((tag) => typeof tag === "string") &&
    typeof hit.text === "string"
  );
}
