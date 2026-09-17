import { useState } from "react"

export function ArtworkImage({
  src,
  fallback,
}: {
  src?: string
  fallback?: string
}) {
  const [failed, setFailed] = useState<string[]>([])
  const url = [src, fallback].find((value) => value && !failed.includes(value))
  return url ? (
    <img
      key={url}
      src={url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed((current) => [...current, url])}
    />
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v6m0 8v6M2 12h6m8 0h6" />
    </svg>
  )
}
