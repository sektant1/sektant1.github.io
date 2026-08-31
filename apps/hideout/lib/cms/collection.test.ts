import { beforeEach, describe, expect, it, vi } from "vitest"

import { createCmsCollection } from "@/lib/cms/collection"

/* The disk and the asset sync are the only things this module reaches for that
   a test should not. Everything else arrives through the adapter, which is the
   seam: three real ones in the app, one plain object here. */
const fsMock = vi.hoisted(() => ({
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
  rename: vi.fn(async () => undefined),
  rm: vi.fn(async () => undefined),
}))

vi.mock("node:fs/promises", () => ({ default: fsMock }))

const syncContentAssets = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock("@/lib/content/assets", () => ({ syncContentAssets }))

vi.mock("@/lib/cms/sidecar-files", () => ({
  preserveSidecarFiles: async (
    _from: string,
    _to: string,
    write: () => Promise<void>
  ) => write(),
}))

type Payload = { slug: string; title: string }

function makeCollection(existing: Record<string, Payload> = {}) {
  const store = { ...existing }
  return {
    store,
    collection: createCmsCollection<Payload, Payload>({
      label: "Post",
      dir: (slug) => `content/posts/${slug}`,
      indexPath: (slug) => `content/posts/${slug}/index.mdx`,
      getAll: async () => Object.values(store),
      getBySlug: async (slug) => store[slug] ?? null,
      normalize: (input) => input as Payload,
      serialize: (payload) => `---\ntitle: ${payload.title}\n---\n`,
      toPayload: (document) => document,
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("reading", () => {
  it("lists every working copy, drafts included", async () => {
    const { collection } = makeCollection({
      one: { slug: "one", title: "One" },
      two: { slug: "two", title: "Two" },
    })
    expect(await collection.list()).toEqual([
      { slug: "one", title: "One" },
      { slug: "two", title: "Two" },
    ])
  })

  it("returns null for a slug that is not there", async () => {
    const { collection } = makeCollection()
    expect(await collection.read("ghost")).toBeNull()
  })
})

describe("create", () => {
  it("writes the index file inside the slug's own directory", async () => {
    const { collection } = makeCollection()
    await collection.create({ slug: "new-post", title: "New" })

    expect(fsMock.mkdir).toHaveBeenCalledWith("content/posts/new-post", {
      recursive: true,
    })
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      "content/posts/new-post/index.mdx",
      "---\ntitle: New\n---\n",
      "utf8"
    )
  })

  it("refuses a slug that is already taken", async () => {
    const { collection } = makeCollection({
      taken: { slug: "taken", title: "Taken" },
    })
    await expect(
      collection.create({ slug: "taken", title: "Another" })
    ).rejects.toThrow("Slug already exists: taken")
    expect(fsMock.writeFile).not.toHaveBeenCalled()
  })

  /* A thumbnail named in the front matter is not served until it has been
     copied and re-encoded, so a write that skips this ships a broken card. */
  it("syncs assets so a new thumbnail is actually served", async () => {
    const { collection } = makeCollection()
    await collection.create({ slug: "new-post", title: "New" })
    expect(syncContentAssets).toHaveBeenCalledOnce()
  })
})

describe("update", () => {
  it("rewrites in place when the slug does not change", async () => {
    const { collection } = makeCollection({
      same: { slug: "same", title: "Before" },
    })
    await collection.update("same", { slug: "same", title: "After" })

    expect(fsMock.rename).not.toHaveBeenCalled()
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      "content/posts/same/index.mdx",
      "---\ntitle: After\n---\n",
      "utf8"
    )
  })

  it("moves the directory when the slug changes", async () => {
    const { collection } = makeCollection({
      old: { slug: "old", title: "Old" },
    })
    await collection.update("old", { slug: "new", title: "Old" })

    expect(fsMock.rename).toHaveBeenCalledWith(
      "content/posts/old",
      "content/posts/new"
    )
  })

  it("names the collection when the working copy is missing", async () => {
    const { collection } = makeCollection()
    await expect(
      collection.update("ghost", { slug: "ghost", title: "Ghost" })
    ).rejects.toThrow("Post not found: ghost")
  })

  /* Renaming onto an occupied slug would rename one directory over another and
     take the other document's assets with it. */
  it("refuses to rename onto a slug another document holds", async () => {
    const { collection } = makeCollection({
      one: { slug: "one", title: "One" },
      two: { slug: "two", title: "Two" },
    })
    await expect(
      collection.update("one", { slug: "two", title: "One" })
    ).rejects.toThrow("Slug already exists: two")
    expect(fsMock.rename).not.toHaveBeenCalled()
  })
})

describe("remove", () => {
  it("deletes the whole directory, assets and all", async () => {
    const { collection } = makeCollection({
      gone: { slug: "gone", title: "Gone" },
    })
    expect(await collection.remove("gone")).toEqual({ ok: true })
    expect(fsMock.rm).toHaveBeenCalledWith("content/posts/gone", {
      recursive: true,
      force: true,
    })
  })

  it("refuses to delete what is not there", async () => {
    const { collection } = makeCollection()
    await expect(collection.remove("ghost")).rejects.toThrow(
      "Post not found: ghost"
    )
    expect(fsMock.rm).not.toHaveBeenCalled()
  })
})

/* The label is the only thing separating the three collections in an error, so
   it has to be the noun the operator recognises. */
describe("the adapter's label", () => {
  it("appears in the not-found message", async () => {
    const collection = createCmsCollection<Payload, Payload>({
      label: "Game",
      dir: (slug) => `content/games/${slug}`,
      indexPath: (slug) => `content/games/${slug}/index.mdx`,
      getAll: async () => [],
      getBySlug: async () => null,
      normalize: (input) => input as Payload,
      serialize: () => "",
      toPayload: (document) => document,
    })
    await expect(collection.remove("ghost")).rejects.toThrow(
      "Game not found: ghost"
    )
  })
})
