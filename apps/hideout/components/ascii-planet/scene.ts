import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { logger } from "@workspace/ui/lib/logger"
import { createScreenPost } from "./screen-post"
import type { ScreenPostOptions } from "./screen-post"
import { createEarthLocationMarkers } from "./markers"
import type { EarthLocation } from "./markers"
import { resolveUserIpLocation } from "./geo-ip"
import { resolveThemeColor } from "./theme-color"
import { createPlanetModel, loadGlbModel } from "./PlanetModel"
import type { GlbSurface, PlanetHandle } from "./PlanetModel"
import {
  DEFAULT_RENDER_STYLE,
  cellHeightFor,
  holoDefaultsFor,
  postCellHeightFor,
  characterResolutionFor,
  lightingFor,
  needsEnvironment,
  postDefaultsFor,
  renderScaleFor,
  subjectFor,
  toneMappingFor,
} from "./policy"
import type { RenderStyle } from "./policy"

/**
 * A spinning subject, rendered to a character grid, in a host element.
 *
 * Headless on purpose: React mounts it and disposes it, and nothing else. The
 * scene used to read `host.closest(".cold-boot")` and a document attribute to
 * decide how it rendered, which put page layout inside the renderer's
 * interface. Both are now told to it — `boot` at construction, `setPaused`
 * afterwards.
 */

const INITIAL_PLANET_ROTATION_Y = -0.28
const EARTH_TEXTURE = "/textures/earth.jpg"
const FRAME_RATE = 30
const DRAG_SPEED = 0.005
/** How long the sync-tear settles over, in ms. */
const BOOT_SETTLE = 1600

export interface AsciiSceneOptions {
  /** A GLB to load. Without one the scene builds the procedural globe. */
  modelUrl?: string
  autoRotateSpeed?: number
  /** Multiplier applied after auto-fit. 1 = default size. */
  modelScale?: number
  /** Camera distance from origin. Smaller = closer/bigger. */
  cameraDistance?: number
  /** Surface treatment for a loaded GLB. */
  surface?: GlbSurface
  /** Characters per pixel. Higher resolves more detail and costs more. */
  resolution?: number
  /** Edge and dither strength for the pass that feeds the character ramp. */
  postOptions?: ScreenPostOptions
  /** Character grid, or projected wireframe. Editable at /admin/home. */
  style?: RenderStyle
  /** Plays the sync-tear settle. The boot curtain's scene sets this. */
  boot?: boolean
  onModelReady?: () => void
  /**
   * Fires once with the reader's resolved position, or null when the lookup
   * fails. The panel around the globe reads out of this, so the numbers it
   * prints are the ones the pin was placed from.
   */
  onLocation?: (location: EarthLocation | null) => void
}

export interface AsciiScene {
  /** Held paused while something else owns the screen. */
  setPaused: (paused: boolean) => void
  dispose: () => void
}

