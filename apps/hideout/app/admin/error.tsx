"use client"

import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <TerminalFrame
        title="cms.local"
        status="fault"
        footer={error.digest ? `digest ${error.digest}` : undefined}
        className="w-full max-w-lg bg-background"
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-sans text-base text-foreground">
              The CMS could not finish that
            </h1>
            <p className="text-xs text-terminal-ink-dim">
              Nothing was written. The message below is what the filesystem
              reported.
            </p>
          </div>

          <pre className="overflow-x-auto border border-border p-2 font-mono text-[0.7rem] whitespace-pre-wrap text-terminal-ink">
            {error.message || "No message was reported."}
          </pre>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onPress={reset}>
              Try again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push("/admin")}
            >
              Back to the dashboard
            </Button>
          </div>
        </div>
      </TerminalFrame>
    </main>
  )
}
