// Where the station answers. The registry is copied to the root of the Pages
// artifact, next to the hideout, so the `add` command stays short.
//
// scripts/build-registry.mjs imports SHOWCASE_URL from this file for the
// manifest's `homepage`, so the two cannot disagree. The hideout keeps its own
// copy in lib/seo/site.ts because it is a separate workspace and takes an
// env-var override for preview deployments; that one is the exception, not a
// third source.
export const SITE_ORIGIN = "https://sektant.dev"

export const REGISTRY_BASE_URL = `${SITE_ORIGIN}/r`
export const SHOWCASE_URL = `${SITE_ORIGIN}/showcase`

export function addCommand(item: string) {
  return `npx shadcn@latest add ${REGISTRY_BASE_URL}/${item}.json`
}
