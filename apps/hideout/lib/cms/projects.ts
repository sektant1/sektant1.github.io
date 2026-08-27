import fs from "node:fs/promises";
import { projectDir, projectIndexPath } from "@/lib/content/paths";
import { getAllProjects, getProjectBySlug } from "@/lib/content/projects";
import { normalizeProjectPayload, projectDocumentToPayload, serializeProject } from "@/lib/cms/validation";
import { preserveSidecarFiles } from "@/lib/cms/sidecar-files";
import { syncContentAssets } from "@/lib/content/assets";

export async function listCmsProjects() {
  const projects = await getAllProjects({ includeDrafts: true });
  return projects.map(projectDocumentToPayload);
}

export async function readCmsProject(slug: string) {
  const project = await getProjectBySlug(slug, { includeDrafts: true });
  return project ? projectDocumentToPayload(project) : null;
}

export async function createCmsProject(input: unknown) {
  const payload = normalizeProjectPayload(input);
  const existing = await getProjectBySlug(payload.slug, { includeDrafts: true });
  if (existing) throw new Error(`Slug already exists: ${payload.slug}`);
  await fs.mkdir(projectDir(payload.slug), { recursive: true });
  await fs.writeFile(projectIndexPath(payload.slug), serializeProject(payload), "utf8");
  await syncContentAssets();
  return payload;
}

export async function updateCmsProject(currentSlug: string, input: unknown) {
  const payload = normalizeProjectPayload(input);
  const existing = await getProjectBySlug(currentSlug, { includeDrafts: true });
  if (!existing) throw new Error(`Project not found: ${currentSlug}`);

  await preserveSidecarFiles(projectDir(currentSlug), projectDir(payload.slug), async () => {
    if (payload.slug !== currentSlug) {
      const conflict = await getProjectBySlug(payload.slug, { includeDrafts: true });
      if (conflict) throw new Error(`Slug already exists: ${payload.slug}`);
      await fs.rename(projectDir(currentSlug), projectDir(payload.slug));
    }

    await fs.mkdir(projectDir(payload.slug), { recursive: true });
    await fs.writeFile(projectIndexPath(payload.slug), serializeProject(payload), "utf8");
  });

  await syncContentAssets();
  return payload;
}

export async function deleteCmsProject(slug: string) {
  const existing = await getProjectBySlug(slug, { includeDrafts: true });
  if (!existing) throw new Error(`Project not found: ${slug}`);
  await fs.rm(projectDir(slug), { recursive: true, force: true });
  await syncContentAssets();
  return { ok: true };
}
