import * as React from "react"
import { IconCheck, IconCopy, IconDotsVertical } from "@tabler/icons-react"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Empty, EmptyTitle } from "@workspace/ui/components/empty"
import { Kbd } from "@workspace/ui/components/kbd"
import { Popover, PopoverTrigger } from "@workspace/ui/components/popover"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

import { snippets, type Snippet } from "@/data/snippets"

const LANGUAGES = [...new Set(snippets.map((snippet) => snippet.language))]
const TABS = ["All", ...LANGUAGES]

export function Snippets() {
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    },
    []
  )

  async function copy(snippet: Snippet) {
    try {
      await navigator.clipboard.writeText(snippet.source)
      setCopied(snippet.id)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(null), 1400)
    } catch {
      // Clipboard access can be denied; saying nothing is better than a
      // confirmation for something that did not happen.
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <AsciiBanner text="SNIPPETS" size="default" />
          <p className="text-xs text-terminal-ink">
            {snippets.length} fragments. Press <Kbd>ctrl</Kbd>
            <Kbd>k</Kbd> to search.
          </p>
        </div>

        <PopoverTrigger isOpen={paletteOpen} onOpenChange={setPaletteOpen}>
          <Button variant="outline" size="sm">
            Search snippets
          </Button>
          <Popover className="w-[min(28rem,90vw)] p-0">
            <Command aria-label="Search snippets">
              <CommandInput placeholder="Search title, description or source…" />
              <CommandList aria-label="Snippet results">
                <CommandEmpty>No snippet matches.</CommandEmpty>
                <CommandGroup>
                  {snippets.map((snippet) => (
                    <CommandItem
                      key={snippet.id}
                      textValue={`${snippet.title} ${snippet.language} ${snippet.source}`}
                      onAction={() => {
                        setPaletteOpen(false)
                        document
                          .getElementById(snippet.id)
                          ?.scrollIntoView({ block: "center" })
                      }}
                    >
                      <span className="truncate">{snippet.title}</span>
                      <Badge
                        variant="outline"
                        className="ms-auto font-mono text-[0.65rem]"
                      >
                        {snippet.language}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </Popover>
        </PopoverTrigger>
      </header>

      <Tabs aria-label="Filter by language" defaultSelectedKey="All">
        <TabsList variant="line" className="flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} id={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => {
          const shown =
            tab === "All"
              ? snippets
              : snippets.filter((snippet) => snippet.language === tab)

          return (
            <TabsContent key={tab} id={tab} className="pt-4">
              {shown.length ? (
                <div className="flex flex-col gap-4">
                  {shown.map((snippet) => (
                    <TerminalFrame
                      key={snippet.id}
                      id={snippet.id}
                      title={`${snippet.language} // ${snippet.area}`}
                      status="standby"
                      footer={snippet.title}
                    >
                      <div className="flex flex-col gap-2 p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-xs font-medium">
                              {snippet.title}
                            </span>
                            <span className="text-[0.72rem] leading-relaxed text-terminal-ink-dim">
                              {snippet.description}
                            </span>
                          </div>

                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="ms-auto shrink-0"
                              aria-label={`Copy ${snippet.title}`}
                              onPress={() => copy(snippet)}
                            >
                              {copied === snippet.id ? (
                                <IconCheck />
                              ) : (
                                <IconCopy />
                              )}
                            </Button>
                            <Tooltip>
                              {copied === snippet.id ? "Copied" : "Copy source"}
                            </Tooltip>
                          </TooltipTrigger>

                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0"
                              aria-label={`Actions for ${snippet.title}`}
                            >
                              <IconDotsVertical />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuItem
                                onAction={() => void copy(snippet)}
                              >
                                Copy source
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onAction={() =>
                                  void navigator.clipboard
                                    ?.writeText(snippet.id)
                                    .catch(() => {})
                                }
                              >
                                Copy reference
                              </DropdownMenuItem>
                            </DropdownMenu>
                          </DropdownMenuTrigger>
                        </div>

                        {/* Long lines scroll inside this box, never the page. */}
                        <ScrollArea className="w-full border-t border-terminal-rule pt-2">
                          <pre className="overflow-x-auto font-mono text-[0.72rem] leading-relaxed">
                            {snippet.source}
                          </pre>
                        </ScrollArea>
                      </div>
                    </TerminalFrame>
                  ))}
                </div>
              ) : (
                <Empty className="py-12">
                  <EmptyTitle className="font-mono text-xs uppercase">
                    Nothing in {tab}
                  </EmptyTitle>
                </Empty>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
