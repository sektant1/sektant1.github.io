import React from "react"

import { CodeBlock } from "@/components/mdx/code-block"
import { mdxElements } from "@/components/mdx/mdx-elements"
import { createHeadingSlugger, textFromReactNode } from "@/lib/mdx/headings"
import { highlightCode } from "@/lib/mdx/highlight"

export { EndOfFile } from "@/components/mdx/mdx-elements"

type CodeProps = { code: string; lang: string; filename?: string }

/** Pulls the fence's code, language and filename out of MDX's <pre><code>. */
function readFence(children: React.ReactNode): CodeProps {
  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>
  > | null
  const props = (child?.props ?? {}) as Record<string, unknown>
  const className = typeof props.className === "string" ? props.className : ""

  return {
    code: String(props.children ?? "").replace(/\n$/, ""),
    lang: className.replace("language-", "") || "text",
    filename:
      typeof props["data-filename"] === "string"
        ? props["data-filename"]
        : undefined,
  }
}

/**
 * The MDX element map used to render published pages.
 *
 * Prose elements are left as plain tags and styled by the `.prose` rules — a
 * component per tag would put the same three utility classes in twenty files.
 * Only the elements that need behaviour are components, and the ones that need
 * no server work come from mdx-elements so the CMS preview can share them.
 *
 * A fresh slugger per render, not a module-level one: heading ids have to
 * match the table of contents, and a shared counter would drift as soon as two
 * posts rendered in the same process.
 */
export function createMdxComponents() {
  const slug = createHeadingSlugger()

  const heading = (Tag: "h1" | "h2" | "h3" | "h4" | "h5", marker: string) =>
    function MdxHeading({
      children,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) {
      const id = slug(textFromReactNode(children))

      return (
        <Tag id={id} {...props}>
          {/* The marker the heading was written with, doubling as its anchor.
              It sits in the margin rather than in the line, so every heading
              starts on the same left edge as the body text no matter its
              depth — and the one structural mark on the page also does
              something: it is how you link to a section. */}
          <a
            href={`#${id}`}
            className="prose-anchor"
            aria-label="Link to this section"
          >
            {marker}
          </a>
          {children}
        </Tag>
      )
    }

  return {
    ...mdxElements,
    h1: heading("h1", "#"),
    h2: heading("h2", "##"),
    h3: heading("h3", "###"),
    h4: heading("h4", "####"),
    h5: heading("h5", "#####"),
    pre: HighlightedFence,
  }
}

async function HighlightedFence({
  children,
}: React.HTMLAttributes<HTMLPreElement>) {
  const { code, lang, filename } = readFence(children)
  const html = await highlightCode(code, lang)

  return <CodeBlock code={code} lang={lang} filename={filename} html={html} />
}
