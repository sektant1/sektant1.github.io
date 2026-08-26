import { IconArrowRight, IconBook } from "@tabler/icons-react"
import { Link } from "react-router"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"
import { AsciiSolid } from "@workspace/ui/components/ascii-solid"
import { Badge } from "@workspace/ui/components/badge"
import { BootLog } from "@workspace/ui/components/boot-log"
import { Card, CardContent } from "@workspace/ui/components/card"
import { CrtScreen } from "@workspace/ui/components/crt-screen"
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Progress } from "@workspace/ui/components/progress"
import { ScrambleText } from "@workspace/ui/components/scramble-text"
import { Separator } from "@workspace/ui/components/separator"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"

import { AREAS, topics } from "@/data/topics"
import { exercises } from "@/data/exercises"
import { courses, lessonCount } from "@/data/courses"
import { snippets } from "@/data/snippets"

const BOOT: { label: string; status: "ok" | "warn" | "skip" }[] = [
  { label: "mounting /codex", status: "ok" },
  { label: `indexing ${topics.length} reference topics`, status: "ok" },
  { label: `loading ${exercises.length} practice sets`, status: "ok" },
  { label: "calibrating phosphor output", status: "ok" },
  { label: "gpu capability probe", status: "warn" },
  { label: "telemetry uplink", status: "skip" },
]

export function Codex() {
  const inProgress = topics.filter(
    (topic) => topic.progress > 0 && topic.progress < 100
  )
  const completed = topics.filter((topic) => topic.progress === 100).length
  const totalLessons = courses.reduce(
    (total, course) => total + lessonCount(course),
    0
  )

  return (
    <div className="flex flex-col gap-8">
      <CrtScreen intensity="subtle" sweep className="border border-border">
        {/* Corner ticks — the frame reads as an instrument rather than a card. */}
        {[
          "start-0 top-0 border-s border-t",
          "end-0 top-0 border-e border-t",
          "start-0 bottom-0 border-s border-b",
          "end-0 bottom-0 border-e border-b",
        ].map((position) => (
          <span
            key={position}
            aria-hidden="true"
            className={`absolute size-2.5 border-terminal-edge ${position}`}
          />
        ))}

        {/* Instrument header: the readings a terminal would print on connect. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-terminal-rule px-5 py-2 font-mono text-[0.65rem] tracking-widest text-terminal-ink-faint uppercase md:px-8">
          <span className="flex items-center gap-1.5 text-terminal-chrome">
            <span
              aria-hidden="true"
              className="size-1 bg-primary shadow-[0_0_6px_var(--primary)]"
            />
            skt://codex
          </span>
          <span aria-hidden="true">│</span>
          <span>build 0.1.0</span>
          <span aria-hidden="true">│</span>
          <span>{topics.length} topics</span>
          <span aria-hidden="true">│</span>
          <span>{courses.length} tracks</span>
          <span aria-hidden="true" className="ms-auto hidden sm:inline">
            <ScrambleText text="link established" speed={22} />
          </span>
        </div>

        <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-start md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <div className="flex min-w-0 flex-col gap-5">
            <AsciiBanner text="SKT CODEX" size="lg" />

            <div className="flex flex-col gap-2 border-t border-terminal-rule pt-4">
              <AsciiMeter
                label="topics"
                value={completed / topics.length}
                unit={`${completed}/${topics.length}`}
              />
              <AsciiMeter
                label="lessons"
                value={0.18}
                unit={`of ${totalLessons}`}
              />
              <AsciiMeter
                label="snippets"
                value={snippets.length / 20}
                unit="indexed"
              />
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[0.72rem] text-primary crt-glow">
              <span className="text-terminal-ink-dim">~/codex</span>
              <span>$</span>
              <ScrambleText text="resume --last" speed={40} />
              <span aria-hidden="true" className="motion-safe:animate-pulse">
                _
              </span>
            </div>
          </div>

          {/* Captioned like a figure, because it is one: the sphere is a live
              renderer, not an ornament. */}
          <figure className="mx-auto hidden w-full min-w-0 flex-col items-center gap-2 md:flex">
            <AsciiSolid shape="sphere" columns={80} />
            <figcaption className="font-mono text-[0.6rem] tracking-widest text-terminal-ink-faint uppercase">
              fig. 1 — lambert sphere, 80 col
            </figcaption>
          </figure>
        </div>
      </CrtScreen>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TerminalFrame
          title="resume"
          status={inProgress.length ? "online" : "standby"}
          footer={`${inProgress.length} open`}
        >
          {inProgress.length ? (
            <ul className="divide-y divide-terminal-rule">
              {inProgress.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    to={`/topic/${topic.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <IconBook className="size-4 shrink-0 text-terminal-ink" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">
                        {topic.title}
                      </div>
                      <Progress
                        value={topic.progress}
                        className="mt-1.5 h-1"
                        aria-label={`${topic.title} progress`}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[0.65rem] text-terminal-ink tabular-nums">
                      {topic.progress}%
                    </span>
                    <IconArrowRight className="size-3.5 shrink-0 text-terminal-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="py-8">
              <EmptyTitle className="font-mono text-xs uppercase">
                Nothing in progress
              </EmptyTitle>
              <EmptyDescription>
                Open any topic below and it will appear here.
              </EmptyDescription>
            </Empty>
          )}
        </TerminalFrame>

        <TerminalFrame title="sys/boot" footer="last cold start">
          <div className="p-3">
            <BootLog lines={BOOT} />
          </div>
        </TerminalFrame>
      </div>

      {AREAS.map((area) => {
        const areaTopics = topics.filter((topic) => topic.area === area)
        if (!areaTopics.length) return null

        return (
          <section key={area} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 font-mono text-xs tracking-widest text-primary uppercase crt-glow-soft">
                {area}
              </h2>
              <Badge
                variant="outline"
                className="shrink-0 font-mono text-[0.65rem]"
              >
                {areaTopics.length}
              </Badge>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {areaTopics.map((topic) => (
                <Card
                  key={topic.slug}
                  className="min-w-0 transition-colors hover:border-terminal-edge"
                >
                  <CardContent className="flex min-w-0 flex-col gap-2 p-3">
                    <Link
                      to={`/topic/${topic.slug}`}
                      className="text-xs font-medium text-balance hover:underline"
                    >
                      {topic.title}
                    </Link>
                    <p className="line-clamp-3 text-[0.72rem] leading-relaxed text-terminal-ink">
                      {topic.summary}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <span className="font-mono text-[0.65rem] text-terminal-ink">
                        {topic.readingMinutes} min
                      </span>
                      <Progress
                        value={topic.progress}
                        className="h-0.5 flex-1"
                        aria-label={`${topic.title} progress`}
                      />
                      <span className="font-mono text-[0.65rem] text-terminal-ink tabular-nums">
                        {topic.progress}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
