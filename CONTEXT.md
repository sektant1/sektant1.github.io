# Visual identity

What the sites look like and why, in the terms the code already uses. Read this
before writing copy, naming a label, or adding a surface.

## The spine

One world: **a CRT terminal in a bunker, run by one operator.** Soviet-era
signage, phosphor tube hardware, radio. Everything on screen belongs to that
machine or to the person operating it.

References outside the spine (games, films, philosophy) are not fixtures. They
belong in the log console, a post, or the about page — never in the chrome. A
front page that quotes four fandoms reads as a moodboard, not a station.

## Three registers

Every string on screen sits in exactly one. This is the rule that makes the
decoration legible instead of textural.

| Register            | Looks like                        | Used for                                            |
| ------------------- | --------------------------------- | --------------------------------------------------- |
| **Cyrillic caps**   | `СИСТЕМА //`, `АРХИВ`             | Chrome and signage: panel titles, operator, status  |
| **Latin caps**      | `BUF 001`, `SCAN // GEO`, `POSTS` | Instrument readouts, codes, console labels, nav     |
| **lowercase Latin** | `man cave for essays…`            | The human talking: prose, descriptions, tags, links |

Corollaries:

- **Hardware subsystems are Cyrillic even inside a Latin log.** `POST::БП`,
  `MAP::ПАМЯТЬ`, `MOUNT::КОРЕНЬ` in the boot log — the metal is Russian, the
  software is not. That is a rule, not a sprinkle.
- **Store strings in the register they render in.** Components apply
  `uppercase` in CSS; the CMS still has to show the editor the truth.
- **Cyrillic never carries meaning a reader needs.** The banner has `srTitle`,
  chrome is `aria-hidden` or labelled. No one has to read Russian to use the
  site.

## Voice

- Human lines are first person, lowercase, **one clause**. The lowercase is the
  personality; the run-on is filler.
- Machine lines are terse and declarative: `// TUBE WARM. LOG OPEN.`
- No line that could appear on any developer's site. "I make computers do cool
  stuff" and "field notes on software, tools, games, and systems" were both cut
  for that.
- **Readouts are real.** A number on a panel is a value the build knows — a
  count, a reading time, a resolved coordinate. Invented telemetry turns the
  console into a screensaver.

## Where the identity is worn

- `apps/hideout` wears the whole thing: `tube-face`, roll band, phosphor theme,
  Bender display face.
- `apps/web` (`/showcase`) wears the **tokens only** — same type, colour and
  `crt-*` accents, no `tube-face`, no post-processing. Components have to be
  legible as what a stranger would install, not as art direction.
- `packages/ui` ships neutral. The identity arrives through the theme file
  (`themes/phosphor.css`), never baked into a component.

## Variation

Green phosphor + Bender + one banner font is _the_ identity. The theme swap and
the ASCII font picker are console toys a reader can find — not equal-weight
brand variants, and never the thing a screenshot shows.

## Content language

**Operator**:
The sole person who authors, arranges, and administers the station.
_Avoid_: Admin, author, user

**Work**:
A thing the operator made or maintains, classified as a project, game,
website, tool, library, course, or experiment.
_Avoid_: Project as the umbrella term

**Document**:
Authored material read through the station, such as a post, essay, page,
lesson, or work write-up.
_Avoid_: Content item, entry

**Deployment**:
A runnable form of a work mounted at a public path, independent of its host and
editorial write-up.
_Avoid_: Website, link

**Root mount**:
The `/<slug>` path claimed by a deployment. A work without a deployment does
not claim one.
_Avoid_: Project route

**Asset**:
A media or downloadable file belonging to a document or work.
_Avoid_: Attachment, sidecar

**Presentation preset**:
A constrained visual treatment for a document or work within the station's
identity.
_Avoid_: Per-page theme

## Comments

Comments state the constraint and the reason, and stop. Two lines is the
target. If the last sentence adds no fact — it only lands the point — delete
it. Uniform rhetorical cadence is the clearest tell that prose was not written
by the person whose site it is.
