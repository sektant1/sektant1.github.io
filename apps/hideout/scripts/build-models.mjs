// Compiles the source GLBs in assets/models/ into the ones the site serves.
//
// A model authored for a renderer and one drawn on this terminal are not the
// same file. The visor resolves texture detail at 512²; the price models land
// in 30 CSS pixels at a capped 1.5 device scale, where 128² already oversamples
// the output. Textures are reduced here once instead of by every reader.
//
// Two more cuts follow from how the model is shaded rather than how it looks:
//
//   The metallic-roughness map is dropped. Both renderers build their own
//   MeshStandardMaterial with scalar roughness and metalness.
//
//   Base colour becomes JPEG. Only its luminance survives the ramp, and JPEG
//   is core glTF — no extension, no loader flag.
//
// Source stays in assets/models/ and is what you edit. public/models/ is
// generated and git-ignored; predev and prebuild run this first.

import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const sourceDir = path.join(root, "assets", "models")
const outDir = path.join(root, "public", "models")

const VISOR_TEXTURE = 512
const ICON_TEXTURE = 128

const GLB_MAGIC = 0x46546c67
const JSON_CHUNK = 0x4e4f534a
const BIN_CHUNK = 0x004e4942

function parseGlb(buffer) {
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) throw new Error("not a GLB")

  let offset = 12
  let json = null
  let bin = Buffer.alloc(0)

  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset)
    const type = buffer.readUInt32LE(offset + 4)
    const body = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === JSON_CHUNK) json = JSON.parse(body.toString("utf8"))
    else if (type === BIN_CHUNK) bin = body
    offset += 8 + length + ((4 - (length % 4)) % 4)
  }

  if (!json) throw new Error("GLB has no JSON chunk")
  return { json, bin }
}

function pad4(length) {
  return (4 - (length % 4)) % 4
}

