"use client"

import { useEffect, useRef } from "react"
import type { RenderStyle } from "./policy"
import type { ScreenPostOptions } from "./screen-post"
import type { EarthLocation } from "./markers"
import type { GlbSurface } from "./PlanetModel"
import { createAsciiScene } from "./scene"
import "./planet.css"

interface AsciiPlanetSceneProps {
  className?: string
  ariaLabel?: string
  onReady?: () => void
  modelUrl?: string
  autoRotateSpeed?: number
  modelScale?: number
  cameraDistance?: number
  surface?: GlbSurface
  resolution?: number
  postOptions?: ScreenPostOptions
  /** Character grid, or projected wireframe. Editable at /admin/home. */
  style?: RenderStyle
  /** Set by the boot curtain, which owns the screen while it runs. */
  boot?: boolean
  /** The reader's resolved position, or null when the lookup fails. */
  onLocation?: (location: EarthLocation | null) => void
}

/**
 * Mounts an ASCII scene in a div and takes it down again.
 *
 * The renderer lives in scene.ts. What stays here is the one thing that is
 * genuinely React's: the element's lifetime, plus the page-level rule that a
 * scene behind the boot curtain does not render while the curtain is up.
 */
export function AsciiPlanetScene({
  className,
  ariaLabel = "spinning ASCII model",
  onReady,
  modelUrl,
  autoRotateSpeed,
  modelScale,
  cameraDistance,
  surface,
  resolution,
  postOptions,
  style,
  boot = false,
  onLocation,
}: AsciiPlanetSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  // Held in a ref rather than a dependency: the lookup fires once per scene,
  // and a caller passing an inline function would otherwise tear the whole
  // renderer down and rebuild it on every render.
  const locationRef = useRef(onLocation)
  useEffect(() => {
    locationRef.current = onLocation
  }, [onLocation])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    host.dataset.modelReady = modelUrl ? "false" : "true"

    const scene = createAsciiScene(host, {
      modelUrl,
      autoRotateSpeed,
      modelScale,
      cameraDistance,
      surface,
      resolution,
      postOptions,
      style,
      boot,
      onModelReady: onReady,
      onLocation: (location) => locationRef.current?.(location),
    })

    if (boot) return () => scene.dispose()

    const syncCurtain = () => {
      scene.setPaused(document.documentElement.dataset.coldBoot === "run")
    }
    syncCurtain()

    const curtain = new MutationObserver(syncCurtain)
    curtain.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-cold-boot"],
    })

    return () => {
      curtain.disconnect()
      scene.dispose()
    }
  }, [
    modelUrl,
    autoRotateSpeed,
    modelScale,
    cameraDistance,
    surface,
    resolution,
    postOptions,
    style,
    boot,
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
