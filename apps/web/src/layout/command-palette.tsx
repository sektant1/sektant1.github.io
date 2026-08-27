import * as React from "react"
import { useNavigate } from "react-router"
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"

import { useTheme } from "@/components/theme-provider"
import { courses } from "@/data/courses"
import { exercises } from "@/data/exercises"
import { snippets } from "@/data/snippets"
import { topics } from "@/data/topics"

const ROUTES = [
  { label: "Codex", path: "/" },
  { label: "Courses", path: "/courses" },
  { label: "Practice", path: "/practice" },
  { label: "Tasks", path: "/tasks" },
  { label: "Notes", path: "/notes" },
  { label: "Snippets", path: "/snippets" },
  { label: "Components", path: "/components" },
  { label: "Submit", path: "/submit" },
]

/**
 * Go to anything: routes, topics, courses, snippets, exercises, plus the
 * appearance commands. One index, so the reader does not have to know which
 * page a thing lives on before they can find it.
 */
export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Go to a page, topic, snippet or exercise…" />
      <CommandList empty="Nothing matches.">
        <CommandGroup heading="Go to">
          {ROUTES.map((route) => (
            <CommandItem
              key={route.path}
              textValue={route.label}
              onAction={() => go(route.path)}
            >
              {route.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Topics">
          {topics.map((topic) => (
            <CommandItem
              key={topic.slug}
              textValue={`${topic.title} ${topic.area}`}
              onAction={() => go(`/topic/${topic.slug}`)}
            >
              <span className="truncate">{topic.title}</span>
              <span className="ms-auto shrink-0 font-mono text-[0.6rem] text-terminal-ink-faint uppercase">
                {topic.area}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Courses">
          {courses.map((course) => (
            <CommandItem
              key={course.slug}
              textValue={course.title}
              onAction={() => go("/courses")}
            >
              <span className="truncate">{course.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Snippets">
          {snippets.map((snippet) => (
            <CommandItem
              key={snippet.id}
              textValue={`${snippet.title} ${snippet.language} ${snippet.source}`}
              onAction={() => go("/snippets")}
            >
              <span className="truncate">{snippet.title}</span>
              <span className="ms-auto shrink-0 font-mono text-[0.6rem] text-terminal-ink-faint">
                {snippet.language}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Exercises">
          {exercises.map((exercise) => (
            <CommandItem
              key={exercise.id}
              textValue={`${exercise.title} ${exercise.area}`}
              onAction={() => go("/practice")}
            >
              <span className="truncate">{exercise.title}</span>
              <span className="ms-auto shrink-0 font-mono text-[0.6rem] text-terminal-ink-faint uppercase">
                {exercise.difficulty}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Appearance">
          {(["light", "dark", "system"] as const).map((option) => (
            <CommandItem
              key={option}
              textValue={`theme ${option}`}
              onAction={() => {
                setTheme(option)
                setOpen(false)
              }}
            >
              Theme: {option}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
