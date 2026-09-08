# sortie

An Escape from Tarkov pre-raid planner and progression dashboard, served at
`/sortie`. Two screens: `/raid` is what you pack and what you can finish
there, `/` is where you are overall.

## Rules that bite

- **The game data is baked, not fetched.** `api.tarkov.dev/graphql` sends no
  `Access-Control-Allow-Origin` header, so no browser can call it — both
  reference sites proxy it server-side. `scripts/build-tarkov-snapshot.mjs`
  reads the static dumps at `json.tarkov.dev` in Node and writes
  `src/data/snapshot/*.json`, which is **committed**. Run `make snapshot` to
  refresh it; never hand-edit the JSON, and do not "improve" this into a
  runtime fetch.
- **Names in the dumps are translation keys.** `{"name": "54cb… Nickname"}`
  resolves against `{endpoint}_en`, a flat `{key: string}` map. The script
  translates **only the fields it extracts**: the dictionary also holds
  generic keys like `MOD_PISTOL_GRIP`, so walking the tree would rewrite
  unrelated strings.
- **The upstream prerequisite data is incomplete, and three rules paper over
  it.** "The Punisher - Part 1" and "Search Mission" arrive with no
  requirement of any kind, so forty-five tasks read as open at level one where
  the game gives about five. The app therefore: treats the 164 tasks carrying
  a `globalVariable` requirement as `gated` (real gate, unknowable state);
  infers a predecessor for numbered sequels by name (`seriesPredecessor`); and
  counts a task naming six or more maps as doable anywhere rather than as
  belonging to each. All three are inference, all three are marked as such in
  the code, and all three should be deleted the day the GraphQL API — which
  still carries the real chain — is reachable again.
- **A tarkov.dev profile import carries no task state.** It has nickname,
  side, experience, prestige and `memberCategory` — nothing else. Task
  progress comes from marking tasks in `/raid` or from a TarkovTracker
  backup. Do not add UI that implies otherwise.
- **`src/domain` is pure.** Functions over `(snapshot, progress)`, relative
  imports, no React, no storage. That is what makes it testable without a
  DOM, and the tests there are the ones that matter.
- **Images are the one runtime request.** Item icons, trader portraits and
  task art load from `assets.tarkov.dev` through `GameImage`, which degrades
  to a bordered well. Baking 3,770 icons into the repo would outweigh the
  rest of the app. Icons are `fit="contain"`, photographs are `fit="cover"`.
- **Signage here is Latin, not Cyrillic — a deliberate exception to
  `CONTEXT.md`.** The station's chrome is decoration a reader can ignore;
  every heading in this app names something they have to act on, so a label
  they cannot read would be a heading in costume. Type is Bender, set through
  `--font-display` in `src/styles.css`, which is also why Latin works: Bender
  ships no Cyrillic.
- **Layout comes from `src/components/layout.ts`.** Row height, gaps,
  separators, grids. A panel that needs something else adds a class on top
  rather than redefining the row.
- **Storage is stubbed in tests, not mocked with a DOM.** `vi.stubGlobal`,
  the same way `packages/ui` tests `persisted-preference`. There is no jsdom
  in this repo.

## What is deliberately missing

Flea prices, profitable crafts, the currency converter and the goons tracker:
a snapshot refreshed daily cannot serve data that moves by the minute, and
`CONTEXT.md` forbids a readout that is not a real value. Achievements and
story are out because nothing here can move them. Teams, accounts, i18n, the
interactive map and the hideout planner are separate work.
