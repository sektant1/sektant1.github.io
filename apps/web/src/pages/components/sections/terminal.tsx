import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"
import { AsciiSolid } from "@workspace/ui/components/ascii-solid"
import { BootLog } from "@workspace/ui/components/boot-log"
import { Button } from "@workspace/ui/components/button"
import { CrtScreen } from "@workspace/ui/components/crt-screen"
import { ScrambleText } from "@workspace/ui/components/scramble-text"
import { Sidebar, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Toaster, toast } from "sonner"
import { ChartContainer, ChartTooltip } from "@workspace/ui/components/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Row, type SectionMap } from "@/pages/components/section"

const CHART_DATA = [
  { frame: "0", ms: 14 },
  { frame: "1", ms: 16 },
  { frame: "2", ms: 12 },
  { frame: "3", ms: 22 },
  { frame: "4", ms: 15 },
  { frame: "5", ms: 13 },
]

const CHART_CONFIG = {
  ms: { label: "Frame time", color: "var(--chart-1)" },
}

export const terminal: SectionMap = {
  "ascii-banner": () => (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Row label="fonts">
        <span className="text-xs text-terminal-ink-dim">
          Slant, Standard, Small, Big, Banner3
        </span>
      </Row>
      <AsciiBanner text="SLANT" font="Slant" />
      <AsciiBanner text="STANDARD" font="Standard" tone="foreground" />
      <AsciiBanner text="SMALL" font="Small" tone="muted" effect="scanlines" />
      <AsciiBanner text="BANNER3" font="Banner3" effect="none" />
    </div>
  ),

  "ascii-solid": () => (
    <Row label="shapes">
      <AsciiSolid shape="sphere" columns={40} />
      <AsciiSolid shape="torus" columns={40} />
      <AsciiSolid shape="cube" columns={40} />
    </Row>
  ),

  "ascii-meter": () => (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <AsciiMeter label="power" value={0.82} unit="OK" />
      <AsciiMeter label="mem" value={0.41} tone="muted" unit="MB" />
      <AsciiMeter label="temp" value={0.95} tone="warning" unit="C" />
    </div>
  ),

  "boot-log": () => (
    <div className="w-full max-w-sm border border-border p-3">
      <BootLog
        lines={[
          { label: "power on self test", status: "ok" },
          { label: "mounting volumes", status: "ok" },
          { label: "thermal sensor", status: "warn" },
          { label: "network uplink", status: "fail" },
          { label: "optional module", status: "skip" },
        ]}
      />
    </div>
  ),

  "crt-screen": () => (
    <Row label="intensity">
      {(["subtle", "default", "heavy"] as const).map((intensity) => (
        <CrtScreen
          key={intensity}
          intensity={intensity}
          className="border border-border"
        >
          <div className="flex h-24 w-40 items-center justify-center font-mono text-xs">
            {intensity}
          </div>
        </CrtScreen>
      ))}
    </Row>
  ),

  "scramble-text": () => (
    <div className="flex flex-col gap-2 text-xs">
      <ScrambleText text="RESOLVING FROM NOISE" />
      <ScrambleText text="HOVER TO RUN AGAIN" scrambleOnHover />
    </div>
  ),

  "terminal-frame": () => (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {(["online", "standby", "fault"] as const).map((status) => (
        <div key={status} className="border border-border">
          <div className="p-3 text-xs">status: {status}</div>
        </div>
      ))}
      <span className="text-xs text-terminal-ink-dim">
        Every frame on this page is a TerminalFrame.
      </span>
    </div>
  ),

  sonner: () => (
    <Row label="toast">
      <Button
        variant="outline"
        onPress={() => toast.success("It worked", { description: "A toast." })}
      >
        Show a toast
      </Button>
      <Toaster position="bottom-right" />
    </Row>
  ),

  chart: () => (
    <div className="w-full max-w-md">
      <ChartContainer config={CHART_CONFIG} className="h-40 w-full">
        <AreaChart data={CHART_DATA}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="frame" tickLine={false} axisLine={false} />
          <ChartTooltip />
          <Area
            dataKey="ms"
            stroke="var(--color-ms)"
            fill="var(--color-ms)"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  ),

  sidebar: () => (
    <div className="h-48 w-full max-w-md overflow-hidden border border-border">
      <SidebarProvider className="min-h-0">
        <Sidebar collapsible="none" className="w-40">
          <div className="p-3 font-mono text-xs text-terminal-ink-dim">
            The shell's own sidebar is the live example.
          </div>
        </Sidebar>
      </SidebarProvider>
    </div>
  ),
}
