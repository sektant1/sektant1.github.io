// The registry is copied to the root of the Pages artifact, next to the
// hideout, so the `add` command stays short. This is the only place the
// published registry URL is defined.
export const REGISTRY_BASE_URL = "https://sektant.dev/r"

export function addCommand(item: string) {
  return `npx shadcn@latest add ${REGISTRY_BASE_URL}/${item}.json`
}
