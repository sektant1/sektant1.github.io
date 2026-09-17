---
name: tarkov-aim-converter-builder
description: Builds and maintains a private, local-first aim sensitivity and FOV converter centered on Escape from Tarkov and Tarkov Arena. Converts hipfire and scoped ADS—including the Razor HD Gen.2 1x setting—to KovaaK’s, Aim Lab, CS2, Valorant, Apex Legends, Overwatch 2, Rainbow Six Siege, Call of Duty/Warzone, Fortnite, Quake/Source games, and custom game profiles. Accounts for DPI, aspect ratio, FOV conventions, equipment turning-speed penalties, cm/360, monitor-distance matching, and unavoidable Tarko
---

# Tarkov Multi-Game Aim Converter Builder

Act as a senior gameplay-input engineer, frontend engineer, and numerical-validation engineer.

Build or maintain a private, local-first interactive web application for converting mouse sensitivity and field of view between Escape from Tarkov, Tarkov Arena, aim trainers, and other FPS games.

The application must be built directly in the current repository with Codex CLI. Never use ChatGPT Sites or another website builder.

## Core objective

The app must let the user enter their Tarkov setup and compare or convert it to other games using transparent, reproducible calculations.

Default user profile:

- Mouse DPI: 800
- CS2 sensitivity: 1.1
- Tarkov/Tarkov Arena sensitivity: 0.246
- Tarkov FOV setting: 85
- ADS optic: Vortex Razor HD Gen.2
- ADS mode: 1x
- Equipment penalty: adjustable, with light and medium presets
- Preferred outputs: cm/360, equivalent sensitivity, effective FOV, and conversion error/uncertainty

Do not lock the UI to these defaults. Every value must remain editable.

## Privacy

The application must be private and local-first.

- Do not deploy, publish, upload, create a public URL, or widen visibility unless the user explicitly requests it.
- Do not add analytics, telemetry, advertising, trackers, accounts, or external databases.
- Store preferences locally in the browser when persistence is useful.
- Do not send sensitivity data to external services.
- If deployment is later requested, show the exact target and visibility before publishing.

## Initial technology

When no suitable project exists, create a lightweight application using:

- React
- TypeScript
- Vite
- CSS or CSS Modules
- Vitest for numerical tests
- Playwright when browser-level testing is available

Avoid a backend unless a concrete requirement makes one necessary.

Keep calculation code independent from React components.

Suggested structure:

src/
  components/
  converters/
  games/
  math/
  validation/
  types/
  data/
tests/

## Supported profiles

Implement a data-driven adapter system. Initial adapters should cover:

- Escape from Tarkov
- Escape from Tarkov Arena
- CS2
- KovaaK’s
- Aim Lab
- Valorant
- Apex Legends
- Overwatch 2
- Rainbow Six Siege
- Call of Duty / Warzone
- Fortnite
- Quake or generic Source-engine profile
- Custom game profile

Each adapter should declare:

- Game identifier and display name
- Sensitivity scale
- Verified yaw constant or conversion function
- FOV representation
- Horizontal or vertical FOV convention
- Aspect-ratio behavior
- ADS behavior when known
- Scope or zoom behavior when known
- Data source
- Date verified
- Confidence level
- Known limitations

Never invent a game constant. If a value cannot be verified, mark it as unverified and require manual calibration or user input.

## Core calculations

Use double-precision JavaScript numbers and isolate all formulas in pure functions.

For a game with a verified linear yaw model:

countsPer360 = 360 / (sensitivity * yawDegreesPerCount)

cmPer360 = countsPer360 * 2.54 / dpi

Equivalent target sensitivity:

targetSensitivity =
  360 * 2.54 /
  (dpi * targetYawDegreesPerCount * desiredCmPer360)

For CS2 with default `m_yaw = 0.022`, 800 DPI and sensitivity 1.1 should produce approximately:

47.23 cm/360

Use this as a regression test, allowing only a small floating-point tolerance.

Support:

- cm/360
- inches/360
- eDPI, but clearly label it as game-specific and not directly comparable across different engines
- degrees per centimetre
- centimetres for 90-degree and 180-degree turns
- raw mouse counts per 360
- effective sensitivity after equipment penalty
- percentage difference from the selected reference profile

Do not present eDPI alone as a universal conversion metric.

## FOV calculations

Clearly distinguish:

- Horizontal FOV
- Vertical FOV
- 4:3-based FOV
- Current-aspect-ratio FOV
- Game slider value
- Actual rendered FOV
- ADS FOV

Use standard trigonometric conversion where applicable:

horizontalFov =
  2 * atan(tan(verticalFov / 2) * aspectRatio)

verticalFov =
  2 * atan(tan(horizontalFov / 2) / aspectRatio)

Perform trigonometric calculations in radians and convert the displayed result to degrees.

Include common aspect ratios:

- 4:3
- 16:9
- 16:10
- 21:9
- Custom width and height

Do not assume that the Tarkov FOV slider maps directly to another game’s FOV slider. Explain the relevant convention beside the result.

## Matching methods

Offer at least these conversion modes:

1. Physical distance / cm-per-360 matching
2. 0% monitor-distance matching
3. 100% horizontal monitor-distance matching
4. 100% vertical monitor-distance matching
5. Custom monitor-distance coefficient when correctly implemented
6. Manual calibration

Present cm/360 as the primary general-purpose comparison.

Show the physical and visual/FOV-aware recommendations side by side because they answer different training goals.

Explain that:

- cm/360 preserves physical turning distance.
- Monitor-distance matching preserves a chosen screen-space relationship.
- No single value can simultaneously preserve every movement amplitude when FOV changes.
- ADS practice may benefit from a different matching method than hipfire practice.

