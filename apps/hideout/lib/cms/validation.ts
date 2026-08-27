import { slugify } from "@/lib/mdx/slugify";
import type {
  GameDocument,
  GameMeta,
  PostDocument,
  PostMeta,
  PostSeriesMeta,
  PostStatus,
  ProjectDocument,
  ProjectMeta,
  ProjectOpenTarget,
} from "@/lib/content/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface PostPayload {
  title: string;
  slug: string;
  description: string;
  date: string;
  status: PostStatus;
  tags: string[];
  thumbnail?: string;
  series?: PostSeriesMeta;
  body: string;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function assertSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and single hyphens.");
  }
}

function assertDate(date: string) {
  if (!DATE_PATTERN.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error("Date must use YYYY-MM-DD.");
  }
}

function assertAssetRef(ref: string | undefined, label: string) {
  if (!ref) return;
  if (ref.includes("\0") || ref.includes("..") || ref.startsWith("~")) {
    throw new Error(`${label} cannot traverse outside the content folder.`);
  }
  if (/^(https?:|\/|\.\.?\/|[a-z0-9._/-]+$)/i.test(ref)) return;
  throw new Error(`${label} must be a URL, absolute path, or content-relative path.`);
}

function normalizePostSeries(value: unknown): PostSeriesMeta | undefined {
  if (!value || typeof value !== "object") return undefined;

  const data = value as Record<string, unknown>;
  const id = asString(data.id);
  const title = asString(data.title);
  const rawOrder = data.order;
  const order =
    typeof rawOrder === "number"
      ? rawOrder
      : typeof rawOrder === "string"
        ? Number.parseInt(rawOrder, 10)
        : NaN;

  if (!id && !title && !Number.isFinite(order)) return undefined;
  if (!id || !title || !Number.isFinite(order)) {
    throw new Error("Series needs id, title, and numeric order when provided.");
  }

  return { id, title, order };
}

function assertUrl(value: string | undefined, label: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return;
  } catch {
    // handled below
  }
  throw new Error(`${label} must be a valid http(s) URL.`);
}

export function normalizePostPayload(input: unknown): PostPayload {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const title = asString(data.title);
  const slug = slugify(asString(data.slug) || title);
  const description = asString(data.description);
  const date = asString(data.date) || new Date().toISOString().slice(0, 10);
  const status: PostStatus = data.status === "published" ? "published" : "draft";
  const tags = asTags(data.tags);
  const thumbnail = asString(data.thumbnail) || undefined;
  const series = normalizePostSeries(data.series);
  const body = typeof data.body === "string" ? data.body.trim() : "";

  if (!title) throw new Error("Title is required.");
  if (!slug) throw new Error("Slug is required.");
  assertSlug(slug);
  if (!description) throw new Error("Description is required.");
  assertDate(date);
  assertAssetRef(thumbnail, "Thumbnail");

  return { title, slug, description, date, status, tags, thumbnail, series, body };
}

export function serializePost(payload: PostPayload) {
  const lines = [
    "---",
    `title: ${JSON.stringify(payload.title)}`,
    `slug: ${JSON.stringify(payload.slug)}`,
    `description: ${JSON.stringify(payload.description)}`,
    `date: ${JSON.stringify(payload.date)}`,
    `status: ${JSON.stringify(payload.status)}`,
    "tags:",
    ...payload.tags.map((tag) => `  - ${JSON.stringify(tag)}`),
  ];

  if (payload.thumbnail) lines.push(`thumbnail: ${JSON.stringify(payload.thumbnail)}`);
  if (payload.series) {
    lines.push(
      "series:",
      `  id: ${JSON.stringify(payload.series.id)}`,
      `  title: ${JSON.stringify(payload.series.title)}`,
      `  order: ${payload.series.order}`,
    );
  }
  lines.push("---", "", payload.body || "Write the post body here.", "");
  return lines.join("\n");
}

export function postDocumentToPayload(post: PostDocument): PostPayload & PostMeta {
  return { ...post.meta, body: post.body };
}

export interface ProjectPayload {
  title: string;
  slug: string;
  description: string;
  date: string;
  tags: string[];
  stack: string[];
  thumbnail?: string;
  href?: string;
  repo?: string;
  open?: ProjectOpenTarget;
  status?: string;
  visibility: PostStatus;
  body: string;
}

function asProjectOpenTarget(value: unknown): ProjectOpenTarget | undefined {
  return value === "project" || value === "website" || value === "repo"
    ? value
    : undefined;
}

export function normalizeProjectPayload(input: unknown): ProjectPayload {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const title = asString(data.title);
  const slug = slugify(asString(data.slug) || title);
  const description = asString(data.description);
  const date = asString(data.date) || new Date().toISOString().slice(0, 10);
  const tags = asTags(data.tags);
  const stack = asTags(data.stack);
  const thumbnail = asString(data.thumbnail) || undefined;
  const href = asString(data.href) || undefined;
  const repo = asString(data.repo) || undefined;
  const open = asProjectOpenTarget(data.open);
  const status = asString(data.status) || undefined;
  const visibility: PostStatus = data.visibility === "draft" ? "draft" : "published";
  const body = typeof data.body === "string" ? data.body.trim() : "";

  if (!title) throw new Error("Title is required.");
  if (!slug) throw new Error("Slug is required.");
  assertSlug(slug);
  if (!description) throw new Error("Description is required.");
  assertDate(date);
  assertAssetRef(thumbnail, "Thumbnail");
  assertUrl(href, "Website URL");
  assertUrl(repo, "Repository URL");
  if (open === "website" && !href) throw new Error("Website projects need an href.");
  if (open === "repo" && !repo) throw new Error("Repository projects need a repo URL.");

  return { title, slug, description, date, tags, stack, thumbnail, href, repo, open, status, visibility, body };
}

