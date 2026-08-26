import type * as React from "react"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"

type PageHeaderProps = {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}

/**
 * The masthead every route shares.
 *
 * The banner sits on its own full-width row rather than beside the actions.
 * ASCII art scales to its container, so putting it in a flex row next to a
 * button sizes it by whatever space the button leaves — which made the same
 * banner render at 8px on one route and 14px on another. Its own row gives
 * every page the same measure.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-3">
      <div className="w-full max-w-md">
        <AsciiBanner text={title} />
      </div>

      {description || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {description ? (
            <p className="max-w-prose text-xs leading-relaxed text-terminal-ink">
              {description}
            </p>
          ) : (
            <span />
          )}
          {actions}
        </div>
      ) : null}
    </header>
  )
}
