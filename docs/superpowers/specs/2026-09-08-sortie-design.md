# Sortie

A third app in the monorepo: an Escape from Tarkov pre-raid planner and
progression dashboard, built on `@workspace/ui`, served statically alongside
the station.

## Why

Two screens from `ttracker.org` do the work: the **raid planner**, which
answers "what do I take into this map and what can I finish there", and the
**dashboard**, which answers "where am I overall". Everything else that site
carries — flea prices, crafts, mini-games, interactive maps — is either live
market data or a separate product.

The reference implementation in `templates/references/TarkovTracker` is a Nuxt
app with Supabase, teams, Stripe and twelve locales. None of that is wanted
here. What is wanted is its data plumbing, which is where the non-obvious
knowledge lives.

## What this is not

- Not a fork of TarkovTracker. It is read for its data handling; no code is
  copied.
- Not the whole tracker. There is no `/tasks` screen, no hideout planner, no
  interactive map, no team sync, no accounts, no i18n.
- Not a live market tool. Flea spikes, profitable crafts, the currency
  converter and the goons tracker are out — see "Data", below, for why.

## Constraints discovered before designing

Three findings shaped everything and are recorded because they are not
recoverable by reading the code:

1. **`api.tarkov.dev/graphql` sends no CORS header.** A fetch from
   `https://ttracker.org` to it fails preflight with
   `No 'Access-Control-Allow-Origin' header is present`. Both reference sites
   proxy it server-side. A static browser app cannot call it.
2. **`json.tarkov.dev` serves the same data as static dumps.** The route shape
   is `https://json.tarkov.dev/{regular|pve}/{tasks,maps,traders,hideout,items}`,
   each returning `{ data, translations }`. Names arrive as translation keys
   (`"54cb… Nickname"`) resolved against `{endpoint}_{lang}` — which is one
   flat `{ key: string }` dictionary. This is what TarkovTracker itself now
   uses (`app/server/utils/tarkov-json.ts`); the GraphQL endpoint returned
   `422 GraphQL server unavailable` throughout this investigation.
3. **A tarkov.dev profile import carries no quest state.** Its parser
   (`app/utils/tarkovDevProfileParser.ts`) reads `aid`, nickname, `side`,
   `experience`, `prestigeLevel`, `memberCategory` and skills. Task completion
   comes from marking tasks by hand, from an EFT log import, or from a
   TarkovTracker backup. Since this app has no `/tasks` screen, the raid
   planner has to be where tasks are marked.

## Shape

A new Vite workspace, `apps/sortie`, mirroring `apps/web`: Vite, React 19,
`@tailwindcss/vite`, react-router, `@` → `src`, `@workspace/ui/*` →
`packages/ui/src/*`, `import "@workspace/ui/globals.css"`. `base: "/sortie/"`,
copied into `dist-pages/sortie/` by `scripts/build-pages.mjs`. Two routes:

```
/          dashboard   — where am I
/raid      raid planner — what do I take, what can I finish
```

It wears the tokens, like `/showcase` does — phosphor palette, mono type, the
`crt-*` accents — not the hideout's `tube-face` or its post-processing. The
registers in `CONTEXT.md` hold: Cyrillic caps for panel signage (`ВЫЛАЗ //`,
`СВОДКА`), Latin caps for readouts (`KAPPA 0 / 13`, `CUSTOMS 41`), lowercase
Latin for prose. Every readout is a value the build or the player's own
progress knows; nothing is invented, which is the rule that keeps the live
market widgets out rather than faked.

## Data

`scripts/build-tarkov-snapshot.mjs`, run in Node, fetches the five dumps for
`regular` plus their `_en` dictionaries, resolves the translation keys, keeps
only what the two screens use, and writes JSON into
`apps/sortie/src/data/snapshot/`. Committed, so a build never depends on a
third party being up.

| File | Holds | Feeds |
| --- | --- | --- |
| `tasks.json` | id, name, normalizedName, trader, map ids, faction, minPlayerLevel, kappaRequired, lightkeeperRequired, taskRequirements, experience, wikiLink, neededKeys, objectives (type, description, count, optional, maps, item, foundInRaid) | everything |
| `maps.json` | id, name, normalizedName, extracts reduced to `{ name, faction, transferItem }`, bosses as `{ name, spawnChance }` resolved through `mobs` | map bar, checklist, boss intel |
| `traders.json` | id, name, normalizedName, imageLink, levels (`level`, `requiredPlayerLevel`, `requiredReputation`), resetTime | trader panel, stat cards |
| `hideout.json` | stations, levels, item requirements | hideout stat card |
| `items.json` | id, name, shortName, iconLink — **only** ids referenced by the files above | every item list |
| `meta.json` | `generatedAt`, source revision, per-file counts | the `ДАННЫЕ //` readout |

`items` is a 16 MB dump; filtering to referenced ids is what keeps the app
shippable. `make snapshot` regenerates; `make snapshot-check` fails when the
upstream shape drifts, the same guard `registry-check` gives the registry. A
scheduled workflow opens a PR with a fresh snapshot.

