# kalibr / калибр

Private, local-first mouse sensitivity and FOV comparison tool. It performs all calculations in-browser, stores preferences in `localStorage`, and makes no runtime API requests for user data.

[Open kalibr](https://sektant.dev/kalibr/) · [Source](https://github.com/sektant1/kalibr)

## Run

From the standalone repository root (Node.js 22.13+):

```sh
npm install
npm run dev
```

Open `http://localhost:5175/kalibr/`.

Inside the site monorepo, run `make dev-kalibr` from its root instead.

## Verify

```sh
npm run typecheck
npm run test
npm run lint
npm run build
```

## Formulas

Linear yaw adapters use full-precision JavaScript numbers:

```text
countsPer360 = 360 / (sensitivity × yawDegreesPerCount)
cmPer360 = countsPer360 × 2.54 / dpi
targetSensitivity = 360 × 2.54 / (dpi × targetYaw × desiredCmPer360)
```

Equipment modeling uses `effectiveMultiplier = 1 - penaltyPercent / 100` and `effectiveCmPer360 = baseCmPer360 / effectiveMultiplier`. Presets are modeling conveniences, not claims about equipment.

FOV conversion uses standard tangent projection in radians. Game slider conventions remain adapter metadata and are never assumed interchangeable.

Monitor-distance modes compare angular displacement at a chosen normalized screen distance. 0% uses the center-screen limit; 100% uses the horizontal or vertical edge. Physical and visual recommendations remain separate because neither can preserve every movement amplitude across FOV changes.

## Privacy

- No backend, analytics, telemetry, account, tracker, or external database.
- Settings persist only in browser local storage.
- JSON export writes to clipboard only.
- The site monorepo builds and publishes this app at `/kalibr/` through GitHub Pages.
- Bender typography is bundled locally. Item artwork loads by default from assets.tarkov.dev; game artwork uses publisher/Steam image servers. Calculations work without those images.

## Item catalog

Weapons and optics are bundled from `json.tarkov.dev/regular/items` with English names from `items_en`. Refresh with `node scripts/sync-items.mjs` from this app's directory. Zoom options describe catalog magnification, not measured rendered ADS FOV.

## Tarkov limitations

- EFT yaw `0.125` is measured community behavior, not a published BSG contract.
- Arena does not inherit EFT yaw without calibration.
- ADS depends on game build, optic, magnification, weapon, camera animation, FOV, aspect ratio, stance, and equipment.
- Vortex Razor HD Gen.2 1x is therefore calibration recommended, not exact.
- Gear penalty uses a simple multiplier unless user enters and validates current in-game value.
- Manual calibration should use at least three slow trials.

## Supported profiles

CS2 and generic Quake/Source have first-party source lineage. EFT, Valorant, Apex, Overwatch 2, Siege, modern Call of Duty/Warzone, and Fortnite are marked estimated because constants are measured rather than publisher contracts. Arena, KovaaK’s, Aim Lab, and custom profiles require a selected known scale, custom yaw, or calibration.

See [SOURCES.md](./SOURCES.md) for evidence and review dates.
