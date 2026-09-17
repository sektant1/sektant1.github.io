export type Confidence =
  "Verified" | "Estimated" | "Calibration recommended" | "Unsupported"

export type FovConvention =
  "vertical" | "horizontal-4:3" | "horizontal-16:9" | "profile"

export type GameId =
  | "tarkov"
  | "arena"
  | "cs2"
  | "kovaaks"
  | "aimlab"
  | "valorant"
  | "apex"
  | "overwatch2"
  | "siege"
  | "cod"
  | "fortnite"
  | "source"
  | "custom"

export interface GameAdapter {
  id: GameId
  name: string
  yaw: number | null
  scale: string
  fovConvention: FovConvention
  aspectBehavior: string
  adsBehavior: string
  sourceIds: string[]
  verified: string
  confidence: Confidence
  limitation: string
}

export type MatchMethod =
  "physical" | "md0" | "mdh100" | "mdv100" | "custom" | "manual"

export interface CalibrationTrial {
  id: string
  distance: number
  unit: "cm" | "in"
  rotation: number
}
