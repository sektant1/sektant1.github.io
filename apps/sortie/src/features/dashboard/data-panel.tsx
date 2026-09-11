import * as React from "react"

import { KeyButton } from "@/components/key-button"
import { Panel } from "@/components/panel"
import { snapshotDate } from "@/data/snapshot"
import { buildExport, readImport, type ImportPreview } from "@/state/import"
import type { Progress } from "@/state/storage"

function download(progress: Progress) {
  const blob = new Blob([JSON.stringify(buildExport(progress), null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `sortie-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Where the snapshot's own numbers are on show, and where progress comes in
 * and out. An import replaces everything, so it is previewed first — the
 * player sees what was understood before anything is applied.
 */
export function DataPanel({
  progress,
  onApply,
}: {
  progress: Progress
  onApply: (progress: Progress) => void
}) {
  const [preview, setPreview] = React.useState<ImportPreview | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setPreview(readImport(JSON.parse(await file.text())))
    } catch {
      setPreview({ source: null, error: "that file is not valid JSON" })
    }
    event.target.value = ""
  }

  return (
    <Panel title="Snapshot and files" tone="quiet">
      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[0.65rem] text-terminal-ink-dim uppercase">
        <div className="flex justify-between gap-2">
          <dt>built</dt>
          <dd className="text-primary tabular-nums">
            {snapshotDate()}
          </dd>
        </div>
        {Object.entries(snapshot.meta.counts).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <dt>{key}</dt>
            <dd className="text-primary tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-1">
        <KeyButton onClick={() => download(progress)}>export</KeyButton>
        <KeyButton onClick={() => fileRef.current?.click()}>import</KeyButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
      </div>

      {preview ? (
        <div className="mt-3 border border-terminal-rule p-2">
          {preview.source === null ? (
            <p className="font-mono text-xs text-destructive">
              {preview.error}
            </p>
          ) : (
            <>
              <p className="font-mono text-[0.65rem] tracking-[0.14em] text-terminal-chrome uppercase">
                {preview.source}
              </p>
              <ul className="mt-1 mb-2 flex flex-col font-mono text-xs text-foreground">
                {preview.summary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mb-2 font-mono text-[0.65rem] text-terminal-ink-dim">
                applying this replaces everything recorded here
              </p>
              <div className="flex gap-1">
                <KeyButton
                  onClick={() => {
                    onApply(preview.progress)
                    setPreview(null)
                  }}
                >
                  apply
                </KeyButton>
                <KeyButton onClick={() => setPreview(null)}>cancel</KeyButton>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="mt-2 font-mono text-[0.65rem] text-terminal-ink-dim">
          reads a sortie export, a TarkovTracker backup, or a tarkov.dev profile
        </p>
      )}
    </Panel>
  )
}
