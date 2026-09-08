import type * as React from "react"
import { NavLink } from "react-router"

import { cn } from "@workspace/ui/lib/utils"

import { snapshot } from "@/data/snapshot"
import { useProgress, useProgressActions } from "@/state/progress"
import { storageAvailable } from "@/state/storage"
import { KeyButton } from "./key-button"

const NAV = [
  { to: "/", label: "СВОДКА", srLabel: "Dashboard" },
  { to: "/raid", label: "ВЫЛАЗ", srLabel: "Raid planner" },
]

/** Read once: whether this browser will keep anything at all. */
const canStore = storageAvailable()

function snapshotDate() {
  return snapshot.meta.generatedAt.slice(0, 10)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const progress = useProgress()
  const { setLevel, setFaction, setFenceRep } = useProgressActions()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div
        aria-hidden="true"
        className="flex h-5 shrink-0 items-center justify-center border-b border-terminal-rule bg-sidebar font-mono text-[0.6rem] tracking-[0.35em] text-terminal-chrome-dim uppercase select-none"
      >
        {`// вылаз // pre-raid planning //`}
      </div>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-terminal-rule px-3 py-2">
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "inline-flex min-h-11 items-center gap-1.5 px-2 font-mono text-[0.7rem] tracking-[0.14em] uppercase md:min-h-0",
                  isActive
                    ? "text-primary crt-glow-soft"
                    : "text-terminal-chrome hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span aria-hidden="true">{isActive ? "[>]" : "[ ]"}</span>
                  <span aria-hidden="true">{item.label}</span>
                  <span className="sr-only">{item.srLabel}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:ml-auto">
          <label className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.12em] text-terminal-ink-dim uppercase">
            LEVEL
            <input
              type="number"
              min={1}
              max={79}
              value={progress.level}
              onChange={(event) =>
                setLevel(Math.max(1, Number(event.target.value) || 1))
              }
              className="w-16 border border-terminal-rule bg-transparent px-2 py-1 text-right font-mono text-[0.7rem] text-primary tabular-nums focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            />
          </label>

          <div className="flex items-center gap-1">
            {(["USEC", "BEAR"] as const).map((faction) => (
              <KeyButton
                key={faction}
                className="min-h-9 md:min-h-0"
                active={progress.faction === faction}
                onClick={() => setFaction(faction)}
              >
                {faction}
              </KeyButton>
            ))}
          </div>

          <label className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.12em] text-terminal-ink-dim uppercase">
            FENCE REP
            <input
              type="number"
              step={0.01}
              value={progress.fenceRep}
              onChange={(event) => setFenceRep(Number(event.target.value) || 0)}
              className="w-20 border border-terminal-rule bg-transparent px-2 py-1 text-right font-mono text-[0.7rem] text-primary tabular-nums focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            />
          </label>

          <span className="font-mono text-[0.65rem] tracking-[0.12em] text-terminal-chrome-dim uppercase">
            <span aria-hidden="true">ДАННЫЕ</span>
            <span className="sr-only">Snapshot date</span> // {snapshotDate()}
          </span>
        </div>
      </header>

      {canStore ? null : (
        <p className="border-b border-destructive/40 bg-destructive/10 px-3 py-1.5 font-mono text-[0.7rem] text-destructive">
          <span aria-hidden="true">СЕАНС // ПАМЯТЬ НЕДОСТУПНА</span>{" "}
          <span className="text-terminal-ink-dim">
            this browser refuses storage, so progress will not survive the tab
          </span>
        </p>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 p-3 md:p-4">
        {children}
      </main>
    </div>
  )
}
