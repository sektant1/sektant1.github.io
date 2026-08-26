import { describe, expect, it } from "vitest"
import { buildItem, diffManifest, parseImports } from "./registry-items.mjs"

describe("parseImports", () => {
  it("finds sibling components a component depends on", () => {
    const source = `import { Button } from "@workspace/ui/components/button"`
    expect(parseImports(source)).toEqual({ components: ["button"], hooks: [] })
  })

  it("finds hooks a component depends on", () => {
    const source = `import { useIsMobile } from "@workspace/ui/hooks/use-mobile"`
    expect(parseImports(source)).toEqual({ components: [], hooks: ["use-mobile"] })
  })

  it("ignores lib/utils, which shadcn init already provides", () => {
    const source = `import { cn } from "@workspace/ui/lib/utils"`
    expect(parseImports(source)).toEqual({ components: [], hooks: [] })
  })

  it("deduplicates repeated imports of the same module", () => {
    const source = `
      import { Button } from "@workspace/ui/components/button"
      import { buttonVariants } from "@workspace/ui/components/button"
    `
    expect(parseImports(source).components).toEqual(["button"])
  })
})

describe("buildItem", () => {
  it("names the item after the component file", () => {
    expect(buildItem("accordion", {}).name).toBe("accordion")
  })

  it("always depends on the theme so consumers cannot miss it", () => {
    expect(buildItem("accordion", {}).registryDependencies).toEqual(["skt-theme"])
  })

  it("declares sibling components it imports, so they install too", () => {
    const item = buildItem("sidebar", {}, { components: ["button"], hooks: [] })
    expect(item.registryDependencies).toEqual(["skt-theme", "button"])
  })

  it("ships the hook files it imports alongside the component", () => {
    const item = buildItem("sidebar", {}, { components: [], hooks: ["use-mobile"] })
    expect(item.files).toEqual([
      {
        path: "packages/ui/src/components/sidebar.tsx",
        type: "registry:ui",
        target: "components/ui/sidebar.tsx",
      },
      {
        path: "packages/ui/src/hooks/use-mobile.ts",
        type: "registry:hook",
        target: "hooks/use-mobile.ts",
      },
    ])
  })

  it("points at the component's source path with type registry:ui", () => {
    expect(buildItem("accordion", {}).files).toEqual([
      {
        path: "packages/ui/src/components/accordion.tsx",
        type: "registry:ui",
        target: "components/ui/accordion.tsx",
      },
    ])
  })

  it("attaches npm dependencies declared for that component", () => {
    expect(buildItem("chart", { chart: ["recharts"] }).dependencies).toEqual([
      "recharts",
    ])
  })

  it("omits the dependencies key when a component needs none", () => {
    expect(buildItem("accordion", {})).not.toHaveProperty("dependencies")
  })

  it("titles multi-word components readably", () => {
    expect(buildItem("alert-dialog", {}).title).toBe("Alert Dialog")
  })
})

describe("diffManifest", () => {
  const manifest = { items: [{ name: "skt-theme" }, { name: "accordion" }] }

  it("reports a component on disk that the manifest forgot", () => {
    expect(diffManifest(manifest, ["accordion", "dialog"]).missing).toEqual([
      "dialog",
    ])
  })

  it("reports a manifest entry with no component on disk", () => {
    expect(diffManifest(manifest, []).extra).toEqual(["accordion"])
  })

  it("ignores the theme item, which has no component file", () => {
    expect(diffManifest(manifest, ["accordion"])).toEqual({
      missing: [],
      extra: [],
    })
  })
})
