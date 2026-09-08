import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * An image from assets.tarkov.dev — an item icon, a trader portrait, a task
 * card. The snapshot carries the URL, not the file: baking 3,770 item icons
 * into the repo would cost more than the rest of the app put together.
 *
 * That is the one thing this app loads at runtime, so it is built to do
 * without: a failed or slow image leaves a bordered well the same size, and
 * the name beside it always carries the meaning on its own.
 *
 * `fit` is not decoration. Item icons are drawn to their own bounds and have
 * to be contained or they crop; task art and portraits are photographs at
 * their own aspect and have to be covered or they letterbox inside a frame
 * three times their height.
 */
export function GameImage({
  src,
  alt,
  fit = "contain",
  className,
}: {
  src: string | null
  alt: string
  fit?: "contain" | "cover"
  className?: string
}) {
  const [failed, setFailed] = React.useState(false)

  return (
    <span
      className={cn(
        "grid shrink-0 place-content-center overflow-hidden border border-terminal-rule/60 bg-sidebar/60",
        className
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "size-full",
            fit === "cover" ? "object-cover" : "object-contain"
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-mono text-[0.6rem] text-terminal-chrome-dim"
        >
          ??
        </span>
      )}
    </span>
  )
}