## Tarkov-specific behavior

Treat Tarkov and Tarkov Arena as special cases.

The UI must separately support:

- Hipfire sensitivity
- ADS sensitivity setting
- Razor HD Gen.2 at 1x
- Optional higher magnification profiles
- Weapon and optic combination
- Tarkov FOV setting
- Aspect ratio
- Equipment turning-speed modifier
- Manual calibration result

Tarkov scope behavior, camera FOV, animation, weapon handling, magnification, equipment modifiers, and possible sensitivity scaling can prevent an exact mathematical conversion.

Never claim that a Tarkov ADS conversion is exact unless the complete behavior has been verified for the selected game version, optic, magnification, FOV, aspect ratio, and equipment setup.

Display one of these result confidence levels:

- Verified
- Estimated
- Calibration recommended
- Unsupported

## Equipment turning-speed penalties

Provide:

- No penalty: 0%
- Light preset: 5%
- Medium preset: 10%
- Custom slider: 0% to 30%
- Editable numeric input

The preset values are modeling defaults, not claims about specific Tarkov equipment.

When using a simple penalty model:

effectiveMultiplier = 1 - penaltyPercent / 100

effectiveYaw = baseYaw * effectiveMultiplier

effectiveCmPer360 = baseCmPer360 / effectiveMultiplier

Clearly label this as an approximation unless the selected equipment’s actual in-game behavior has been verified.

Allow the user to enter the exact penalty shown by their current equipment.

Show both:

- Base sensitivity without gear
- Effective sensitivity with gear

## Calibration mode

Implement a manual calibration workflow for mechanics that cannot be trusted from public constants.

The user should be able to provide:

- DPI
- In-game sensitivity
- Measured mouse travel
- Unit: centimetres or inches
- Observed rotation: 90°, 180°, 360°, or custom
- Hipfire or ADS
- Gear penalty state
- Optic and magnification

Derive the effective cm/360 and inferred yaw from that measurement.

Show multiple trials and their average when possible. Warn about measurement error and suggest performing at least three trials.

Calibration results should be usable as a custom source profile.

## User interface

Create a responsive interface that works on desktop and mobile.

Use no more than three main visual sections:

1. Input and Tarkov setup
2. Results and game comparison
3. Assumptions, sources, and calibration

Desktop:

- Compact two-column input/result layout
- Results remain visible while adjusting controls when space permits
- Full keyboard navigation
- Clear comparison table

Mobile:

- Single-column controls
- Large touch targets
- Numeric input keyboards where supported
- No horizontal page overflow
- Comparison table may become stacked result cards

Useful controls include:

- DPI input
- Source game
- Source sensitivity
- Hipfire/ADS toggle
- Scope and magnification
- FOV and aspect ratio
- Gear preset and penalty slider
- Matching method
- Target games
- Copy result
- Reset defaults
- Share/export configuration as JSON without uploading it

Update results immediately as controls change.

## Results

For each selected target game, show:

- Recommended sensitivity
- cm/360
- Difference from source in percent
- FOV input or recommendation
- Matching method
- Confidence level
- Short limitation note

Include a dedicated comparison for the default CS2 setup:

- 800 DPI
- CS2 sensitivity 1.1
- Default CS2 yaw
- Expected result near 47.23 cm/360

Highlight whether the current Tarkov hipfire or ADS configuration is faster or slower than this CS2 reference.

Do not hide intermediate values. Add an expandable calculation explanation.

## Research and sources

Before adding or changing an adapter:

- Verify current game behavior using primary sources when available.
- Cross-check important constants with at least one independent reputable source.
- Record the URL, game version, access date, and relevant assumption.
- Prefer official documentation, developer statements, exposed console variables, or reproducible measurements.
- Do not copy proprietary calculator code.
- If reliable verification is unavailable, use calibration instead of guessing.

Keep source metadata in a dedicated data file so it can be reviewed and updated.

## Numerical validation

Create automated tests for:

- CS2 800 DPI, sensitivity 1.1, yaw 0.022 ≈ 47.23 cm/360
- Round-trip source-to-target-to-source conversion
- FOV vertical-to-horizontal-to-vertical round trip
- Zero gear penalty
- Light and medium gear penalty calculations
- Invalid DPI and sensitivity values
- Extreme but valid aspect ratios
- Manual calibration
- Floating-point rounding
- Missing or unverified adapter constants

Round only for display. Never use rounded values as inputs for subsequent calculations.

Run:

- Type checking
- Unit tests
- Production build
- Browser smoke test when available

Fix failures before declaring the app complete.

## Accessibility

- Associate every input with a label.
- Do not communicate confidence or errors through color alone.
- Provide visible keyboard focus.
- Use sufficient contrast.
- Add ARIA attributes only when native HTML semantics are insufficient.
- Respect reduced-motion preferences.

## Error handling

Reject or clearly flag:

- DPI less than or equal to zero
- Negative sensitivity
- Invalid FOV
- Invalid aspect ratio
- Gear penalties at or above 100%
- Unknown yaw constants
- Unsupported scope conversions

Do not output a fabricated target sensitivity when required data is missing.

## Deliverables

When implementing the app:

- Inspect the existing repository first.
- Preserve unrelated user changes.
- Build the complete working application.
- Add verified game adapters.
- Add automated tests.
- Add a README with setup, development, testing, build, formulas, assumptions, privacy, and supported games.
- Add a SOURCES.md or equivalent source registry.
- Add a clear list of Tarkov limitations.
- Run and validate the application.
- Report the files changed, commands run, tests passed, and remaining estimated conversions.

Never deploy or publish unless explicitly requested.
