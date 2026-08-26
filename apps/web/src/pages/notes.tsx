import * as React from "react"
import { IconInfoCircle, IconPlus, IconSearch } from "@tabler/icons-react"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import { Kbd } from "@workspace/ui/components/kbd"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import { Sheet, SheetTrigger } from "@workspace/ui/components/sheet"
import { Textarea } from "@workspace/ui/components/textarea"

import { AREAS, topics, type Area } from "@/data/topics"
import { useLocalState } from "@/lib/use-local-state"

type Note = {
  id: string
  title: string
  area: Area
  body: string
  created: string
}

const SEED: Note[] = [
  {
    id: "n-1",
    title: "G-buffer packing",
    area: "Rendering",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    created: "2026-08-12",
  },
  {
    id: "n-2",
    title: "Why the accumulator clamps",
    area: "Physics",
    body: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    created: "2026-08-15",
  },
  {
    id: "n-3",
    title: "Archetype fragmentation",
    area: "ECS",
    body: "",
    created: "2026-08-19",
  },
]

export function Notes() {
  const [notes, setNotes] = useLocalState<Note[]>("notes", SEED)
  const [selectedId, setSelectedId] = React.useState<string | null>(
    SEED[0]?.id ?? null
  )
  const [query, setQuery] = React.useState("")
  const [saved, setSaved] = React.useState(false)

  const searchRef = React.useRef<HTMLInputElement>(null)
  const savedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      if (typing) return

      if (event.key === "/") {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === "n") {
        event.preventDefault()
        createNote()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // createNote closes over setNotes only, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    },
    []
  )

  function createNote() {
    const id = `n-${Math.round(performance.now())}`
    setNotes((current) => [
      {
        id,
        title: "Untitled note",
        area: "Tooling",
        body: "",
        created: "2026-08-26",
      },
      ...current,
    ])
    setSelectedId(id)
  }

  const filtered = notes.filter((note) =>
    `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase())
  )
  const selected = notes.find((note) => note.id === selectedId) ?? null

  function updateBody(body: string) {
    if (!selected) return
    setNotes((current) =>
      current.map((note) =>
        note.id === selected.id ? { ...note, body } : note
      )
    )
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <AsciiBanner text="NOTES" size="default" />
          <p className="text-xs text-foreground/75">
            Kept in this browser. Press <Kbd>n</Kbd> for a new note,{" "}
            <Kbd>/</Kbd> to search.
          </p>
        </div>
        <Button size="sm" onPress={createNote}>
          <IconPlus />
          New note
        </Button>
      </header>

      {notes.length === 0 ? (
        <Empty className="py-16">
          <EmptyTitle className="font-mono text-xs uppercase">
            No notes yet
          </EmptyTitle>
          <EmptyDescription>
            Notes live alongside the topics you are reading.
          </EmptyDescription>
          <Button size="sm" className="mt-3" onPress={createNote}>
            <IconPlus />
            New note
          </Button>
        </Empty>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-[28rem] border border-border max-lg:!flex-col"
        >
          <ResizablePanel defaultSize={32} minSize={20}>
            <div className="flex h-full flex-col">
              <div className="border-b border-border/60 p-2">
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 opacity-50" />
                  <Input
                    ref={searchRef}
                    aria-label="Search notes"
                    placeholder="Search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="ps-7 text-xs"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 p-2">
                  {AREAS.map((area) => {
                    const inArea = filtered.filter((note) => note.area === area)
                    if (!inArea.length) return null

                    return (
                      <Collapsible key={area} defaultExpanded>
                        <CollapsibleTrigger className="w-full font-mono text-[0.65rem] tracking-widest uppercase opacity-60">
                          {area} ({inArea.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="flex flex-col">
                            {inArea.map((note) => (
                              <li key={note.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(note.id)}
                                  className={
                                    note.id === selectedId
                                      ? "w-full truncate bg-muted px-2 py-1.5 text-start text-[0.72rem] text-primary"
                                      : "w-full truncate px-2 py-1.5 text-start text-[0.72rem] hover:bg-muted/50"
                                  }
                                >
                                  {note.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}

                  {filtered.length === 0 ? (
                    <Empty className="py-8">
                      <EmptyTitle className="font-mono text-[0.72rem] uppercase">
                        No match
                      </EmptyTitle>
                    </Empty>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={68} minSize={30}>
            {selected ? (
              <div className="flex h-full flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-xs tracking-widest text-primary uppercase crt-glow-soft">
                    {selected.title}
                  </span>
                  <span
                    aria-live="polite"
                    className={
                      saved
                        ? "font-mono text-[0.65rem] text-primary opacity-100 transition-opacity"
                        : "font-mono text-[0.65rem] opacity-0 transition-opacity"
                    }
                  >
                    saved
                  </span>

                  <SheetTrigger>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Note details"
                      className="ms-auto"
                    >
                      <IconInfoCircle />
                    </Button>
                    <Sheet>
                      <div className="flex flex-col gap-3 p-4">
                        <span className="font-mono text-xs tracking-widest uppercase">
                          Details
                        </span>
                        <Separator />
                        <dl className="flex flex-col gap-2 text-[0.72rem]">
                          <div className="flex justify-between gap-4">
                            <dt className="opacity-60">Area</dt>
                            <dd>{selected.area}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="opacity-60">Created</dt>
                            <dd className="font-mono">{selected.created}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="opacity-60">Words</dt>
                            <dd className="font-mono tabular-nums">
                              {countWords(selected.body)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="opacity-60">Topic</dt>
                            <dd className="truncate">
                              {topics.find(
                                (topic) => topic.area === selected.area
                              )?.title ?? "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </Sheet>
                  </SheetTrigger>
                </div>

                <Textarea
                  aria-label={`${selected.title} body`}
                  value={selected.body}
                  onChange={(event) => updateBody(event.target.value)}
                  placeholder="Start typing…"
                  className="min-h-[18rem] flex-1 resize-none font-mono text-[0.72rem] leading-relaxed"
                />
              </div>
            ) : (
              <Empty className="py-16">
                <EmptyTitle className="font-mono text-xs uppercase">
                  Nothing selected
                </EmptyTitle>
              </Empty>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}

function countWords(body: string) {
  const trimmed = body.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}
