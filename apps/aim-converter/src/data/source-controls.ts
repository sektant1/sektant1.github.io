import type { FovConvention, GameId } from "../types.ts"
import { adapterById } from "./adapters.ts"

export const sourceControls: Record<
  GameId,
  {
    sensitivityLabel: string
    defaultSensitivity: number
    defaultFov: number
    fixedFov?: number
    fovLabel: string
    image?: string
    imageFallback?: string
  }
> = {
  tarkov: {
    sensitivityLabel: "Mouse sensitivity",
    defaultSensitivity: 0.246,
    defaultFov: 85,
    fovLabel: "Tarkov FOV (vertical)",
    image:
      "https://static-cdn.jtvnw.net/ttv-boxart/Escape%20from%20Tarkov-144x192.jpg",
    imageFallback:
      "https://www.escapefromtarkov.com/apple-touch-icon-180x180.png",
  },
  arena: {
    sensitivityLabel: "Mouse sensitivity",
    defaultSensitivity: 0.246,
    defaultFov: 85,
    fovLabel: "Arena FOV (vertical)",
    image: "https://arena.tarkov.com/_nuxt/img/navbar_logo.5cd038d.png",
    imageFallback: "https://arena.tarkov.com/apple-touch-icon.png",
  },
  cs2: {
    sensitivityLabel: "Mouse sensitivity",
    defaultSensitivity: 1.1,
    defaultFov: 90,
    fixedFov: 90,
    fovLabel: "Fixed base FOV (4:3)",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
  },
  kovaaks: {
    sensitivityLabel: "Sensitivity in selected scale",
    defaultSensitivity: 1.1,
    defaultFov: 90,
    fovLabel: "Scenario FOV",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/824270/header.jpg",
  },
  aimlab: {
    sensitivityLabel: "Sensitivity in selected scale",
    defaultSensitivity: 1.1,
    defaultFov: 90,
    fovLabel: "Training FOV",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/714010/header.jpg",
  },
  valorant: {
    sensitivityLabel: "Sensitivity: aim",
    defaultSensitivity: 0.35,
    defaultFov: 103,
    fixedFov: 103,
    fovLabel: "Fixed horizontal FOV",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/cbf4460132cdfeb2a97fad5f9dd25ba0bc058f76-128x128.png",
  },
  apex: {
    sensitivityLabel: "Mouse sensitivity",
    defaultSensitivity: 1.1,
    defaultFov: 90,
    fovLabel: "FOV (4:3 horizontal)",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1172470/header.jpg",
  },
  overwatch2: {
    sensitivityLabel: "Mouse sensitivity (%)",
    defaultSensitivity: 4,
    defaultFov: 103,
    fovLabel: "FOV (16:9 horizontal)",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2357570/header.jpg",
  },
  siege: {
    sensitivityLabel: "Horizontal sensitivity",
    defaultSensitivity: 10,
    defaultFov: 60,
    fovLabel: "FOV (vertical)",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/359550/header.jpg",
  },
  cod: {
    sensitivityLabel: "Mouse sensitivity",
    defaultSensitivity: 4,
    defaultFov: 100,
    fovLabel: "FOV (16:9 horizontal)",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1938090/header.jpg",
  },
  fortnite: {
    sensitivityLabel: "X-axis sensitivity (%)",
    defaultSensitivity: 6,
    defaultFov: 80,
    fixedFov: 80,
    fovLabel: "Modeled hipfire FOV (estimate)",
    image: "https://static-cdn.jtvnw.net/ttv-boxart/Fortnite-144x192.jpg",
    imageFallback:
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/FortniteLogo.svg",
  },
  source: {
    sensitivityLabel: "sensitivity",
    defaultSensitivity: 1.1,
    defaultFov: 90,
    fovLabel: "FOV (4:3 horizontal)",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2310/header.jpg",
    imageFallback: "https://static-cdn.jtvnw.net/ttv-boxart/Quake-144x192.jpg",
  },
  custom: {
    sensitivityLabel: "Sensitivity",
    defaultSensitivity: 1,
    defaultFov: 90,
    fovLabel: "FOV",
  },
}

export function resolveSourceControls(settings: {
  sourceId: GameId
  trainerScale: GameId
  customYaw: number
  fov: number
  profileFovConvention: FovConvention
  penalty: number
  mode: "hipfire" | "ads"
  sensitivity: number
  adsSensitivity: number
}) {
  const isTarkov =
    settings.sourceId === "tarkov" || settings.sourceId === "arena"
  const isTrainer =
    settings.sourceId === "kovaaks" || settings.sourceId === "aimlab"
  const hasProfileFov = isTrainer || settings.sourceId === "custom"
  const adapter =
    adapterById[isTrainer ? settings.trainerScale : settings.sourceId]
  return {
    isTarkov,
    isTrainer,
    hasProfileFov,
    yaw: adapter?.yaw ?? (adapter?.id === "custom" ? settings.customYaw : null),
    fov: sourceControls[settings.sourceId].fixedFov ?? settings.fov,
    fovConvention: hasProfileFov
      ? settings.profileFovConvention
      : adapter.fovConvention,
    penalty: isTarkov ? settings.penalty : 0,
    mode: isTarkov ? settings.mode : "hipfire",
    sensitivity:
      isTarkov && settings.mode === "ads"
        ? settings.adsSensitivity
        : settings.sensitivity,
  }
}
