"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { logger } from "@workspace/ui/lib/logger"
import { createAsciiPost, type AsciiPostOptions } from "./AsciiPost"
import {
  createEarthLocationMarkers,
  resolveThemeColor,
  resolveUserIpLocation,
} from "./markers"
import { createPlanetModel, loadGlbModel } from "./PlanetModel"
import type { GlbSurface, PlanetHandle } from "./PlanetModel"
import "./planet.css"

const INITIAL_PLANET_ROTATION_Y = -0.28

interface AsciiPlanetSceneProps {
  className?: string
  ariaLabel?: string
  onReady?: () => void
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
  postOptions?: AsciiPostOptions
}

export function AsciiPlanetScene({
  className,
  ariaLabel = "spinning ASCII model",
  onReady,
  modelUrl,
  autoRotateSpeed = 2.4,
  modelScale = 1,
  cameraDistance = 5.5,
  surface,
  resolution,
  postOptions,
}: AsciiPlanetSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isMobile = typeof window !== "undefined" && window.innerWidth < 720
    const modelPromise = modelUrl ? loadGlbModel(modelUrl, surface) : null
    const isBootScene = Boolean(host.closest(".cold-boot"))
    host.dataset.modelReady = modelUrl ? "false" : "true"

    const initialW = Math.max(1, host.clientWidth)
    const initialH = Math.max(1, host.clientHeight)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.setPixelRatio(1)
    renderer.setSize(initialW, initialH)
    renderer.setClearColor(0x000000, 0)
    // The shader is a nine-level glyph quantiser, so what matters is how the
    // scene's brightness is distributed across those levels. A filmic
    // curve keeps the highlight from clipping every bright pixel to the same
    // character, which is what flattened the coin's face; the exposure lift
    // then spreads the midtones the object mostly lives in.
    // Two subjects, two treatments. A loaded model is a solid with relief,
    // shaded by the light that rakes across it; the procedural globe is a
    // high-contrast texture on a sphere, where the picture is already in the
    // albedo and extra shaping only washes it out.
    const relief = Boolean(modelUrl)

    renderer.toneMapping = relief
      ? THREE.ACESFilmicToneMapping
      : THREE.NoToneMapping
    renderer.toneMappingExposure = relief ? 1.45 : 1

    const characterResolution = resolution ?? (isMobile ? 0.18 : 0.24)
    renderer.domElement.setAttribute("aria-hidden", "true")
    host.appendChild(renderer.domElement)

    // Edge detection and dithering, applied to the frame before it is reduced
    // to characters. See AsciiPost for why neither can be done with lighting.
    // Edge detection earns its cost on relief and costs contrast on a
    // texture, so the globe gets the dither and none of the Sobel.
    const post = createAsciiPost(initialW, initialH, {
      ...(relief
        ? { minLevel: 0 }
        : { edge: 0, contrast: 1, dither: 0.045, minLevel: 1 }),
      ...postOptions,
      cellHeight: 2 / characterResolution,
      ink: resolveThemeColor("--primary", "#35ff80"),
    })
    post.setBootProgress(isBootScene && !reduceMotion ? 0 : 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      30,
      initialW / initialH,
      0.1,
      100
    )
    camera.position.set(0, 0, cameraDistance)

    // Lighting for a render that will be thrown away and kept only as
    // luminance. Two rules follow from that:
    //
    //   Nothing survives that is not a brightness difference. A light from
    //   behind the camera lights every facing surface about equally, which is
    //   why the old front key (2, 3.5, 6) produced a filled silhouette with no
    //   features. The key is moved off to the side and low, so the terminator
    //   falls across the object and relief casts its own gradients.
    //
    //   The edges have to be drawn by something. A rim light behind the
    //   subject picks out the silhouette and every raised lip on it, which in
    //   a character grid is the difference between a shape and a blob.
    // A metal's diffuse response is black — all of its shading is reflection.
    // Without an environment to reflect there is nothing to shade with, which
    // is why the coin rendered as a flat dark disc no matter how it was lit.
    // This generates one procedurally: no asset, no request.
    let envRT: THREE.WebGLRenderTarget | null = null
    if (relief) {
      const pmrem = new THREE.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      envRT = pmrem.fromScene(room, 0.04)
      scene.environment = envRT.texture
      // Reflections carry the detail, so they are turned up past neutral.
      scene.environmentIntensity = 0.85
      room.dispose()
      pmrem.dispose()
    }

    const ambient = new THREE.AmbientLight(0xffffff, relief ? 0.04 : 0.15)
    scene.add(ambient)

    // Key. For relief it is high and well to the side, so the terminator
    // falls across the surface and every raised edge casts its own gradient.
    // For the globe it stays near the camera, which is what keeps the
    // coastlines in the texture legible instead of half of them in shadow.
    const key = new THREE.DirectionalLight(0xffffff, relief ? 4.2 : 2)
    if (relief) key.position.set(-5.5, 3.2, 1.8)
    else key.position.set(2, 3.5, 6)
    scene.add(key)

    // Fill: opposite and weak, only enough to keep the shadow side from
    // clipping to the empty character.
    const fill = new THREE.DirectionalLight(0xffffff, relief ? 0.7 : 0.35)
    if (relief) fill.position.set(3.5, -1.2, 3.5)
    else fill.position.set(-2, 1.5, 4)
    scene.add(fill)

    // Rim: behind and above, aimed back at the camera. Relief only — on a
    // sphere it just adds a bright ring that reads as a halo.
    if (relief) {
      const rim = new THREE.DirectionalLight(0xffffff, 1.5)
      rim.position.set(2.5, 3.0, -5)
      scene.add(rim)
    }

    let rafId = 0
    let disposed = false
    let modelLoaded = !modelPromise

    // An empty group when a model is loading, rather than the procedural
    // globe: it used to render for however long the GLB took to arrive, so
    // the coin visibly replaced a planet a second or two in.
    let planet: PlanetHandle = modelUrl
      ? { group: new THREE.Group(), mesh: new THREE.Group(), dispose: () => {} }
      : createPlanetModel("/textures/earth.jpg")
    planet.group.rotation.y = INITIAL_PLANET_ROTATION_Y
    planet.group.scale.setScalar(modelScale)
    scene.add(planet.group)
    let locationMarkers = modelUrl
      ? null
      : createEarthLocationMarkers({
          host,
          planetMesh: planet.mesh,
          camera,
        })
    const userIpController = modelUrl ? null : new AbortController()
    if (userIpController) {
      resolveUserIpLocation(userIpController.signal)
        .then((location) => {
          if (disposed) return
          if (!location) {
            logger.warn(
              "planet",
              "could not resolve your location; no pin added"
            )
            return
          }
          locationMarkers?.addLocation(location)
          logger.info("planet", `pinned you at ${location.name}`, {
            lat: location.lat,
            lon: location.lon,
          })
        })
        .catch(() => {
          if (!disposed) logger.warn("planet", "location lookup failed")
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
          onReady?.()
        })
        .catch((error) => {
          logger.error("planet", `could not load ${modelUrl}`, error)
        })
    }

    const spinPerSec = reduceMotion ? 0 : (autoRotateSpeed * Math.PI) / 30

    const frameRate = 30
    const FRAME_MS = 1000 / frameRate
    let lastFrame = 0
    let lastT = performance.now()
    let dragging = false
    let lastX = 0
    let lastY = 0
    const DRAG_SPEED = 0.005

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      host.setPointerCapture(e.pointerId)
      host.style.cursor = "grabbing"
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      planet.group.rotation.y += dx * DRAG_SPEED
      planet.group.rotation.x += dy * DRAG_SPEED
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      host.releasePointerCapture?.(e.pointerId)
      host.style.cursor = "grab"
    }
    host.addEventListener("pointerdown", onPointerDown)
    host.addEventListener("pointermove", onPointerMove)
    host.addEventListener("pointerup", onPointerUp)
    host.addEventListener("pointercancel", onPointerUp)

    // Scrolling past the hero leaves the WebGL pass running against nothing on
    // screen, so the loop stops when the globe is not visible and picks the
    // clock back up where it left off.
    let intersects = true
    let rendering = false
    let bootStartedAt: number | null = null

    const renderFrame = () => {
      if (disposed || !rendering) return
      rafId = requestAnimationFrame(renderFrame)

      const now = performance.now()
      // A drag is direct manipulation and has to track the pointer, so the
      // cap is lifted while the reader is holding the globe.
      if (!dragging && now - lastFrame < FRAME_MS) return
      lastFrame = now

      const dt = (now - lastT) / 1000
      lastT = now
      if (!dragging) planet.group.rotation.y += spinPerSec * dt
      locationMarkers?.update()

      if (isBootScene && !reduceMotion) {
        const elapsed = bootStartedAt === null ? 0 : now - bootStartedAt
        post.setBootProgress(elapsed / 1600)
      }

      post.capture(renderer, scene, camera)
      renderer.setRenderTarget(null)
      renderer.clear()
      renderer.render(post.scene, post.camera)
    }

    const syncRendering = () => {
      const next =
        intersects &&
        modelLoaded &&
        (isBootScene || document.documentElement.dataset.coldBoot !== "run")
      if (next === rendering) return

      rendering = next
      if (rendering) {
        lastT = performance.now()
        if (isBootScene && bootStartedAt === null) bootStartedAt = lastT
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

    const bootVisibility = new MutationObserver(syncRendering)
    bootVisibility.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-cold-boot"],
    })

    syncRendering()

    const onResize = () => {
      const w = Math.max(1, host.clientWidth)
      const h = Math.max(1, host.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      post.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(host)

    logger.info("planet", "globe online", {
      resolution: characterResolution,
      fps: reduceMotion ? 0 : frameRate,
      reducedMotion: reduceMotion,
    })

    return () => {
      disposed = true
      userIpController?.abort()
      cancelAnimationFrame(rafId)
      visibility.disconnect()
      bootVisibility.disconnect()
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
    }
  }, [
    modelUrl,
    autoRotateSpeed,
    modelScale,
    cameraDistance,
    surface,
    resolution,
    postOptions,
    onReady,
  ])

  return (
    <div
      ref={hostRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
      data-model-ready={modelUrl ? "false" : "true"}
    />
  )
}
