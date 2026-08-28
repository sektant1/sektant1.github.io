"use client"

import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"

import {
  BANNER_FONT_OPTIONS,
  bannerFontPreference,
  type BannerFontId,
} from "@/lib/banner-font"

export function BannerFontPicker() {
  const [selected, store] = usePersistedPreference(bannerFontPreference)
  const option =
    BANNER_FONT_OPTIONS.find((candidate) => candidate.id === selected) ??
    BANNER_FONT_OPTIONS[0]

  function choose(next: BannerFontId) {
    // The face is applied by an attribute rather than by re-rendering: the
    // hero ships all three, and CSS picks the one this attribute names.
    document.documentElement.dataset.asciiFont = next
    store(next)
  }

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <label
        htmlFor="banner-font"
        className="font-mono text-[0.7rem] text-terminal-ink-dim"
      >
        Hero signal face
      </label>
      <NativeSelect
        id="banner-font"
        value={selected}
        onChange={(event) => choose(event.target.value as BannerFontId)}
        className="w-full max-w-xs"
      >
        {BANNER_FONT_OPTIONS.map((candidate) => (
          <NativeSelectOption key={candidate.id} value={candidate.id}>
            {candidate.label}
            {" // "}
            {candidate.note}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <div className="field-frame overflow-hidden px-3 py-4">
        <AsciiBanner
          key={option.id}
          text="HIDEOUT"
          font={option.font}
          size="sm"
          effect="none"
        />
      </div>

      <p className="text-xs leading-relaxed text-terminal-ink-faint">
        Stored on this terminal. Public hero uses selected face on next load.
      </p>
    </div>
  )
}
