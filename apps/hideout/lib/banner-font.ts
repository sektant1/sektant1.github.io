import type { AsciiBannerFont } from "@workspace/ui/lib/ascii-art"
import {
  createPersistedPreference,
  oneOf,
} from "@workspace/ui/lib/persisted-preference"

export const BANNER_FONT_STORAGE_KEY = "ascii-banner-font"

export const BANNER_FONT_OPTIONS = [
  {
    id: "delta",
    label: "Delta Corps Priest 1",
    font: "Delta Corps Priest 1",
    note: "field command",
  },
  {
    id: "dos-rebel",
    label: "DOS Rebel",
    font: "DOS Rebel",
    note: "heavy terminal",
  },
  {
    id: "sub-zero",
    label: "Sub-Zero",
    font: "Sub-Zero",
    note: "compact tactical",
  },
  {
    id: "ansi-regular",
    label: "ANSI Regular",
    font: "ANSI Regular",
    note: "block stencil",
  },
  {
    id: "bloody",
    label: "Bloody",
    font: "Bloody",
    note: "worn phosphor",
  },
  {
    id: "electronic",
    label: "Electronic",
    font: "Electronic",
    note: "outlined circuitry",
  },
  {
    id: "cyberlarge",
    label: "Cyberlarge",
    font: "Cyberlarge",
    note: "wireframe console",
  },
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  font: AsciiBannerFont
  note: string
}>

export type BannerFontId = (typeof BANNER_FONT_OPTIONS)[number]["id"]

export const DEFAULT_BANNER_FONT: BannerFontId = "delta"

export const BANNER_FONT_IDS = BANNER_FONT_OPTIONS.map((option) => option.id)

export const bannerFontPreference = createPersistedPreference<BannerFontId>({
  key: BANNER_FONT_STORAGE_KEY,
  fallback: DEFAULT_BANNER_FONT,
  parse: oneOf(BANNER_FONT_IDS),
})
