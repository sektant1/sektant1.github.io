import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { createMdxComponents } from "@/components/mdx/mdx-components"
import { mdxOptions } from "@/lib/mdx/options"
import { Article } from "@/components/content/article"
import { ReadingProgress } from "@/components/content/reading-progress"
import { SiteShell } from "@/components/layout/site-shell"
import { getPageBySlug, publicPageMeta } from "@/lib/content/pages"
import { buildContentTree } from "@/lib/content/tree"
import { extractToc } from "@/lib/mdx/toc"

export const metadata: Metadata = {
  title: "Tech passport",
}

export default async function TechPassportPage() {
  const page = await getPageBySlug("tech-passport")
  if (!page) notFound()
  const meta = publicPageMeta(page)
  const tree = await buildContentTree(`/${meta.slug}`)

  return (
    <SiteShell
      path={`content/pages/${meta.slug}/index.mdx`}
      tree={tree}
      gauge={<ReadingProgress />}
    >
      <Article
        title={meta.title}
        date={meta.date}
        tags={meta.tags}
        tagBase={null}
        toc={extractToc(page.body)}
      >
        <MDXRemote
          source={page.body}
          components={createMdxComponents()}
          options={mdxOptions}
        />
      </Article>
    </SiteShell>
  )
}
