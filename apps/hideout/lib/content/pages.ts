import fs from "node:fs/promises"
import path from "node:path"
import { parsePostFile } from "@/lib/content/posts"
import { pageIndexPath } from "@/lib/content/paths"

async function exists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function getPageBySlug(slug: string) {
  const file = pageIndexPath(slug)
  if (!(await exists(file))) return null
  const raw = await fs.readFile(file, "utf8")
  return parsePostFile(raw, slug, file)
}

export function publicPageMeta(
  page: Awaited<ReturnType<typeof getPageBySlug>> extends infer T
    ? NonNullable<T>
    : never
) {
  return {
    ...page.meta,
    thumbnail: page.meta.thumbnail
      ? path.posix.join(
          "/content-assets/pages",
          page.meta.slug,
          page.meta.thumbnail
        )
      : undefined,
  }
}
