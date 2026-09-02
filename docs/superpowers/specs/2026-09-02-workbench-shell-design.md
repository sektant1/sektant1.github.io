# Workbench shell

The site chrome, rebuilt as an editor workbench rather than an editor-shaped
decoration, with a shell of its own for narrow screens.

## Why

`SiteShell` today borrows an editor's furniture — a file tree, a path in the
header, a status bar — but stops there. There are no buffers, no gutter, no
panel, and the one instrument the site owns (the ASCII 3D viewer) is only ever
seen on the front page and in the boot sequence. Three things follow from that:

1. **The metaphor is shallow.** Everything that makes an editor legible as an
   editor — what is open, where you are inside it, what the machine is doing —
   is missing or spelled out in prose.
2. **The chrome is stacked, not organised.** Classification bar, header,
   gauge, log, status bar: five horizontal rules competing for the top and
   bottom edges, with the sidebar carrying navigation, the file tree, social
   links and a byline in one undifferentiated column.
3. **Nothing announces itself as pressable.** Keys, links, tree rows and pure
   readouts are all mono text in phosphor. On a pointer device hover sorts it
   out. On a phone there is no hover, so the reader cannot tell an instrument
   from a control — and the shell is drawn for a mouse in the first place.

## What this is not

- Not a content redesign. `Article`, the MDX components, the hero and the
  listings keep their markup. The shell around them changes.
- Not a theme change. Phosphor green, Bender, the CRT treatment and the ASCII
  banner stay exactly as they are — the banner in particular is untouched.
- Not a rewrite of `packages/ui`. One shared component grows one optional
  prop; everything else is composition inside `apps/hideout`.

## The shape

One DOM, one mounted document, two compositions selected by CSS. The desktop
composition is a workbench; the narrow one is its own object with its own
ergonomics, not the workbench squeezed.

```
┌───────────────────────────────────────────────── classification (≥md) ──┐
│┌──┬────────────────┬──────────────────────────────────────────────┬────┐│
││ R│  side panel    │ buffer tabs                                  │ m  ││
││ a│  (files /      ├──────────────────────────────────────────────┤ i  ││
││ i│   search /     │ breadcrumb                                   │    ││
││ l│   visor /      ├───┬──────────────────────────────────────────┤    ││
││  │   stash /      │ g │ document                                 │    ││
││  │   links)       │ u │                                          │    ││
││  │                │ t │                                          │    ││
│└──┴────────────────┴───┴──────────────────────────────────────────┴────┘│
│┌────────────────────────────────────────────────────────────────────────┐│
││ dock: ЖУРНАЛ | ВИЗОР                            (ctrl+`, on demand)    ││
│└────────────────────────────────────────────────────────────────────────┘│
│┌────────────────────────────────────────────────────────────────────────┐│
││ status bar                                                             ││
│└────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘

