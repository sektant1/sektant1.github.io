import type { AsciiBannerFont } from "@workspace/ui/components/ascii-banner"

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
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  font: AsciiBannerFont
  note: string
}>

export type BannerFontId = (typeof BANNER_FONT_OPTIONS)[number]["id"]

export const DEFAULT_BANNER_FONT: BannerFontId = "delta"

export function isBannerFontId(value: string | null): value is BannerFontId {
  return BANNER_FONT_OPTIONS.some((option) => option.id === value)
}
