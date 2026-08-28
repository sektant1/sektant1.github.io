import Link from "next/link"
import { BannerFontPicker } from "@/components/admin/banner-font-picker"
import { AdminShell } from "@/components/admin/admin-shell"
import { Readout } from "@/components/layout/readout"
import { getAllPosts, getAllSeries } from "@/lib/content/posts"
import { getAllProjects } from "@/lib/content/projects"

export default async function AdminDashboardPage() {
  const [posts, series, projects] = await Promise.all([
    getAllPosts({ includeDrafts: true }),
    getAllSeries({ includeDrafts: true }),
    getAllProjects({ includeDrafts: true }),
  ])

  const postDrafts = posts.filter((post) => post.meta.status === "draft")
  const projectDrafts = projects.filter(
    (project) => project.meta.visibility === "draft"
  )

  return (
    <AdminShell
      path="cms"
      status={[
        { label: "posts", value: posts.length },
        { label: "projects", value: projects.length },
      ]}
    >
      <div className="flex max-w-3xl flex-col gap-8 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-sans text-lg text-foreground">Content on disk</h1>
          <p className="text-xs text-terminal-ink-dim">
            Everything here writes MDX files under <code>content/</code>. Commit
            them to publish.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
            posts
          </h2>
          <dl className="flex max-w-sm flex-col gap-1">
            <Readout label="total" value={posts.length} />
            <Readout
              label="published"
              value={posts.length - postDrafts.length}
            />
            <Readout label="drafts" value={postDrafts.length} />
            <Readout label="series" value={series.length} />
          </dl>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
            display / hero
          </h2>
          <BannerFontPicker />
          <Link
            href="/admin/home"
            className="text-xs text-terminal-ink-dim hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            Edit the front page text →
          </Link>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
            projects
          </h2>
          <dl className="flex max-w-sm flex-col gap-1">
            <Readout label="total" value={projects.length} />
            <Readout
              label="published"
              value={projects.length - projectDrafts.length}
            />
            <Readout label="drafts" value={projectDrafts.length} />
          </dl>
        </section>

        {/* Drafts are the reason to open this screen, so they get their own
            list rather than being one row among the published ones. */}
        {postDrafts.length + projectDrafts.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
              unfinished
            </h2>
            <ul className="flex flex-col border-t border-terminal-rule">
              {postDrafts.map((post) => (
                <DraftRow
                  key={post.meta.slug}
                  href={`/admin/posts/${post.meta.slug}/edit`}
                  kind="post"
                  title={post.meta.title}
                />
              ))}
              {projectDrafts.map((project) => (
                <DraftRow
                  key={project.meta.slug}
                  href={`/admin/projects/${project.meta.slug}/edit`}
                  kind="project"
                  title={project.meta.title}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AdminShell>
  )
}

function DraftRow({
  href,
  kind,
  title,
}: {
  href: string
  kind: string
  title: string
}) {
  return (
    <li className="border-b border-terminal-rule">
      <Link
        href={href}
        className="flex items-baseline gap-3 py-2 text-xs hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="w-14 shrink-0 font-mono text-[0.65rem] text-terminal-chrome-dim">
          {kind}
        </span>
        <span className="min-w-0 truncate text-foreground">{title}</span>
      </Link>
    </li>
  )
}
