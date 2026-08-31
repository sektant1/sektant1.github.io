import { describe, expect, it } from "vitest"
import {
  buildItem,
  collectItemImports,
  diffManifest,
  parseImports,
} from "./registry-items.mjs"

describe("parseImports", () => {
  it("finds sibling components a component depends on", () => {
    const source = `import { Button } from "@workspace/ui/components/button"`
    expect(parseImports(source)).toEqual({
      components: ["button"],
      hooks: [],
      libs: [],
      packages: [],
    })
  })

  it("finds hooks a component depends on", () => {
    const source = `import { useIsMobile } from "@workspace/ui/hooks/use-mobile"`
    expect(parseImports(source)).toEqual({
      components: [],
      hooks: ["use-mobile"],
      libs: [],
      packages: [],
    })
  })

  it("finds lib modules a component depends on", () => {
    const source = `import { logger } from "@workspace/ui/lib/logger"`
    expect(parseImports(source)).toEqual({
      components: [],
      hooks: [],
      libs: ["logger"],
      packages: [],
    })
  })

  it("ignores lib/utils, which shadcn init already provides", () => {
    const source = `import { cn } from "@workspace/ui/lib/utils"`
    expect(parseImports(source)).toEqual({
      components: [],
      hooks: [],
      libs: [],
      packages: [],
    })
  })

  it("deduplicates repeated imports of the same module", () => {
    const source = `
      import { Button } from "@workspace/ui/components/button"
      import { buttonVariants } from "@workspace/ui/components/button"
    `
    expect(parseImports(source).components).toEqual(["button"])
  })

  it("finds the npm packages a consumer would have to install", () => {
    const source = `import { Button } from "react-aria-components"`
    expect(parseImports(source).packages).toEqual(["react-aria-components"])
  })

  it("reduces a deep import to the package that provides it", () => {
    const source = `import big from "figlet/importable-fonts/Big.js"`
    expect(parseImports(source).packages).toEqual(["figlet"])
  })

  it("keeps both halves of a scoped package name", () => {
    const source = `import { IconX } from "@tabler/icons-react"`
    expect(parseImports(source).packages).toEqual(["@tabler/icons-react"])
  })

  /* A type-only import still has to resolve when the consumer type-checks, so
     it is a dependency like any other. */
  it("counts type-only imports, which still need the package installed", () => {
    const source = `import type { ButtonProps } from "react-aria-components"`
    expect(parseImports(source).packages).toEqual(["react-aria-components"])
  })

  it("ignores what shadcn init already installs", () => {
    const source = `
      import * as React from "react"
      import { createPortal } from "react-dom"
      import { clsx } from "clsx"
      import { twMerge } from "tailwind-merge"
      import { cva } from "class-variance-authority"
    `
    expect(parseImports(source).packages).toEqual([])
  })

  it("ignores relative imports, which travel with the file", () => {
    const source = `import { helper } from "./helper"`
    expect(parseImports(source).packages).toEqual([])
  })

  /* font-picker.tsx really does contain this sentence, and the first version
     of the package scan published it as a dependency. */
  it("does not read prose in a comment as an import", () => {
    const source = `
      // Null rather than a face id, so "nothing chosen yet" stays distinguishable
      // from "chose the same face the caller defaults to".
      const storedFace = null
    `
    expect(parseImports(source).packages).toEqual([])
  })

  it("does not read a block comment as an import", () => {
    const source = `/* imported from "not-a-package" long ago */`
    expect(parseImports(source).packages).toEqual([])
  })

  /* A // inside a string is not a comment; blanking it would swallow the rest
     of the line, and with it a real import sitting after it. */
  it("keeps an import that follows a url in a string", () => {
    const source = `
      const docs = "https://example.com/guide"
      import { Button } from "react-aria-components"
    `
    expect(parseImports(source).packages).toEqual(["react-aria-components"])
  })
})

/* The dependency is often not in the component file. ascii-banner.tsx imports
   no package at all — lib/ascii-art.ts, which it drags along, is what imports
   figlet. Reading only the .tsx would ship a broken install. */
describe("collectItemImports", () => {
  const sources = {
    "components/ascii-banner": `
      import { renderAsciiArt } from "@workspace/ui/lib/ascii-art"
    `,
    "lib/ascii-art": `import figlet from "figlet"`,
    "components/sidebar": `
      import { Button } from "@workspace/ui/components/button"
      import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
    `,
    "components/button": `import { Button } from "react-aria-components"`,
    "hooks/use-mobile": `import * as React from "react"`,
  }
  const read = (kind, name) => sources[`${kind}/${name}`]

  it("finds a package imported by a lib the component ships with", () => {
    expect(collectItemImports("ascii-banner", read).packages).toEqual(["figlet"])
  })

  it("still lists the lib file itself", () => {
    expect(collectItemImports("ascii-banner", read).libs).toEqual(["ascii-art"])
  })

  /* A sibling component installs as its own registry item and carries its own
     dependencies, so its packages are not this item's problem. */
  it("does not absorb a sibling component's packages", () => {
    expect(collectItemImports("sidebar", read).packages).toEqual([])
  })

  it("collects hooks and sibling components as before", () => {
    const imports = collectItemImports("sidebar", read)
    expect(imports.components).toEqual(["button"])
    expect(imports.hooks).toEqual(["use-mobile"])
  })

  it("survives a file it cannot read", () => {
    expect(collectItemImports("ghost", () => undefined).packages).toEqual([])
  })
})

describe("buildItem", () => {
  it("names the item after the component file", () => {
    expect(buildItem("accordion").name).toBe("accordion")
  })

  it("always depends on the theme so consumers cannot miss it", () => {
    expect(buildItem("accordion").registryDependencies).toEqual(["skt-theme"])
  })

  it("declares sibling components it imports, so they install too", () => {
    const item = buildItem("sidebar", { components: ["button"], hooks: [] })
    expect(item.registryDependencies).toEqual(["skt-theme", "button"])
  })

  it("ships the hook files it imports alongside the component", () => {
    const item = buildItem("sidebar", { components: [], hooks: ["use-mobile"] })
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

  it("ships the lib files it imports alongside the component", () => {
    const item = buildItem("log-console", { libs: ["logger"] })
    expect(item.files).toEqual([
      {
        path: "packages/ui/src/components/log-console.tsx",
        type: "registry:ui",
        target: "components/ui/log-console.tsx",
      },
      {
        path: "packages/ui/src/lib/logger.ts",
        type: "registry:lib",
        target: "lib/logger.ts",
      },
    ])
  })

  it("points at the component's source path with type registry:ui", () => {
    expect(buildItem("accordion").files).toEqual([
      {
        path: "packages/ui/src/components/accordion.tsx",
        type: "registry:ui",
        target: "components/ui/accordion.tsx",
      },
    ])
  })

  it("declares the packages its own imports need installed", () => {
    const item = buildItem("chart", { packages: ["recharts"] })
    expect(item.dependencies).toEqual(["recharts"])
  })

  it("omits the dependencies key when a component needs none", () => {
    expect(buildItem("accordion")).not.toHaveProperty("dependencies")
  })

  it("titles multi-word components readably", () => {
    expect(buildItem("alert-dialog").title).toBe("Alert Dialog")
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
