// Replace <GITHUB_USER> once the repository has a remote. This is the only
// place the published registry URL is defined.
export const REGISTRY_BASE_URL =
  "https://<GITHUB_USER>.github.io/skt-ui-toolkit/r"

export function addCommand(item: string) {
  return `npx shadcn@latest add ${REGISTRY_BASE_URL}/${item}.json`
}
