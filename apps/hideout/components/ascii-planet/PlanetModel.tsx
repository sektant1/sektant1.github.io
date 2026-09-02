import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import GLOBE_FRAGMENT from "./shaders/globe.frag"
import GLOBE_VERTEX from "./shaders/globe.vert"
import { DEFAULT_RENDER_STYLE, globeTonesFor, type RenderStyle } from "./policy"

export interface PlanetHandle {
  group: THREE.Group
  mesh: THREE.Object3D
  dispose: () => void
}

// A scene is built per mount, and the curtain's scene is mounted more than
// once: React's strict double-invoke in development, and a replayed boot.
// Without this the GLB is fetched again each time and the coin visibly loads
// twice; cached, the second build parses bytes that are already here.
THREE.Cache.enabled = true

const TARGET_DIAMETER = 2.8

/** Earth's, in radians. The globe is a globe before it is a graphic. */
const AXIAL_TILT = 0.41

function fitObjectToTarget(
  obj: THREE.Object3D,
  target = TARGET_DIAMETER
): void {
  const box = new THREE.Box3().setFromObject(obj)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  obj.position.sub(center)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = target / maxDim
  obj.scale.multiplyScalar(scale)
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else mat?.dispose?.()
  })
}

export interface GlbSurface {
  /** 0 = mirror, 1 = chalk. Low values give the sweeping highlight that
   *  reads as relief once the render is reduced to luminance. */
  roughness?: number
  /** 1 for metal. A metal's diffuse term is black, so all of its shading is
   *  specular — which is exactly the part that moves as the object turns. */
  metalness?: number
  /** Multiplies the normal map, for pushing surface detail past the
   *  threshold where a character actually changes. */
  normalScale?: number
}

/**
 * The angle two faces have to differ by before the edge between them is drawn.
 *
 * Low enough that the model's own faceting comes through as wire — which is
 * the look — and high enough that a curved plate does not dissolve into every
 * triangle it was tessellated from.
 */
const EDGE_THRESHOLD_DEG = 12

/** The fill under the wire. Dim enough that the lines stay the drawing. */
const HOLO_FILL = 0x1f5c3d

/**
 * The solid the wire is stretched over: flat-shaded, so every facet takes one
 * value from the lighting rig and the raster quantises it to a plate.
 *
 * It is also what makes the wireframe readable. Without a solid the far side
 * of the model draws through the near side, and a raster that fattens each
 * line to the cell it crosses turns that into a mass of noise. With it, the
 * faces hide the lines behind them, the silhouette comes back, and the shading
 * that survives is the faceting itself — which is the whole look.
 */
/**
 * Point sampling, the way a console with no filtering unit did it.
 *
 * The mesh is drawn as chunky cells, and a bilinear texture under it is a
 * smooth image showing through a coarse grid — two resolutions in one picture.
 * Nearest makes the texel the same kind of block the raster is, which is the
 * look, and the mip chain stays nearest too so the far side of a sphere does
 * not quietly go back to blending.
 */
function pointSample(texture: THREE.Texture | null): THREE.Texture | null {
  if (!texture) return null
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapNearestFilter
  texture.anisotropy = 1
  texture.needsUpdate = true
  return texture
}

function holoFillMaterial(source?: THREE.MeshStandardMaterial): THREE.Material {
  return new THREE.MeshLambertMaterial({
    // A map already carries the picture; tinting it as well only drives the
    // whole surface below the raster's first step, which is how the coin came
    // out as a bare rim. The tint is for meshes that arrive with nothing.
    color: source?.map ? 0xffffff : HOLO_FILL,
    // The coin's ₿ is a normal map, not geometry, so a wireframe alone finds
    // the rim and nothing else. Carrying the maps into the fill is what keeps
    // the engraving: the wire draws the shape, the maps shade the face.
    map: pointSample(source?.map ?? null),
    normalMap: pointSample(source?.normalMap ?? null),
    // A projection carries its own light. Without this the coin is lit from
    // one side and half its engraving falls under the raster's first step,
    // which is a hologram with a shadow on it — the wrong physics for the
    // picture and the wrong reading for the page.
    emissive: source?.map ? 0xffffff : 0x000000,
    emissiveMap: source?.map ?? null,
    emissiveIntensity: 0.45,
    flatShading: true,
  })
}

/**
 * Draws every mesh under `root` as the lines of its own silhouette and feature
 * edges, hidden-line style.
 *
 * `material.wireframe` would draw all three edges of every triangle, which on
 * a model this dense is a grey mass once the raster quantises it.
 * `EdgesGeometry` keeps the edges a person would draw: the rim, the engraving,
 * the step between plates.
 *
 * The meshes stay and keep rendering, as depth only: they are what occludes.
 */
function wireframeInPlace(root: THREE.Object3D): void {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff })
  const meshes: THREE.Mesh[] = []

  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.isMesh && mesh.geometry) meshes.push(mesh)
  })

  for (const mesh of meshes) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, EDGE_THRESHOLD_DEG),
      material
    )
    edges.position.copy(mesh.position)
    edges.rotation.copy(mesh.rotation)
    edges.scale.copy(mesh.scale)
    // Depth first, lines second, whatever three's own sorting would prefer:
    // an occluder that draws after the lines it should have hidden occludes
    // nothing.
    mesh.renderOrder = -1
    edges.renderOrder = 1
    const old = mesh.material as THREE.Material | THREE.Material[] | undefined
    const source = (Array.isArray(old) ? old[0] : old) as
      THREE.MeshStandardMaterial | undefined
    mesh.material = holoFillMaterial(source)
    if (Array.isArray(old)) old.forEach((m) => m.dispose())
    else old?.dispose?.()
    mesh.parent?.add(edges)
  }
}