export function createAsciiScene(
  host: HTMLElement,
  options: AsciiSceneOptions = {}
): AsciiScene {
  const {
    modelUrl,
    autoRotateSpeed = 2.4,
    modelScale = 1,
    cameraDistance = 5.5,
    surface,
    resolution,
    postOptions,
    style = DEFAULT_RENDER_STYLE,
    boot = false,
    onModelReady,
    onLocation,
  } = options

  const subject = subjectFor(modelUrl)
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const characterResolution = characterResolutionFor(
    window.innerWidth,
    resolution
  )

  const initialW = Math.max(1, host.clientWidth)
  const initialH = Math.max(1, host.clientHeight)

  // Everything below the renderer is measured in CSS pixels and multiplied up
  // by this: the glyph grid is a layout decision, the pixel ratio is only how
  // finely each glyph gets drawn.
  const renderScale = renderScaleFor(window.devicePixelRatio)
  let cellHeight = cellHeightFor(initialW, characterResolution)

  // A context is not guaranteed. Browsers with fingerprinting protection turn
  // WebGL off, some extensions block it, and a machine with no accelerated
  // driver can simply refuse — in which case the constructor throws. Left
  // uncaught it escapes the mounting effect and React tears the page down, so
  // the reader loses the whole site over one decorative panel.
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
  } catch (error) {
    logger.warn("planet", "no WebGL context; the scene stays empty", error)
    // Marked ready so nothing goes on waiting for a picture that will not
    // arrive: the curtain drops its spinner and the panel keeps its readouts.
    host.dataset.modelReady = "true"
    onModelReady?.()
    onLocation?.(null)
    return { setPaused: () => {}, dispose: () => {} }
  }

  renderer.setPixelRatio(renderScale)
  renderer.setSize(initialW, initialH)
  renderer.setClearColor(0x000000, 0)

  const tone = toneMappingFor(subject, style)
  renderer.toneMapping = tone.filmic
    ? THREE.ACESFilmicToneMapping
    : THREE.NoToneMapping
  renderer.toneMappingExposure = tone.exposure

  renderer.domElement.setAttribute("aria-hidden", "true")
  // The chrome around the canvas is styled per style: a character grid wants
  // its phosphor bloom, a raster wants its edges.
  host.dataset.style = style
  host.appendChild(renderer.domElement)

  // Edge detection and dithering, applied to the frame before it is reduced
  // to characters. See AsciiPost for why neither can be done with lighting.
  // The pass works in the drawing buffer's own pixels, so both its size and
  // its cell are given in those rather than in CSS pixels.
  const post = createScreenPost(
    style,
    initialW * renderScale,
    initialH * renderScale,
    {
      ...(style === "holo"
        ? holoDefaultsFor(subject)
        : postDefaultsFor(subject)),
      ...postOptions,
      cellHeight: postCellHeightFor(
        style,
        cellHeight,
        renderScale,
        initialW * renderScale
      ),
      ink: resolveThemeColor("--primary", "#32f078"),
    }
  )
  const settling = boot && !reduceMotion
  post.setBootProgress(settling ? 0 : 1)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, initialW / initialH, 0.1, 100)
  camera.position.set(0, 0, cameraDistance)

  // Generated rather than fetched: no asset, no request.
  let envRT: THREE.WebGLRenderTarget | null = null
  if (needsEnvironment(subject, style)) {
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    envRT = pmrem.fromScene(room, 0.04)
    scene.environment = envRT.texture
    // Reflections carry the detail, so they are turned up past neutral.
    scene.environmentIntensity = 0.85
    room.dispose()
    pmrem.dispose()
  }

  for (const light of lightingFor(subject)) {
    if (light.kind === "ambient") {
      scene.add(new THREE.AmbientLight(0xffffff, light.intensity))
      continue
    }
    const directional = new THREE.DirectionalLight(0xffffff, light.intensity)
    if (light.position) directional.position.set(...light.position)
    scene.add(directional)
  }

  let rafId = 0
  let disposed = false
  const modelPromise = modelUrl ? loadGlbModel(modelUrl, surface, style) : null
  let modelLoaded = !modelPromise

  // An empty group while a model is loading, rather than the procedural
  // globe: it used to render for however long the GLB took to arrive, so the
  // coin visibly replaced a planet a second or two in.
  let planet: PlanetHandle = modelUrl
    ? { group: new THREE.Group(), mesh: new THREE.Group(), dispose: () => {} }
    : createPlanetModel(EARTH_TEXTURE, style)
  planet.group.rotation.y = INITIAL_PLANET_ROTATION_Y
  planet.group.scale.setScalar(modelScale)
  scene.add(planet.group)

  let locationMarkers = modelUrl
    ? null
    : createEarthLocationMarkers({ host, planetMesh: planet.mesh, camera })

  const userIpController = modelUrl ? null : new AbortController()
  if (userIpController) {
    resolveUserIpLocation(userIpController.signal).then((location) => {
      if (disposed) return
      if (!location) {
        logger.warn("planet", "could not resolve your location; no pin added")
        onLocation?.(null)
        return
      }
      locationMarkers?.addLocation(location)
      onLocation?.(location)
      logger.info("planet", `pinned you at ${location.name}`, {
        lat: location.lat,
        lon: location.lon,
      })
    })
  }

  if (modelPromise) {
    modelPromise
      .then((next) => {
        if (disposed) {
          next.dispose()
          return
        }
        locationMarkers?.dispose()
        scene.remove(planet.group)
        planet.dispose()
        planet = next
        planet.group.rotation.y = INITIAL_PLANET_ROTATION_Y
        planet.group.scale.setScalar(modelScale)
        scene.add(planet.group)
        locationMarkers = null
        modelLoaded = true
        host.dataset.modelReady = "true"
        syncRendering()
        onModelReady?.()
      })
      .catch((error) => {
        logger.error("planet", `could not load ${modelUrl}`, error)
        // The model is the only thing the curtain waits for, and a blocked or
        // failed fetch used to leave it waiting forever behind a spinner.
        modelLoaded = true
        host.dataset.modelReady = "true"
        syncRendering()
        onModelReady?.()
      })
  }

  const spinPerSec = reduceMotion ? 0 : (autoRotateSpeed * Math.PI) / 30
  const FRAME_MS = 1000 / FRAME_RATE
  let lastFrame = 0
  let lastT = performance.now()
  let dragging = false
  let lastX = 0
  let lastY = 0

  const onPointerDown = (event: PointerEvent) => {
    dragging = true
    lastX = event.clientX
    lastY = event.clientY
    host.setPointerCapture(event.pointerId)
    host.style.cursor = "grabbing"
  }
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    planet.group.rotation.y += (event.clientX - lastX) * DRAG_SPEED
    planet.group.rotation.x += (event.clientY - lastY) * DRAG_SPEED
    lastX = event.clientX
    lastY = event.clientY
  }
  const onPointerUp = (event: PointerEvent) => {
    dragging = false
    host.releasePointerCapture?.(event.pointerId)
    host.style.cursor = "grab"
  }
  host.addEventListener("pointerdown", onPointerDown)
  host.addEventListener("pointermove", onPointerMove)
  host.addEventListener("pointerup", onPointerUp)
  host.addEventListener("pointercancel", onPointerUp)

  // Scrolling past the hero leaves the WebGL pass running against nothing on
  // screen, so the loop stops when the subject is not visible and picks the
  // clock back up where it left off.
  let intersects = true
  let paused = false
  let rendering = false
  let settleStartedAt: number | null = null

  const renderFrame = () => {
    if (disposed || !rendering) return
    rafId = requestAnimationFrame(renderFrame)

    const now = performance.now()
    // A drag is direct manipulation and has to track the pointer, so the cap
    // is lifted while the reader is holding the subject.
    if (!dragging && now - lastFrame < FRAME_MS) return
    lastFrame = now

    const dt = (now - lastT) / 1000
    lastT = now
    if (!dragging) planet.group.rotation.y += spinPerSec * dt
    locationMarkers?.update()

    if (settling) {
      const elapsed = settleStartedAt === null ? 0 : now - settleStartedAt
      post.setBootProgress(elapsed / BOOT_SETTLE)
    }

    post.capture(renderer, scene, camera)
    renderer.setRenderTarget(null)
    renderer.clear()
    renderer.render(post.scene, post.camera)
  }

  function syncRendering() {
    const next = intersects && modelLoaded && !paused
    if (next === rendering) return

    locationMarkers?.setVisible(next)
    rendering = next
    if (rendering) {
      lastT = performance.now()
      if (settling && settleStartedAt === null) settleStartedAt = lastT
      rafId = requestAnimationFrame(renderFrame)
      logger.debug("planet", "back on screen, resuming")
    } else {
      cancelAnimationFrame(rafId)
      logger.debug("planet", "off screen, render paused")
    }
  }

  const visibility = new IntersectionObserver(
    ([entry]) => {
      intersects = entry.isIntersecting
      syncRendering()
    },
    { rootMargin: "100px" }
  )
  visibility.observe(host)

  syncRendering()

  const onResize = () => {
    const w = Math.max(1, host.clientWidth)
    const h = Math.max(1, host.clientHeight)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    // The column floor is a function of the box, so a rotation that halves
    // the width has to re-derive the cell or the subject loses its engraving.
    cellHeight = cellHeightFor(w, characterResolution)
    post.setCellHeight(
      postCellHeightFor(style, cellHeight, renderScale, w * renderScale)
    )
    post.setSize(w * renderScale, h * renderScale)
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(host)

  logger.info("planet", "globe online", {
    subject,
    style,
    resolution: characterResolution,
    columns: Math.floor(initialW / (cellHeight * 0.6)),
    renderScale,
    fps: reduceMotion ? 0 : FRAME_RATE,
    reducedMotion: reduceMotion,
  })

  return {
    setPaused(next) {
      if (next === paused) return
      paused = next
      syncRendering()
    },

    dispose() {
      disposed = true
      userIpController?.abort()
      cancelAnimationFrame(rafId)
      visibility.disconnect()
      ro.disconnect()
      host.removeEventListener("pointerdown", onPointerDown)
      host.removeEventListener("pointermove", onPointerMove)
      host.removeEventListener("pointerup", onPointerUp)
      host.removeEventListener("pointercancel", onPointerUp)
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
      locationMarkers?.dispose()
      planet.dispose()
      post.dispose()
      envRT?.dispose()
      renderer.dispose()
    },
  }
}
