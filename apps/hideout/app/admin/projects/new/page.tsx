import { ProjectForm } from "@/components/admin/project-form"

export default function NewProjectPage() {
  return (
    <ProjectForm mode="create" today={new Date().toISOString().slice(0, 10)} />
  )
}
