export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sektant.dev"
).replace(/\/$/, "")
export const SITE_NAME = "Sektant's Hideout"
export const SITE_DESCRIPTION = "i make computer do cool stuff"
export const SITE_AUTHOR = "Sektant1"
export const SITE_LOCALE = "en_US"
export const SITE_KEYWORDS = [
  "neovim",
  "vim",
  "claude code",
  "react",
  "frontend",
  "dev blog",
  "phosphor ui",
  "terminal aesthetic",
  "mdx",
  "indie dev",
]

export function absUrl(path: string): string {
  if (!path) return SITE_URL
  if (/^https?:/i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
