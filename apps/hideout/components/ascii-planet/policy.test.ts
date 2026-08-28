import { describe, expect, it } from "vitest"
import {
  characterResolutionFor,
  lightingFor,
  needsEnvironment,
  postDefaultsFor,
  subjectFor,
  toneMappingFor,
} from "./policy"

describe("subjectFor", () => {
  it("treats a loaded model as relief and the procedural globe as texture", () => {
    expect(subjectFor("/models/bitcoin.glb")).toBe("relief")
    expect(subjectFor(undefined)).toBe("texture")
  })
})

describe("lightingFor", () => {
  it("gives relief a rim light behind the subject", () => {
    const rim = lightingFor("relief").find(
      (light) => light.position && light.position[2] < 0
    )
    expect(rim).toBeDefined()
  })

  it("keeps the rim off the globe, where it reads as a halo", () => {
    const behind = lightingFor("texture").filter(
      (light) => light.position && light.position[2] < 0
    )
    expect(behind).toHaveLength(0)
  })

  it("keeps the relief key off to the side, not behind the camera", () => {
    const [, key] = lightingFor("relief")
    expect(key.position?.[0]).toBeLessThan(0)
    expect(key.intensity).toBeGreaterThan(1)
  })

  it("puts exactly one ambient light in every subject", () => {
    for (const subject of ["relief", "texture"] as const) {
      const ambient = lightingFor(subject).filter(
        (light) => light.kind === "ambient"
      )
      expect(ambient).toHaveLength(1)
    }
  })
})

describe("toneMappingFor", () => {
  it("only lifts exposure where a filmic curve is applied", () => {
    expect(toneMappingFor("relief")).toEqual({ filmic: true, exposure: 1.45 })
    expect(toneMappingFor("texture")).toEqual({ filmic: false, exposure: 1 })
  })
})

describe("postDefaultsFor", () => {
  it("runs the Sobel on relief and not on a texture", () => {
    expect(postDefaultsFor("relief").edge).toBeGreaterThan(0)
    expect(postDefaultsFor("texture").edge).toBe(0)
  })

  it("dithers both, since banding is a property of the ramp", () => {
    expect(postDefaultsFor("relief").dither).toBeGreaterThan(0)
    expect(postDefaultsFor("texture").dither).toBeGreaterThan(0)
  })
})

describe("characterResolutionFor", () => {
  it("coarsens the grid on narrow viewports", () => {
    expect(characterResolutionFor(390)).toBeLessThan(
      characterResolutionFor(1440)
    )
  })

  it("lets a caller override the viewport rule", () => {
    expect(characterResolutionFor(390, 0.26)).toBe(0.26)
    expect(characterResolutionFor(1440, 0.26)).toBe(0.26)
  })
})

describe("needsEnvironment", () => {
  it("generates one only for relief, whose shading is reflection", () => {
    expect(needsEnvironment("relief")).toBe(true)
    expect(needsEnvironment("texture")).toBe(false)
  })
})
