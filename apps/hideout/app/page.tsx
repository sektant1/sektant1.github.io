import { GameGrid } from "@/components/games/game-grid"
import { StationHero } from "@/components/hero/station-hero"
import { SectionHeading } from "@/components/layout/section-heading"
import { SiteShell } from "@/components/layout/site-shell"
import { PostList } from "@/components/posts/post-list"
import { ProjectGrid } from "@/components/projects/project-grid"
import { getAllPosts, publicPostMeta } from "@/lib/content/posts"
import { getAllGames } from "@/lib/content/games"
import { getAllProjects } from "@/lib/content/projects"
import { getHomeContent } from "@/lib/content/home"
import { buildActivity } from "@/lib/activity"
import { buildContentTree } from "@/lib/content/tree"

function readingMinutes(readingTime?: string) {
  const match = /(\d+)/.exec(readingTime ?? "")
  return match ? Number.parseInt(match[1], 10) : 0
}

export default async function HomePage() {
  const [postDocuments, projects, games, tree, home] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
    getAllGames(),
    buildContentTree("/"),
    getHomeContent(),
  ])

  const posts = postDocuments.map(publicPostMeta)

  // Busiest first, then alphabetical so the order is stable between builds
  // when two tags are level. The hero shows the head of this list.
  const tagCounts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const tags = [...tagCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 12)
  const minutes = posts.reduce(
    (total, post) => total + readingMinutes(post.readingTime),
    0
  )

  // Everything the archive holds, on one timeline. The trace reports that the
  // station was worked on and how often, not what any entry was, so the three
  // kinds are counted together.
  const activity = buildActivity([
    ...posts.map((post) => post.date),
    ...projects.map((project) => project.meta.date),
    ...games.map((game) => game.meta.date),
  ])

  return (
    <SiteShell
      path="index"
      tree={tree}
      status={[
        { label: "posts", value: posts.length },
        { label: "projects", value: projects.length },
      ]}
    >
      <div className="tube-on mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12">
        <StationHero
          posts={posts.length}
          projects={projects.length}
          minutes={minutes}
          tags={tags}
          activity={activity}
          content={home.hero}
        />

        <section className="flex flex-col gap-4">
          <SectionHeading
            path={home.sections.posts.path}
            title={home.sections.posts.title}
            action={{ label: home.sections.posts.actionLabel, href: "/posts" }}
          />
          <PostList posts={posts.slice(0, 4)} />
        </section>

        {/* Only when there is something to show — an empty section on the
            front page reads as a site that is unfinished. */}
        {games.length > 0 ? (
          <section className="flex flex-col gap-4">
            <SectionHeading
              path={home.sections.games.path}
              title={home.sections.games.title}
              action={{
                label: home.sections.games.actionLabel,
                href: "/games",
              }}
            />
            <GameGrid games={games.slice(0, 3)} />
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          <SectionHeading
            path={home.sections.projects.path}
            title={home.sections.projects.title}
            action={{
              label: home.sections.projects.actionLabel,
              href: "/projects",
            }}
          />
          <ProjectGrid projects={projects.slice(0, 3)} />
        </section>
      </div>
    </SiteShell>
  )
}
