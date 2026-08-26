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
      <CrtScreen
        intensity="subtle"
        sweep
        className="border border-primary/25 bg-[color-mix(in_oklch,var(--card),var(--primary)_6%)]"
      >
        {/* Corner ticks — the frame reads as an instrument rather than a card. */}
        <span
          aria-hidden="true"
          className="absolute start-0 top-0 size-3 border-s border-t border-primary/50"
        />
        <span
          aria-hidden="true"
          className="absolute end-0 top-0 size-3 border-e border-t border-primary/50"
        />
        <span
          aria-hidden="true"
          className="absolute start-0 bottom-0 size-3 border-s border-b border-primary/50"
        />
        <span
          aria-hidden="true"
          className="absolute end-0 bottom-0 size-3 border-e border-b border-primary/50"
        />

        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-primary/90 uppercase crt-glow-soft">
              <span className="size-1 bg-primary shadow-[0_0_6px_var(--primary)]" />
              <ScrambleText text="terminal // sektant systems" speed={18} />
            </div>

            <AsciiBanner text="SKT CODEX" size="lg" />

            <p className="max-w-prose text-xs leading-relaxed text-foreground/80">
              <ScrambleText
                text="Reference and practice for real-time graphics, engine architecture and network simulation."
                speed={12}
              />
            </p>

            <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
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

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary crt-glow">
              <span className="text-foreground/75">~/codex</span>
              <span>$</span>
              <ScrambleText text="resume --last" speed={40} />
              <span className="motion-safe:animate-pulse">_</span>
            </div>
          </div>

          <AsciiSolid
            shape="sphere"
            columns={60}
            className="mx-auto hidden shrink-0 md:block"
          />
        </div>
      </CrtScreen>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TerminalFrame
          title="resume"
          status={inProgress.length ? "online" : "standby"}
          footer={`${inProgress.length} open`}
        >
          {inProgress.length ? (
            <ul className="divide-y divide-border">
              {inProgress.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    to={`/topic/${topic.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <IconBook className="size-4 shrink-0 text-foreground/75" />
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
                    <span className="shrink-0 font-mono text-[10px] text-foreground/75 tabular-nums">
                      {topic.progress}%
                    </span>
                    <IconArrowRight className="size-3.5 shrink-0 text-foreground/75" />
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
                className="shrink-0 font-mono text-[10px]"
              >
                {areaTopics.length}
              </Badge>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {areaTopics.map((topic) => (
                <Card
                  key={topic.slug}
                  className="min-w-0 transition-colors hover:border-primary/50"
                >
                  <CardContent className="flex min-w-0 flex-col gap-2 p-3">
                    <Link
                      to={`/topic/${topic.slug}`}
                      className="text-xs font-medium text-balance hover:underline"
                    >
                      {topic.title}
                    </Link>
                    <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground/75">
                      {topic.summary}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <span className="font-mono text-[10px] text-foreground/75">
                        {topic.readingMinutes} min
                      </span>
                      <Progress
                        value={topic.progress}
                        className="h-0.5 flex-1"
                        aria-label={`${topic.title} progress`}
                      />
                      <span className="font-mono text-[10px] text-foreground/75 tabular-nums">
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
