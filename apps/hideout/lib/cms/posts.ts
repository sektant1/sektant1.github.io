import fs from "node:fs/promises"
import { postDir, postIndexPath } from "@/lib/content/paths"
import { getAllPosts, getPostBySlug } from "@/lib/content/posts"
import {
  normalizePostPayload,
  postDocumentToPayload,
  serializePost,
} from "@/lib/cms/validation"
import { preserveSidecarFiles } from "@/lib/cms/sidecar-files"
import { syncContentAssets } from "@/lib/content/assets"

export async function listCmsPosts() {
  const posts = await getAllPosts({ includeDrafts: true })
  return posts.map(postDocumentToPayload)
}

export async function readCmsPost(slug: string) {
  const post = await getPostBySlug(slug, { includeDrafts: true })
  return post ? postDocumentToPayload(post) : null
}

export async function createCmsPost(input: unknown) {
  const payload = normalizePostPayload(input)
  const existing = await getPostBySlug(payload.slug, { includeDrafts: true })
  if (existing) throw new Error(`Slug already exists: ${payload.slug}`)
  await fs.mkdir(postDir(payload.slug), { recursive: true })
  await fs.writeFile(
    postIndexPath(payload.slug),
    serializePost(payload),
    "utf8"
  )
  await syncContentAssets()
  return payload
}

export async function updateCmsPost(currentSlug: string, input: unknown) {
  const payload = normalizePostPayload(input)
  const existing = await getPostBySlug(currentSlug, { includeDrafts: true })
  if (!existing) throw new Error(`Post not found: ${currentSlug}`)

  await preserveSidecarFiles(
    postDir(currentSlug),
    postDir(payload.slug),
    async () => {
      if (payload.slug !== currentSlug) {
        const slugConflict = await getPostBySlug(payload.slug, {
          includeDrafts: true,
        })
        if (slugConflict)
          throw new Error(`Slug already exists: ${payload.slug}`)
        await fs.rename(postDir(currentSlug), postDir(payload.slug))
      }

      await fs.mkdir(postDir(payload.slug), { recursive: true })
      await fs.writeFile(
        postIndexPath(payload.slug),
        serializePost(payload),
        "utf8"
      )
    }
  )

  await syncContentAssets()
  return payload
}

export async function deleteCmsPost(slug: string) {
  const existing = await getPostBySlug(slug, { includeDrafts: true })
  if (!existing) throw new Error(`Post not found: ${slug}`)
  await fs.rm(postDir(slug), { recursive: true, force: true })
  await syncContentAssets()
  return { ok: true }
}
