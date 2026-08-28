import { GameGrid } from "@/components/games/game-grid";
import { StationHero } from "@/components/hero/station-hero";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteShell } from "@/components/layout/site-shell";
import { PostList } from "@/components/posts/post-list";
import { ProjectGrid } from "@/components/projects/project-grid";
import { getAllPosts, publicPostMeta } from "@/lib/content/posts";
import { getAllGames } from "@/lib/content/games";
import { getAllProjects } from "@/lib/content/projects";
import { getHomeContent } from "@/lib/content/home";
import { buildContentTree } from "@/lib/content/tree";

function readingMinutes(readingTime?: string) {
  const match = /(\d+)/.exec(readingTime ?? "");
  return match ? Number.parseInt(match[1], 10) : 0;
}

export default async function HomePage() {
  const [postDocuments, projects, games, tree, home] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
    getAllGames(),
    buildContentTree("/"),
    getHomeContent(),
  ]);

  const posts = postDocuments.map(publicPostMeta);
  const minutes = posts.reduce(
    (total, post) => total + readingMinutes(post.readingTime),
    0,
  );

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
              action={{ label: home.sections.games.actionLabel, href: "/games" }}
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
  );
}
