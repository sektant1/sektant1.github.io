import { AdminAction, AdminShell } from "@/components/admin/admin-shell"
import { ContentTable } from "@/components/admin/content-table"
import { getAllProjects } from "@/lib/content/projects"

export default async function AdminProjectsPage() {
  const projects = await getAllProjects({ includeDrafts: true })

  return (
    <AdminShell
      path="content/projects"
      status={[{ label: "projects", value: projects.length }]}
      actions={
        <AdminAction href="/admin/projects/new">New project</AdminAction>
      }
    >
      <div className="p-4 md:p-6">
        <ContentTable
          label="Projects"
          editBase="/admin/projects"
          noteLabel="stack"
          rows={projects.map((project) => ({
            slug: project.meta.slug,
            title: project.meta.title,
            date: project.meta.date,
            published: project.meta.visibility === "published",
            note: project.meta.stack.slice(0, 3).join(" · ") || undefined,
          }))}
        />
      </div>
    </AdminShell>
  )
}
