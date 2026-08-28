import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { Article } from "@/components/content/article"
import { ReadingProgress } from "@/components/content/reading-progress"
import { SiteShell } from "@/components/layout/site-shell"
import { SeriesNav } from "@/components/posts/series-nav"
import { createMdxComponents, EndOfFile } from "@/components/mdx/mdx-components"
import { mdxOptions } from "@/lib/mdx/options"
import {
  getAllPosts,
  getPostBySlug,
  getSeriesContextForPost,
  publicPostMeta,
} from "@/lib/content/posts"
import { buildContentTree } from "@/lib/content/tree"
import { isAdminVisible } from "@/lib/runtime/mode"
import { extractToc } from "@/lib/mdx/toc"
import { SITE_AUTHOR, SITE_NAME, SITE_URL, absUrl } from "@/lib/seo/site"

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.meta.slug }))
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug: routeSlug } = await params
  const post = await getPostBySlug(routeSlug)
  if (!post) return { title: "Post not found" }
  const { title, description, slug, date, tags, thumbnail, series } = post.meta
  const url = `${SITE_URL}/posts/${slug}`
  const image = thumbnail
    ? absUrl(thumbnail)
    : `${SITE_URL}/opengraph-image.png`
  return {
    title,
    description,
    keywords: series ? [...tags, series.title] : tags,
    authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
    alternates: { canonical: `/posts/${slug}` },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      publishedTime: date,
      authors: [SITE_AUTHOR],
      tags,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const meta = publicPostMeta(post)
  const toc = extractToc(post.body)
  const [tree, seriesContext] = await Promise.all([
    buildContentTree(`/posts/${meta.slug}`),
    getSeriesContextForPost(post),
  ])
  const url = `${SITE_URL}/posts/${meta.slug}`
  const image = meta.thumbnail
    ? absUrl(meta.thumbnail)
    : `${SITE_URL}/opengraph-image.png`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    image: [image],
    datePublished: meta.date,
    dateModified: meta.date,
    author: { "@type": "Person", name: SITE_AUTHOR, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/apple-icon.png` },
    },
    keywords: meta.tags?.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell
        path={`content/posts/${meta.slug}/index.mdx`}
        tree={tree}
        gauge={<ReadingProgress />}
        status={[
          { label: "date", value: meta.date },
          ...(meta.readingTime
            ? [
                {
                  label: "read",
                  value: meta.readingTime.replace(/\s*read$/i, ""),
                },
              ]
            : []),
          ...(seriesContext
            ? [
                {
                  label: "part",
                  value: `${seriesContext.currentIndex + 1}/${seriesContext.posts.length}`,
                },
              ]
            : []),
        ]}
      >
        <Article
          title={meta.title}
          date={meta.date}
          readingTime={meta.readingTime}
          tags={meta.tags}
          toc={toc}
          editHref={isAdminVisible() ? `/admin/posts/${meta.slug}/edit` : null}
          footer={seriesContext ? <SeriesNav context={seriesContext} /> : null}
        >
          <MDXRemote
            source={post.body}
            components={createMdxComponents()}
            options={mdxOptions}
          />
          <EndOfFile />
        </Article>
      </SiteShell>
    </>
  )
}
