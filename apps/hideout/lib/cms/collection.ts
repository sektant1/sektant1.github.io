import fs from "node:fs/promises"

import { preserveSidecarFiles } from "@/lib/cms/sidecar-files"
import { syncContentAssets } from "@/lib/content/assets"

/**
 * How one collection differs. Everything else about writing content is the
 * same, which is the point of this file.
 *
 * `label` is the noun the operator sees in an error, so it is written the way
 * the CMS says it: "Post", "Project", "Game".
 */
export type CollectionAdapter<Payload extends { slug: string }, Doc> = {
  label: string
  dir: (slug: string) => string
  indexPath: (slug: string) => string
  getAll: (options: { includeDrafts: boolean }) => Promise<Doc[]>
  getBySlug: (
    slug: string,
    options: { includeDrafts: boolean }
  ) => Promise<Doc | null | undefined>
  normalize: (input: unknown) => Payload
  serialize: (payload: Payload) => string
  toPayload: (document: Doc) => Payload
}

export type CmsCollection<Payload> = {
  list: () => Promise<Payload[]>
  read: (slug: string) => Promise<Payload | null>
  create: (input: unknown) => Promise<Payload>
  update: (currentSlug: string, input: unknown) => Promise<Payload>
  remove: (slug: string) => Promise<{ ok: true }>
}

/** The CMS edits working copies, so drafts are always in scope. */
const INCLUDE_DRAFTS = { includeDrafts: true } as const

/**
 * Writing a collection to disk: list, read, create, update, delete.
 *
 * Posts, projects and games are stored the same way — a directory named by
 * slug, an `index.mdx` inside it, and whatever assets sit beside it — so they
 * are written the same way too. This used to be three files that differed only
 * in which noun they named; `posts.ts` and `projects.ts` were five lines
 * apart, and all five were a variable name and a line break. A rule added to
 * one of them was a rule missing from the other two.
 *
 * The adapter is the seam. Three satisfy it in the app and a plain in-memory
 * one satisfies it in the tests, which is what makes this testable without
 * writing to the content tree.
 *
 * Every write ends in `syncContentAssets`, because a thumbnail named in the
 * front matter is not served until it has been copied and re-encoded.
 */
export function createCmsCollection<Payload extends { slug: string }, Doc>(
  adapter: CollectionAdapter<Payload, Doc>
): CmsCollection<Payload> {
  const { label, dir, indexPath, normalize, serialize, toPayload } = adapter

  async function requireExisting(slug: string) {
    const existing = await adapter.getBySlug(slug, INCLUDE_DRAFTS)
    if (!existing) throw new Error(`${label} not found: ${slug}`)
    return existing
  }

  async function refuseIfTaken(slug: string) {
    const conflict = await adapter.getBySlug(slug, INCLUDE_DRAFTS)
    if (conflict) throw new Error(`Slug already exists: ${slug}`)
  }

  async function writeIndex(payload: Payload) {
    await fs.mkdir(dir(payload.slug), { recursive: true })
    await fs.writeFile(indexPath(payload.slug), serialize(payload), "utf8")
  }

  return {
    async list() {
      const documents = await adapter.getAll(INCLUDE_DRAFTS)
      return documents.map(toPayload)
    },

    async read(slug) {
      const document = await adapter.getBySlug(slug, INCLUDE_DRAFTS)
      return document ? toPayload(document) : null
    },

    async create(input) {
      const payload = normalize(input)
      await refuseIfTaken(payload.slug)
      await writeIndex(payload)
      await syncContentAssets()
      return payload
    },

    async update(currentSlug, input) {
      const payload = normalize(input)
      await requireExisting(currentSlug)

      // Renaming the slug moves the directory, and the assets beside index.mdx
      // have to move with it.
      await preserveSidecarFiles(
        dir(currentSlug),
        dir(payload.slug),
        async () => {
          if (payload.slug !== currentSlug) {
            await refuseIfTaken(payload.slug)
            await fs.rename(dir(currentSlug), dir(payload.slug))
          }
          await writeIndex(payload)
        }
      )

      await syncContentAssets()
      return payload
    },

    async remove(slug) {
      await requireExisting(slug)
      await fs.rm(dir(slug), { recursive: true, force: true })
      await syncContentAssets()
      return { ok: true }
    },
  }
}
