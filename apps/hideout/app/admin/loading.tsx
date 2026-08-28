import { Spinner } from "@workspace/ui/components/spinner"

export default function AdminLoading() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-svh items-center justify-center gap-2 font-mono text-xs text-terminal-ink-dim"
    >
      <Spinner /> Reading content from disk…
    </main>
  )
}
