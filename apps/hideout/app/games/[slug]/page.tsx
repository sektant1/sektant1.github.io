import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { Article } from "@/components/content/article"
import { ReadingProgress } from "@/components/content/reading-progress"
import { GameMasthead } from "@/components/games/game-masthead"
import { SiteShell } from "@/components/layout/site-shell"
import { createMdxComponents, EndOfFile } from "@/components/mdx/mdx-components"
import { getAllGames, getGameBySlug } from "@/lib/content/games"
import { buildContentTree } from "@/lib/content/tree"
import { mdxOptions } from "@/lib/mdx/options"
import { extractToc } from "@/lib/mdx/toc"
import { isAdminVisible } from "@/lib/runtime/mode"
import { SITE_AUTHOR, SITE_NAME, SITE_URL, absUrl } from "@/lib/seo/site"

interface GamePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const games = await getAllGames()
  return games.map((game) => ({ slug: game.meta.slug }))
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)
  if (!game) return { title: "Game not found" }

  const { meta } = game
  const url = `${SITE_URL}/games/${meta.slug}`
  const image = meta.thumbnail
    ? absUrl(meta.thumbnail)
    : `${SITE_URL}/opengraph-image.png`

  return {
    title: meta.title,
    description: meta.description,
    keywords: [...meta.tags, ...meta.platforms, meta.engine].filter(
      (keyword): keyword is string => Boolean(keyword)
    ),
    authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
    alternates: { canonical: `/games/${meta.slug}` },
    openGraph: {
      type: "website",
      url,
      title: meta.title,
      description: meta.description,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [image],
    },
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)
  if (!game) notFound()

  const { meta } = game
  const toc = extractToc(game.body)
  const tree = await buildContentTree(`/games/${meta.slug}`)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: meta.title,
    description: meta.description,
    url: meta.playHref ?? `${SITE_URL}/games/${meta.slug}`,
    datePublished: meta.date,
    author: { "@type": "Person", name: SITE_AUTHOR, url: SITE_URL },
    gamePlatform: meta.platforms,
    ...(meta.engine ? { gameEngine: meta.engine } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell
        path={`content/games/${meta.slug}/index.mdx`}
        tree={tree}
        gauge={<ReadingProgress />}
        status={[
          ...(meta.status ? [{ label: "status", value: meta.status }] : []),
          ...(meta.platforms.length
            ? [{ label: "on", value: meta.platforms.join(" ") }]
            : []),
        ]}
      >
        <Article
          title={meta.title}
          date={meta.date}
          tags={meta.tags}
          tagBase={null}
          toc={toc}
          masthead={<GameMasthead meta={meta} />}
          editHref={isAdminVisible() ? `/admin/games/${meta.slug}/edit` : null}
        >
          <MDXRemote
            source={game.body}
            components={createMdxComponents()}
            options={mdxOptions}
          />
          <EndOfFile />
        </Article>
      </SiteShell>
    </>
  )
}
