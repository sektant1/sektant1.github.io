import type { MetadataRoute } from "next"
import { getAllSeries, getPublicPostMetas } from "@/lib/content/posts"
import { getAllGames } from "@/lib/content/games"
import { getAllProjects } from "@/lib/content/projects"
import { SITE_URL } from "@/lib/seo/site"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublicPostMetas()
  const series = await getAllSeries()
  const projects = await getAllProjects()
  const games = await getAllGames()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/posts`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/games`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/tech-passport`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/posts/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projects.map((proj) => ({
    url: `${SITE_URL}/projects/${proj.meta.slug}`,
    lastModified: proj.meta.date ? new Date(proj.meta.date) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const gameRoutes: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${SITE_URL}/games/${game.meta.slug}`,
    lastModified: game.meta.date ? new Date(game.meta.date) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const seriesRoutes: MetadataRoute.Sitemap = series.map((item) => ({
    url: `${SITE_URL}/posts/series/${item.id}`,
    lastModified: item.latestPost?.date ? new Date(item.latestPost.date) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...postRoutes,
    ...seriesRoutes,
    ...projectRoutes,
    ...gameRoutes,
  ]
}
