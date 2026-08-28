import fs from "node:fs/promises"
import path from "node:path"

interface SidecarFile {
  relativePath: string
  contents: Buffer
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectSidecarFiles(
  dir: string,
  root = dir
): Promise<SidecarFile[]> {
  if (!(await pathExists(dir))) return []

  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: SidecarFile[] = []

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSidecarFiles(filePath, root)))
      continue
    }

    if (entry.name === "index.mdx" && dir === root) continue
    files.push({
      relativePath: path.relative(root, filePath),
      contents: await fs.readFile(filePath),
    })
  }

  return files
}

async function restoreMissingSidecarFiles(dir: string, files: SidecarFile[]) {
  for (const file of files) {
    const target = path.join(dir, file.relativePath)
    if (await pathExists(target)) continue
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, file.contents)
  }
}

export async function preserveSidecarFiles<T>(
  sourceDir: string,
  targetDir: string,
  write: () => Promise<T>
) {
  const sidecars = await collectSidecarFiles(sourceDir)
  const result = await write()
  await restoreMissingSidecarFiles(targetDir, sidecars)
  return result
}
