/**
 * Every string the front page renders, and the rules for editing them.
 *
 * The defaults below are the page as it shipped: the file under `content/`
 * only carries what the CMS changed, and a field left empty falls back here.
 * That keeps the front page whole no matter what is on disk — a half-written
 * JSON file, a field cleared by accident, or no file at all.
 *
 * Pure on purpose: no fs, no path aliases. `home.ts` reads, `lib/cms/home.ts`
 * writes, and both share this.
 */

import {
  DEFAULT_RENDER_STYLE,
  isRenderStyle,
  type RenderStyle,
} from "../render-style"

export type HomeQuickLink = {
  label: string
  href: string
}

export type HomeSection = {
  path: string
  title: string
  actionLabel: string
}

export type HomeContent = {
  render: {
    /** How the globe and the boot coin are drawn. */
    style: RenderStyle
  }
  hero: {
    systemLabel: string
    systemUnit: string
    linkStatus: string
    bannerWide: string
    bannerStackedTop: string
    bannerStackedBottom: string
    srTitle: string
    tagline: string
    description: string
    operator: string
    summaryTitle: string
    summaryRef: string
    metricPosts: string
    metricProjects: string
    metricMinutes: string
    quickAccessTitle: string
    quickAccessRef: string
    quickLinks: HomeQuickLink[]
    tagsTitle: string
    tagsRef: string
    globeTitle: string
    globeFooterEnd: string
  }
  sections: {
    posts: HomeSection
    games: HomeSection
    projects: HomeSection
  }
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  render: { style: DEFAULT_RENDER_STYLE },
  hero: {
    systemLabel: "СИСТЕМА //",
    systemUnit: "СКТ-01",
    linkStatus: "СВЯЗЬ: УСТ.",
    bannerWide: "SEKTANT HIDEOUT",
    bannerStackedTop: "SEKTANT",
    bannerStackedBottom: "HIDEOUT",
    srTitle: "Sektant's Hideout",
    tagline: "// TUBE WARM. LOG OPEN.",
    description: "man cave for essays, tinkering, and things I built",
    operator: "ОПЕРАТОР // SEKTANT1",
    summaryTitle: "АРХИВ // СВОДКА",
    summaryRef: "BUF 001",
    metricPosts: "POSTS",
    metricProjects: "PROJECTS",
    metricMinutes: "READ MIN",
    quickAccessTitle: "БЫСТРЫЙ ДОСТУП",
    quickAccessRef: "NAV // 03",
    quickLinks: [
      { label: "FIELD NOTES", href: "/posts" },
      { label: "PROJECT ARCHIVE", href: "/projects" },
      { label: "PLAYABLE BUILDS", href: "/games" },
    ],
    tagsTitle: "ИНДЕКС // ТЕГИ",
    tagsRef: "IDX // TAG",
    globeTitle: "ОБЪЕКТ 01 // GEO NODE",
    globeFooterEnd: "DRAG // SLEW",
  },
  sections: {
    posts: {
      path: "content/posts",
      title: "LATEST",
      actionLabel: "all posts",
    },
    games: {
      path: "content/games",
      title: "GAMES",
      actionLabel: "all games",
    },
    projects: {
      path: "content/projects",
      title: "THINGS I BUILT",
      actionLabel: "all projects",
    },
  },
}

// The banner is drawn with a figlet-style ASCII font, which has no glyphs
// outside printable ASCII. Cyrillic renders as blanks there, so it is refused
// in the banner fields and allowed everywhere else — the chrome labels are
// Cyrillic on purpose.
const ASCII_ONLY = /^[\x20-\x7e]*$/
const BANNER_FIELDS = [
  "bannerWide",
  "bannerStackedTop",
  "bannerStackedBottom",
] as const

const MAX_LENGTH = 240
const MAX_QUICK_LINKS = 8

export class HomeContentError extends Error {}

function fail(message: string): never {
  throw new HomeContentError(message)
}

function asText(
  value: unknown,
  fallback: string,
  label: string,
  max = MAX_LENGTH
) {
  if (value === undefined || value === null) return fallback
  if (typeof value !== "string") fail(`${label} must be text.`)
  const trimmed = value.trim()
  // Clearing a field is how you ask for the original back, rather than an
  // empty slot in the layout.
  if (!trimmed) return fallback
  if (trimmed.length > max) fail(`${label} is longer than ${max} characters.`)
  if (/[\p{Cc}]/u.test(trimmed))
    fail(`${label} cannot contain control characters.`)
  return trimmed
}

function asAscii(value: unknown, fallback: string, label: string) {
  const text = asText(value, fallback, label, 64)
  if (!ASCII_ONLY.test(text)) {
    fail(
      `${label} is drawn as ASCII art, so it cannot use non-ASCII characters.`
    )
  }
  return text
}

function asHref(value: unknown, fallback: string, label: string) {
  const href = asText(value, fallback, label)
  if (href.startsWith("/")) {
    if (href.includes("..")) fail(`${label} cannot traverse with "..".`)
    return href
  }
  if (/^https?:\/\/\S+$/i.test(href)) return href
  fail(`${label} must be a site path like /posts, or a full http(s) URL.`)
}

