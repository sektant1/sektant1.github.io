import * as React from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty"

import { addCommand } from "@/lib/registry-url"
import type { SectionMap } from "@/pages/components/section"
import { forms } from "@/pages/components/sections/forms"
import { layout } from "@/pages/components/sections/layout"
import { overlays } from "@/pages/components/sections/overlays"
import { primitives } from "@/pages/components/sections/primitives"
import { terminal } from "@/pages/components/sections/terminal"

const SECTIONS: SectionMap = {
  ...primitives,
  ...forms,
  ...layout,
  ...overlays,
  ...terminal,
}

const NAMES = Object.keys(SECTIONS).sort()

export function ComponentsIndex() {
  const [query, setQuery] = React.useState("")
  const [copied, setCopied] = React.useState<string | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  async function copy(name: string) {
    try {
      await navigator.clipboard.writeText(addCommand(name))
      setCopied(name)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(null), 1400)
    } catch {
      // Clipboard permission can be denied — better silent than a false
      // confirmation.
    }
  }

  const shown = NAMES.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-3">
        <AsciiBanner text="COMPONENTS" size="default" />
        <p className="max-w-prose text-xs leading-relaxed text-foreground/75">
          Every registered component with its variants. This page is the
          coverage gate: if something is in the registry, it renders here.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            aria-label="Filter components"
            placeholder="Filter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-56 text-xs"
          />
          <span className="font-mono text-[0.65rem] tabular-nums opacity-60">
            {shown.length} / {NAMES.length}
          </span>
        </div>
      </header>

      {shown.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle className="font-mono text-xs uppercase">
            No component matches
          </EmptyTitle>
          <EmptyDescription>
            Try a shorter fragment of the name.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {shown.map((name) => {
            const Section = SECTIONS[name]

            return (
              <TerminalFrame
                key={name}
                id={name}
                title={name}
                status="standby"
                footer={addCommand(name)}
              >
                <div className="flex flex-col gap-4 p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onPress={() => copy(name)}
                      className="ms-auto"
                    >
                      {copied === name ? <IconCheck /> : <IconCopy />}
                      {copied === name ? "copied" : "copy add command"}
                    </Button>
                  </div>
                  <div className="flex min-w-0 flex-col gap-4">
                    <Section />
                  </div>
                </div>
              </TerminalFrame>
            )
          })}
        </div>
      )}
    </div>
  )
}
