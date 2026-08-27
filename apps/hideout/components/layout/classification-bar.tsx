import { cn } from "@workspace/ui/lib/utils"

/**
 * The banner line every field document carries across its top edge.
 *
 * It is the most recognisable thing about a military readout and it costs one
 * rule of chrome, so it does the work of establishing what this machine is
 * before anything else on the page has to.
 *
 * The marking is honest about what this actually is — a public site, no
 * secrets — which is the joke: the most classified thing on this terminal is
 * a post about configuring Neovim.
 */
export function ClassificationBar({
  marking = "unclassified // personal",
  className,
}: {
  marking?: string
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-5 shrink-0 items-center justify-center border-b border-terminal-rule bg-sidebar font-mono text-[0.6rem] tracking-[0.35em] text-terminal-chrome-dim uppercase select-none",
        className
      )}
    >
      {`// ${marking} //`}
    </div>
  )
}
