"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"

import { TextField } from "@/components/admin/fields"

/**
 * The CMS sign-in.
 *
 * It runs against credentials in .env.local and guards local file writes, not
 * anything published — so the screen says so rather than performing security
 * theatre with a lock icon.
 */
export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      })

      if (!response.ok) {
        // The API does not say which half was wrong, and neither does this.
        throw new Error("That username and password do not match.")
      }

      router.replace("/admin")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.")
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <TerminalFrame
        title="cms.local"
        footer="credentials come from .env.local"
        status={error ? "fault" : "online"}
        className="w-full max-w-sm bg-background"
      >
        <form onSubmit={submit} className="flex flex-col gap-4 p-4">
          <p className="text-xs text-terminal-ink-dim">
            Sign in to edit the MDX files in this working copy.
          </p>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Not signed in</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <TextField
            id="identifier"
            label="username"
            value={identifier}
            onChange={setIdentifier}
          />

          <TextField
            id="password"
            label="password"
            type="password"
            value={password}
            onChange={setPassword}
          />

          <Button type="submit" isDisabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </TerminalFrame>
    </main>
  )
}
