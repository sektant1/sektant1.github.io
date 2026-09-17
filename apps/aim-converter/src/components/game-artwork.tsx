import { sourceControls } from "../data/source-controls.ts"
import type { GameId } from "../types.ts"
import { ArtworkImage } from "./artwork-image.tsx"

export function GameArtwork({ id }: { id: GameId }) {
  const profile = sourceControls[id]
  return (
    <div className="game-artwork" aria-hidden="true">
      <ArtworkImage src={profile.image} fallback={profile.imageFallback} />
    </div>
  )
}
