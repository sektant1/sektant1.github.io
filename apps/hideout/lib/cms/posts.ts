import { createCmsCollection } from "@/lib/cms/collection"
import {
  normalizePostPayload,
  postDocumentToPayload,
  serializePost,
} from "@/lib/cms/validation"
import { postDir, postIndexPath } from "@/lib/content/paths"
import { getAllPosts, getPostBySlug } from "@/lib/content/posts"

export const cmsPosts = createCmsCollection({
  label: "Post",
  dir: postDir,
  indexPath: postIndexPath,
  getAll: getAllPosts,
  getBySlug: getPostBySlug,
  normalize: normalizePostPayload,
  serialize: serializePost,
  toPayload: postDocumentToPayload,
})
