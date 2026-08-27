"use client"

import * as React from "react"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"

import {
  BANNER_FONT_OPTIONS,
  BANNER_FONT_STORAGE_KEY,
  DEFAULT_BANNER_FONT,
  isBannerFontId,
  type BannerFontId,
} from "@/lib/banner-font"

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readStored() {
  try {
    const stored = window.localStorage.getItem(BANNER_FONT_STORAGE_KEY)
    return isBannerFontId(stored) ? stored : DEFAULT_BANNER_FONT
  } catch {
    return DEFAULT_BANNER_FONT
  }
}

export function BannerFontPicker() {
  const selected = React.useSyncExternalStore(
    subscribe,
    readStored,
    () => DEFAULT_BANNER_FONT
  )
  const option =
    BANNER_FONT_OPTIONS.find((candidate) => candidate.id === selected) ??
    BANNER_FONT_OPTIONS[0]

  function choose(next: BannerFontId) {
    document.documentElement.dataset.asciiFont = next
    try {
      window.localStorage.setItem(BANNER_FONT_STORAGE_KEY, next)
    } catch {
      // Choice still applies to current page when storage is unavailable.
    }
    for (const listener of listeners) listener()
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