function writeGlb(json, bin) {
  const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8")
  const jsonPadded = Buffer.concat([
    jsonBuffer,
    Buffer.alloc(pad4(jsonBuffer.length), 0x20),
  ])
  const binPadded = Buffer.concat([bin, Buffer.alloc(pad4(bin.length), 0)])

  const header = Buffer.alloc(12)
  header.writeUInt32LE(GLB_MAGIC, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(
    12 + 8 + jsonPadded.length + (binPadded.length ? 8 + binPadded.length : 0),
    8
  )

  const chunks = [
    header,
    chunkHeader(jsonPadded.length, JSON_CHUNK),
    jsonPadded,
  ]
  if (binPadded.length) {
    chunks.push(chunkHeader(binPadded.length, BIN_CHUNK), binPadded)
  }
  return Buffer.concat(chunks)
}

function chunkHeader(length, type) {
  const header = Buffer.alloc(8)
  header.writeUInt32LE(length, 0)
  header.writeUInt32LE(type, 4)
  return header
}

function imageBytes(json, bin, image) {
  if (image.bufferView === undefined) {
    throw new Error("external image URIs are not supported")
  }
  const view = json.bufferViews[image.bufferView]
  const start = view.byteOffset ?? 0
  return bin.subarray(start, start + view.byteLength)
}

/**
 * Both maps end up as JPEG, for the same reason: the frame they shade is
 * reduced to one of nine glyph densities, and a compression artifact has to
 * move a pixel a full ramp step to be visible at all. The normal map is the
 * one that would object in a normal renderer, so it keeps a higher quality —
 * still an order of magnitude below the PNG it replaces.
 */
async function encode(bytes, role, maxTexture) {
  const pipeline = sharp(bytes).resize(maxTexture, maxTexture, {
    fit: "inside",
    withoutEnlargement: true,
  })

  return {
    data: await pipeline
      .jpeg({ quality: role === "normal" ? 92 : 82, mozjpeg: true })
      .toBuffer(),
    mimeType: "image/jpeg",
  }
}

async function compile(json, bin, maxTexture) {
  // Every bufferView an accessor reads is copied through untouched. Geometry
  // remains source-authored; this pass only removes runtime texture waste.
  const keptViews = []
  const viewRemap = new Map()
  for (const accessor of json.accessors ?? []) {
    if (accessor.bufferView === undefined) continue
    if (viewRemap.has(accessor.bufferView)) continue
    viewRemap.set(accessor.bufferView, keptViews.length)
    keptViews.push({ source: accessor.bufferView, bytes: null })
  }
  for (const accessor of json.accessors ?? []) {
    if (accessor.bufferView === undefined) continue
    accessor.bufferView = viewRemap.get(accessor.bufferView)
  }

  // Only the textures the material still names survive. Dropping the
  // metallic-roughness map here is what removes its image from the file.
  const usedTextures = new Map()
  const takeTexture = (reference) => {
    if (!reference) return
    if (!usedTextures.has(reference.index)) {
      usedTextures.set(reference.index, usedTextures.size)
    }
    reference.index = usedTextures.get(reference.index)
  }

  const roles = new Map()
  for (const material of json.materials ?? []) {
    const pbr = material.pbrMetallicRoughness
    if (pbr?.metallicRoughnessTexture) delete pbr.metallicRoughnessTexture
    if (material.occlusionTexture) delete material.occlusionTexture

    if (pbr?.baseColorTexture) {
      roles.set(pbr.baseColorTexture.index, "color")
      takeTexture(pbr.baseColorTexture)
    }
    if (material.normalTexture) {
      roles.set(material.normalTexture.index, "normal")
      takeTexture(material.normalTexture)
    }
    if (material.emissiveTexture) {
      roles.set(material.emissiveTexture.index, "color")
      takeTexture(material.emissiveTexture)
    }
  }

  const sourceTextures = json.textures ?? []
  const textures = []
  const images = []
  for (const [sourceIndex] of [...usedTextures.entries()].sort(
    (a, b) => a[1] - b[1]
  )) {
    const texture = sourceTextures[sourceIndex]
    const image = json.images[texture.source]
    const { data, mimeType } = await encode(
      imageBytes(json, bin, image),
      roles.get(sourceIndex),
      maxTexture
    )

    const viewIndex = keptViews.length
    keptViews.push({ source: null, bytes: data })
    images.push({ mimeType, bufferView: viewIndex, name: image.name })
    textures.push({ ...texture, source: images.length - 1 })
  }

  json.textures = textures
  json.images = images

  // One pass over the kept views assembles the new binary chunk. Offsets are
  // four-byte aligned, which the spec requires and some loaders enforce.
  const chunks = []
  const bufferViews = []
  let offset = 0
  for (const view of keptViews) {
    const bytes =
      view.bytes ??
      bin.subarray(
        json.bufferViews[view.source].byteOffset ?? 0,
        (json.bufferViews[view.source].byteOffset ?? 0) +
          json.bufferViews[view.source].byteLength
      )
    const original = view.source === null ? null : json.bufferViews[view.source]

    bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: bytes.length,
      ...(original?.byteStride ? { byteStride: original.byteStride } : {}),
      ...(original?.target ? { target: original.target } : {}),
    })

    const padding = pad4(bytes.length)
    chunks.push(bytes, Buffer.alloc(padding, 0))
    offset += bytes.length + padding
  }

  json.bufferViews = bufferViews
  const nextBin = Buffer.concat(chunks)
  json.buffers = [{ byteLength: nextBin.length }]

  return { json, bin: nextBin }
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`

let sources
try {
  sources = (await fs.readdir(sourceDir)).filter((file) =>
    file.endsWith(".glb")
  )
} catch {
  console.log("models: no assets/models directory, nothing to compile")
  process.exit(0)
}

await fs.mkdir(outDir, { recursive: true })

for (const file of sources) {
  const sourcePath = path.join(sourceDir, file)
  const targetPath = path.join(outDir, file)

  const buffer = await fs.readFile(sourcePath)
  const parsed = parseGlb(buffer)
  const maxTexture = file === "bitcoin.glb" ? VISOR_TEXTURE : ICON_TEXTURE
  const compiled = await compile(parsed.json, parsed.bin, maxTexture)
  const output = writeGlb(compiled.json, compiled.bin)

  await fs.writeFile(targetPath, output)
  console.log(
    `models: ${file} ${mb(buffer.length)} -> ${mb(output.length)} ` +
      `(${Math.round((1 - output.length / buffer.length) * 100)}% smaller)`
  )
}