narrow:
┌─────────────────────────────────────────┐
│ mark   ~/path                    ПОИСК  │  44px
├─────────────────────────────────────────┤
│ document (full width, no gutter)        │
├─────────────────────────────────────────┤
│ ФАЙЛЫ   ПОИСК   ЖУРНАЛ   СВЯЗЬ          │  56px, 44px targets
└─────────────────────────────────────────┘
```

The document is rendered once, as `children`, inside a grid slot both
compositions style. Media queries hide the rail, the tabs and the gutter below
`md`/`lg` and hide the mobile bars above it. Nothing heavy is rendered twice:
the pieces that only exist on one side are chrome measured in bytes, and the
one piece that costs something — the 3D viewer — gates on `matchMedia` in an
effect, so a phone never starts a renderer it cannot show.

A minimap was built here and taken out again: a column of ticks beside a
document that already has an outline on one side and a scrollbar on the other
was a third answer to a question nobody was asking twice.

## Surfaces

### Activity rail (≥md)

3.25rem, flush left, four keys. Each switches the side panel; pressing the
active one collapses the panel, which is how an editor's rail behaves.

| Key      | Panel                                            |
| -------- | ------------------------------------------------ |
| `ФАЙЛЫ`  | Section keys, a name filter, and `ContentTree`     |
| `ПОИСК`  | Opens the command palette                          |
| `ВИЗОР`  | The instrument: the ASCII 3D viewer                |
| `СКЛАД`  | The stash: what the build ships, on a slot grid     |
| `СВЯЗЬ`  | Social links + byline, moved out of the tree       |

Which panel is open persists through `createPersistedPreference`
(`workbench-panel`), like every other reader choice on the site.

### Buffer tabs (≥md)

The documents opened this session, newest last, capped at eight with the
oldest dropped. Held in `sessionStorage` — a tab strip that survives a restart
is a promise the site cannot keep, since the reader did not open those files,
they visited those URLs. Each tab: kind marker, truncated label, close. The
active tab carries a phosphor rule along its top edge, matching `PanelTab` in
`LogConsole`. Middle-click closes. Closing the active tab moves to its
neighbour; closing the last one leaves the strip empty rather than navigating.

### Breadcrumb (≥md)

`~/ posts / how-to-setup-neovim ▸ how to reach me`. Path segments are links to
the listing above them; the trailing element is the heading currently under
the top of the viewport, tracked with an `IntersectionObserver` over the
document's `h2`/`h3`. When no heading is in view the trailing element is
dropped, not shown empty.

### Gutter (≥lg)

A CSS counter on the document's top-level blocks, drawn in the margin the
heading anchors already live in — so the column starts at `lg`, where there is
room for both, rather than at `md`. Real numbers for real blocks, unselectable,
and given empty alternative text so a screen reader does not read a number
before every paragraph. Not line numbers: this site has no lines.

### Dock (all widths, on demand)

The bottom panel, opened with `ctrl+\`` or from the status bar. Two tabs:

- `ЖУРНАЛ` — the existing `LogConsole`, with its own output/problems split.
- `ВИЗОР` — the 3D viewer at panel size.

`LogConsole` gains one optional prop, `panels`, letting a host add tabs to the
strip it already draws. That is a generalisation of the component, not a
special case bolted to it: the panel across the bottom of an editor has always
been a place other views dock into.

Only one viewer instance exists, and three surfaces can ask for it: the dock,
the hover preview and the panel, in that order of standing. Each claims for as
long as it is mounted; whoever loses draws a plate naming the surface that won.
Opening the dock's tab is a decision, hovering is a glance, and a panel left
open is a setting from last week — the order is how deliberate the ask was.

### Visor

`AsciiPlanetScene` through the existing lazy seam, so three stays out of every
route's bundle. It mounts only when:

- the viewport is at least `lg`, and
- the reader has opened a surface that shows it, and
- reduced motion is not requested.

Otherwise the slot draws a plate that says the instrument is off and why —
"screen too narrow", "motion held", "running in the dock", "the globe has it".
A phone gets a readout, never a renderer, and never a still frame pretending
to be one.

Model: `bitcoin.glb` is what the repo has. The visor takes a model id, so
adding mil-spec models later is dropping a GLB into `apps/hideout/assets/models`
and running `make models`. Recommended CC0 additions, in the order they would
earn their place: a field radio, a satellite, an ammunition crate.

### Mobile shell (<md)

- Top bar, 44px: mark, truncated path, `ПОИСК` key.
- Bottom tab bar, 56px, four 44px targets: `ФАЙЛЫ`, `ПОИСК`, `ЖУРНАЛ`,
  `СВЯЗЬ`. The active one is lit.
- `ФАЙЛЫ` and `СВЯЗЬ` open full-height sheets, not an 18rem drawer.
- Dropped: classification bar, buffer tabs, gutter, breadcrumb, and
  the status bar itself — the tab bar already offers find and the log, and
  what the bar had left was readouts. Its keys (top, boot, crt, phosphor) move
  into the `СВЯЗЬ` sheet under `ПУЛЬТ`, so nothing the console could do is
  lost with the bar.

