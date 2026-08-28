/**
 * One thumbnail shape for the whole site.
 *
 * Cards, list rows and mastheads all fit to this, and the build re-encodes
 * every front-matter thumbnail to match it — so a 1254×1254 logo and a
 * 1280×720 screenshot arrive the same size and the grid reads as a grid.
 *
 * The generator in scripts/sync-content-assets.mjs reads these values, so the
 * ratio the CSS fits to and the ratio the files are encoded at cannot drift.
 */
export const THUMB_WIDTH = 960
export const THUMB_HEIGHT = 540
export const THUMB_ASPECT = `${THUMB_WIDTH} / ${THUMB_HEIGHT}`
