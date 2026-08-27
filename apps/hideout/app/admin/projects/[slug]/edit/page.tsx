import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { getProjectBySlug } from "@/lib/content/projects";

interface EditProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug, { includeDrafts: true });
  if (!project) notFound();

  return (
    <ProjectForm
      mode="edit"
      project={{ ...project.meta, body: project.body }}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
