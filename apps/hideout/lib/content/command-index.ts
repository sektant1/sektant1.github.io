import { cache } from "react"

import { getPublicPostMetas } from "@/lib/content/posts"
import { getAllGames } from "@/lib/content/games"
import { getAllProjects } from "@/lib/content/projects"
import type { CommandIndex } from "@/components/layout/command-palette"

/**
 * Everything the command palette can jump to.
 *
 * Built on the server and sent down with the page: the whole index is a few
 * kilobytes of titles, which is far less than shipping a search library to do
 * the same job in the browser.
 *
 * Wrapped in React's `cache` because every page renders the shell, and without
 * it a static build would re-read and re-parse the content directory once per
 * route.
 */
export const buildCommandIndex = cache(async (): Promise<CommandIndex> => {
  const [posts, projects, games] = await Promise.all([
    getPublicPostMetas(),
    getAllProjects(),
    getAllGames(),
  ])

  return {
    posts: posts.map((post) => ({
      href: `/posts/${post.slug}`,
      label: post.title,
      meta: post.date,
      // Tags and the description are searchable but not shown — typing "nvim"
      // should find the Neovim post even though the title says "Neovim".
      keywords: [post.description, ...post.tags, post.series?.title]
        .filter(Boolean)
        .join(" "),
    })),

    projects: projects.map((project) => ({
      // Always the write-up here, never the outbound link: the palette is
      // navigation, and a result that silently opens a new tab is a trap.
      href: `/projects/${project.meta.slug}`,
      label: project.meta.title,
      meta: project.meta.stack.slice(0, 2).join(" "),
      keywords: [project.meta.description, ...project.meta.tags].join(" "),
    })),

    games: games.map((game) => ({
      href: `/games/${game.meta.slug}`,
      label: game.meta.title,
      meta: game.meta.platforms.slice(0, 2).join(" "),
      keywords: [game.meta.description, game.meta.engine, ...game.meta.tags]
        .filter(Boolean)
        .join(" "),
    })),

    pages: [
      { href: "/", label: "Home", keywords: "index start" },
      { href: "/posts", label: "All posts", keywords: "archive writing blog" },
      { href: "/projects", label: "All projects", keywords: "work builds" },
      { href: "/games", label: "All games", keywords: "play itch jam" },
      { href: "/about", label: "About", keywords: "contact email gpg radio" },
      {
        href: "/tech-passport",
        label: "Tech passport",
        keywords: "colophon stack built with fonts credits",
      },
      { href: "/rss.xml", label: "RSS feed", keywords: "subscribe atom" },
    ],
  }
})
