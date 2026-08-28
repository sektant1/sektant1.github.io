import { spawn } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const disabledRoot = path.join(root, ".pages-disabled")
const serverOnlyPaths = ["app/admin", "app/api", "middleware.ts", "proxy.ts"]

async function hasPublishedSeries() {
  const postsDir = path.join(root, "content", "posts")
  let entries
  try {
    entries = await fs.readdir(postsDir, { withFileTypes: true })
  } catch {
    return false
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const file = path.join(postsDir, entry.name, "index.mdx")
    let raw
    try {
      raw = await fs.readFile(file, "utf8")
    } catch {
      continue
    }
    const match = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!match) continue
    const fm = match[1]
    if (!/\nseries\s*:/.test("\n" + fm)) continue
    if (/\nstatus\s*:\s*draft\b/.test("\n" + fm)) continue
    return true
  }
  return false
}

async function hasPublishedGame() {
  const gamesDir = path.join(root, "content", "games")
  let entries
  try {
    entries = await fs.readdir(gamesDir, { withFileTypes: true })
  } catch {
    return false
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const file = path.join(gamesDir, entry.name, "index.mdx")
    let raw
    try {
      raw = await fs.readFile(file, "utf8")
    } catch {
      continue
    }
    const match = raw.match(/^---\n([\s\S]*?)\n---/)
    if (match && !/\nstatus\s*:\s*draft\b/.test("\n" + match[1])) return true
  }
  return false
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function moveAway(relativePath) {
  const source = path.join(root, relativePath)
  if (!(await exists(source))) return null

  const target = path.join(disabledRoot, relativePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.rm(target, { recursive: true, force: true })
  await fs.rename(source, target)
  return { source, target }
}

async function restore(moved) {
  for (const entry of moved.reverse()) {
    await fs.mkdir(path.dirname(entry.source), { recursive: true })
    await fs.rm(entry.source, { recursive: true, force: true })
    await fs.rename(entry.target, entry.source)
  }

  await fs.rm(disabledRoot, { recursive: true, force: true })
}

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      shell: process.platform === "win32",
      stdio: "inherit",
    })

    child.on("exit", (code) => {
      if (code === 0) resolve()
      else
        reject(
          new Error(
            `${command} ${args.join(" ")} failed with exit code ${code}`
          )
        )
    })
  })
}

const moved = []

try {
  await fs.rm(disabledRoot, { recursive: true, force: true })

  const pathsToMove = [...serverOnlyPaths]
  if (!(await hasPublishedSeries())) {
    pathsToMove.push("app/posts/series")
  }
  if (!(await hasPublishedGame())) {
    pathsToMove.push("app/games/[slug]")
  }

  for (const relativePath of pathsToMove) {
    const entry = await moveAway(relativePath)
    if (entry) moved.push(entry)
  }

  // This build calls next directly rather than through `npm run build`, so
  // it does not get the prebuild step and has to run the same preparation
  // itself. A model missing here is a 404 on the boot screen.
  await run("node", ["scripts/build-models.mjs"])
  await run("node", ["scripts/sync-content-assets.mjs"])
  await run("node", ["scripts/generate-search-index.mjs"])
  await run("npx", ["next", "build", "--webpack"], {
    GITHUB_PAGES: "true",
    NEXT_PUBLIC_HIDE_ADMIN: "true",
  })
} finally {
  await restore(moved)

  // The export ran with the CMS routes moved aside, so the route types Next
  // left in .next describe an app that is no longer on disk — tsconfig
  // includes them, and typecheck would fail on routes it cannot see. Next
  // regenerates both on the next dev or build.
  for (const dir of [".next/types", ".next/dev/types"]) {
    await fs.rm(path.join(root, dir), { recursive: true, force: true })
  }
}
