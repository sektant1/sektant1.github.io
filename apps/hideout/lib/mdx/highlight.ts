import "server-only"

import {
  createHighlighter,
  type Highlighter,
  type ThemeRegistration,
} from "shiki"

/**
 * A monochrome phosphor syntax theme.
 *
 * A single-gun tube cannot produce a rainbow, and the rest of the site is
 * built on that: charts, the sidebar, the whole palette. Code follows the same
 * rule. Meaning is carried by brightness rather than hue — the tokens a reader
 * scans for (keywords, function names) burn brightest, the ones they skip
 * (comments, punctuation) sit near the background. The one exception is cyan
 * for strings and literals, which is the second gun the theme already names.
 *
 * Values are the phosphor ramp as hex, because a TextMate theme has no access
 * to the CSS custom properties the rest of the site uses.
 */
const TUBE = {
  bright: "#d6ffe6",
  primary: "#35ff80",
  mid: "#7dffab",
  dim: "#2ee06e",
  faint: "#1c8a44",
  cyan: "#00cec8",
  danger: "#ff3a3a",
  bg: "#020d06",
} as const

const phosphorTheme: ThemeRegistration = {
  name: "phosphor",
  type: "dark",
  colors: {
    "editor.background": TUBE.bg,
    "editor.foreground": TUBE.bright,
  },
  settings: [
    { settings: { background: TUBE.bg, foreground: TUBE.bright } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: TUBE.faint, fontStyle: "italic" },
    },
    {
      scope: ["punctuation", "meta.brace", "meta.delimiter"],
      settings: { foreground: TUBE.dim },
    },
    {
      scope: ["keyword", "storage", "storage.type", "keyword.control"],
      settings: { foreground: TUBE.primary, fontStyle: "bold" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: TUBE.primary },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
      ],
      settings: { foreground: TUBE.mid },
    },
    {
      scope: [
        "string",
        "constant.numeric",
        "constant.language",
        "constant.character",
      ],
      settings: { foreground: TUBE.cyan },
    },
    {
      scope: ["variable", "variable.parameter", "meta.object-literal.key"],
      settings: { foreground: TUBE.bright },
    },
    {
      scope: ["entity.name.tag", "entity.other.attribute-name"],
      settings: { foreground: TUBE.mid },
    },
    {
      scope: ["invalid", "markup.deleted"],
      settings: { foreground: TUBE.danger },
    },
  ],
}

// The languages posts actually use. Loading the full grammar set costs
// hundreds of milliseconds per build and megabytes of memory for languages
// nothing here writes in.
const LANGS = [
  "bash",
  "c",
  "cpp",
  "css",
  "diff",
  "go",
  "html",
  "json",
  "lua",
  "markdown",
  "python",
  "rust",
  "shell",
  "toml",
  "tsx",
  "typescript",
  "vim",
  "yaml",
] as const

// Built once per process and shared: every code block in every post during a
// static build goes through this one instance.
let highlighter: Promise<Highlighter> | null = null

function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: [phosphorTheme],
    langs: [...LANGS],
  })
  return highlighter
}

/** Renders code to HTML. Unknown languages fall back to plain text. */
export async function highlightCode(code: string, lang: string) {
  const shiki = await getHighlighter()
  const loaded = shiki.getLoadedLanguages()
  const language = loaded.includes(lang) ? lang : "text"

  return shiki.codeToHtml(code, { lang: language, theme: "phosphor" })
}
