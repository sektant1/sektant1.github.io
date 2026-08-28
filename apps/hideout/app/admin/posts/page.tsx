import { AdminAction, AdminShell } from "@/components/admin/admin-shell"
import { ContentTable } from "@/components/admin/content-table"
import { getAllPosts } from "@/lib/content/posts"

export default async function AdminPostsPage() {
  const posts = await getAllPosts({ includeDrafts: true })

  return (
    <AdminShell
      path="content/posts"
      status={[{ label: "posts", value: posts.length }]}
      actions={<AdminAction href="/admin/posts/new">New post</AdminAction>}
    >
      <div className="p-4 md:p-6">
        <ContentTable
          label="Posts"
          editBase="/admin/posts"
          noteLabel="series"
          rows={posts.map((post) => ({
            slug: post.meta.slug,
            title: post.meta.title,
            date: post.meta.date,
            published: post.meta.status === "published",
            note: post.meta.series
              ? `${post.meta.series.title} #${post.meta.series.order}`
              : undefined,
          }))}
        />
      </div>
    </AdminShell>
  )
}
