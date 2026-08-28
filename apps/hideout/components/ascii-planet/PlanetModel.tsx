import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

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

export function loadGlbModel(
  url: string,
  surface: GlbSurface = {}
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

export function createPlanetModel(
  textureUrl = "/textures/earth.jpg"
): PlanetHandle {
  const group = new THREE.Group()

  const texture = loadHighContrastEarth(textureUrl)

  const material = new THREE.MeshToonMaterial({
    map: texture,
    color: 0xffffff,
  })

  const geometry = new THREE.SphereGeometry(1.4, 64, 48)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.z = 0.41
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
