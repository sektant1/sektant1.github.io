"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { CommandKey } from "@workspace/ui/components/command-strip"
import { Kbd } from "@workspace/ui/components/kbd"

import { REPLAY_BOOT_EVENT } from "@/components/layout/cold-boot"
import { cn } from "@workspace/ui/lib/utils"

export type CommandEntry = {
  /** Where it goes. External project links are absolute. */
  href: string
  label: string
  /** Right-aligned: a date for a post, a stack for a project. */
  meta?: string
  /** Extra words the query matches on but that are not displayed. */
  keywords?: string
}

/** The header trigger and the dialog are siblings, not parent and child. */
export const PALETTE_EVENT = "hideout:open-palette"

/** The platform does not change while the page is open. */
const subscribeToNothing = () => () => {}

export type CommandIndex = {
  posts: CommandEntry[]
  projects: CommandEntry[]
  games: CommandEntry[]
  pages: CommandEntry[]
}

/**
 * Go to anything, from anywhere: ⌘K / ctrl+K.
 *
 * The sidebar shows the file tree and the posts page has filters, but both
 * make you already know where a thing lives. This is one index over every post
 * and project, searchable by title, tag and stack — the same move an editor
 * makes with a fuzzy file finder, which is the vocabulary the rest of the site
 * is built in.
 */
export function CommandPalette({ index }: { index: CommandIndex }) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    // Opened from the header button as well as the shortcut, so the feature is
    // discoverable by people who never try ⌘K.
    const onRequest = () => setOpen(true)

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener(PALETTE_EVENT, onRequest)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(PALETTE_EVENT, onRequest)
    }
  }, [])

  function go(href: string) {
    setOpen(false)
    if (/^https?:\/\//.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer")
      return
    }
    router.push(href)
  }

  function run(action: () => void) {
    setOpen(false)
    action()
  }

  const groups: { heading: string; entries: CommandEntry[] }[] = [
    { heading: "Posts", entries: index.posts },
    { heading: "Projects", entries: index.projects },
    { heading: "Games", entries: index.games },
    { heading: "Pages", entries: index.pages },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Find a post, project or page…" />
      <CommandList empty="Nothing matches.">
        {groups
          .filter((group) => group.entries.length > 0)
          .map((group) => (
            // items + a render function, not mapped children: the group is a
            // react-aria Collection, and it only builds a filterable list from
            // data it was handed.
            <CommandGroup
              key={group.heading}
              heading={group.heading}
              items={group.entries}
            >
              {(entry: CommandEntry) => (
                <CommandItem
                  id={entry.href}
                  // Everything the query should match, including the words that
                  // are not on screen.
                  textValue={[entry.label, entry.meta, entry.keywords]
                    .filter(Boolean)
                    .join(" ")}
                  onAction={() => go(entry.href)}
                >
                  <span className="truncate">{entry.label}</span>
                  {entry.meta ? (
                    <span className="ms-auto shrink-0 font-mono text-[0.6rem] text-terminal-ink-faint">
                      {entry.meta}
                    </span>
                  ) : null}
                </CommandItem>
              )}
            </CommandGroup>
          ))}

        {/* Things the terminal does, as opposed to places it goes. */}
        <CommandGroup heading="System">
          <CommandItem
            id="boot"
            textValue="run boot sequence cold start post replay"
            onAction={() =>
              run(() => window.dispatchEvent(new Event(REPLAY_BOOT_EVENT)))
            }
          >
            <span className="truncate">Run the boot sequence</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

/**
 * The header's way in. A palette nobody knows about is a palette nobody uses,
 * so the shortcut is printed on the control that opens it.
 */
export function CommandTrigger({ className }: { className?: string }) {
  // ⌘ on a Mac, ctrl everywhere else. The server cannot know which, so it
  // renders neither and the client fills it in during hydration. Read through
  // useSyncExternalStore rather than an effect so the two never disagree.
  const modifier = React.useSyncExternalStore(
    subscribeToNothing,
    () => (/mac/i.test(navigator.userAgent) ? "⌘" : "ctrl"),
    () => null
  )

  // The same key the status bar carries, so the header reads as another bank
  // of the same console rather than as a search box borrowed from a web app.
  return (
    <CommandKey
      onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
      title="Search everything (ctrl+k)"
      className={cn("gap-2", className)}
    >
      find
      <Kbd className="bg-transparent text-terminal-chrome-dim normal-case">
        {modifier ? `${modifier} K` : " "}
      </Kbd>
    </CommandKey>
  )
}
