"use client"

import * as React from "react"
import { IconTypography } from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"
import {
  createPersistedPreference,
  oneOf,
} from "@workspace/ui/lib/persisted-preference"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"

/**
 * Bender is the face the identity was drawn against, so it leads. It has no
 * Cyrillic, which is why it is not the theme default — the rest of the list
 * carries a Cyrillic subset, so switching among them never silently drops
 * half the glyph set.
 *
 * Plain ids: the row is set in the face it names, so the specimen is the
 * description. A prose note beside it was a second, worse account of something
 * the reader can already see.
 */
export const FACES = [
  "Bender",
  "Play",
  "Jura",
  "Oswald",
  "Chakra Petch",
] as const

/**
 * The face the prose is set in. All monospace, and deliberately so: the site is
 * a text terminal before it is a document, so a proportional body face would
 * not be a variant of the identity but a different one. Every entry carries a
 * Cyrillic subset for the same reason the display list does.
 *
 * IBM Plex Mono leads because it is what the theme already sets — picking it is
 * picking no change.
 */
export const BODY_FACES = [
  "IBM Plex Mono",
  "JetBrains Mono",
  "Fira Mono",
  "Source Code Pro",
] as const

/**
 * How large the interface is drawn, as a multiplier on the root font size.
 *
 * Not a text-only zoom. Everything downstream of the root is in rem — type,
 * spacing, icon sizes, the gaps between cells — so one factor moves the whole
 * console as a piece, which is the only way a dense instrument layout survives
 * being resized. The steps are wide enough apart to be worth pressing and stop
 * at 1.25: past that the fixed-pitch raster on the tube face starts landing
 * across the counters of the type rather than between its rows.
 */
export const SCALES = [
  { id: "0.9", label: "90%" },
  { id: "1", label: "100%" },
  { id: "1.1", label: "110%" },
  { id: "1.25", label: "125%" },
] as const

export type FaceId = (typeof FACES)[number]
export type BodyFaceId = (typeof BODY_FACES)[number]
export type ScaleId = (typeof SCALES)[number]["id"]

export const FONT_STORAGE_KEY = "display-face"
export const BODY_FONT_STORAGE_KEY = "body-face"
export const UI_SCALE_STORAGE_KEY = "ui-scale"

/** For the before-paint setup script, which validates without importing React. */
export const FACE_IDS: readonly string[] = FACES
export const BODY_FACE_IDS: readonly string[] = BODY_FACES
export const SCALE_IDS: readonly string[] = SCALES.map((step) => step.id)

/**
 * The custom properties each list drives. The display face feeds `--font-sans`;
 * the body face feeds `--font-body`, which is a separate stack from
 * `--font-mono` on purpose — the instrument surfaces measure themselves against
 * the mono advance and cannot be repointed. See the note in globals.css.
 */
export const FONT_FACE_PROPERTY = "--font-display"
export const BODY_FONT_FACE_PROPERTY = "--font-body-face"
export const UI_SCALE_PROPERTY = "--ui-scale"

// Null rather than a face id, so "nothing chosen yet" stays distinguishable
// from "chose the same face the caller defaults to".
const storedFace = createPersistedPreference<FaceId | null>({
  key: FONT_STORAGE_KEY,
  fallback: null,
  parse: oneOf(FACES),
})

const storedBodyFace = createPersistedPreference<BodyFaceId | null>({
  key: BODY_FONT_STORAGE_KEY,
  fallback: null,
  parse: oneOf(BODY_FACES),
})

// Scale has a real default rather than null: 1 is a value, not the absence of
// one, and nothing downstream needs to tell "unset" from "chose 100%".
const storedScale = createPersistedPreference<ScaleId>({
  key: UI_SCALE_STORAGE_KEY,
  fallback: "1",
  parse: oneOf(SCALES.map((step) => step.id)),
})

/**
 * The three settings the picker holds, for a host that wants to read them.
 *
 * The trigger is an icon, so the values behind it are invisible until it is
 * opened. A panel that lists them beside the control needs the same numbers the
 * control writes, and a second copy of the storage keys is how those two drift.
 */
export function useTypeSettings({
  defaultFace = "Play",
  defaultBodyFace = "IBM Plex Mono",
}: {
  defaultFace?: FaceId
  defaultBodyFace?: BodyFaceId
} = {}) {
  const [storedDisplay, chooseFace] = usePersistedPreference(storedFace)
  const [storedBody, chooseBodyFace] = usePersistedPreference(storedBodyFace)
  const [scale, chooseScale] = usePersistedPreference(storedScale)
  const face = storedDisplay ?? defaultFace
  const bodyFace = storedBody ?? defaultBodyFace

  React.useEffect(() => {
    document.documentElement.style.setProperty(FONT_FACE_PROPERTY, face)
  }, [face])

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      BODY_FONT_FACE_PROPERTY,
      bodyFace
    )
  }, [bodyFace])

  React.useEffect(() => {
    document.documentElement.style.setProperty(UI_SCALE_PROPERTY, scale)
  }, [scale])

  return {
    face,
    bodyFace,
    scale,
    scaleLabel: SCALES.find((step) => step.id === scale)?.label ?? scale,
    chooseFace,
    chooseBodyFace,
    chooseScale,
  }
}

