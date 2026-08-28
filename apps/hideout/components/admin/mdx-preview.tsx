"use client"

import * as React from "react"
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote"
import { Spinner } from "@workspace/ui/components/spinner"

import { mdxElements } from "@/components/mdx/mdx-elements"

/**
 * Live preview of the MDX being written.
 *
 * Compilation happens on the server, because MDX has to be compiled to run and
 * shipping the compiler to the browser to preview a draft is not worth the
 * megabyte. Code fences render unhighlighted here — shiki is server-side, and
 * a writer checking their layout does not need the colours.
 *
 * Requests are debounced and the stale ones are dropped, so a fast typist does
 * not watch older responses overwrite newer ones.
 */
export function MdxPreview({ source }: { source: string }) {
  const [compiled, setCompiled] =
    React.useState<MDXRemoteSerializeResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setPending(true)
      fetch("/api/admin/mdx-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = await response.json()
          if (!response.ok)
            throw new Error(payload.error ?? "Could not compile MDX.")
          setCompiled(payload.mdx)
          setError(null)
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return
          setError(
            cause instanceof Error ? cause.message : "Could not compile MDX."
          )
        })
        .finally(() => {
          if (!controller.signal.aborted) setPending(false)
        })
    }, 400)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [source])

  if (error) {
    return (
      <div className="border border-destructive p-3">
        <p className="font-mono text-[0.7rem] tracking-widest text-destructive uppercase">
          MDX will not compile
        </p>
        <pre className="mt-2 overflow-x-auto font-mono text-[0.7rem] whitespace-pre-wrap text-terminal-ink-dim">
          {error}
        </pre>
      </div>
    )
  }

  if (!compiled) {
    return (
      <p className="flex items-center gap-2 py-6 font-mono text-[0.7rem] text-terminal-ink-faint">
        <Spinner /> Compiling preview…
      </p>
    )
  }

  return (
    <div className="prose" aria-busy={pending}>
      <MDXRemote {...compiled} components={PREVIEW_COMPONENTS} />
    </div>
  )
}

const PREVIEW_COMPONENTS = {
  // The same components the published page uses, so the preview cannot
  // disagree with it — except the fence, which is highlighted on the server.
  ...mdxElements,
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="overflow-x-auto border border-border bg-card p-3 font-mono text-xs"
      {...props}
    />
  ),
}
