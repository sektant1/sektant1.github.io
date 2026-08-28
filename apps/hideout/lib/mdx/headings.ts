import React from "react"
import { slugify } from "@/lib/mdx/slugify"

export function textFromReactNode(node: React.ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child)
      }
      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return textFromReactNode(child.props.children)
      }
      return ""
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export function createHeadingSlugger() {
  const counts = new Map<string, number>()

  return (value: string) => {
    const base = slugify(value) || "section"
    const next = (counts.get(base) ?? 0) + 1
    counts.set(base, next)
    return next === 1 ? base : `${base}-${next}`
  }
}
