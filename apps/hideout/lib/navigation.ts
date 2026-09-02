/**
 * Where this station can be steered, in one place.
 *
 * The same four listings were written out four times — the archive panel, the
 * breadcrumb's link map, the palette's page list and the front page's quick
 * links — and the three console events were re-declared beside every control
 * that fired them. Each copy was a chance for a surface to offer a route the
 * others did not, which is what "there are buttons everywhere and I cannot
 * tell which is which" actually is.
 *
 * A surface still decides how a destination is drawn: a key on the rail, a
 * row in a sheet, an entry in the palette. What it does not decide any more is
 * which destinations exist.
 */

export type Section = {
  /** Also the palette's search term and the tab strip's kind. */
  id: "posts" | "projects" | "games" | "about"
  label: string
  href: string
  /**
   * How the palette names it.
   *
   * Not derivable from the label: three of these are listings and read as
   * "All posts", and About is a page that happens to have a key beside them.
   */
  paletteLabel: string
  /** Extra words the palette matches on. */
  keywords: string
}

export const SECTIONS: Section[] = [
  {
    id: "posts",
    label: "posts",
    paletteLabel: "All posts",
    href: "/posts",
    keywords: "archive writing blog essays",
  },
  {
    id: "projects",
    label: "projects",
    paletteLabel: "All projects",
    href: "/projects",
    keywords: "work builds",
  },
  {
    id: "games",
    label: "games",
    paletteLabel: "All games",
    href: "/games",
    keywords: "play itch jam builds",
  },
  {
    id: "about",
    label: "about",
    paletteLabel: "About",
    href: "/about",
    keywords: "contact email radio operator",
  },
]

/**
 * Whether a route belongs to a listing.
 *
 * A document counts as its section: reading a post is being in the posts, and
 * a key that goes dark the moment you open one of its documents is reporting
 * that you left. `/` matches nothing — the front page is not a section.
 */
export function isSectionActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const SOCIAL_LINKS = [
  { label: "github", href: "https://github.com/sektant1" },
  { label: "youtube", href: "https://youtube.com/@sektant1swe" },
  { label: "rss", href: "/rss.xml" },
]

/** The person behind the operator callsign. */
export const BYLINE = {
  name: "gabriel fernandes",
  href: "https://www.linkedin.com/in/gabrielfernandesbr/",
}

/**
 * What the console can be told to do, as opposed to where it can be sent.
 *
 * Window events rather than a context: the listener is one component (the
 * palette, the log, the boot curtain) and the callers are scattered across
 * three shells, so the shell that fires one does not have to be an ancestor
 * of the one that answers.
 */
export const CONSOLE = {
  palette: "hideout:open-palette",
  log: "hideout:toggle-log",
  boot: "hideout:replay-boot",
} as const

export type ConsoleCommand = keyof typeof CONSOLE

export function fire(command: ConsoleCommand) {
  window.dispatchEvent(new Event(CONSOLE[command]))
}
