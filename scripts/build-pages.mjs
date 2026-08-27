// Assembles everything GitHub Pages serves into one directory.
//
//   dist-pages/            the hideout static export, at the domain root
//   dist-pages/r/          the shadcn registry, the URL `shadcn add` is given
//   dist-pages/showcase/   the component showcase
//
// One artifact, one deploy, one custom domain. The hideout carries the CNAME
// in its public/ directory, so the domain survives the copy.

import { spawn } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outDir = path.join(root, "dist-pages")

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))
    })
  })
}

async function copyInto(source, target, label) {
  try {
    await fs.access(source)
  } catch {
    throw new Error(`${label} produced no output at ${source}`)
  }
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.cp(source, target, { recursive: true })
}

// The registry JSON is emitted into apps/web/public, so the showcase can serve
// it in dev. Building it first means both copies below come from one run.
await run("npm", ["run", "registry:build"])
await run("npm", ["run", "build", "--workspace", "web"])
await run("npm", ["run", "build:pages", "--workspace", "hideout"])

await fs.rm(outDir, { recursive: true, force: true })

await copyInto(path.join(root, "apps/hideout/out"), outDir, "hideout build:pages")
await copyInto(
  path.join(root, "apps/web/dist"),
  path.join(outDir, "showcase"),
  "web build"
)
await copyInto(
  path.join(root, "apps/web/public/r"),
  path.join(outDir, "r"),
  "registry:build"
)

// Next writes _next/; a leading underscore is invisible to Jekyll, and Pages
// still runs it for artifacts that do not opt out.
await fs.writeFile(path.join(outDir, ".nojekyll"), "")

console.log(`\nPages artifact assembled at ${path.relative(root, outDir)}`)
