import { createCmsCollection } from "@/lib/cms/collection"
import {
  gameDocumentToPayload,
  normalizeGamePayload,
  serializeGame,
} from "@/lib/cms/validation"
import { gameDir, gameIndexPath } from "@/lib/content/paths"
import { getAllGames, getGameBySlug } from "@/lib/content/games"

export const cmsGames = createCmsCollection({
  label: "Game",
  dir: gameDir,
  indexPath: gameIndexPath,
  getAll: getAllGames,
  getBySlug: getGameBySlug,
  normalize: normalizeGamePayload,
  serialize: serializeGame,
  toPayload: gameDocumentToPayload,
})
