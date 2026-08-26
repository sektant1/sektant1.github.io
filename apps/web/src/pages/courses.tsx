import { Link } from "react-router"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { AspectRatio } from "@workspace/ui/components/aspect-ratio"
import { Badge } from "@workspace/ui/components/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import {
  HoverCard,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import { Progress } from "@workspace/ui/components/progress"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"

import { PageHeader } from "@/layout/page-header"
import { allLessons, courses, lessonCount } from "@/data/courses"
import { useLocalState } from "@/lib/use-local-state"

export function Courses() {
  const [completed] = useLocalState<string[]>("lessons-complete", [])

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <PageHeader
        title="COURSES"
        description="Guided tracks. Each lesson opens in the runner with a brief, an editor pane and its checks."
      />

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="font-mono text-xs tracking-widest text-primary uppercase crt-glow-soft">
          Featured
        </h2>

        {/* The carousel controls sit outside the track, so the row needs
            horizontal room for them at every breakpoint. */}
        <div className="px-12">
          <Carousel opts={{ align: "start" }}>
            <CarouselContent>
              {courses.map((course) => (
                <CarouselItem
                  key={course.slug}
                  className="sm:basis-1/2 xl:basis-1/3"
                >
                  <TerminalFrame
                    title={course.area}
                    footer={`${lessonCount(course)} lessons`}
                    status="standby"
                  >
                    <AspectRatio
                      ratio={16 / 9}
                      className="border-b border-terminal-rule"
                    >
                      <div className="flex size-full items-end bg-gradient-to-br from-primary/25 to-transparent p-3">
                        <span className="font-mono text-[0.65rem] tracking-widest uppercase opacity-70">
                          {course.level}
                        </span>
                      </div>
                    </AspectRatio>
                    <div className="flex flex-col gap-1.5 p-3">
                      <span className="text-xs font-medium text-balance">
                        {course.title}
                      </span>
                      <span className="line-clamp-2 text-[0.72rem] leading-relaxed text-terminal-ink-dim">
                        {course.summary}
                      </span>
                    </div>
                  </TerminalFrame>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="font-mono text-xs tracking-widest text-primary uppercase crt-glow-soft">
          All tracks
        </h2>

        <Accordion allowsMultipleExpanded>
          {courses.map((course) => {
            const lessons = allLessons(course)
            const done = lessons.filter((lesson) =>
              completed.includes(lesson.slug)
            ).length

            return (
              <AccordionItem key={course.slug} id={course.slug}>
                <AccordionTrigger>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-start">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-medium">
                        {course.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 font-mono text-[0.65rem]"
                      >
                        {course.area}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(done / lessons.length) * 100}
                        className="h-0.5 w-32"
                        aria-label={`${course.title} progress`}
                      />
                      <span className="font-mono text-[0.65rem] tabular-nums opacity-70">
                        {done}/{lessons.length}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="flex flex-col gap-4 pt-1">
                    {course.modules.map((mod) => (
                      <div key={mod.title} className="flex flex-col gap-1.5">
                        <span className="font-mono text-[0.65rem] tracking-widest uppercase opacity-60">
                          {mod.title}
                        </span>
                        <ul className="flex flex-col">
                          {mod.lessons.map((lesson) => (
                            <li key={lesson.slug}>
                              <HoverCardTrigger>
                                <Link
                                  to={`/courses/${lesson.slug}`}
                                  className="flex items-center gap-2 px-2 py-1.5 text-[0.72rem] transition-colors hover:bg-muted/50"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={
                                      completed.includes(lesson.slug)
                                        ? "font-mono text-primary"
                                        : "font-mono opacity-40"
                                    }
                                  >
                                    {completed.includes(lesson.slug)
                                      ? "[x]"
                                      : "[ ]"}
                                  </span>
                                  <span className="truncate">
                                    {lesson.title}
                                  </span>
                                </Link>
                                <HoverCard className="max-w-xs">
                                  <span className="text-[0.72rem] leading-relaxed text-terminal-ink">
                                    {lesson.brief}
                                  </span>
                                </HoverCard>
                              </HoverCardTrigger>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </section>
    </div>
  )
}
