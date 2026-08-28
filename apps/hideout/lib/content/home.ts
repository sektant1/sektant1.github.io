import fs from "node:fs/promises"
import { cache } from "react"
import { homeContentPath } from "@/lib/content/paths"
import {
  DEFAULT_HOME_CONTENT,
  normalizeHomeContent,
  type HomeContent,
} from "@/lib/content/home-schema"

/**
 * What the front page renders.
 *
 * A missing, unreadable, or malformed file leaves the page as it shipped: the
 * front page is the first thing anyone sees, so it must not depend on a file
 * the CMS may never have written. Bad JSON is reported to the server log and
 * then ignored — the CMS validates on the way in, so anything broken here was
 * hand-edited.
 */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  let raw: string
  try {
    raw = await fs.readFile(homeContentPath(), "utf8")
  } catch {
    return DEFAULT_HOME_CONTENT
  }

  try {
    return normalizeHomeContent(JSON.parse(raw))
  } catch (error) {
    console.warn(
      `Ignoring ${homeContentPath()}: ${error instanceof Error ? error.message : error}`
    )
    return DEFAULT_HOME_CONTENT
  }
})

export { DEFAULT_HOME_CONTENT }
export type { HomeContent }