export function serializeProject(payload: ProjectPayload) {
  const lines = [
    "---",
    `title: ${JSON.stringify(payload.title)}`,
    `slug: ${JSON.stringify(payload.slug)}`,
    `description: ${JSON.stringify(payload.description)}`,
    `date: ${JSON.stringify(payload.date)}`,
  ];
  if (payload.status) lines.push(`status: ${JSON.stringify(payload.status)}`);
  lines.push(`visibility: ${JSON.stringify(payload.visibility)}`);
  lines.push("tags:");
  payload.tags.forEach((tag) => lines.push(`  - ${JSON.stringify(tag)}`));
  lines.push("stack:");
  payload.stack.forEach((item) => lines.push(`  - ${JSON.stringify(item)}`));
  if (payload.href) lines.push(`href: ${JSON.stringify(payload.href)}`);
  if (payload.repo) lines.push(`repo: ${JSON.stringify(payload.repo)}`);
  if (payload.open) lines.push(`open: ${JSON.stringify(payload.open)}`);
  if (payload.thumbnail) lines.push(`thumbnail: ${JSON.stringify(payload.thumbnail)}`);
  lines.push("---", "", payload.body || "Write the project body here.", "");
  return lines.join("\n");
}

export function projectDocumentToPayload(project: ProjectDocument): ProjectPayload & ProjectMeta {
  return { ...project.meta, body: project.body };
}

export interface GamePayload {
  title: string;
  slug: string;
  description: string;
  date: string;
  tags: string[];
  platforms: string[];
  engine?: string;
  thumbnail?: string;
  playHref?: string;
  downloadHref?: string;
  storeHref?: string;
  repo?: string;
  status?: string;
  jam?: string;
  visibility: PostStatus;
  body: string;
}

export function normalizeGamePayload(input: unknown): GamePayload {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const title = asString(data.title);
  const slug = slugify(asString(data.slug) || title);
  const description = asString(data.description);
  const date = asString(data.date) || new Date().toISOString().slice(0, 10);
  const thumbnail = asString(data.thumbnail) || undefined;
  const playHref = asString(data.playHref) || undefined;
  const downloadHref = asString(data.downloadHref) || undefined;
  const storeHref = asString(data.storeHref) || undefined;
  const repo = asString(data.repo) || undefined;

  if (!title) throw new Error("A title is required.");
  assertSlug(slug);
  assertDate(date);
  assertAssetRef(thumbnail, "Thumbnail");
  assertUrl(playHref, "Play link");
  assertUrl(downloadHref, "Download link");
  assertUrl(storeHref, "Store link");
  assertUrl(repo, "Repository");

  return {
    title,
    slug,
    description,
    date,
    tags: asTags(data.tags),
    platforms: asTags(data.platforms),
    engine: asString(data.engine) || undefined,
    thumbnail,
    playHref,
    downloadHref,
    storeHref,
    repo,
    status: asString(data.status) || undefined,
    jam: asString(data.jam) || undefined,
    visibility: asString(data.visibility) === "draft" ? "draft" : "published",
    body: typeof data.body === "string" ? data.body : "",
  };
}

export function serializeGame(payload: GamePayload) {
  const lines = [
    "---",
    `title: ${JSON.stringify(payload.title)}`,
    `slug: ${JSON.stringify(payload.slug)}`,
    `description: ${JSON.stringify(payload.description)}`,
    `date: ${JSON.stringify(payload.date)}`,
  ];
  if (payload.engine) lines.push(`engine: ${JSON.stringify(payload.engine)}`);
  if (payload.status) lines.push(`status: ${JSON.stringify(payload.status)}`);
  if (payload.jam) lines.push(`jam: ${JSON.stringify(payload.jam)}`);
  lines.push(`visibility: ${JSON.stringify(payload.visibility)}`);
  lines.push("platforms:");
  payload.platforms.forEach((item) => lines.push(`  - ${JSON.stringify(item)}`));
  lines.push("tags:");
  payload.tags.forEach((tag) => lines.push(`  - ${JSON.stringify(tag)}`));
  if (payload.playHref) lines.push(`playHref: ${JSON.stringify(payload.playHref)}`);
  if (payload.downloadHref) lines.push(`downloadHref: ${JSON.stringify(payload.downloadHref)}`);
  if (payload.storeHref) lines.push(`storeHref: ${JSON.stringify(payload.storeHref)}`);
  if (payload.repo) lines.push(`repo: ${JSON.stringify(payload.repo)}`);
  if (payload.thumbnail) lines.push(`thumbnail: ${JSON.stringify(payload.thumbnail)}`);
  lines.push("---", "", payload.body || "Write the game body here.", "");
  return lines.join("\n");
}

export function gameDocumentToPayload(game: GameDocument): GamePayload & GameMeta {
  return { ...game.meta, body: game.body };
}
