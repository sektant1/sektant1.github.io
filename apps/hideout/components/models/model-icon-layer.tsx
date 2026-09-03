"use client"

import * as React from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { logger } from "@workspace/ui/lib/logger"

import { resolveThemeColor } from "@/components/ascii-planet/theme-color"
import type { ModelFront } from "@/components/models/model-icon"

const FRAME_RATE = 24
const MODEL_SPAN = 1.66
const CAMERA_DISTANCE = 4
const PRESENTATION_TILT = -0.12
const SPIN_RADIANS_PER_MS = 0.00055

type Palette = {
  shadow: THREE.Color
  ink: THREE.Color
  hot: THREE.Color
}

type IconUniforms = {
  iconShadow: { value: THREE.Color }
  iconInk: { value: THREE.Color }
  iconHot: { value: THREE.Color }
}

type ModelHandle = {
  root: THREE.Group
  spin: THREE.Group
  materials: THREE.MeshStandardMaterial[]
  textures: Set<THREE.Texture>
}

type ModelRequest = {
  key: string
  url: string
  front: ModelFront
}

THREE.Cache.enabled = true

export function ModelIconLayer() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return

    const targets = Array.from(
      host.querySelectorAll<HTMLElement>("[data-model-icon]")
    )
    if (
      targets.length === 0 ||
      window.matchMedia("(forced-colors: active)").matches
    ) {
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        premultipliedAlpha: false,
        powerPreference: "low-power",
      })
    } catch (error) {
      logger.warn("model-icon", "models have no WebGL context", error)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.autoClear = false

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.set(0, 0, CAMERA_DISTANCE)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x07140c, 1.5))

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2)
    keyLight.position.set(-3, 4, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.8)
    rimLight.position.set(4, 1, -3)
    scene.add(rimLight)

    const models = new Map<string, ModelHandle>()
    const modelRequests = new Map<string, ModelRequest>()
    for (const target of targets) {
      const url = target.dataset.modelIcon
      if (!url) continue
      const front = readModelFront(target.dataset.modelFront)
      const key = modelKey(url, front)
      if (modelRequests.has(key)) continue
      modelRequests.set(key, {
        key,
        url,
        front,
      })
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const frameDuration = 1000 / FRAME_RATE
    let disposed = false
    let intersects = true
    let rafId = 0
    let lastFrame = 0
    let rotation = -0.28

    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      const pixelRatio = renderer.getPixelRatio()
      if (
        canvas.width !== Math.floor(width * pixelRatio) ||
        canvas.height !== Math.floor(height * pixelRatio)
      ) {
        renderer.setSize(width, height, false)
      }
    }

    const active = () => intersects && !document.hidden

    const requestFrame = () => {
      if (!disposed && active() && rafId === 0) {
        rafId = requestAnimationFrame(renderFrame)
      }
    }

    const renderFrame = (time: number) => {
      rafId = 0
      if (disposed || !active() || models.size === 0) return
      if (!reduceMotion && time - lastFrame < frameDuration) {
        requestFrame()
        return
      }

      const elapsed = lastFrame === 0 ? 0 : time - lastFrame
      lastFrame = time
      if (!reduceMotion) rotation += elapsed * SPIN_RADIANS_PER_MS

      resize()
      const canvasRect = canvas.getBoundingClientRect()
      for (const model of models.values()) model.root.visible = false

      renderer.setScissorTest(false)
      renderer.clear(true, true, true)
      renderer.setScissorTest(true)

      targets.forEach((target) => {
        const url = target.dataset.modelIcon
        const model = url
          ? models.get(modelKey(url, readModelFront(target.dataset.modelFront)))
          : null
        if (!model) return

        const rect = target.getBoundingClientRect()
        const inset = 1
        const width = Math.max(1, rect.width - inset * 2)
        const height = Math.max(1, rect.height - inset * 2)
        const x = rect.left - canvasRect.left + inset
        const y = canvasRect.bottom - rect.bottom + inset

        model.root.visible = true
        model.spin.rotation.y = rotation
        renderer.setScissor(x, y, width, height)
        renderer.setViewport(x, y, width, height)
        renderer.render(scene, camera)
        model.root.visible = false
      })

      renderer.setScissorTest(false)
      if (!reduceMotion) requestFrame()
    }

    const palette = readPalette()
    const loader = new GLTFLoader()

    for (const { key, url, front } of modelRequests.values()) {
      loader.load(
        url,
        (gltf) => {
          const model = prepareModel(gltf.scene, palette, front)
          if (disposed) {
            disposeModel(model)
            return
          }

          model.root.visible = false
          models.set(key, model)
          scene.add(model.root)
          for (const target of targets) {
            if (
              target.dataset.modelIcon === url &&
              readModelFront(target.dataset.modelFront) === front
            ) {
              target.dataset.modelReady = "true"
            }
          }
          requestFrame()
        },
        undefined,
        (error) => logger.warn("model-icon", `could not load ${url}`, error)
      )
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      requestFrame()
    })
    resizeObserver.observe(host)

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        intersects = entry.isIntersecting
        if (intersects) requestFrame()
        else cancelAnimationFrame(rafId)
        if (!intersects) rafId = 0
      },
      { rootMargin: "50px" }
    )
    visibilityObserver.observe(host)

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId)
        rafId = 0
      } else {
        requestFrame()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    const tubeObserver = new MutationObserver(() => {
      const next = readPalette()
      for (const model of models.values()) {
        for (const material of model.materials) {
          updatePalette(material, next)
        }
      }
      requestFrame()
    })
    tubeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-tube"],
    })

    resize()

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      tubeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      for (const target of targets) target.removeAttribute("data-model-ready")
      for (const model of models.values()) disposeModel(model)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="model-icon-layer pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  )
}

