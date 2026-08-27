import type { Metadata } from "next";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteShell } from "@/components/layout/site-shell";
import { ProjectGrid } from "@/components/projects/project-grid";
import { getAllProjects } from "@/lib/content/projects";
import { buildContentTree } from "@/lib/content/tree";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, tree] = await Promise.all([
    getAllProjects(),
    buildContentTree("/projects"),
  ]);

  return (
    <SiteShell
      path="content/projects"
      tree={tree}
      status={[{ label: "projects", value: projects.length }]}
    >
      <div className="tube-on mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <SectionHeading path="content/projects" title="projects">
          <p className="max-w-prose text-xs text-terminal-ink-dim">
            Everything I have shipped or am still building. Each one links to
            its write-up, its source and its site, wherever those exist.
          </p>
        </SectionHeading>

        <ProjectGrid projects={projects} />
      </div>
    </SiteShell>
  );
}
