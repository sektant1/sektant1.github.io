import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { Article } from "@/components/content/article"
import { ReadingProgress } from "@/components/content/reading-progress"
import { ProjectMasthead } from "@/components/projects/project-masthead"
import { SiteShell } from "@/components/layout/site-shell"
import { createMdxComponents, EndOfFile } from "@/components/mdx/mdx-components"
import { mdxOptions } from "@/lib/mdx/options"
import {
  getAllProjects,
  getProjectBySlug,
  publicProjectMeta,
} from "@/lib/content/projects"
import { buildContentTree } from "@/lib/content/tree"
import { isAdminVisible } from "@/lib/runtime/mode"
import { extractToc } from "@/lib/mdx/toc"
import { SITE_AUTHOR, SITE_NAME, SITE_URL, absUrl } from "@/lib/seo/site"

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map((project) => ({ slug: project.meta.slug }))
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug: routeSlug } = await params
  const project = await getProjectBySlug(routeSlug)
  if (!project) return { title: "Project not found" }
  const meta = publicProjectMeta(project)
  const url = `${SITE_URL}/projects/${meta.slug}`
  const image = meta.thumbnail
    ? absUrl(meta.thumbnail)
    : `${SITE_URL}/opengraph-image.png`
  return {
    title: meta.title,
    description: meta.description,
    keywords: [...meta.tags, ...meta.stack],
    authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
    alternates: { canonical: `/projects/${meta.slug}` },
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

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const meta = publicProjectMeta(project)
  const toc = extractToc(project.body)
  const tree = await buildContentTree(`/projects/${meta.slug}`)
  const url = `${SITE_URL}/projects/${meta.slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: meta.title,
    description: meta.description,
    codeRepository: meta.repo,
    url: meta.href ?? url,
    datePublished: meta.date,
    author: { "@type": "Person", name: SITE_AUTHOR, url: SITE_URL },
    keywords: [...meta.tags, ...meta.stack].join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell
        path={`content/projects/${meta.slug}/index.mdx`}
        tree={tree}
        gauge={<ReadingProgress />}
        status={[
          ...(meta.status ? [{ label: "status", value: meta.status }] : []),
          ...(meta.stack.length
            ? [{ label: "stack", value: meta.stack.join(" ") }]
            : []),
        ]}
      >
        <Article
          title={meta.title}
          date={meta.date}
          tags={meta.tags}
          tagBase={null}
          toc={toc}
          editHref={
            isAdminVisible() ? `/admin/projects/${meta.slug}/edit` : null
          }
          masthead={<ProjectMasthead meta={meta} />}
        >
          <MDXRemote
            source={project.body}
            components={createMdxComponents()}
            options={mdxOptions}
          />
          <EndOfFile />
        </Article>
      </SiteShell>
    </>
  )
}
