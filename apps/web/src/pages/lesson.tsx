import * as React from "react"
import { IconCheck, IconPlayerPlay } from "@tabler/icons-react"
import { useParams } from "react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Button, LinkButton } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Kbd } from "@workspace/ui/components/kbd"
import { Progress } from "@workspace/ui/components/progress"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { Textarea } from "@workspace/ui/components/textarea"

import { allLessons, courses } from "@/data/courses"
import { useLocalState } from "@/lib/use-local-state"

const RUN_MS = 600

function findLesson(slug: string) {
  for (const course of courses) {
    const lesson = allLessons(course).find((item) => item.slug === slug)
    if (lesson) return { course, lesson }
  }
  return null
}

export function Lesson() {
  const { slug = "" } = useParams()
  const found = findLesson(slug)

  const [completed, setCompleted] = useLocalState<string[]>(
    "lessons-complete",
    []
  )
  const [drafts, setDrafts] = useLocalState<Record<string, string>>(
    "lesson-drafts",
    {}
  )
  const [running, setRunning] = React.useState(false)

  const runTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(
    () => () => {
      if (runTimer.current) clearTimeout(runTimer.current)
    },
    []
  )

  if (!found) {
    return (
      <Empty className="py-16">
        <EmptyTitle className="font-mono text-xs uppercase">
          No such lesson
        </EmptyTitle>
        <EmptyDescription>
          <code className="font-mono">{slug}</code> is not in any track.
        </EmptyDescription>
        <LinkButton
          href="/courses"
          variant="outline"
          size="sm"
          className="mt-3"
        >
          Back to courses
        </LinkButton>
      </Empty>
    )
  }

  const { course, lesson } = found
  const lessons = allLessons(course)
  const done = lessons.filter((item) => completed.includes(item.slug)).length
  const isComplete = completed.includes(lesson.slug)
  const draft = drafts[lesson.slug] ?? lesson.starter

  function run() {
    setRunning(true)
    runTimer.current = setTimeout(() => {
      setRunning(false)
      setCompleted((current) =>
        current.includes(lesson.slug) ? current : [...current, lesson.slug]
      )
    }, RUN_MS)
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/courses">Courses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/courses">{course.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{lesson.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-medium">{lesson.title}</h1>
        {isComplete ? (
          <Badge className="gap-1 font-mono text-[0.65rem]">
            <IconCheck className="size-3" />
            complete
          </Badge>
        ) : null}
        <div className="flex min-w-[10rem] flex-1 items-center gap-2">
          <Progress
            value={(done / lessons.length) * 100}
            className="h-1 flex-1"
            aria-label={`${course.title} progress`}
          />
          <span className="font-mono text-[0.65rem] tabular-nums opacity-70">
            {done}/{lessons.length}
          </span>
        </div>
      </header>

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[26rem] border border-border max-lg:!flex-col"
      >
        <ResizablePanel defaultSize={38} minSize={22}>
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-4">
              <span className="font-mono text-[0.65rem] tracking-widest text-primary uppercase crt-glow-soft">
                Brief
              </span>
              <p className="text-xs leading-relaxed">{lesson.brief}</p>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={62} minSize={30}>
          <Tabs
            aria-label="Lesson panes"
            defaultSelectedKey="editor"
            className="h-full p-3"
          >
            <TabsList variant="line">
              <TabsTrigger id="editor">Editor</TabsTrigger>
              <TabsTrigger id="checks">
                Checks
                <Badge
                  variant="secondary"
                  className="ms-1.5 font-mono text-[0.65rem]"
                >
                  {lesson.checks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent id="editor" className="flex flex-col gap-2 pt-2">
              <Textarea
                aria-label={`${lesson.title} editor`}
                spellCheck={false}
                value={draft}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [lesson.slug]: event.target.value,
                  }))
                }
                className="min-h-[16rem] resize-none font-mono text-[0.72rem] leading-relaxed"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onPress={run} isDisabled={running}>
                  {running ? <Spinner /> : <IconPlayerPlay />}
                  {running ? "Running" : "Run checks"}
                </Button>
                <span className="flex items-center gap-1.5 text-[0.65rem] opacity-60">
                  <Kbd>ctrl</Kbd>
                  <Kbd>enter</Kbd>
                </span>
                {/* Say plainly that nothing is executed. A green tick that
                    implies real evaluation would be a lie. */}
                <span className="ms-auto text-[0.65rem] text-terminal-ink-dim">
                  Checks are illustrative — no code is executed.
                </span>
              </div>
            </TabsContent>

            <TabsContent id="checks" className="flex flex-col gap-2 pt-2">
              {lesson.checks.map((check) => (
                <Alert key={check}>
                  <IconCheck />
                  <AlertDescription>{check}</AlertDescription>
                </Alert>
              ))}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>

      <TerminalFrame
        title="lesson/meta"
        status={isComplete ? "online" : "standby"}
        footer={`${course.title} — ${lesson.lang}`}
      >
        <div className="p-3 font-mono text-[0.72rem] text-terminal-ink-dim">
          {lesson.slug}
        </div>
      </TerminalFrame>
    </div>
  )
}
