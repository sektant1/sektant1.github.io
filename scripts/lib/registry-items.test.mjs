import { describe, expect, it } from "vitest"
import { buildItem, diffManifest } from "./registry-items.mjs"

describe("buildItem", () => {
  it("names the item after the component file", () => {
    expect(buildItem("accordion", {}).name).toBe("accordion")
  })

  it("always depends on the theme so consumers cannot miss it", () => {
    expect(buildItem("accordion", {}).registryDependencies).toEqual(["skt-theme"])
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