/**
 * Swaps the two faces the page is set in.
 *
 * `--font-display` feeds `--font-sans`, so it changes every heading and label.
 * `--font-body-face` feeds `--font-body`, which is what body copy and prose are
 * set in. Neither touches `--font-mono`: readouts, code, and the ASCII and LED
 * art stay on the instrument face, which is the register line — the machine
 * keeps its voice, the reader picks the one the human talks in.
 */
export function FontPicker({
  defaultFace = "Play",
  defaultBodyFace = "IBM Plex Mono",
  className,
}: {
  defaultFace?: FaceId
  defaultBodyFace?: BodyFaceId
  /** Styles the trigger, so a host can dress it as its own chrome does. */
  className?: string
}) {
  const {
    face,
    bodyFace,
    scaleLabel,
    chooseFace,
    chooseBodyFace,
    chooseScale,
    scale,
  } = useTypeSettings({ defaultFace, defaultBodyFace })

  return (
    <DropdownMenuTrigger>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Change type faces and interface scale"
          className={className}
        >
          <IconTypography />
        </Button>
        <Tooltip>
          Display {face} — body {bodyFace} — scale {scaleLabel}
        </Tooltip>
      </TooltipTrigger>

      <DropdownMenu>
        {/* Two sections rather than two triggers: the faces are one decision
            about how the page reads, and splitting them across two buttons in
            the header would spend a second slot of chrome on it. Latin caps on
            the headers, which is the register for a console label.

            Each section carries its own single selection, which react-aria
            supports at the section level — so the two lists are independent
            radio groups in one menu rather than one list pretending to be
            two. */}
        <ChoiceSection
          label="Display"
          options={FACES.map((id) => ({ id, label: id, face: id }))}
          selected={face}
          onSelect={chooseFace}
        />

        <DropdownMenuSeparator />

        <ChoiceSection
          label="Body"
          options={BODY_FACES.map((id) => ({ id, label: id, face: id }))}
          selected={bodyFace}
          onSelect={chooseBodyFace}
        />

        <DropdownMenuSeparator />

        {/* Scale sits with the faces because it answers the same question they
            do — how this page reads — and a reader who has just found the type
            too small is already in this menu. It is the whole interface, not
            the text alone: every measure downstream is in rem. */}
        <ChoiceSection
          label="Scale"
          options={SCALES.map((step) => ({ id: step.id, label: step.label }))}
          selected={scale}
          onSelect={chooseScale}
        />
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}

/**
 * One setting as a radio group.
 *
 * `selectionMode="single"` is what makes the current choice real rather than
 * drawn: react-aria renders the rows as `menuitemradio` and marks the chosen
 * one `aria-checked`, so a screen reader is told which one is active. The
 * previous signal was the word "active" sitting in the row's text, which is not
 * a state — it is a coincidence of wording, and nothing announced it.
 *
 * `shouldCloseOnSelect={false}` because these are choices a reader makes by
 * eye: the menu stays open so the next one is a keypress away instead of a
 * reopen, and the page behind it has already changed.
 */
export function ChoiceSection<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  /** `face` sets the row in the family it names, so a face list is its own
      specimen. Settings that are not faces — scale — leave it out. */
  options: readonly { id: T; label: string; face?: string }[]
  selected: T
  onSelect: (id: T) => void
}) {
  return (
    <DropdownMenuGroup
      selectionMode="single"
      disallowEmptySelection
      shouldCloseOnSelect={false}
      selectedKeys={[selected]}
      onSelectionChange={(keys) => {
        // "all" cannot arise in single-selection mode and an empty set is ruled
        // out by disallowEmptySelection, but both are in the type.
        if (keys === "all") return
        const [first] = keys
        if (first !== undefined) onSelect(String(first) as T)
      }}
    >
      <DropdownMenuLabel className="font-mono text-[0.6rem] tracking-widest text-terminal-ink-faint uppercase">
        {label}
      </DropdownMenuLabel>

      {options.map((option) => (
        <DropdownMenuItem
          key={option.id}
          id={option.id}
          textValue={option.label}
          /* The default radio indicator is a tick at the inline end — every
             other product's shape, on a screen whose every other mark is a
             reticle or an edge. Hidden here rather than changed in the shared
             component, so other consumers still get the tick, and the padding
             it reserves is given back to the readout. */
          className={({ isSelected }) =>
            cn(
              "gap-3 pe-2 **:data-[slot=dropdown-menu-radio-item-indicator]:hidden",
              /* A lit edge down the inline start: the toolkit's own way of
                 saying a slot is doing something, and a cue that is a shape and
                 a position rather than only a colour. */
              isSelected && "crt-edge ps-3"
            )
          }
        >
          {({ isSelected }) => (
            <>
              {/* Set in the face it names, so the row is its own specimen. */}
              <span
                style={option.face ? { fontFamily: option.face } : undefined}
                className={cn(isSelected && "text-primary crt-glow")}
              >
                {option.label}
              </span>

              {/* The state, as a readout: Latin caps, real value, and only on
                  the row that has one. An inactive row says nothing, which is
                  what makes the lit one findable at a glance. */}
              {isSelected ? (
                <span
                  aria-hidden="true"
                  className="ms-auto font-mono text-[0.6rem] tracking-widest text-primary uppercase crt-glow"
                >
                  Active
                </span>
              ) : null}
            </>
          )}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  )
}
