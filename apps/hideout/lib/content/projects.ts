import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import {
  normalizeExistingAssetRef,
  projectIndexPath,
  projectsRoot,
} from "@/lib/content/paths"
import type {
  PostStatus,
  ProjectDocument,
  ProjectMeta,
  ProjectOpenTarget,
} from "@/lib/content/types"

async function exists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string")
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  return []
}

function asOpenTarget(value: unknown): ProjectOpenTarget | undefined {
  return value === "project" || value === "website" || value === "repo"
    ? value
    : undefined
}

function asVisibility(value: unknown): PostStatus {
  return value === "draft" ? "draft" : "published"
}

export function parseProjectFile(
  raw: string,
  slugFallback: string,
  absolutePath: string
): ProjectDocument {
  const parsed = matter(raw)
  const meta: ProjectMeta = {
    title: asString(parsed.data.title, slugFallback),
    slug: asString(parsed.data.slug, slugFallback),
    description: asString(parsed.data.description),
    date: asString(parsed.data.date, new Date().toISOString().slice(0, 10)),
    tags: asStringArray(parsed.data.tags),
    thumbnail: asString(parsed.data.thumbnail) || undefined,
    stack: asStringArray(parsed.data.stack),
    href: asString(parsed.data.href) || undefined,
    repo: asString(parsed.data.repo) || undefined,
    open: asOpenTarget(parsed.data.open),
    status: asString(parsed.data.status) || undefined,
    visibility: asVisibility(
      parsed.data.visibility ?? parsed.data.publishStatus
    ),
  }
  return {
    meta,
    body: parsed.content.trim(),
    absolutePath,
    assetBasePath: path.dirname(absolutePath),
  }
}

export async function getProjectBySlug(
  slug: string,
  { includeDrafts = false }: { includeDrafts?: boolean } = {}
): Promise<ProjectDocument | null> {
  const file = projectIndexPath(slug)
  if (!(await exists(file))) return null
  const raw = await fs.readFile(file, "utf8")
  const project = parseProjectFile(raw, slug, file)
  if (!includeDrafts && project.meta.visibility !== "published") return null
  return project
}

export function publicProjectMeta(project: ProjectDocument): ProjectMeta {
  return {
    ...project.meta,
    thumbnail: normalizeExistingAssetRef(
      "projects",
      project.meta.slug,
      project.meta.thumbnail
    ),
  }
}

export async function getAllProjects({
  includeDrafts = false,
}: { includeDrafts?: boolean } = {}) {
  await fs.mkdir(projectsRoot, { recursive: true })
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })
  const projects: ProjectDocument[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const file = projectIndexPath(entry.name)
    if (!(await exists(file))) continue
    const raw = await fs.readFile(file, "utf8")
    const project = parseProjectFile(raw, entry.name, file)
    if (!includeDrafts && project.meta.visibility !== "published") continue
    projects.push(project)
  }

  return projects
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date))
    .map((project) => ({
      ...project,
      meta: {
        ...project.meta,
        thumbnail: normalizeExistingAssetRef(
          "projects",
          project.meta.slug,
          project.meta.thumbnail
        ),
      },
    }))
}
