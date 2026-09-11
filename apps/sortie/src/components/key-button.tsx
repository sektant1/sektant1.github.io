import type * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * The key affordance: a bordered box in Latin caps, lit while active. The
 * border is on at rest rather than on hover, because half this app is used on
 * a phone, where there is no hover to reveal it. Disabled is a key with no
 * phosphor, never a key that has been removed.
 *
 * The 44px minimum is the touch target the identity requires below md.
 */
export function KeyButton({
  active = false,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={props.onClick ? active : undefined}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.12em] uppercase transition-colors md:min-h-0",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "border-primary bg-primary/10 text-primary crt-glow-soft"
          : "border-terminal-rule text-terminal-chrome hover:border-primary/60 hover:text-primary",
        "disabled:border-terminal-rule disabled:text-terminal-chrome-dim disabled:hover:border-terminal-rule disabled:hover:text-terminal-chrome-dim",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
