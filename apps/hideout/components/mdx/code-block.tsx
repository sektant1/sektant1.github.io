"use client"

import * as React from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

type CodeBlockProps = {
  code: string
  lang: string
  filename?: string
  /** Pre-highlighted markup from shiki, rendered on the server. */
  html: string
}

/**
 * A code block dressed as an open file.
 *
 * The header carries the filename when the fence declares one, because in a
 * post about configuring something, *which file* is half the instruction. The
 * language sits on the right as a fallback label when there is no filename.
 */
export function CodeBlock({ code, lang, filename, html }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <figure className="my-5 border border-border">
      <figcaption className="flex items-center gap-2 border-b border-border bg-card px-2 py-1">
        <span className="min-w-0 flex-1 truncate font-mono text-[0.65rem] text-terminal-ink-dim">
          {filename ?? lang}
        </span>

        {filename ? (
          <span className="shrink-0 font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
            {lang}
          </span>
        ) : null}

        <Button
          variant="ghost"
          size="xs"
          onPress={() => {
            void navigator.clipboard.writeText(code).then(() => setCopied(true))
          }}
        >
          {copied ? (
            <IconCheck data-icon="inline-start" aria-hidden="true" />
          ) : (
            <IconCopy data-icon="inline-start" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </figcaption>

      {/* shiki emits its own <pre>; the overflow container is ours so a long
          line scrolls inside the block instead of widening the page. */}
      <div
        className="overflow-x-auto [&_pre]:m-0 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  )
}
