import * as React from "react"
import { IconSearch } from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import { Kbd } from "@workspace/ui/components/kbd"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { Popover, PopoverTrigger } from "@workspace/ui/components/popover"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Slider } from "@workspace/ui/components/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { PageHeader } from "@/layout/page-header"
import { exercises, LANGUAGES } from "@/data/exercises"
import { AREAS, type Difficulty } from "@/data/topics"

const PAGE_SIZE = 8
const DIFFICULTIES: Difficulty[] = ["intro", "working", "deep"]
const MAX_MINUTES = Math.max(...exercises.map((item) => item.estimateMinutes))

export function Practice() {
  const [query, setQuery] = React.useState("")
  const [areas, setAreas] = React.useState<string[]>([])
  const [difficulty, setDifficulty] = React.useState<string>("any")
  const [languages, setLanguages] = React.useState<string[]>([])
  const [maxMinutes, setMaxMinutes] = React.useState(MAX_MINUTES)
  const [page, setPage] = React.useState(1)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

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

  const filtered = exercises.filter((exercise) => {
    if (
      query &&
      !`${exercise.title} ${exercise.summary}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false
    if (areas.length && !areas.includes(exercise.area)) return false
    if (difficulty !== "any" && exercise.difficulty !== difficulty) return false
    if (
      languages.length &&
      !exercise.languages.some((language) => languages.includes(language))
    )
      return false
    if (exercise.estimateMinutes > maxMinutes) return false
    return true
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // A filter change can shrink the list past the current page. Clamping during
  // render keeps the reader from landing on an empty page 3.
  const currentPage = Math.min(page, pageCount)
  const shown = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function resetFilters() {
    setQuery("")
    setAreas([])
    setDifficulty("any")
    setLanguages([])
    setMaxMinutes(MAX_MINUTES)
    setPage(1)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="PRACTICE"
        description={
          <>
            {exercises.length} exercises. Press <Kbd>ctrl</Kbd>
            <Kbd>k</Kbd> to jump to one.
          </>
        }
        actions={
          <PopoverTrigger isOpen={paletteOpen} onOpenChange={setPaletteOpen}>
            <Button variant="outline" size="sm">
              <IconSearch />
              Jump to
            </Button>
            <Popover className="w-[min(28rem,90vw)] p-0">
              <Command>
                <CommandInput placeholder="Search exercises…" />
                <CommandList aria-label="Exercise results">
                  <CommandEmpty>No exercise matches.</CommandEmpty>
                  <CommandGroup>
                    {exercises.map((exercise) => (
                      <CommandItem
                        key={exercise.id}
                        textValue={exercise.title}
                        onAction={() => {
                          setPaletteOpen(false)
                          resetFilters()
                          setQuery(exercise.title)
                        }}
                      >
                        <span className="truncate">{exercise.title}</span>
                        <Badge
                          variant="outline"
                          className="ms-auto font-mono text-[0.65rem]"
                        >
                          {exercise.area}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </Popover>
          </PopoverTrigger>
        }
      />

      <TerminalFrame title="filters" footer={`${filtered.length} matching`}>
        <div className="grid gap-4 p-3 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Input
              aria-label="Search exercises"
              placeholder="Search title or summary"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="text-xs"
            />

            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[0.65rem] tracking-widest uppercase opacity-60">
                Area
              </span>
              <ToggleGroup
                aria-label="Filter by area"
                selectionMode="multiple"
                selectedKeys={areas}
                onSelectionChange={(keys) => {
                  setAreas([...keys].map(String))
                  setPage(1)
                }}
                className="flex-wrap"
              >
                {AREAS.map((area) => (
                  <ToggleGroupItem key={area} id={area}>
                    {area}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          <RadioGroup
            aria-label="Filter by difficulty"
            value={difficulty}
            onChange={(value) => {
              setDifficulty(value)
              setPage(1)
            }}
            className="gap-1.5"
          >
            <span className="font-mono text-[0.65rem] tracking-widest uppercase opacity-60">
              Difficulty
            </span>
            {/* RadioGroupItem is the indicator alone — the label is a
                sibling inside a Field, which is what wires the two together. */}
            <Field orientation="horizontal">
              <RadioGroupItem value="any" id="difficulty-any" />
              <FieldLabel htmlFor="difficulty-any">Any</FieldLabel>
            </Field>
            {DIFFICULTIES.map((level) => (
              <Field key={level} orientation="horizontal">
                <RadioGroupItem value={level} id={`difficulty-${level}`} />
                <FieldLabel htmlFor={`difficulty-${level}`}>{level}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>

          <div className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="font-mono text-[0.65rem] tracking-widest uppercase opacity-60">
                Language
              </legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {LANGUAGES.map((language) => (
                  <Field key={language} orientation="horizontal">
                    <Checkbox
                      id={`lang-${language}`}
                      isSelected={languages.includes(language)}
                      onChange={(selected) => {
                        setLanguages((current) =>
                          selected
                            ? [...current, language]
                            : current.filter((item) => item !== language)
                        )
                        setPage(1)
                      }}
                    />
                    <FieldLabel htmlFor={`lang-${language}`}>
                      {language}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[0.65rem] tracking-widest uppercase opacity-60">
                Max minutes
              </span>
              <span className="font-mono text-[0.65rem] tabular-nums opacity-70">
                {maxMinutes}m
              </span>
            </div>
            <Slider
              aria-label="Maximum minutes"
              minValue={20}
              maxValue={MAX_MINUTES}
              step={5}
              value={maxMinutes}
              onChange={(value: number | number[]) => {
                setMaxMinutes(typeof value === "number" ? value : value[0])
                setPage(1)
              }}
            />
          </div>
        </div>
      </TerminalFrame>

      {shown.length ? (
        <>
          <Table aria-label="Practice exercises">
            <TableHeader>
              <TableHead isRowHeader>Exercise</TableHead>
              <TableHead className="w-28">Area</TableHead>
              <TableHead className="w-24">Level</TableHead>
              <TableHead className="w-40">Languages</TableHead>
              <TableHead className="w-20 text-end">Est.</TableHead>
            </TableHeader>
            <TableBody>
              {shown.map((exercise) => (
                <TableRow key={exercise.id} id={exercise.id}>
                  <TableCell className="min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">
                        {exercise.title}
                      </span>
                      <span className="line-clamp-1 text-[0.72rem] text-terminal-ink-dim">
                        {exercise.summary}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-[0.65rem]"
                    >
                      {exercise.area}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        exercise.difficulty === "deep"
                          ? "destructive"
                          : "secondary"
                      }
                      className="font-mono text-[0.65rem]"
                    >
                      {exercise.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[0.65rem]">
                    {exercise.languages.join(", ")}
                  </TableCell>
                  <TableCell className="text-end font-mono text-[0.65rem] tabular-nums">
                    {exercise.estimateMinutes}m
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  isDisabled={currentPage === 1}
                  onPress={() => setPage(currentPage - 1)}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-2 font-mono text-[0.72rem] tabular-nums">
                  {currentPage} / {pageCount}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  isDisabled={currentPage === pageCount}
                  onPress={() => setPage(currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      ) : (
        <Empty className="py-12">
          <EmptyTitle className="font-mono text-xs uppercase">
            No exercise matches
          </EmptyTitle>
          <EmptyDescription>
            Every filter is still applied. Clearing them brings the full list
            back.
          </EmptyDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onPress={resetFilters}
          >
            Clear filters
          </Button>
        </Empty>
      )}
    </div>
  )
}
