import { createCmsCollection } from "@/lib/cms/collection"
import {
  normalizeProjectPayload,
  projectDocumentToPayload,
  serializeProject,
} from "@/lib/cms/validation"
import { projectDir, projectIndexPath } from "@/lib/content/paths"
import { getAllProjects, getProjectBySlug } from "@/lib/content/projects"

export const cmsProjects = createCmsCollection({
  label: "Project",
  dir: projectDir,
  indexPath: projectIndexPath,
  getAll: getAllProjects,
  getBySlug: getProjectBySlug,
  normalize: normalizeProjectPayload,
  serialize: serializeProject,
  toPayload: projectDocumentToPayload,
})
