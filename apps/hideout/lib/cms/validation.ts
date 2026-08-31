import { slugify } from "@/lib/mdx/slugify"
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
} from "@/lib/content/types"

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface PostPayload {
  title: string
  slug: string
  description: string
  date: string
  status: PostStatus
  tags: string[]
  thumbnail?: string
  series?: PostSeriesMeta
  body: string
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

/**
 * The fields every collection stores, and the checks every collection runs.
 *
 * Posts, projects and games are all a title, a slug, a description, a date,
 * some tags, an optional thumbnail and a body — written out three times, which
 * is how the three drifted: games never learned to require a description or to
 * trim a body, and its missing-title error is worded differently. Those
 * differences are now options rather than accidents, so the next one has to be
 * asked for.
 *
 * The collection-specific fields stay where they are. A project's `open`
 * target and a game's store link are genuinely its own, and folding them into
 * a shared shape would buy nothing but indirection.
 */
type CoreOptions = {
  /** Games say "A title is required."; the others say "Title is required." */
  titleError?: string
  /** Games accept an empty description. Posts and projects do not. */
  requireDescription?: boolean
  /** Games keep the body's surrounding whitespace. */
  trimBody?: boolean
}

function normalizeCore(
  data: Record<string, unknown>,
  {
    titleError = "Title is required.",
    requireDescription = true,
    trimBody = true,
  }: CoreOptions = {}
) {
  const title = asString(data.title)
  const slug = slugify(asString(data.slug) || title)
  const description = asString(data.description)
  const date = asString(data.date) || new Date().toISOString().slice(0, 10)
  const tags = asTags(data.tags)
  const thumbnail = asString(data.thumbnail) || undefined
  const rawBody = typeof data.body === "string" ? data.body : ""

  if (!title) throw new Error(titleError)
  if (!slug) throw new Error("Slug is required.")
  assertSlug(slug)
  if (requireDescription && !description)
    throw new Error("Description is required.")
  assertDate(date)
  assertAssetRef(thumbnail, "Thumbnail")

  return {
    title,
    slug,
    description,
    date,
    tags,
    thumbnail,
    body: trimBody ? rawBody.trim() : rawBody,
  }
}

/** The object form of whatever the request sent, without trusting it. */
function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {}
}

/**
 * Front matter, written by hand rather than by a YAML library.
 *
 * Deliberate: the CMS owns these files and the shape is small and fixed, so a
 * dependency to emit six keys would be more to install than to read. What the
 * helpers buy is that every value is quoted the same way and every document
 * opens and closes the same way, which is what three separate serialisers kept
 * almost — but not exactly — agreeing on.
 */
function field(key: string, value: string | number) {
  return `${key}: ${JSON.stringify(value)}`
}

/** Written only when there is something to write. */
function optional(key: string, value: string | undefined) {
  return value ? [field(key, value)] : []
}

/** A front-matter list, written even when it is empty. */
function list(key: string, values: string[]) {
  return [`${key}:`, ...values.map((value) => `  - ${JSON.stringify(value)}`)]
}

/** The four keys every collection opens with, in the order it opens with. */
function head(payload: {
  title: string
  slug: string
  description: string
  date: string
}) {
  return [
    "---",
    field("title", payload.title),
    field("slug", payload.slug),
    field("description", payload.description),
    field("date", payload.date),
  ]
}

/** Closes the block and puts the body under it, or a prompt to write one. */
function withBody(lines: string[], body: string, placeholder: string) {
  return [...lines, "---", "", body || placeholder, ""].join("\n")
}

function asTags(value: unknown) {
  if (Array.isArray(value))
    return value
      .map(String)
      .map((tag) => tag.trim())
      .filter(Boolean)
  if (typeof value === "string")
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  return []
}

function assertSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      "Slug must use lowercase letters, numbers, and single hyphens."
    )
  }
}