## Affordance grammar

Written into `CONTEXT.md` beside the register table, because it is the same
kind of rule: every element on screen sits in exactly one class.

| Class        | Looks like                                              | Used for                       |
| ------------ | ------------------------------------------------------- | ------------------------------ |
| **Key**      | Bordered box, Latin caps, lit while active               | Anything that acts on the page |
| **Target**   | `>` / `[+]` marker, underline on hover **and** on touch  | Navigation: links, tree, tabs  |
| **Readout**  | No border, no marker, chrome-dim, selectable             | Values the build knows         |

Corollaries:

- Resting state, not hover state, carries the affordance. A control that only
  looks like a control under a pointer does not exist on a phone.
- A readout never borrows a key's border. The `[ read ]` mode block is the one
  documented exception: it is inverted, not bordered.
- Disabled is a key with no phosphor, never a hidden key.

## Files

New, under `apps/hideout/components/layout/workbench/`:

| File                  | Holds                                              |
| --------------------- | -------------------------------------------------- |
| `workbench.tsx`       | The grid, both compositions, the slot for children  |
| `activity-rail.tsx`   | Rail keys and the panel they select                 |
| `side-panel.tsx`      | Files / links panels around existing components     |
| `buffer-tabs.tsx`     | Session buffer strip                                |
| `breadcrumb-bar.tsx`  | Path segments and the active heading                |
| `visor.tsx`           | The single 3D instrument and its fallback           |
| `instrument-hover.tsx`| The viewer as a preview under the pointer          |
| `stash-panel.tsx`     | The slot grid and what sits in it                  |
| `files-panel.tsx`     | Section keys, the tree filter, the face control    |
| `use-instrument.ts`   | Claiming the one viewer, and losing it gracefully  |
| `mobile-bars.tsx`     | Top bar and bottom tab bar                          |

The dock has no file of its own: it is `LogConsole` with the visor docked into
the tab strip it already draws, through a new optional `panels` prop, kept
where the log's keyboard shortcut and its lifetime already live. State splits
in two — `lib/workbench.ts` holds the pure arithmetic (the buffer list) with
the unit tests on it, and `lib/workbench-state.ts` holds the stores that
arithmetic is kept out of. `lib/navigation.ts` is the one list of sections,
links and console commands every surface reads.

Changed: `site-shell.tsx` (composes the workbench, keeps its props),
`status-bar.tsx` (takes a class, so the narrow shell can drop it),
`log-console.tsx` (the `panels` prop), `sheet.tsx` (an `aria-label` that
reaches the dialog rather than the overlay), `globals.css` (the gutter counter
), `styles/effects.css` (the hover and mount effects), `CONTEXT.md` (the
grammar above).

`site-shell.tsx` currently carries the whole shell in 235 lines; after this it
is composition only, and each surface above is a file small enough to hold in
one context.

## Testing

- Unit (`vitest`): buffer list reducer — append, dedupe, cap, close active,
  close last. Pure functions kept out of the components for that reason.
- `make check` green (registry drift included: `log-console.tsx` changes, so
  `make registry` runs and `registry.json` is committed with it).
- Playwright pass on the dev server at 390px, 768px and 1440px: every rail
  key, tab close, dock tab, mobile sheet, and a keyboard walk of the rail and
  tabs.

## Risks

- **Bundle.** Everything new is chrome, and the tabs, the rail and the panels
  are client components on every route. All of them are small, and the only
  heavy import on the site still arrives through the lazy seam.
- **Hydration.** Persisted panel state renders its fallback on the server, as
  every other preference here does; the panel that opens is settled before
  first paint by the same head-script pattern used for the tube and the CRT.
- **Scope creep into content.** The gutter counts the document's top-level
  blocks. If a page's markup makes that unreliable, the fix is an attribute on
  the container, not a change to how the document is written.
