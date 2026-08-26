import { useSidebar } from "@workspace/ui/components/sidebar"
import { Kbd } from "@workspace/ui/components/kbd"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

/**
 * The collapse control, written as a command rather than drawn as an icon —
 * the same idiom as the `:NERDTREE` label it replaces.
 */
export function SidebarCollapseCommand() {
  const { toggleSidebar } = useSidebar()

  return (
    <TooltipTrigger>
      <button
        type="button"
        onClick={toggleSidebar}
        className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim transition-colors hover:text-terminal-chrome"
      >
        :NERDTREE
        <span aria-hidden="true" className="ms-1.5">
          «
        </span>
        <span className="sr-only">Collapse the sidebar</span>
      </button>
      <Tooltip>
        Collapse — <Kbd>ctrl</Kbd> <Kbd>b</Kbd>
      </Tooltip>
    </TooltipTrigger>
  )
}