function assertDate(date: string) {
  if (
    !DATE_PATTERN.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`))
  ) {
    throw new Error("Date must use YYYY-MM-DD.")
  }
}

function assertAssetRef(ref: string | undefined, label: string) {
  if (!ref) return
  if (ref.includes("\0") || ref.includes("..") || ref.startsWith("~")) {
    throw new Error(`${label} cannot traverse outside the content folder.`)
  }
  if (/^(https?:|\/|\.\.?\/|[a-z0-9._/-]+$)/i.test(ref)) return
  throw new Error(
    `${label} must be a URL, absolute path, or content-relative path.`
  )
}

function normalizePostSeries(value: unknown): PostSeriesMeta | undefined {
  if (!value || typeof value !== "object") return undefined

  const data = value as Record<string, unknown>
  const id = asString(data.id)
  const title = asString(data.title)
  const rawOrder = data.order
  const order =
    typeof rawOrder === "number"
      ? rawOrder
      : typeof rawOrder === "string"
        ? Number.parseInt(rawOrder, 10)
        : NaN

  if (!id && !title && !Number.isFinite(order)) return undefined
  if (!id || !title || !Number.isFinite(order)) {
    throw new Error("Series needs id, title, and numeric order when provided.")
  }

  return { id, title, order }
}

function assertUrl(value: string | undefined, label: string) {
  if (!value) return
  try {
    const url = new URL(value)
    if (url.protocol === "http:" || url.protocol === "https:") return
  } catch {
    // handled below
  }
  throw new Error(`${label} must be a valid http(s) URL.`)
}

export function normalizePostPayload(input: unknown): PostPayload {
  const data = asRecord(input)
  const core = normalizeCore(data)

  return {
    ...core,
    status: data.status === "published" ? "published" : "draft",
    series: normalizePostSeries(data.series),
  }
}

export function serializePost(payload: PostPayload) {
  return withBody(
    [
      ...head(payload),
      field("status", payload.status),
      ...list("tags", payload.tags),
      ...optional("thumbnail", payload.thumbnail),
      ...(payload.series
        ? [
            "series:",
            `  ${field("id", payload.series.id)}`,
            `  ${field("title", payload.series.title)}`,
            `  order: ${payload.series.order}`,
          ]
        : []),
    ],
    payload.body,
    "Write the post body here."
  )
}

export function postDocumentToPayload(
  post: PostDocument
): PostPayload & PostMeta {
  return { ...post.meta, body: post.body }
}

export interface ProjectPayload {
  title: string
  slug: string
  description: string
  date: string
  tags: string[]
  stack: string[]
  thumbnail?: string
  href?: string
  repo?: string
  open?: ProjectOpenTarget
  status?: string
  visibility: PostStatus
  body: string
}

function asProjectOpenTarget(value: unknown): ProjectOpenTarget | undefined {
  return value === "project" || value === "website" || value === "repo"
    ? value
    : undefined
}

export function normalizeProjectPayload(input: unknown): ProjectPayload {
  const data = asRecord(input)
  const core = normalizeCore(data)

  const href = asString(data.href) || undefined
  const repo = asString(data.repo) || undefined
  const open = asProjectOpenTarget(data.open)

  assertUrl(href, "Website URL")
  assertUrl(repo, "Repository URL")
  if (open === "website" && !href)
    throw new Error("Website projects need an href.")
  if (open === "repo" && !repo)
    throw new Error("Repository projects need a repo URL.")

  return {
    ...core,
    stack: asTags(data.stack),
    href,
    repo,
    open,
    status: asString(data.status) || undefined,
    visibility: data.visibility === "draft" ? "draft" : "published",
  }
}

export function serializeProject(payload: ProjectPayload) {
  return withBody(
    [
      ...head(payload),
      ...optional("status", payload.status),
      field("visibility", payload.visibility),
      ...list("tags", payload.tags),
      ...list("stack", payload.stack),
      ...optional("href", payload.href),
      ...optional("repo", payload.repo),
      ...optional("open", payload.open),
      ...optional("thumbnail", payload.thumbnail),
    ],
    payload.body,
    "Write the project body here."
  )
}

export function projectDocumentToPayload(
  project: ProjectDocument
): ProjectPayload & ProjectMeta {
  return { ...project.meta, body: project.body }
}

export interface GamePayload {
  title: string
  slug: string
  description: string
  date: string
  tags: string[]
  platforms: string[]
  engine?: string
  thumbnail?: string
  playHref?: string
  downloadHref?: string
  storeHref?: string
  repo?: string
  status?: string
  jam?: string
  visibility: PostStatus
  body: string
}

export function normalizeGamePayload(input: unknown): GamePayload {
  const data = asRecord(input)
  // The three exceptions games came with. They are almost certainly drift
  // rather than intent — nothing about a game makes its description optional
  // — but changing them is an editorial decision, not a refactor.
  const core = normalizeCore(data, {
    titleError: "A title is required.",
    requireDescription: false,
    trimBody: false,
  })

  const playHref = asString(data.playHref) || undefined
  const downloadHref = asString(data.downloadHref) || undefined
  const storeHref = asString(data.storeHref) || undefined
  const repo = asString(data.repo) || undefined

  assertUrl(playHref, "Play link")
  assertUrl(downloadHref, "Download link")
  assertUrl(storeHref, "Store link")
  assertUrl(repo, "Repository")

  return {
    ...core,
    platforms: asTags(data.platforms),
    engine: asString(data.engine) || undefined,
    playHref,
    downloadHref,
    storeHref,
    repo,
    status: asString(data.status) || undefined,
    jam: asString(data.jam) || undefined,
    visibility: asString(data.visibility) === "draft" ? "draft" : "published",
  }
}

export function serializeGame(payload: GamePayload) {
  return withBody(
    [
      ...head(payload),
      ...optional("engine", payload.engine),
      ...optional("status", payload.status),
      ...optional("jam", payload.jam),
      field("visibility", payload.visibility),
      ...list("platforms", payload.platforms),
      ...list("tags", payload.tags),
      ...optional("playHref", payload.playHref),
      ...optional("downloadHref", payload.downloadHref),
      ...optional("storeHref", payload.storeHref),
      ...optional("repo", payload.repo),
      ...optional("thumbnail", payload.thumbnail),
    ],
    payload.body,
    "Write the game body here."
  )
}

export function gameDocumentToPayload(
  game: GameDocument
): GamePayload & GameMeta {
  return { ...game.meta, body: game.body }
}