function asQuickLinks(value: unknown, fallback: HomeQuickLink[]) {
  if (value === undefined || value === null) return fallback
  if (!Array.isArray(value)) fail("Quick links must be a list.")

  const links = value
    // A row the editor blanked out entirely is a removal, not an error.
    .filter((entry) => {
      if (!entry || typeof entry !== "object") return false
      const data = entry as Record<string, unknown>
      return Boolean(asString(data.label) || asString(data.href))
    })
    .map((entry, index) => {
      const data = entry as Record<string, unknown>
      const position = `Quick link ${index + 1}`
      const label = asString(data.label)
      const href = asString(data.href)
      if (!label) fail(`${position} needs a label.`)
      if (!href) fail(`${position} needs a destination.`)
      return {
        label: asText(label, "", `${position} label`, 48),
        href: asHref(href, "", `${position} destination`),
      }
    })

  if (!links.length) return fallback
  if (links.length > MAX_QUICK_LINKS) {
    fail(`Quick access takes at most ${MAX_QUICK_LINKS} links.`)
  }
  return links
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === undefined || value === null) return {}
  if (typeof value !== "object" || Array.isArray(value))
    fail(`${label} must be an object.`)
  return value as Record<string, unknown>
}

function normalizeSection(
  value: unknown,
  fallback: HomeSection,
  label: string
): HomeSection {
  const data = asRecord(value, label)
  return {
    path: asText(data.path, fallback.path, `${label} path`, 80),
    title: asText(data.title, fallback.title, `${label} title`, 80),
    actionLabel: asText(
      data.actionLabel,
      fallback.actionLabel,
      `${label} link label`,
      48
    ),
  }
}

/**
 * Turns anything — a parsed JSON file, a form submission — into content the
 * page can render, filling every gap from the defaults. Throws
 * HomeContentError with a message meant for the editor when a value is
 * present but unusable.
 */
export function normalizeHomeContent(input: unknown): HomeContent {
  const root = asRecord(input, "Home content")
  const hero = asRecord(root.hero, "Hero")
  const sections = asRecord(root.sections, "Sections")
  const d = DEFAULT_HOME_CONTENT

  const render = asRecord(root.render, "Render")

  const normalized: HomeContent = {
    // An unknown style is a file written by hand, and the page still has to
    // draw something: it falls back rather than refusing to render.
    render: {
      style: isRenderStyle(render.style) ? render.style : d.render.style,
    },
    hero: {
      systemLabel: asText(
        hero.systemLabel,
        d.hero.systemLabel,
        "System label",
        48
      ),
      systemUnit: asText(hero.systemUnit, d.hero.systemUnit, "System unit", 48),
      linkStatus: asText(hero.linkStatus, d.hero.linkStatus, "Link status", 48),
      bannerWide: asAscii(hero.bannerWide, d.hero.bannerWide, "Wide banner"),
      bannerStackedTop: asAscii(
        hero.bannerStackedTop,
        d.hero.bannerStackedTop,
        "Stacked banner, first line"
      ),
      bannerStackedBottom: asAscii(
        hero.bannerStackedBottom,
        d.hero.bannerStackedBottom,
        "Stacked banner, second line"
      ),
      srTitle: asText(hero.srTitle, d.hero.srTitle, "Screen-reader title", 80),
      tagline: asText(hero.tagline, d.hero.tagline, "Tagline"),
      description: asText(
        hero.description,
        d.hero.description,
        "Description",
        400
      ),
      operator: asText(hero.operator, d.hero.operator, "Operator line", 48),
      summaryTitle: asText(
        hero.summaryTitle,
        d.hero.summaryTitle,
        "Summary title",
        48
      ),
      summaryRef: asText(
        hero.summaryRef,
        d.hero.summaryRef,
        "Summary reference",
        24
      ),
      metricPosts: asText(
        hero.metricPosts,
        d.hero.metricPosts,
        "Posts metric label",
        24
      ),
      metricProjects: asText(
        hero.metricProjects,
        d.hero.metricProjects,
        "Projects metric label",
        24
      ),
      metricMinutes: asText(
        hero.metricMinutes,
        d.hero.metricMinutes,
        "Reading metric label",
        24
      ),
      quickAccessTitle: asText(
        hero.quickAccessTitle,
        d.hero.quickAccessTitle,
        "Quick access title",
        48
      ),
      quickAccessRef: asText(
        hero.quickAccessRef,
        d.hero.quickAccessRef,
        "Quick access reference",
        24
      ),
      quickLinks: asQuickLinks(hero.quickLinks, d.hero.quickLinks),
      tagsTitle: asText(
        hero.tagsTitle,
        d.hero.tagsTitle,
        "Tag index title",
        48
      ),
      tagsRef: asText(hero.tagsRef, d.hero.tagsRef, "Tag index reference", 24),
      globeTitle: asText(
        hero.globeTitle,
        d.hero.globeTitle,
        "Globe caption",
        48
      ),
      globeFooterEnd: asText(
        hero.globeFooterEnd,
        d.hero.globeFooterEnd,
        "Globe footer, right",
        48
      ),
    },
    sections: {
      posts: normalizeSection(
        sections.posts,
        d.sections.posts,
        "Posts section"
      ),
      games: normalizeSection(
        sections.games,
        d.sections.games,
        "Games section"
      ),
      projects: normalizeSection(
        sections.projects,
        d.sections.projects,
        "Projects section"
      ),
    },
  }

  return normalized
}

export { BANNER_FIELDS, MAX_QUICK_LINKS }
