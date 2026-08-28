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
 * is hidden — the strip is short enough to swipe, and a bar under the keys
 * would read as a rule the design does not intend.
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
        "flex min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden",
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
