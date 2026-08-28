import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SectionHeading } from "@/components/layout/section-heading"
import { SiteShell } from "@/components/layout/site-shell"
import { PostList } from "@/components/posts/post-list"
import { getAllSeries, getSeriesById } from "@/lib/content/posts"
import { buildContentTree } from "@/lib/content/tree"

interface PostSeriesPageProps {
  params: Promise<{ seriesId: string }>
}

export async function generateStaticParams() {
  const series = await getAllSeries()
  return series.map((item) => ({ seriesId: item.id }))
}

export async function generateMetadata({
  params,
}: PostSeriesPageProps): Promise<Metadata> {
  const { seriesId } = await params
  const series = await getSeriesById(seriesId)
  if (!series) return { title: "Series not found" }

  return {
    title: `${series.title} | Series`,
    description: `All posts in the ${series.title} series.`,
    keywords: series.tags,
    alternates: { canonical: `/posts/series/${series.id}` },
    openGraph: {
      title: `${series.title} | Series`,
      description: `All posts in the ${series.title} series.`,
      type: "website",
      url: `/posts/series/${series.id}`,
    },
  }
}

export default async function PostSeriesPage({ params }: PostSeriesPageProps) {
  const { seriesId } = await params
  const [series, tree] = await Promise.all([
    getSeriesById(seriesId),
    buildContentTree(`/posts/series/${seriesId}`),
  ])
  if (!series) notFound()

  return (
    <SiteShell
      path={`content/posts (series: ${series.id})`}
      tree={tree}
      status={[
        { label: "parts", value: series.count },
        ...(series.latestPost
          ? [{ label: "latest", value: series.latestPost.date }]
          : []),
      ]}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <SectionHeading
          path={`content/posts · series/${series.id}`}
          title={series.title}
          action={{ label: "all series", href: "/posts?tab=series" }}
        >
          {series.description ? (
            <p className="max-w-prose text-xs text-terminal-ink-dim">
              {series.description}
            </p>
          ) : null}
        </SectionHeading>

        {/* Ordered by part, not by date: a series is read front to back. */}
        <PostList posts={series.posts} />
      </div>
    </SiteShell>
  )
}
