"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const commandKeyVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 font-mono text-[0.65rem] tracking-widest whitespace-nowrap uppercase crt-persist transition-colors select-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      tone: {
        default:
          "border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:text-foreground",
        // The lit key: the one that is currently doing something.
        active: "border-primary text-primary crt-glow-soft",
        alert:
          "border-destructive/60 text-destructive hover:border-destructive",
      },
    },
    defaultVariants: { tone: "default" },
  }
)

type CommandKeyProps = React.ComponentProps<"button"> &
  VariantProps<typeof commandKeyVariants>

/**
 * One key on the strip. A real button: it is pressed, so it is a `button`,
 * and it says what it does in one word the way a labelled key on a console
 * does — FIND, LOG, SAVE.
 */
function CommandKey({ tone, className, type, ...props }: CommandKeyProps) {
  return (
    <button
      data-slot="command-key"
      type={type ?? "button"}
      className={cn(commandKeyVariants({ tone }), className)}
      {...props}
    />
  )
}

/**
 * The row of labelled keys along the bottom of a terminal.
 *
 * Scrolls rather than wraps: a console strip is one line, and a key that has
 * moved to a second row is a key the operator has to hunt for. The scrollbar
 * is hidden — a bar under the keys would read as a rule the design does not
 * intend.
 *
 * The strip used to say it was "short enough to swipe" and leave it at that.
 * It is not, on a phone: six keys in the room a 390px bar has left over shows
 * about four, and with the scrollbar hidden there was nothing at all to say the
 * other two existed — they read as keys that had fallen off the screen. The
 * mask fades the trailing edge, so a cut key is visibly cut rather than absent.
 *
 * The trailing edge only. CSS cannot ask whether a box overflows, so the fade
 * is unconditional — and on the trailing edge that costs nothing, because a
 * strip whose keys fit has empty space there for the mask to land on. A leading
 * fade would have no such luck: it would sit on the first key at rest, dimming
 * FIND on every screen wide enough not to need it.
 */
function CommandStrip({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-strip"
      className={cn(
        "flex min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-0.75rem),transparent_100%)] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** A rule between groups of keys, as a console separates its banks. */
function CommandStripDivider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("mx-1 h-3.5 w-px shrink-0 bg-terminal-rule", className)}
    />
  )
}

export { CommandStrip, CommandKey, CommandStripDivider, commandKeyVariants }
