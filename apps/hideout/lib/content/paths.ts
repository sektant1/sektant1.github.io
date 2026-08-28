import path from "node:path"
import fs from "node:fs"

export const contentRoot = path.join(process.cwd(), "content")
export const postsRoot = path.join(contentRoot, "posts")
export const projectsRoot = path.join(contentRoot, "projects")
export const gamesRoot = path.join(contentRoot, "games")
export const pagesRoot = path.join(contentRoot, "pages")

export function postDir(slug: string) {
  return path.join(postsRoot, slug)
}

export function postIndexPath(slug: string) {
  return path.join(postDir(slug), "index.mdx")
}

export function projectDir(slug: string) {
  return path.join(projectsRoot, slug)
}

export function projectIndexPath(slug: string) {
  return path.join(projectDir(slug), "index.mdx")
}

export function gameDir(slug: string) {
  return path.join(gamesRoot, slug)
}

export function gameIndexPath(slug: string) {
  return path.join(gameDir(slug), "index.mdx")
}

export function pageIndexPath(slug: string) {
  return path.join(pagesRoot, slug, "index.mdx")
}

// The front page is chrome, not prose: labels, a quote, three links. It reads
// as JSON rather than as MDX front matter with an empty body.
export function homeContentPath() {
  return path.join(pagesRoot, "home.json")
}

type AssetKind = "posts" | "projects" | "games"

export function normalizeAssetRef(kind: AssetKind, slug: string, ref?: string) {
  if (!ref) return undefined
  if (/^(https?:|\/)/.test(ref)) return ref
  const trimmed = ref.replace(/^\.\//, "").replace(/^\/+/, "")
  return `/content-assets/${kind}/${slug}/${trimmed}`
}

// Formats the asset sync re-encodes to WebP. SVG is left alone: it has no
// resolution to normalise.
const NORMALISED = /\.(avif|gif|jpe?g|png|webp)$/i

/**
 * The served URL for a thumbnail declared in front matter.
 *
 * Existence is checked against `content/`, which is the source of truth, but
 * the URL points at what `sync-content-assets` actually wrote: one thumbnail
 * per entry, re-encoded to WebP at a single size. Returns undefined when the
 * file named in front matter is not there, so a typo degrades to no image
 * rather than to a broken one.
 */
export function normalizeExistingAssetRef(
  kind: AssetKind,
  slug: string,
  ref?: string
) {
  if (!ref) return undefined
  if (/^(https?:|\/)/.test(ref)) return ref

  const trimmed = ref.replace(/^\.\//, "").replace(/^\/+/, "")
  const root =
    kind === "posts" ? postsRoot : kind === "games" ? gamesRoot : projectsRoot

  if (!fs.existsSync(path.join(root, slug, trimmed))) return undefined

  const served = NORMALISED.test(trimmed)
    ? trimmed.replace(/\.[^.]+$/, ".webp")
    : trimmed

  return `/content-assets/${kind}/${slug}/${served}`
}
