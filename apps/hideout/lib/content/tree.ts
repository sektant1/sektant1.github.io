import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { ContentTreeNode } from "@/lib/content/types"
import { contentRoot } from "@/lib/content/paths"
import { isAdminVisible } from "@/lib/runtime/mode"

type ContentEntry = {
  slug: string
  title: string
  date: string
  status: string
}

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

function normalizeLabel(input: string) {
  return input
    .replace(/\.(mdx?|markdown)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

async function readEntry(
  filePath: string,
  slug: string
): Promise<ContentEntry | null> {
  if (!(await exists(filePath))) return null
  const raw = await fs.readFile(filePath, "utf8")
  const parsed = matter(raw)
  const status = asString(parsed.data.status, "published")

  if (status === "draft") return null

  return {
    slug: asString(parsed.data.slug, slug),
    title: asString(parsed.data.title, normalizeLabel(slug)),
    date: asString(parsed.data.date),
    status,
  }
}

function leaf(
  label: string,
  href: string,
  activeHref?: string
): ContentTreeNode {
  return { kind: "leaf", label, href, active: activeHref === href }
}

function isMarkdownFile(name: string) {
  return /\.(md|mdx)$/i.test(name)
}

async function findIndexFile(dirPath: string) {
  for (const name of ["index.mdx", "index.md"]) {
    const filePath = path.join(dirPath, name)
    if (await exists(filePath)) return filePath
  }
  return null
}

function routeFromParts(parts: string[], slug = parts.at(-1) ?? "") {
  const routeParts = [...parts]
  if (slug) routeParts[routeParts.length - 1] = slug
  if (routeParts[0] === "pages")
    return `/${routeParts.slice(1).join("/") || ""}` || "/"
  return `/${routeParts.join("/")}`
}

function nodeIsActive(node: ContentTreeNode, activeHref?: string): boolean {
  if (!activeHref) return false
  if (node.kind === "leaf") return node.href === activeHref
  return Boolean(
    node.children?.some((child) => nodeIsActive(child, activeHref))
  )
}

function sortNodes(a: ContentTreeNode, b: ContentTreeNode) {
  if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1
  return a.label.localeCompare(b.label)
}

async function buildDirectoryNode(
  dirPath: string,
  parts: string[],
  activeHref?: string
): Promise<ContentTreeNode | null> {
  const indexFile = await findIndexFile(dirPath)
  if (indexFile) {
    const entry = await readEntry(indexFile, parts.at(-1) ?? "")
    if (!entry) return null
    return leaf(entry.title, routeFromParts(parts, entry.slug), activeHref)
  }

  const dirEntries = await fs.readdir(dirPath, { withFileTypes: true })
  const children = (
    await Promise.all(
      dirEntries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          return buildDirectoryNode(
            entryPath,
            [...parts, entry.name],
            activeHref
          )
        }

        if (!entry.isFile() || !isMarkdownFile(entry.name)) return null

        const slug = entry.name.replace(/\.(md|mdx)$/i, "")
        const contentEntry = await readEntry(entryPath, slug)
        if (!contentEntry) return null
        return leaf(
          contentEntry.title,
          routeFromParts([...parts, slug], contentEntry.slug),
          activeHref
        )
      })
    )
  )
    .filter((node): node is ContentTreeNode => Boolean(node))
    .sort(sortNodes)

  if (!children.length) return null

  const node: ContentTreeNode = {
    kind: "dir",
    label: `${parts.at(-1) ?? "content"}/`,
    children,
    defaultOpen: parts.length === 1,
  }

  return {
    ...node,
    defaultOpen: node.defaultOpen || nodeIsActive(node, activeHref),
  }
}

export async function buildContentTree(
  activeHref?: string
): Promise<ContentTreeNode[]> {
  const rootChildren = [leaf("home", "/", activeHref)]
  if (isAdminVisible())
    rootChildren.push(leaf("cms.local", "/admin", activeHref))

  if (!(await exists(contentRoot))) {
    return [
      {
        kind: "dir",
        label: "content/",
        defaultOpen: true,
        children: rootChildren,
      },
    ]
  }

  const entries = await fs.readdir(contentRoot, { withFileTypes: true })
  const contentNodes = (
    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(contentRoot, entry.name)
        if (entry.isDirectory())
          return buildDirectoryNode(entryPath, [entry.name], activeHref)
        if (!entry.isFile() || !isMarkdownFile(entry.name)) return null

        const slug = entry.name.replace(/\.(md|mdx)$/i, "")
        const contentEntry = await readEntry(entryPath, slug)
        if (!contentEntry) return null
        return leaf(
          contentEntry.title,
          routeFromParts([contentEntry.slug]),
          activeHref
        )
      })
    )
  )
    .filter((node): node is ContentTreeNode => Boolean(node))
    .sort(sortNodes)

  return [
    {
      kind: "dir" as const,
      label: "content/",
      defaultOpen: true,
      children: [rootChildren[0], ...contentNodes, ...rootChildren.slice(1)],
    },
  ]
}
