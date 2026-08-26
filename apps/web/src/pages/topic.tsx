import {
  IconAlertTriangle,
  IconClock,
  IconExternalLink,
} from "@tabler/icons-react"
import { Link, useParams } from "react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
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
import {
  HoverCard,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import { Kbd } from "@workspace/ui/components/kbd"
import { Progress } from "@workspace/ui/components/progress"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

import { topicBySlug, topics } from "@/data/topics"

export function Topic() {
  const { slug = "" } = useParams()
  const topic = topicBySlug(slug)

  if (!topic) {
    return (
      <Empty className="py-16">
        <EmptyTitle className="font-mono text-xs uppercase">
          No such topic
        </EmptyTitle>
        <EmptyDescription>
          <code className="font-mono">{slug}</code> is not in the index.
        </EmptyDescription>
        <LinkButton href="/" variant="outline" size="sm" className="mt-3">
          Back to the codex
        </LinkButton>
      </Empty>
    )
  }

  const prerequisites = topic.prerequisites
    .map((prerequisite) => topics.find((item) => item.slug === prerequisite))
    .filter((item) => item !== undefined)

  return (
    <article className="flex max-w-5xl min-w-0 flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Codex</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{topic.area}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{topic.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex min-w-0 flex-col gap-3">
        <AsciiBanner text={topic.area} size="sm" tone="muted" />
        <h1 className="text-xl font-medium text-balance">{topic.title}</h1>
        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          {topic.summary}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="font-mono text-[0.65rem]">
            {topic.area}
          </Badge>

          <TooltipTrigger>
            <Button
              variant="ghost"
              size="xs"
              className="gap-1 text-muted-foreground"
            >
              <IconClock />
              {topic.readingMinutes} min
            </Button>
            <Tooltip>
              Estimated at 200 words per minute, code blocks excluded.
            </Tooltip>
          </TooltipTrigger>

          <div className="flex min-w-[8rem] flex-1 items-center gap-2">
            <Progress
              value={topic.progress}
              className="h-1 flex-1"
              aria-label="Reading progress"
            />
            <span className="font-mono text-[0.65rem] text-muted-foreground tabular-nums">
              {topic.progress}%
            </span>
          </div>
        </div>

        {prerequisites.length ? (
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem]">
            <span className="font-mono tracking-widest text-muted-foreground uppercase">
              Requires
            </span>
            {prerequisites.map((prerequisite) => (
              <HoverCardTrigger key={prerequisite.slug}>
                <Link
                  to={`/topic/${prerequisite.slug}`}
                  className="text-primary underline underline-offset-4"
                >
                  {prerequisite.title}
                </Link>
                <HoverCard className="max-w-xs">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">
                      {prerequisite.title}
                    </span>
                    <span className="text-[0.72rem] leading-relaxed text-muted-foreground">
                      {prerequisite.summary}
                    </span>
                  </div>
                </HoverCard>
              </HoverCardTrigger>
            ))}
          </div>
        ) : null}
      </header>

      <Separator />

      <Tabs defaultSelectedKey="reference">
        <TabsList>
          <TabsTrigger id="reference">Reference</TabsTrigger>
          <TabsTrigger id="caveats">
            Caveats
            <Badge
              variant="secondary"
              className="ms-1.5 font-mono text-[0.65rem]"
            >
              {topic.caveats.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger id="references">Sources</TabsTrigger>
        </TabsList>

        <TabsContent id="reference" className="flex flex-col gap-6 pt-4">
          {topic.sections.map((section) => (
            <section
              key={section.heading}
              className="flex min-w-0 flex-col gap-2"
            >
              <h2 className="font-mono text-xs tracking-widest uppercase">
                {section.heading}
              </h2>
              <p className="max-w-prose text-xs leading-relaxed">
                {section.body}
              </p>

              {section.code ? (
                <TerminalFrame
                  title={section.code.lang}
                  status="standby"
                  className="mt-1"
                >
                  {/* The code scrolls inside its own box; the page never
                      scrolls sideways because of a long line. */}
                  <ScrollArea className="w-full">
                    <pre className="overflow-x-auto p-3 font-mono text-[0.72rem] leading-relaxed">
                      {section.code.source}
                    </pre>
                  </ScrollArea>
                </TerminalFrame>
              ) : null}
            </section>
          ))}

          <footer className="flex items-center gap-2 pt-2 text-[0.72rem] text-muted-foreground">
            Press <Kbd>j</Kbd> and <Kbd>k</Kbd> to move between sections.
          </footer>
        </TabsContent>

        <TabsContent id="caveats" className="flex flex-col gap-3 pt-4">
          {topic.caveats.map((caveat, index) => (
            <Alert
              key={caveat}
              variant={index === 0 ? "destructive" : "default"}
            >
              <IconAlertTriangle />
              <AlertDescription>{caveat}</AlertDescription>
            </Alert>
          ))}
        </TabsContent>

        <TabsContent id="references" className="pt-4">
          <Table>
            <TableHeader>
              <TableHead isRowHeader>Source</TableHead>
              <TableHead className="w-24 text-end">Link</TableHead>
            </TableHeader>
            <TableBody>
              {topic.references.map((reference) => (
                <TableRow key={reference.href} id={reference.href}>
                  <TableCell className="text-xs">{reference.label}</TableCell>
                  <TableCell className="text-end">
                    <a
                      href={reference.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[0.72rem] text-primary underline underline-offset-4"
                    >
                      open
                      <IconExternalLink className="size-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </article>
  )
}