export function loadGlbModel(
  url: string,
  surface: GlbSurface = {},
  style: RenderStyle = DEFAULT_RENDER_STYLE
): Promise<PlanetHandle> {
  const { roughness = 0.35, metalness = 0.9, normalScale = 2.0 } = surface

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => {
        const group = new THREE.Group()
        const root = gltf.scene
        root.traverse((o) => {
          const mesh = o as THREE.Mesh
          if (!mesh.isMesh) return
          const old = mesh.material as
            THREE.Material | THREE.Material[] | undefined
          const pick = (m: THREE.Material | undefined) =>
            m as THREE.MeshStandardMaterial | undefined
          const src = Array.isArray(old) ? pick(old[0]) : pick(old)
          const map = src?.map ?? null
          const normalMap = src?.normalMap ?? null
          const roughnessMap = src?.roughnessMap ?? null
          const metalnessMap = src?.metalnessMap ?? null
          const mat = new THREE.MeshStandardMaterial({
            color: src?.color ? src.color.clone() : new THREE.Color(0xffffff),
            map,
            normalMap,
            roughnessMap,
            metalnessMap,
            // The old values (roughness 1, metalness 0) flattened everything
            // to pure Lambert, which in ASCII is a silhouette with a soft
            // gradient inside it and no detail at all.
            roughness,
            metalness,
          })
          if (normalMap) {
            mat.normalScale.set(normalScale, normalScale)
            const geom = mesh.geometry as THREE.BufferGeometry | undefined
            if (
              geom &&
              geom.index &&
              !geom.attributes.tangent &&
              geom.attributes.uv &&
              geom.attributes.normal
            ) {
              try {
                geom.computeTangents()
              } catch {
                /* noop */
              }
            }
          }
          if (Array.isArray(old)) old.forEach((m) => m.dispose())
          else old?.dispose?.()
          mesh.material = mat
        })
        if (style === "holo") wireframeInPlace(root)
        fitObjectToTarget(root)
        group.add(root)
        resolve({
          group,
          mesh: root,
          dispose: () => disposeObject(root),
        })
      },
      undefined,
      (err) => reject(err)
    )
  })
}

function loadHighContrastEarth(url: string): THREE.CanvasTexture {
  const W = 1024
  const H = 512
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, W, H)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace

  if (!ctx) return tex

  const img = new Image()
  img.crossOrigin = "anonymous"
  img.onload = () => {
    ctx.drawImage(img, 0, 0, W, H)
    const imageData = ctx.getImageData(0, 0, W, H)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]
      const isIce = r > 210 && g > 210 && b > 210
      const isWater = b >= r + 4 && b >= g - 6
      let v: number
      if (isIce) v = 255
      else if (isWater) v = 54
      else v = 235
      d[i] = v
      d[i + 1] = v
      d[i + 2] = v
    }
    ctx.putImageData(imageData, 0, 0)
    tex.needsUpdate = true
  }
  img.src = url

  return tex
}

/**
 * The globe's surface, emitted rather than lit.
 *
 * Both passes downstream read one number per cell and quantise it, so the
 * useful thing a material can do here is name the tones instead of shading a
 * ball and hoping the reduction lands on them. `globe.frag` carries the
 * argument in full; `globeTonesFor` carries where the steps are.
 */
function globeMaterial(
  texture: THREE.Texture,
  style: RenderStyle
): THREE.ShaderMaterial {
  const tones = globeTonesFor(style)

  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uWater: { value: tones.water },
      uLand: { value: tones.land },
      uLimb: { value: tones.limb },
      uLimbPower: { value: tones.limbPower },
      uWire: { value: new THREE.Vector2(tones.wire[0], tones.wire[1]) },
      uWireWidth: { value: tones.wireWidth },
      uWireTone: { value: tones.wireTone },
      uBackTone: { value: tones.backTone },
    },
    vertexShader: GLOBE_VERTEX,
    fragmentShader: GLOBE_FRAGMENT,
    // Both sides, and neither of them occluding the other: a projection is
    // drawn through, so the far half of the sphere shows in the gaps of the
    // near half. That is the whole reason the object reads as hollow.
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    // The value written is the tone the pass is meant to read. A tone curve
    // over the top would move every one of them off the step it was put on.
    toneMapped: false,
  })
}

export function createPlanetModel(
  textureUrl = "/textures/earth.jpg",
  style: RenderStyle = DEFAULT_RENDER_STYLE
): PlanetHandle {
  const group = new THREE.Group()
  const texture = loadHighContrastEarth(textureUrl)
  const material = globeMaterial(texture, style)

  // Segments are a silhouette decision now rather than a shading one. The
  // hologram used to take its tones from a coarse sphere's own faceting, which
  // is why it was built at 32 — with the tones named outright, the only thing
  // the count still buys is a limb that reads as a curve rather than a polygon.
  const geometry = new THREE.SphereGeometry(1.4, 64, 48)
  const mesh = new THREE.Mesh(geometry, material)

  // The tilt goes on the group and the spin on the mesh inside it, which is the
  // only order that turns a planet. Both used to be the other way round — the
  // sphere tilted and its parent spun — and a parent turning about the world's
  // vertical axis swings a tilted child's pole around a cone rather than
  // rotating it about its own. The globe wobbled like a struck top, and every
  // pin on it rode up and down with the wobble.
  group.rotation.z = AXIAL_TILT
  group.add(mesh)

  return {
    group,
    mesh,
    dispose() {
      geometry.dispose()
      material.dispose()
      texture.dispose()
    },
  }
}