The app never fetches at runtime. It works offline, and an upstream outage —
the state the GraphQL API was in during this design — cannot empty a screen.

Deliberately absent, because a daily snapshot cannot honestly serve them:
flea spikes, profitable crafts, currency conversion, and the goons tracker
(`goonReports` is present in the maps dump but arrived empty). The Story stat
card is out for the same reason: `data.story` is empty upstream.

## Modules

Three layers, each usable and testable without the one above it.

**`src/domain/`** — pure functions over `(snapshot, progress)`. No React, no
storage, no DOM.

- `taskGraph.ts` — resolves each task to `locked | available | complete |
  failed`, honouring `taskRequirements`, `minPlayerLevel`, `factionName` and
  trader level requirements.
- `activeTasks.ts` — the available tasks for a map, plus the ones with no map
  ("global"), which is the count on each map button.
- `raidKit.ts` — from a map's active tasks derives keys to bring
  (`neededKeys`), items to find in raid (`giveItem` objectives with
  `foundInRaid`), and items to bring and plant (`plantItem`).
- `checklist.ts` — fixed entries (med kit, food and water, ammo and mags,
  repairs) plus entries derived from the map: an extract with `transferItem`
  yields "bring N × item", an extract behind a key yields that key.
- `stats.ts` — the dashboard cards: tasks, objectives, kappa, lightkeeper,
  hideout, achievements; and per-trader task progress.

**`src/state/`** — `progress.ts` holds the player: `level`, `faction`,
`gameEdition`, `prestige`, `gameMode`, `taskCompletions`, `objectiveCounts`,
`traderLevels`, `fenceRep`, `checklistTicks` per map, `notes` per map. A small
store read through `useSyncExternalStore`; no state library. Persisted to
`localStorage` under one versioned key, with a migration step on read.

`src/state/import/` reads three foreign shapes into that one: this app's own
export, a `tarkovtracker-backup` v1/v2 (its `pvp`/`pve` `UserProgressData`),
and a tarkov.dev profile (level from `experience` via `playerLevels`, faction
from `side`, edition from `memberCategory`). Every import previews what it
understood before it is applied. EFT log import is out of scope.

**`src/features/dashboard/`, `src/features/raid/`** — composition and render
only.

## Screens

### `/` dashboard

- **Stat cards** — tasks, objectives, kappa, lightkeeper, hideout,
  achievements; each `done / total` with a percentage, each a link into the
  raid planner filtered accordingly. A card whose total is zero is not
  rendered.
- **Map priority** — maps ordered by active task count, with a kappa-only
  toggle; each row links to that map in the planner.
- **Traders** — per trader: current level against `requiredPlayerLevel` and
  `requiredReputation`, task progress, and a reputation input.
- **Boss intel** — spawn chance per boss per map, from the snapshot.
- **Ops center** — the Tarkov clock, which is arithmetic over `Date.now()`,
  and trader restock derived from `resetTime`, labelled as an estimate because
  a committed snapshot's `resetTime` ages.

`ascii-meter` and `led-panel` from `@workspace/ui` carry the bars.

### `/raid` raid planner

- **Map bar** — every map with its active task count, plus a global-tasks
  toggle. Selection is in the URL (`/raid?map=customs`).
- **Pre-raid checklist** — fixed plus derived entries, ticked per map, ticks
  persisted.
- **Notes** — free text per map.
- **Bring & find** — keys to bring, items to find in raid with an `x / y`
  counter, items to bring and plant.
- **Active quests** — a card per task: experience, kappa and lightkeeper tags,
  how many tasks it unlocks, a wiki link, and objectives that can be checked
  or counted. **This is where progress is entered**, and what feeds the
  dashboard.

## Failure

- Snapshot missing or unreadable at build time → the build fails, rather than
  shipping an empty app.
- `localStorage` unavailable (private windows throw on access, not just on
  write) → the store runs in memory and the shell says so once.
- An import that does not validate → the preview reports what was rejected and
  nothing is applied.
- A task referencing an id absent from the snapshot → skipped, and counted in
  a single readout rather than crashing a list.

## Testing

Vitest at the repo root, as it already runs for `packages/ui` and
`apps/hideout`. Tests sit beside their subject in `src/domain` and
`src/state`, against fixtures cut from a real snapshot:

- `taskGraph` — prerequisites, faction, level and trader gating.
- `activeTasks` — per-map and global partition.
- `raidKit` and `checklist` — derivation from a known map.
- `stats` — the six cards and per-trader totals.
- `progress` — persistence round-trip and version migration.
- `import` — each of the three shapes, valid and malformed.

UI tests only where state logic lives. `make check` runs the lot.

## Out of scope, deliberately

Team sync, accounts, i18n, the interactive map, the hideout planner, the
`/tasks` screen, EFT log import, and every live-market widget. Each is a
separate piece of work with its own spec.