function prepareModel(
  source: THREE.Object3D,
  palette: Palette,
  front: ModelFront
): ModelHandle {
  const materials: THREE.MeshStandardMaterial[] = []
  const textures = new Set<THREE.Texture>()

  source.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh) return

    const oldMaterials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    const old = oldMaterials[0] as THREE.MeshStandardMaterial | undefined

    for (const material of oldMaterials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value)
      }
      material.dispose()
    }

    const material = new THREE.MeshStandardMaterial({
      alphaMap: old?.alphaMap ?? null,
      alphaTest: old?.alphaTest ?? 0,
      color: old?.color?.clone() ?? new THREE.Color(0.72, 0.72, 0.72),
      map: old?.map ?? null,
      metalness: 0.32,
      normalMap: old?.normalMap ?? null,
      roughness: 0.46,
      side: old?.side ?? THREE.FrontSide,
      vertexColors: old?.vertexColors ?? false,
    })
    if (material.normalMap) material.normalScale.set(1.25, 1.25)
    applyIconShader(material, palette)
    materials.push(material)
    mesh.material = material
  })

  source.updateWorldMatrix(true, true)
  const sourceBox = new THREE.Box3().setFromObject(source)
  const sourceSize = sourceBox.getSize(new THREE.Vector3())
  const sourceCenter = sourceBox.getCenter(new THREE.Vector3())

  source.position.sub(sourceCenter)

  const aligned = new THREE.Group()
  aligned.add(source)
  orientFrontToCamera(aligned, sourceSize, front)
  aligned.updateWorldMatrix(true, true)

  const alignedBox = new THREE.Box3().setFromObject(aligned)
  const size = new THREE.Vector3()
  alignedBox.getSize(size)

  const orbitWidth = Math.hypot(size.x, size.z)
  const envelope = Math.max(orbitWidth, size.y) || 1
  aligned.scale.setScalar(MODEL_SPAN / envelope)

  const spin = new THREE.Group()
  spin.add(aligned)

  const root = new THREE.Group()
  root.rotation.x = PRESENTATION_TILT
  root.add(spin)

  return { root, spin, materials, textures }
}

function readModelFront(value: string | undefined): ModelFront {
  if (
    value === "x" ||
    value === "-x" ||
    value === "y" ||
    value === "-y" ||
    value === "z" ||
    value === "-z"
  ) {
    return value
  }
  return "auto"
}

function modelKey(url: string, front: ModelFront) {
  return `${front}:${url}`
}

function orientFrontToCamera(
  root: THREE.Group,
  size: THREE.Vector3,
  front: ModelFront
) {
  if (front === "x" || front === "-x") {
    root.rotation.y = front === "x" ? -Math.PI / 2 : Math.PI / 2
    return
  }
  if (front === "y" || front === "-y") {
    root.rotation.x = front === "y" ? Math.PI / 2 : -Math.PI / 2
    return
  }
  if (front === "-z") {
    root.rotation.y = Math.PI
    return
  }
  if (front === "z") return

  if (size.x <= size.y && size.x <= size.z) {
    root.rotation.y = Math.PI / 2
    return
  }
  if (size.y <= size.x && size.y <= size.z) {
    root.rotation.x = Math.PI / 2
  }
}

function readPalette(): Palette {
  const ink = resolveThemeColor("--primary", "#32f078")
  const hot = resolveThemeColor("--terminal-chrome", "#a9ffc9")
  return {
    shadow: ink.clone().multiplyScalar(0.16),
    ink,
    hot,
  }
}

function applyIconShader(
  material: THREE.MeshStandardMaterial,
  palette: Palette
) {
  const uniforms: IconUniforms = {
    iconShadow: { value: palette.shadow.clone() },
    iconInk: { value: palette.ink.clone() },
    iconHot: { value: palette.hot.clone() },
  }
  material.userData.iconUniforms = uniforms
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = `
uniform vec3 iconShadow;
uniform vec3 iconInk;
uniform vec3 iconHot;
${shader.fragmentShader}`.replace(
      "#include <opaque_fragment>",
      `
float iconLight = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
float iconBody = smoothstep(0.008, 0.62, iconLight);
float iconHighlight = smoothstep(0.42, 1.15, iconLight);
float iconDetail = smoothstep(0.015, 0.11, fwidth(iconLight));
vec3 iconView = normalize(vViewPosition);
float iconRim = pow(1.0 - saturate(dot(normal, iconView)), 3.0);
outgoingLight = mix(iconShadow, iconInk, iconBody);
outgoingLight = mix(outgoingLight, iconHot, iconHighlight * 0.42);
outgoingLight += iconHot * (iconRim * 0.28 + iconDetail * 0.1);
#include <opaque_fragment>
`
    )
  }
  material.customProgramCacheKey = () => "model-icon-phosphor-v1"
}

function updatePalette(material: THREE.MeshStandardMaterial, palette: Palette) {
  const uniforms = material.userData.iconUniforms as IconUniforms | undefined
  if (!uniforms) return
  uniforms.iconShadow.value.copy(palette.shadow)
  uniforms.iconInk.value.copy(palette.ink)
  uniforms.iconHot.value.copy(palette.hot)
}

function disposeModel(model: ModelHandle) {
  model.root.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
  })
  for (const material of model.materials) material.dispose()
  for (const texture of model.textures) texture.dispose()
}
