/**
 * The station's mark: the same sixteen-unit S the favicon is cut from.
 *
 * Drawn rather than set. Every edge lands on a whole unit of the grid and
 * `crispEdges` keeps the rasteriser from inventing a grey one, so the mark is
 * the same shape at 16 pixels in a browser tab as it is at 20 in the sidebar —
 * which is the only reason a site whose type is a raster can carry a logo at
 * all.
 *
 * The corner brackets rather than a box: the identity has no rounded
 * rectangles and no closed frames in it, and the same four marks appear around
 * the panels further down the page.
 */
export function SiteMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <path
        className="text-terminal-chrome-dim"
        fill="currentColor"
        d="M1 1h4v1H2v3H1zM11 1h4v4h-1V2h-3zM1 11h1v3h3v1H1zM14 11h1v4h-4v-1h3z"
      />
      <path
        className="text-primary"
        fill="currentColor"
        d="M4 4h7v2H6v1h5v5H4v-2h5v-1H4z"
      />
      {/* The block that follows a prompt. It lights under the pointer, which
          is the whole hover state: the mark is a terminal, and a terminal
          answers by putting its cursor where you are looking. */}
      <rect
        x="12"
        y="10"
        width="2"
        height="2"
        fill="currentColor"
        className="text-terminal-chrome-dim transition-colors group-hover/mark:text-primary"
      />
    </svg>
  )
}
