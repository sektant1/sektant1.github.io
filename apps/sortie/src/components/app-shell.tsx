import type * as React from "react"
import { NavLink } from "react-router"

import { cn } from "@workspace/ui/lib/utils"

import { snapshotDate } from "@/data/snapshot"
import { useProgress, useProgressActions } from "@/state/progress"
import { storageAvailable } from "@/state/storage"
import { Segmented } from "./segmented"

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/raid", label: "Raid planner" },
]

/** Read once: whether this browser will keep anything at all. */
const canStore = storageAvailable()

export function AppShell({ children }: { children: React.ReactNode }) {
  const progress = useProgress()
  const { setLevel, setFaction, setFenceRep } = useProgressActions()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div
        aria-hidden="true"
        className="flex h-5 shrink-0 items-center justify-center border-b border-terminal-rule bg-sidebar font-mono text-[0.6rem] tracking-[0.35em] text-terminal-chrome-dim uppercase select-none"
      >
        {`// sortie // pre-raid planning //`}
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
                  "inline-flex min-h-11 items-center gap-1.5 px-2 font-sans text-[0.75rem] font-bold tracking-[0.14em] uppercase md:min-h-0",
                  isActive
                    ? "text-primary crt-glow-soft"
                    : "text-terminal-chrome hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span aria-hidden="true">{isActive ? "[>]" : "[ ]"}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* One instrument cluster, divided, rather than five loose boxes:
            these four readings belong together and are read together. */}
        <div className="flex min-w-0 flex-wrap items-stretch gap-2 md:ml-auto">
          <div className="flex items-stretch divide-x divide-terminal-rule border border-terminal-rule">
            <label className="flex items-center gap-2 px-2">
              <span className="font-mono text-[0.6rem] tracking-[0.14em] text-terminal-ink-dim uppercase">
                Level
              </span>
              <input
                type="number"
                min={1}
                max={79}
                value={progress.level}
                onChange={(event) =>
                  setLevel(Math.max(1, Number(event.target.value) || 1))
                }
                className="w-12 bg-transparent py-1.5 text-right font-mono text-sm text-primary tabular-nums focus-visible:outline-none"
              />
            </label>

            <label className="flex items-center gap-2 px-2">
              <span className="font-mono text-[0.6rem] tracking-[0.14em] text-terminal-ink-dim uppercase">
                Fence rep
              </span>
              <input
                type="number"
                step={0.01}
                value={progress.fenceRep}
                onChange={(event) =>
                  setFenceRep(Number(event.target.value) || 0)
                }
                className="w-16 bg-transparent py-1.5 text-right font-mono text-sm text-primary tabular-nums focus-visible:outline-none"
              />
            </label>
          </div>

          <Segmented
            label="PMC faction"
            size="compact"
            value={progress.faction}
            onChange={setFaction}
            options={[
              { value: "USEC", label: "USEC" },
              { value: "BEAR", label: "BEAR" },
            ]}
          />

          <span
            className="self-center font-mono text-[0.6rem] tracking-[0.14em] text-terminal-chrome-dim uppercase"
            title="When the Tarkov data this app ships was built"
          >
            Data {snapshotDate()}
          </span>
        </div>
      </header>

      {canStore ? null : (
        <p className="border-b border-destructive/40 bg-destructive/10 px-3 py-1.5 font-mono text-[0.7rem] text-destructive">
          NO STORAGE{" "}
          <span className="text-terminal-ink-dim">
            — this browser refuses it, so progress will not survive the tab
          </span>
        </p>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 p-3 md:p-4">
        {children}
      </main>
    </div>
  )
}
