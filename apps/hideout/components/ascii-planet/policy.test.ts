import { describe, expect, it } from "vitest"
import {
  CELL_ASPECT,
  MIN_COLUMNS,
  cellHeightFor,
  characterResolutionFor,
  HOLO_COLUMNS,
  MIN_HOLO_DEVICE_CELL,
  holoCellHeightFor,
  globeTonesFor,
  holoDefaultsFor,
  lightingFor,
  needsLighting,
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
  it("keeps enough steps to reach the phosphor's dimmest stop", () => {
    // Under five, the bottom of the ramp is unreachable and every lit thing on
    // the projection comes out within a shade of everything else.
    for (const subject of ["relief", "texture"] as const) {
      expect(holoDefaultsFor(subject).levels).toBeGreaterThanOrEqual(5)
    }
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

describe("needsLighting", () => {
  it("builds a rig only for what answers to light", () => {
    expect(needsLighting("relief")).toBe(true)
    // The globe emits its own tones, in both styles.
    expect(needsLighting("texture")).toBe(false)
  })
})

describe("globeTonesFor", () => {
  it("leaves the ocean under the first step, as a void the wire crosses", () => {
    // The raster's dimmest lit stop is already most of the ink, so a filled
    // ocean is a solid ball with the coastlines a shade above it.
    const step = 1 / holoDefaultsFor("texture").levels
    expect(globeTonesFor("holo").water).toBeLessThan(step)
  })

  it("keeps the land above the wire, in both passes", () => {
    // The continents are the subject and the graticule is the instrument
    // around them; a wire brighter than the coastlines reads as a cage with a
    // map behind it.
    for (const style of ["holo", "ascii"] as const) {
      const tones = globeTonesFor(style)
      expect(tones.land).toBeGreaterThan(tones.wireTone)
    }
  })

  it("drops the far side's wire below the near side's", () => {
    for (const style of ["holo", "ascii"] as const) {
      const tones = globeTonesFor(style)
      expect(tones.backTone).toBeLessThan(tones.wireTone)
    }
  })

  it("leaves two raster steps empty between the land and the wire", () => {
    const levels = holoDefaultsFor("texture").levels
    const tones = globeTonesFor("holo")
    const step = (tone: number) => Math.floor(tone * levels)
    expect(step(tones.land) - step(tones.wireTone)).toBeGreaterThanOrEqual(3)
  })

  it("draws a heavier wire for the pass that point-samples its cells", () => {
    // The raster takes the brightest sample in a cell and finds a hairline.
    // The character grid takes the middle of one and misses it.
    expect(globeTonesFor("ascii").wireWidth).toBeGreaterThan(
      globeTonesFor("holo").wireWidth
    )
  })

  it("drives the limb to the top of the ramp from the empty ocean", () => {
    // The edge is drawn over water more often than over anything else, and a
    // silhouette that lands a stop short of the top is not a silhouette.
    for (const style of ["holo", "ascii"] as const) {
      const tones = globeTonesFor(style)
      expect(tones.water + tones.limb).toBeGreaterThanOrEqual(1)
    }
  })

  it("draws a thinner ring on the raster, whose cells are square", () => {
    expect(globeTonesFor("holo").limbPower).toBeGreaterThan(
      globeTonesFor("ascii").limbPower
    )
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
