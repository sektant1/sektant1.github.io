import { describe, expect, it } from "vitest"
import {
  CELL_ASPECT,
  MIN_COLUMNS,
  cellHeightFor,
  characterResolutionFor,
  HOLO_COLUMNS,
  MIN_HOLO_DEVICE_CELL,
  holoCellHeightFor,
  holoDefaultsFor,
  lightingFor,
  postCellHeightFor,
  needsEnvironment,
  postDefaultsFor,
  renderScaleFor,
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
    expect(toneMappingFor("relief", "ascii")).toEqual({
      filmic: true,
      exposure: 1.45,
    })
    expect(toneMappingFor("texture", "ascii")).toEqual({
      filmic: false,
      exposure: 1,
    })
  })

  it("drops the curve for a projection, whatever the subject", () => {
    for (const subject of ["relief", "texture"] as const) {
      expect(toneMappingFor(subject, "holo").filmic).toBe(false)
    }
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

describe("holoDefaultsFor", () => {
  it("gives the coin more steps than the globe", () => {
    expect(holoDefaultsFor("relief").levels).toBeGreaterThan(
      holoDefaultsFor("texture").levels
    )
  })
})

describe("cellHeightFor", () => {
  it("holds the column floor in a phone-sized box", () => {
    // The boot coin is 6rem across on a short phone.
    const columns = 96 / (CELL_ASPECT * cellHeightFor(96, 0.26))
    expect(columns).toBeCloseTo(MIN_COLUMNS)
  })

  it("leaves a desktop box on its resolution figure", () => {
    // 18rem, the column the boot coin occupies from md up.
    expect(cellHeightFor(288, 0.26)).toBeCloseTo(2 / 0.26)
    expect(cellHeightFor(1200, 0.26)).toBeCloseTo(2 / 0.26)
  })

  it("lifts the coin's phone box, where the letter is lost", () => {
    // 11rem, the widest the coin gets below md.
    expect(cellHeightFor(176, 0.26)).toBeLessThan(2 / 0.26)
  })

  it("never coarsens past what the resolution asked for", () => {
    for (const width of [64, 96, 176, 320, 640, 1440]) {
      expect(cellHeightFor(width, 0.24)).toBeLessThanOrEqual(2 / 0.24)
    }
  })
})

describe("holoCellHeightFor", () => {
  it("draws the same column count whatever the buffer is", () => {
    for (const buffer of [352, 654, 768, 1024]) {
      expect(buffer / holoCellHeightFor(buffer)).toBeCloseTo(HOLO_COLUMNS)
    }
  })

  it("stops at a cell the raster can still resolve", () => {
    expect(holoCellHeightFor(96)).toBe(MIN_HOLO_DEVICE_CELL)
  })

  it("does not follow the character grid down on a phone", () => {
    // The phone globe coarsens its glyphs; the projection should not care.
    const phone = postCellHeightFor("holo", cellHeightFor(327, 0.18), 2, 654)
    const desktop = postCellHeightFor("holo", cellHeightFor(384, 0.24), 1, 384)
    expect(654 / phone).toBeCloseTo(384 / desktop)
  })
})

describe("renderScaleFor", () => {
  it("draws phone glyphs with the pixels the phone has", () => {
    expect(renderScaleFor(3)).toBe(2)
    expect(renderScaleFor(2)).toBe(2)
  })

  it("never goes below one, whatever the browser reports", () => {
    expect(renderScaleFor(0)).toBe(1)
    expect(renderScaleFor(Number.NaN)).toBe(1)
  })
})

describe("needsEnvironment", () => {
  it("generates one only for relief, whose shading is reflection", () => {
    expect(needsEnvironment("relief", "ascii")).toBe(true)
    expect(needsEnvironment("texture", "ascii")).toBe(false)
  })

  it("skips it for a projection, which reflects nothing", () => {
    expect(needsEnvironment("relief", "holo")).toBe(false)
  })
})
