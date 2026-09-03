"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@workspace/ui/lib/utils"

const ModelLayer = dynamic(
  () => import("./model-icon-layer").then((module) => module.ModelIconLayer),
  { ssr: false }
)

export type ModelFront = "auto" | "x" | "-x" | "y" | "-y" | "z" | "-z"

export function ModelIconLayer({
  mediaQuery = "(min-width: 48rem)",
}: {
  mediaQuery?: string
}) {
  const wide = React.useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(mediaQuery)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    () => window.matchMedia(mediaQuery).matches,
    () => false
  )

  return wide ? <ModelLayer /> : null
}

export function ModelIcon({
  src,
  front = "auto",
  fallback,
  className,
}: {
  src: string
  front?: ModelFront
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <span
      data-model-icon={src}
      data-model-front={front}
      aria-hidden="true"
      className={cn(
        "model-icon-target flex shrink-0 items-center justify-center overflow-hidden",
        className
      )}
    >
      <span className="model-icon-fallback">{fallback}</span>
    </span>
  )
}
