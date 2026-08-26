import {
  IconAlertTriangle,
  IconFile,
  IconInfoCircle,
} from "@tabler/icons-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { AspectRatio } from "@workspace/ui/components/aspect-ratio"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { Progress } from "@workspace/ui/components/progress"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
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

import { Row, type SectionMap } from "@/pages/components/section"

export const layout: SectionMap = {
  accordion: () => (
    <div className="w-full max-w-md border border-border">
      <Accordion allowsMultipleExpanded>
        <AccordionItem id="one">
          <AccordionTrigger>First section</AccordionTrigger>
          <AccordionContent>
            <span className="text-xs">Body of the first section.</span>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="two">
          <AccordionTrigger>Second section</AccordionTrigger>
          <AccordionContent>
            <span className="text-xs">Body of the second section.</span>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),

  alert: () => (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert>
        <IconInfoCircle />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Something worth reading.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <IconAlertTriangle />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>Something that will bite.</AlertDescription>
      </Alert>
    </div>
  ),

  "aspect-ratio": () => (
    <Row label="16 / 9">
      <div className="w-64">
        <AspectRatio ratio={16 / 9} className="border border-border">
          <div className="size-full bg-gradient-to-br from-primary/30 to-transparent" />
        </AspectRatio>
      </div>
    </Row>
  ),

  breadcrumb: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Codex</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Rendering</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Current page</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),

  card: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>A short supporting line.</CardDescription>
      </CardHeader>
      <CardContent>
        <span className="text-xs">Body content lives here.</span>
      </CardContent>
    </Card>
  ),

  carousel: () => (
    <div className="w-full max-w-md px-12">
      <Carousel>
        <CarouselContent>
          {[1, 2, 3].map((slide) => (
            <CarouselItem key={slide} className="basis-1/2">
              <div className="flex h-24 items-center justify-center border border-border text-xs">
                slide {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),

  collapsible: () => (
    <div className="w-full max-w-sm">
      <Collapsible defaultExpanded>
        <CollapsibleTrigger className="text-xs">
          Toggle the panel
        </CollapsibleTrigger>
        <CollapsibleContent>
          <span className="text-xs text-terminal-ink-dim">
            Hidden until expanded.
          </span>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),

  calendar: () => (
    <div className="w-fit border border-border p-2">
      <Calendar aria-label="A date" />
    </div>
  ),

  empty: () => (
    <Empty className="w-full max-w-sm border border-border py-8">
      <EmptyTitle className="font-mono text-xs uppercase">
        Nothing here
      </EmptyTitle>
      <EmptyDescription>
        What to do about it goes in this line.
      </EmptyDescription>
      <Button size="sm" variant="outline" className="mt-3">
        Do the thing
      </Button>
    </Empty>
  ),

  item: () => (
    <div className="w-full max-w-sm border border-border">
      <Item>
        <ItemMedia>
          <IconFile />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>An item</ItemTitle>
          <ItemDescription>With a supporting line.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),

  pagination: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious />
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 font-mono text-xs tabular-nums">2 / 5</span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),

  progress: () => (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Row label="0%">
        <Progress value={0} className="w-48" aria-label="Empty" />
      </Row>
      <Row label="45%">
        <Progress value={45} className="w-48" aria-label="Part way" />
      </Row>
      <Row label="100%">
        <Progress value={100} className="w-48" aria-label="Full" />
      </Row>
    </div>
  ),

  resizable: () => (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-32 w-full max-w-md border border-border"
    >
      <ResizablePanel defaultSize={40}>
        <div className="p-3 text-xs">left</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <div className="p-3 text-xs">right</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),

  "scroll-area": () => (
    <ScrollArea className="h-32 w-full max-w-sm border border-border p-3">
      <div className="flex flex-col gap-2 text-xs">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index}>Scrollable line {index + 1}</span>
        ))}
      </div>
    </ScrollArea>
  ),

  table: () => (
    <div className="w-full max-w-md">
      <Table aria-label="Example">
        <TableHeader>
          <TableHead isRowHeader>Name</TableHead>
          <TableHead className="w-24 text-end">Value</TableHead>
        </TableHeader>
        <TableBody>
          {[
            ["alpha", "1"],
            ["beta", "2"],
            ["gamma", "3"],
          ].map(([name, value]) => (
            <TableRow key={name} id={name}>
              <TableCell>{name}</TableCell>
              <TableCell className="text-end font-mono tabular-nums">
                {value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),

  tabs: () => (
    <div className="w-full max-w-md">
      <Tabs aria-label="Example tabs" defaultSelectedKey="one">
        <TabsList>
          <TabsTrigger id="one">First</TabsTrigger>
          <TabsTrigger id="two">Second</TabsTrigger>
        </TabsList>
        <TabsContent id="one" className="pt-3 text-xs">
          First panel.
        </TabsContent>
        <TabsContent id="two" className="pt-3 text-xs">
          Second panel.
        </TabsContent>
      </Tabs>
    </div>
  ),
}
