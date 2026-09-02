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
import { CONSOLE, fire } from "@/lib/navigation"

export type CommandEntry = {
  /** Where it goes. External project links are absolute. */
  href: string
  label: string
  /** Right-aligned: a date for a post, a stack for a project. */
  meta?: string
  /** Extra words the query matches on but that are not displayed. */
  keywords?: string
}

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
    window.addEventListener(CONSOLE.palette, onRequest)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(CONSOLE.palette, onRequest)
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
            onAction={() => run(() => fire("boot"))}
          >
            <span className="truncate">Run the boot sequence</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
