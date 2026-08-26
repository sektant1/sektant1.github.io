import { useLocation } from "react-router"

import { useTheme } from "@/components/theme-provider"
import { toFileName } from "@/lib/file-name"

function Cell({
  children,
  tone = "dim",
}: {
  children: React.ReactNode
  tone?: "dim" | "chrome"
}) {
  return (
    <span
      className={
        tone === "chrome"
          ? "shrink-0 border-e border-terminal-rule px-2 text-terminal-chrome"
          : "shrink-0 border-e border-terminal-rule px-2 text-terminal-ink-dim"
      }
    >
      {children}
    </span>
  )
}

/**
 * The rule along the bottom of an editor window. Every cell reports something
 * the app actually knows — route, theme, display face — rather than dressing
 * the bar with invented telemetry.
 */
export function StatusBar() {
  const { pathname } = useLocation()
  const { theme } = useTheme()

  return (
    <footer className="flex h-6 shrink-0 items-center overflow-hidden border-t border-border bg-[color-mix(in_oklch,var(--background),var(--foreground)_2%)] font-mono text-[0.6rem] tracking-widest uppercase">
      <span className="shrink-0 self-stretch border-e border-terminal-rule bg-primary/15 px-2 leading-6 text-terminal-chrome crt-glow">
        read
      </span>

      <Cell tone="chrome">{toFileName(pathname)}</Cell>
      <Cell>utf-8</Cell>
      <Cell>lf</Cell>

      <span className="flex-1" />

      <Cell>{theme}</Cell>
      <span className="shrink-0 px-2 text-terminal-ink-dim">local</span>
    </footer>
  )
}
