import * as React from "react"

import { Panel } from "@/components/panel"
import { tarkovTime } from "./tarkov-time"

function Clock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 border border-terminal-rule py-3">
      <span className="font-mono text-[0.6rem] tracking-[0.18em] text-terminal-chrome uppercase">
        {label}
      </span>
      <span className="font-mono text-lg text-primary tabular-nums crt-glow-soft">
        {value}
      </span>
    </div>
  )
}

export function OpsCenter() {
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { left, right } = tarkovTime(now)

  return (
    <Panel title="Raid clocks" tone="quiet">
      <div className="flex gap-2">
        <Clock label="Server 1" value={left} />
        <Clock label="Server 2" value={right} />
      </div>
      <p className="mt-2 font-mono text-[0.65rem] text-terminal-ink-dim">
        raid time runs at seven times the wall clock, and the two servers sit
        twelve hours apart
      </p>
    </Panel>
  )
}
