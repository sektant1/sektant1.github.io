"use client"

import dynamic from "next/dynamic"

/**
 * The seam that keeps three out of the shared bundle.
 *
 * SiteShell renders the boot curtain on every route, and the curtain imports
 * the scene, so a static import put the renderer — three, GLTFLoader, PMREM,
 * about 560 KB — into the client bundle of every page, including the ones
 * with nothing to render and the readers who have already seen the boot.
 *
 * `ssr: false` because the scene is WebGL: there is nothing for the server to
 * render, and prerendering it only ships markup that is thrown away.
 */
export const AsciiPlanetScene = dynamic(
  () => import("./AsciiPlanetScene").then((module) => module.AsciiPlanetScene),
  { ssr: false }
)
