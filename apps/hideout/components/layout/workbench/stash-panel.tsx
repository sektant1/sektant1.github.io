"use client"

import { IconLetterF } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  BODY_FACES,
  ChoiceSection,
  FACES,
  SCALES,
  useTypeSettings,
} from "@workspace/ui/components/font-picker"
import { cn } from "@workspace/ui/lib/utils"

import { useCrtScreen, useTube } from "@/lib/console-controls"
import { fire } from "@/lib/navigation"

/**
 * The console: every setting the station has, on one bank of keys.
 *
 * The glass, the tube coating, the two faces the page is set in and the scale
 * it is drawn at were spread across a status bar, the foot of the archive
 * panel and a menu behind an icon. They are one kind of thing, so they are one
 * list.
 *
 * One shape for all of them — a marker in a fixed gutter, a label, the value at
 * the end — so the eye finds the line rather than learning a new control. The
 * marker says what kind: a track is thrown, a letter opens a list, `>_` runs.
 *
 * Labels are Latin caps, the register for console labels and readouts.
 */

export function StashPanel({ className }: { className?: string }) {
  const [glass, toggleGlass] = useCrtScreen()
  const [coating, toggleCoating] = useTube()
  // The values the picker writes, so each row carries the setting it is on
  // instead of hiding it behind the menu that changes it.
  const type = useTypeSettings({ defaultFace: "Bender" })

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex flex-col gap-4 p-3">
        <section className="flex flex-col gap-1">
          <SectionRule label="Console" />

          <Key
            label="Crt"
            value={glass ? "on" : "off"}
            marker={<Track thrown={glass} lit={glass} />}
            on={glass}
            pressed={glass}
            onPress={toggleGlass}
          />

          {/* A choice between two tubes, not a thing switched off: the block is
              lit in both positions, and the key stays unlit like the other
              settings. Green as the dark half of a toggle said the theme was
              disabled; a lit key would have said amber was the on state. */}
          <Key
            label={coating === "amber" ? "Amber" : "Green"}
            value={coating === "amber" ? "p3" : "p1"}
            marker={<Track thrown={coating === "amber"} lit />}
            onPress={toggleCoating}
          />

          {/* The type settings, one row each, carrying the value they are set
              to. They used to be an icon that opened a menu of all three, which
              made them the one control here a reader had to open to read. */}
          <MenuKey
            label="Display"
            marker={<IconLetterF className="mx-auto size-5" />}
            value={type.face}
            options={FACES.map((id) => ({ id, label: id, face: id }))}
            selected={type.face}
            onSelect={type.chooseFace}
          />

          <MenuKey
            label="Body"
            marker={<IconLetterF className="mx-auto size-5" />}
            value={type.bodyFace}
            options={BODY_FACES.map((id) => ({ id, label: id, face: id }))}
            selected={type.bodyFace}
            onSelect={type.chooseBodyFace}
          />

          <MenuKey
            label="Scale"
            marker="%"
            value={type.scaleLabel}
            options={SCALES.map((step) => ({ id: step.id, label: step.label }))}
            selected={type.scale}
            onSelect={type.chooseScale}
          />

          {/* The one key that acts rather than holds a setting. It keeps the
              row and changes the marker, and its value is the action it
              runs. */}
          <Key
            label="Boot"
            value="[ run ]"
            marker={<Marker>&gt;_</Marker>}
            onPress={() => fire("boot")}
          />
        </section>
      </div>
    </div>
  )
}

/** The one row every control in the bank is drawn as. */
const KEY =
  "stash-switch flex min-h-11 w-full items-center gap-2.5 border px-2.5 text-start crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"

const KEY_REST =
  "border-terminal-rule bg-terminal-wash/20 text-terminal-ink-dim hover:border-terminal-edge hover:bg-terminal-wash/20 hover:text-terminal-ink-dim"

const KEY_ON = "border-primary bg-terminal-wash/40 crt-glow-soft"

function Key({
  label,
  value,
  marker,
  on,
  pressed,
  onPress,
}: {
  label: string
  value: string
  marker: React.ReactNode
  /** Lit: the key is in a state, rather than waiting to be pressed. */
  on?: boolean
  /** Only for the keys that hold a position; a momentary key has none. */
  pressed?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={pressed}
      className={cn(KEY, on ? KEY_ON : KEY_REST)}
    >
      {marker}
      <Label>{label}</Label>
      <Value>{value}</Value>
    </button>
  )
}

/**
 * A key that opens a list instead of holding a position.
 *
 * Same row as the switches, with the kind of setting in the gutter where they
 * carry a track: one shape for every control in the bank, and what a row is
 * about said by its marker alone.
 */
function MenuKey<T extends string>({
  label,
  marker,
  value,
  options,
  selected,
  onSelect,
}: {
  label: string
  marker: React.ReactNode
  value: string
  options: readonly { id: T; label: string; face?: string }[]
  selected: T
  onSelect: (id: T) => void
}) {
  return (
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        className={cn(KEY, KEY_REST, "h-auto rounded-none font-normal")}
      >
        <Marker>{marker}</Marker>
        <Label>{label}</Label>
        <Value>{value}</Value>
      </Button>

      <DropdownMenu>
        <ChoiceSection
          label={label}
          options={options}
          selected={selected}
          onSelect={onSelect}
        />
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}

/** The gutter down the inline start, one width for every row. */
function Marker({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="w-7 shrink-0 text-center font-mono text-[0.85rem] text-terminal-chrome-dim"
    >
      {children}
    </span>
  )
}

/**
 * A two-position track, with the block on the side the setting is on.
 *
 * The position is the state, so it survives a palette a reader cannot tell two
 * greens apart in. `lit` is what separates a switch from a choice: an off
 * switch dims its block, a setting that is always one of two things does not.
 */
function Track({ thrown, lit }: { thrown: boolean; lit?: boolean }) {
  return (
    <span aria-hidden="true" className="w-7 shrink-0">
      <span
        data-thrown={thrown || undefined}
        data-lit={lit || undefined}
        className="stash-track relative block h-4 w-7 border border-terminal-edge"
      />
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="console-label min-w-0 flex-1 truncate text-terminal-chrome-dim">
      {children}
    </span>
  )
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <span className="console-value shrink-0 text-terminal-ink lowercase">
      {children}
    </span>
  )
}

/** A stencilled plate above a band, with the rule running out of it. */
function SectionRule({ label }: { label: string }) {
  return (
    <p className="console-sign mb-0.5 flex items-center gap-2 text-terminal-chrome-dim">
      {label}
      <span aria-hidden="true" className="h-px flex-1 bg-terminal-rule" />
    </p>
  )
}
