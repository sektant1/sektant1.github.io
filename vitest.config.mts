import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * One run across the workspaces, because `npm run test` is one command.
 *
 * Projects rather than a single alias table: `@/` resolves to `apps/web/src`
 * in the showcase and to `apps/hideout` in the site, so a shared alias would
 * silently give one of them the other's files. Until this existed nothing
 * importing through `@/` could be tested at all, which is most of the site —
 * the tested modules were the ones that happened to use relative imports.
 */
const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "hideout",
          root: dir("./apps/hideout"),
          include: ["**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/.next/**", "**/out/**"],
        },
        resolve: {
          alias: {
            "@workspace/ui": dir("./packages/ui/src"),
            "@": dir("./apps/hideout"),
          },
        },
      },
      {
        test: {
          name: "web",
          root: dir("./apps/web"),
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**"],
        },
        resolve: {
          alias: {
            "@workspace/ui": dir("./packages/ui/src"),
            "@": dir("./apps/web/src"),
          },
        },
      },
      {
        test: {
          name: "ui",
          root: dir("./packages/ui"),
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**"],
        },
        resolve: {
          alias: { "@workspace/ui": dir("./packages/ui/src") },
        },
      },
      {
        test: {
          name: "scripts",
          root: dir("./scripts"),
          include: ["**/*.test.mjs"],
          exclude: ["**/node_modules/**"],
        },
      },
    ],
  },
})
