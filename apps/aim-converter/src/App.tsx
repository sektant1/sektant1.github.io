import { useEffect, useId, useState } from "react"
import { TarkovLoadout } from "./components/tarkov-loadout.tsx"
import { EquipmentPicker } from "./components/equipment-picker.tsx"
import { GameArtwork } from "./components/game-artwork.tsx"
import { Selector, SelectorIcon } from "./components/selector.tsx"
import {
  resolveSourceControls,
  sourceControls,
} from "./data/source-controls.ts"
import { adapterById, adapters } from "./data/adapters.ts"
import {
  applyGearPenalty,
  calibrationResult,
  cmPer360,
  horizontalFromVertical,
  matchingCm360,
  roundDisplay,
  sensitivityForCm360,
  verticalFromHorizontal,
} from "./math/aim.ts"
import type {
  CalibrationTrial,
  FovConvention,
  GameId,
  MatchMethod,
} from "./types.ts"

const defaults = {
  dpi: 800,
  sourceId: "tarkov" as GameId,
  sensitivity: 0.246,
  adsSensitivity: 0.246,
  mode: "hipfire" as "hipfire" | "ads",
  fov: 85,
  aspectWidth: 16,
  aspectHeight: 9,
  penalty: 0,
  optic: "Vortex Razor HD Gen.2",
  magnification: "1x",
  weapon: "Colt M4A1 5.56x45 assault rifle",
  equipment: {} as Record<string, string>,
  trainerScale: "cs2" as GameId,
  profileFovConvention: "horizontal-4:3" as FovConvention,
  method: "physical" as MatchMethod,
  customCoefficient: 0.75,
  customYaw: 0.022,
  referenceId: "cs2" as GameId,
  referenceSensitivity: 1.1,
  referenceDpi: 800,
  targets: [
    "cs2",
    "valorant",
    "apex",
    "overwatch2",
    "siege",
    "cod",
  ] as GameId[],
}

type Settings = typeof defaults
const storageKey = "skt-kalibr-settings-v1"
const targetHorizontalFov: Partial<Record<GameId, number>> = {
  cs2: 106.26,
  valorant: 103,
  overwatch2: 103,
  fortnite: 80,
  source: 106.26,
}
const methodNames: Record<MatchMethod, string> = {
  physical: "Same cm/360",
  md0: "0% monitor distance",
  mdh100: "100% horizontal monitor distance",
  mdv100: "100% vertical monitor distance",
  custom: "Custom monitor distance coefficient",
  manual: "Manual calibration",
}

function loadSettings(): Settings {
  try {
    const stored =
      localStorage.getItem(storageKey) ??
      localStorage.getItem("skt-aim-converter-settings-v1")
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
  } catch {
    return defaults
  }
}

function numberValue(value: string) {
  return value === "" ? 0 : Number(value)
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step = "any",
  suffix,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number | "any"
  suffix?: string
  hint?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const invalid =
    !Number.isFinite(value) ||
    (min !== undefined && value < min) ||
    (max !== undefined && value > max)
  return (
    <label className="field">
      <span id={`${id}-label`}>{label}</span>
      <span className="input-wrap">
        <input
          type="number"
          inputMode="decimal"
          value={draft ?? value}
          min={min}
          max={max}
          step={step}
          aria-invalid={invalid}
          aria-labelledby={`${id}-label`}
          aria-describedby={hint || invalid ? id : undefined}
          onFocus={(event) => {
            setDraft(event.target.value)
            event.target.select()
          }}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            setDraft(event.target.value)
            onChange(numberValue(event.target.value))
          }}
        />
        {suffix && <b>{suffix}</b>}
      </span>
      {(hint || invalid) && (
        <small id={id} className={invalid ? "field-error" : "field-hint"}>
          {invalid
            ? `Enter ${min !== undefined ? `${min} or more` : "a valid number"}${max !== undefined ? `, up to ${max}` : ""}.`
            : hint}
        </small>
      )}
    </label>
  )
}

function format(value: number, decimals = 3) {
  return Number.isFinite(value)
    ? roundDisplay(value, decimals).toLocaleString(undefined, {
        maximumFractionDigits: decimals,
      })
    : "—"
}

export function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [trials, setTrials] = useState<CalibrationTrial[]>([
    { id: crypto.randomUUID(), distance: 47.23, unit: "cm", rotation: 360 },
  ])
  const [copyStatus, setCopyStatus] = useState("")
  const [customAspect, setCustomAspect] = useState(
    !["4:3", "16:9", "16:10", "21:9"].includes(
      `${settings.aspectWidth}:${settings.aspectHeight}`
    )
  )
  const controls = sourceControls[settings.sourceId]
  const resolved = resolveSourceControls(settings)
  const source = adapterById[settings.sourceId]
  const aspect = settings.aspectWidth / settings.aspectHeight
  const sourceSensitivity = resolved.sensitivity
  const sourceYaw = resolved.yaw
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9
  const safeFov = resolved.fov > 0 && resolved.fov < 180 ? resolved.fov : 85
  const sourceVertical =
    resolved.fovConvention === "vertical"
      ? safeFov
      : verticalFromHorizontal(
          safeFov,
          resolved.fovConvention === "horizontal-4:3" ? 4 / 3 : 16 / 9
        )
  const sourceHorizontal =
    settings.sourceId === "valorant"
      ? 103
      : horizontalFromVertical(sourceVertical, safeAspect)
  let calibration: ReturnType<typeof calibrationResult> | null = null
  try {
    calibration = trials.length
      ? calibrationResult(settings.dpi, sourceSensitivity, trials)
      : null
  } catch {
    calibration = null
  }
  const inputsValid =
    settings.dpi > 0 &&
    sourceSensitivity > 0 &&
    resolved.fov > 0 &&
    resolved.fov < 180 &&
    settings.aspectWidth > 0 &&
    settings.aspectHeight > 0 &&
    Number.isFinite(aspect) &&
    resolved.penalty >= 0 &&
    resolved.penalty <= 30 &&
    (settings.method !== "custom" ||
      (Number.isFinite(settings.customCoefficient) &&
        settings.customCoefficient >= 0 &&
        settings.customCoefficient <= 1))
  const rawCm =
    inputsValid && sourceYaw && sourceYaw > 0
      ? cmPer360(settings.dpi, sourceSensitivity, sourceYaw)
      : null
  const modeledCm =
    settings.method === "manual" ? (calibration?.averageCm ?? null) : rawCm
  const gear =
    modeledCm && inputsValid
      ? applyGearPenalty(modeledCm, resolved.penalty)
      : null
  const effectiveCm = gear?.effectiveCm ?? null
  const reference = adapterById[settings.referenceId]
  const referenceYaw = reference?.yaw
  const referenceCm =
    referenceYaw &&
    settings.referenceDpi > 0 &&
    settings.referenceSensitivity > 0
      ? cmPer360(
          settings.referenceDpi,
          settings.referenceSensitivity,
          referenceYaw
        )
      : null

  useEffect(
    () => localStorage.setItem(storageKey, JSON.stringify(settings)),
    [settings]
  )

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }))
  const valid = inputsValid
  const speedText =
    effectiveCm && referenceCm
      ? effectiveCm < referenceCm
        ? "faster"
        : effectiveCm > referenceCm
          ? "slower"
          : "identical"
      : "unknown"

  const toggleTarget = (id: GameId) =>
    update(
      "targets",
      settings.targets.includes(id)
        ? settings.targets.filter((target) => target !== id)
        : [...settings.targets, id]
    )
  const exportJson = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          { version: 1, settings, calibrationTrials: trials },
          null,
          2
        )
      )
      setCopyStatus("Configuration copied locally")
    } catch {
      setCopyStatus("Copy failed. Allow clipboard access and try again.")
    }
  }

  return (
    <main id="top">
      <a className="skip-link" href="#setup">
        Skip to source setup
      </a>
      <nav className="app-nav" aria-label="Workspace navigation">
        <a className="nav-brand" href="#top">
          КАЛИБР <span> / KALIBR</span>
        </a>
        <div>
          <a href="#setup">SETUP</a>
          <a href="#results">RESULTS</a>
          <a href="#calibration">CALIBRATION</a>
        </div>
        <span className="local-status">LOCAL · NO ACCOUNT</span>
      </nav>
      <header className="masthead">
        <div>
          <p className="eyebrow">MOUSE SENSITIVITY WORKBENCH</p>
          <h1 aria-label="kalibr">
            калибр
            <span className="brand-latin">kalibr / sensitivity converter</span>
          </h1>
          <p>your mouse. every game. one consistent starting point.</p>
        </div>
        <div className="reference">
          <span>{reference.name}</span>
          <strong>{referenceCm ? format(referenceCm, 2) : "—"} cm/360</strong>
          <small>
            {settings.referenceDpi} DPI · {settings.referenceSensitivity} sens
          </small>
          <a
            href="#reference-settings"
            onClick={() => {
              const details = document.getElementById("reference-settings")
              if (details instanceof HTMLDetailsElement) details.open = true
            }}
          >
            Change reference
          </a>
        </div>
      </header>

      <div className="workspace">
        <section
          id="setup"
          className="panel setup"
          aria-labelledby="setup-title"
        >
          <div className="section-title">
            <span>01</span>
            <div>
              <h2 id="setup-title">
                <span aria-hidden="true">НАСТРОЙКА / </span>Source setup
              </h2>
              <p>
                {source.name} / {resolved.mode}
              </p>
            </div>
          </div>
          <div className="form-grid">
            <div className="field wide">
              <span>Source game</span>
              <Selector
                label="Source game"
                value={settings.sourceId}
                onChange={(event) => {
                  const sourceId = event.target.value as GameId
                  setSettings((current) => ({
                    ...current,
                    sourceId,
                    sensitivity: sourceControls[sourceId].defaultSensitivity,
                    fov: sourceControls[sourceId].defaultFov,
                    mode: "hipfire",
                    method: "physical",
                  }))
                }}
              >
                {adapters.map((adapter) => (
                  <option key={adapter.id} value={adapter.id}>
                    {adapter.name}
                  </option>
                ))}
              </Selector>
            </div>
            <div className="source-context wide">
              <p>
                <span className="badge">{source.confidence}</span>{" "}
                {source.limitation}
              </p>
              <small>
                {resolved.isTarkov
                  ? "Hipfire and measured ADS. Gear applies only to Tarkov profiles."
                  : "Hipfire conversion. Scoped sensitivity needs a separate measurement."}
              </small>
            </div>
            {resolved.isTrainer && (
              <div className="field wide">
                <span>Trainer sensitivity scale</span>
                <Selector
                  label="Trainer sensitivity scale"
                  value={settings.trainerScale}
                  onChange={(event) =>
                    update("trainerScale", event.target.value as GameId)
                  }
                >
                  {adapters
                    .filter(
                      (adapter) =>
                        adapter.yaw !== null || adapter.id === "custom"
                    )
                    .map((adapter) => (
                      <option key={adapter.id} value={adapter.id}>
                        {adapter.name}
                      </option>
                    ))}
                </Selector>
                <small className="field-hint">
                  Use the same sensitivity scale selected inside your trainer.
                </small>
              </div>
            )}
            <Field
              label="Mouse DPI"
              value={settings.dpi}
              min={1}
              step={1}
              onChange={(value) => update("dpi", value)}
              hint="Use your mouse’s active DPI stage."
            />
            <Field
              label={controls.sensitivityLabel}
              value={settings.sensitivity}
              min={0.0001}
              onChange={(value) => update("sensitivity", value)}
              hint={source.scale}
            />
            {resolved.isTarkov && (
              <>
                <Field
                  label="ADS sensitivity"
                  value={settings.adsSensitivity}
                  min={0.0001}
                  onChange={(value) => update("adsSensitivity", value)}
                />
                <fieldset className="mode-control">
                  <legend>Measured mode</legend>
                  <label>
                    <input
                      type="radio"
                      name="mode"
                      checked={settings.mode === "hipfire"}
                      onChange={() => update("mode", "hipfire")}
                    />
                    Hipfire
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="mode"
                      checked={settings.mode === "ads"}
                      onChange={() => update("mode", "ads")}
                    />
                    ADS
                  </label>
                </fieldset>
              </>
            )}
            {(settings.sourceId === "custom" ||
              (resolved.isTrainer && settings.trainerScale === "custom")) && (
              <Field
                label="Custom yaw (deg/count/unit)"
                value={settings.customYaw}
                min={0.000001}
                onChange={(value) => update("customYaw", value)}
              />
            )}
            <div className="form-divider wide">Field of view</div>
            {controls.fixedFov ? (
              <div className="fixed-readout field">
                <span>{controls.fovLabel}</span>
                <strong>{controls.fixedFov}°</strong>
                <small className="field-hint">
                  {settings.sourceId === "valorant"
                    ? "16:9 view; other ratios use the game’s letterboxing."
                    : settings.sourceId === "fortnite"
                      ? "Approximate camera model, not an editable game setting."
                      : "Gameplay FOV, not viewmodel_fov."}
                </small>
              </div>
            ) : (
              <Field
                label={controls.fovLabel}
                value={settings.fov}
                min={1}
                max={179}
                onChange={(value) => update("fov", value)}
                suffix="°"
              />
            )}
            {resolved.hasProfileFov && (
              <div className="field">
                <span>FOV convention</span>
                <Selector
                  label="FOV convention"
                  value={settings.profileFovConvention}
                  onChange={(event) =>
                    update(
                      "profileFovConvention",
                      event.target.value as FovConvention
                    )
                  }
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal-4:3">Horizontal at 4:3</option>
                  <option value="horizontal-16:9">Horizontal at 16:9</option>
                </Selector>
              </div>
            )}
            <div className="field">
              <span>Aspect ratio</span>
              <Selector
                label="Aspect ratio"
                value={
                  customAspect
                    ? "custom"
                    : `${settings.aspectWidth}:${settings.aspectHeight}`
                }
                onChange={(event) => {
                  if (event.target.value === "custom") {
                    setCustomAspect(true)
                    return
                  }
                  setCustomAspect(false)
                  const [width, height] = event.target.value
                    .split(":")
                    .map(Number)
                  update("aspectWidth", width)
                  update("aspectHeight", height)
                }}
              >
                <option>4:3</option>
                <option>16:9</option>
                <option>16:10</option>
                <option>21:9</option>
                <option value="custom">Custom</option>
              </Selector>
            </div>
            {customAspect && (
              <>
                <Field
                  label="Aspect width"
                  value={settings.aspectWidth}
                  min={1}
                  onChange={(value) => update("aspectWidth", value)}
                />
                <Field
                  label="Aspect height"
                  value={settings.aspectHeight}
                  min={1}
                  onChange={(value) => update("aspectHeight", value)}
                />
              </>
            )}
            {resolved.isTarkov && (
              <>
                <div className="form-divider wide">Equipment</div>
                <div className="field">
                  <span>Gear model</span>
                  <Selector
                    label="Gear model"
                    value={settings.penalty}
                    onChange={(event) =>
                      update("penalty", numberValue(event.target.value))
                    }
                  >
                    <option value={0}>No penalty · 0%</option>
                    <option value={5}>Light model · 5%</option>
                    <option value={10}>Medium model · 10%</option>
                    {![0, 5, 10].includes(settings.penalty) && (
                      <option value={settings.penalty}>
                        Custom · {settings.penalty}%
                      </option>
                    )}
                  </Selector>
                </div>
                <Field
                  label="Exact / custom penalty"
                  value={settings.penalty}
                  min={0}
                  max={30}
                  step={0.1}
                  onChange={(value) => update("penalty", value)}
                  suffix="%"
                />
                <label className="range wide">
                  <span>
                    Penalty model <b>{format(settings.penalty, 1)}%</b>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={settings.penalty}
                    style={{
                      backgroundSize: `${Math.max(0, Math.min(100, (settings.penalty / 30) * 100))}% 0.375rem, 100% 0.375rem`,
                    }}
                    onChange={(event) =>
                      update("penalty", numberValue(event.target.value))
                    }
                  />
                  <span className="range-scale" aria-hidden="true">
                    <span>0% · no penalty</span>
                    <span>30%</span>
                  </span>
                </label>
                <TarkovLoadout
                  weapon={settings.weapon}
                  optic={settings.optic}
                  magnification={settings.magnification}
                  onWeaponChange={(value) => update("weapon", value)}
                  onOpticChange={(value) => update("optic", value)}
                  onMagnificationChange={(value) =>
                    update("magnification", value)
                  }
                />
                <EquipmentPicker
                  value={settings.equipment}
                  onChange={(value) => update("equipment", value)}
                  arena={settings.sourceId === "arena"}
                />
              </>
            )}
          </div>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setSettings(defaults)
                setCustomAspect(false)
              }}
            >
              Reset defaults
            </button>
            <button type="button" onClick={exportJson}>
              Copy config JSON
            </button>
          </div>
          {!valid && (
            <p className="error" role="alert">
              Check DPI, sensitivity, FOV, aspect ratio, and penalty values.
            </p>
          )}
        </section>

        <section
          id="results"
          className="panel results"
          aria-labelledby="results-title"
        >
          <div className="section-title">
            <span>02</span>
            <div>
              <h2 id="results-title">
                <span aria-hidden="true">ПЕРЕВОД / </span>Converted sensitivity
              </h2>
              <p>
                {methodNames[settings.method]} · {settings.dpi} DPI
              </p>
            </div>
          </div>
          <div className="result-toolbar">
            <div className="field">
              <span>Matching method</span>
              <Selector
                label="Matching method"
                value={settings.method}
                onChange={(event) =>
                  update("method", event.target.value as MatchMethod)
                }
              >
                {Object.entries(methodNames).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Selector>
              <small className="field-hint">
                {settings.method === "physical"
                  ? "Keep the same mouse travel for a full turn."
                  : settings.method === "manual"
                    ? "Use your measured turn from calibration below."
                    : "Match screen-space movement; turning distance may change."}
              </small>
            </div>
            {settings.method === "custom" && (
              <Field
                label="Monitor-distance coefficient"
                value={settings.customCoefficient}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => update("customCoefficient", value)}
              />
            )}
            {settings.method === "manual" && (
              <a href="#calibration">Adjust calibration ↓</a>
            )}
          </div>
          <details className="reference-settings" id="reference-settings">
            <summary>Compare with {reference.name}</summary>
            <div className="reference-fields">
              <div className="field">
                <span>Reference game</span>
                <Selector
                  label="Reference game"
                  value={settings.referenceId}
                  onChange={(event) => {
                    const referenceId = event.target.value as GameId
                    setSettings((current) => ({
                      ...current,
                      referenceId,
                      referenceSensitivity:
                        sourceControls[referenceId].defaultSensitivity,
                    }))
                  }}
                >
                  {adapters
                    .filter((adapter) => adapter.yaw !== null)
                    .map((adapter) => (
                      <option key={adapter.id} value={adapter.id}>
                        {adapter.name}
                      </option>
                    ))}
                </Selector>
              </div>
              <Field
                label="Reference DPI"
                value={settings.referenceDpi}
                min={1}
                step={1}
                onChange={(value) => update("referenceDpi", value)}
              />
              <Field
                label="Reference sensitivity"
                value={settings.referenceSensitivity}
                min={0.0001}
                onChange={(value) => update("referenceSensitivity", value)}
              />
            </div>
            <p className="field-hint">
              Compare against an existing hipfire setup. Games with unknown yaw
              need calibration before they can be a reference.{" "}
              {reference.confidence}.
            </p>
          </details>
          {valid && effectiveCm ? (
            <>
              <div className="hero-readout">
                <div>
                  <span>EFFECTIVE DISTANCE</span>
                  <strong>{format(effectiveCm, 2)}</strong>
                  <small>cm / 360</small>
                </div>
                <div className="speed">
                  <span>VS {reference.name.toUpperCase()}</span>
                  <strong>{speedText}</strong>
                  <small>
                    {format(
                      referenceCm
                        ? Math.abs((effectiveCm / referenceCm - 1) * 100)
                        : Number.NaN,
                      2
                    )}
                    %{" "}
                    {referenceCm && effectiveCm < referenceCm ? "less" : "more"}{" "}
                    mouse travel
                  </small>
                </div>
              </div>
              <details className="measurement-details">
                <summary>Turn measurements & field of view</summary>
                <div className="metrics">
                  <div>
                    <span>BASE</span>
                    <strong>{format(modeledCm!, 3)} cm</strong>
                  </div>
                  <div>
                    <span>INCHES / 360</span>
                    <strong>{format(effectiveCm / 2.54, 3)}</strong>
                  </div>
                  <div>
                    <span>COUNTS / 360</span>
                    <strong>
                      {format((effectiveCm * settings.dpi) / 2.54, 1)}
                    </strong>
                  </div>
                  <div>
                    <span>DEG / CM</span>
                    <strong>{format(360 / effectiveCm, 3)}</strong>
                  </div>
                  <div>
                    <span>CM / 180</span>
                    <strong>{format(effectiveCm / 2, 3)}</strong>
                  </div>
                  <div>
                    <span>CM / 90</span>
                    <strong>{format(effectiveCm / 4, 3)}</strong>
                  </div>
                  <div>
                    <span>GAME eDPI*</span>
                    <strong>
                      {format(settings.dpi * sourceSensitivity, 1)}
                    </strong>
                  </div>
                  <div>
                    <span>EFFECTIVE MULT.</span>
                    <strong>{format(gear!.multiplier, 3)}×</strong>
                  </div>
                </div>
                <p className="fineprint">
                  * eDPI is game-specific and cannot compare different engines.
                </p>
                <div className="fov-strip">
                  <div>
                    <span>SLIDER</span>
                    <strong>{format(resolved.fov, 2)}°</strong>
                    <small>{resolved.fovConvention}</small>
                  </div>
                  <div>
                    <span>VERTICAL</span>
                    <strong>{format(sourceVertical, 2)}°</strong>
                    <small>rendered estimate</small>
                  </div>
                  <div>
                    <span>HORIZONTAL</span>
                    <strong>{format(sourceHorizontal, 2)}°</strong>
                    <small>
                      at {settings.aspectWidth}:{settings.aspectHeight}
                    </small>
                  </div>
                </div>
              </details>
              <details className="target-picker" open>
                <summary>
                  Target games{" "}
                  <span className="summary-count">
                    {
                      settings.targets.filter((id) => id !== settings.sourceId)
                        .length
                    }{" "}
                    selected
                  </span>
                </summary>
                <fieldset className="targets">
                  <legend>Target games</legend>
                  {adapters
                    .filter((adapter) => adapter.id !== settings.sourceId)
                    .map((adapter) => (
                      <label key={adapter.id}>
                        <input
                          type="checkbox"
                          checked={settings.targets.includes(adapter.id)}
                          onChange={() => toggleTarget(adapter.id)}
                        />
                        <SelectorIcon value={adapter.id} />
                        {adapter.name}
                      </label>
                    ))}
                </fieldset>
              </details>
              <p className="comparison-help">
                Enter the sensitivity shown in each game.{" "}
                {settings.method === "physical" || settings.method === "manual"
                  ? "These values keep the same mouse travel per turn."
                  : "These values match the selected screen distance. The cm/360 baseline appears when it differs."}
              </p>
              <div
                className="comparison"
                aria-label="Game sensitivity comparison"
              >
                <div className="comparison-head" aria-hidden="true">
                  <span>Game</span>
                  <span>Sensitivity</span>
                  <span>In-game setup</span>
                </div>
                {settings.targets.map((id) => {
                  const target = adapterById[id]
                  if (!target || id === settings.sourceId) return null
                  const targetYaw =
                    target.yaw ?? (id === "custom" ? settings.customYaw : null)
                  if (
                    !targetYaw ||
                    targetYaw <= 0 ||
                    !Number.isFinite(targetYaw)
                  )
                    return (
                      <article className="game-row unsupported" key={id}>
                        <div className="game-identity">
                          <GameArtwork id={id} />
                          <strong>{target.name}</strong>
                        </div>
                        <div>
                          <strong>Measure first</strong>
                          <small>
                            Select this game as the source and use calibration.
                          </small>
                        </div>
                        <div>
                          <small>{target.limitation}</small>
                        </div>
                      </article>
                    )
                  const physical = sensitivityForCm360(
                    settings.dpi,
                    targetYaw,
                    effectiveCm
                  )
                  const targetHorizontal =
                    targetHorizontalFov[id] ?? sourceHorizontal
                  const targetVertical = verticalFromHorizontal(
                    targetHorizontal,
                    safeAspect
                  )
                  const visualCm = matchingCm360(
                    effectiveCm,
                    settings.method,
                    sourceHorizontal,
                    targetHorizontal,
                    sourceVertical,
                    targetVertical,
                    settings.customCoefficient
                  )
                  const visual = sensitivityForCm360(
                    settings.dpi,
                    targetYaw,
                    visualCm
                  )
                  return (
                    <article className="game-row" key={id}>
                      <div className="game-identity">
                        <GameArtwork id={id} />
                        <strong>{target.name}</strong>
                      </div>
                      <div className="game-value">
                        <strong>{format(visual, 5)}</strong>
                        <small>{format(visualCm, 2)} cm/360</small>
                        {Math.abs(visual - physical) > 0.000005 && (
                          <small>Same cm/360: {format(physical, 5)}</small>
                        )}
                        <button
                          type="button"
                          aria-label={`Copy ${target.name} sensitivity`}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                String(roundDisplay(visual, 5))
                              )
                              setCopyStatus(
                                `${target.name}: ${format(visual, 5)} copied`
                              )
                            } catch {
                              setCopyStatus(
                                "Copy failed. Select the sensitivity number and copy it manually."
                              )
                            }
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="game-guidance">
                        <strong>{sourceControls[id].sensitivityLabel}</strong>
                        <small>{target.scale}</small>
                        <small>
                          {Math.abs(visualCm / effectiveCm - 1) < 0.00001
                            ? "Same mouse travel as source"
                            : `${format(Math.abs((visualCm / effectiveCm - 1) * 100), 1)}% ${visualCm > effectiveCm ? "more" : "less"} mouse travel`}
                        </small>
                        {settings.method !== "physical" &&
                          settings.method !== "manual" && (
                            <small>
                              {format(targetHorizontal, 2)}° horizontal FOV
                              {targetHorizontalFov[id] === undefined
                                ? " · assumed same as source"
                                : ""}
                            </small>
                          )}
                        <details className="result-assumptions">
                          <summary>Model details</summary>
                          <span className="badge">
                            {resolved.mode === "ads" && id !== "custom"
                              ? "Calibration recommended"
                              : target.confidence}
                          </span>
                          <small>{target.limitation}</small>
                          <small>FOV convention: {target.fovConvention}</small>
                        </details>
                      </div>
                    </article>
                  )
                })}
              </div>
              {settings.targets.filter((id) => id !== settings.sourceId)
                .length === 0 && (
                <p className="comparison-help">
                  Select a target game above to see its sensitivity.
                </p>
              )}
              <details>
                <summary>Show calculation</summary>
                <pre>{`counts/360 = 360 / (${sourceSensitivity} × ${sourceYaw ?? "calibrated yaw"})\nbase cm/360 = counts × 2.54 / ${settings.dpi}\ngear multiplier = 1 - ${resolved.penalty} / 100 = ${gear!.multiplier}\neffective cm/360 = ${modeledCm} / ${gear!.multiplier} = ${effectiveCm}`}</pre>
              </details>
            </>
          ) : (
            <div className="empty">
              <strong>
                {valid
                  ? "Measure this profile first"
                  : "Check conversion inputs"}
              </strong>
              <p>
                {valid
                  ? settings.method === "manual"
                    ? "Add a valid trial in calibration below to use your measured turn."
                    : "This profile has no verified yaw. Use manual calibration below, or select Custom game to enter a measured yaw."
                  : "Correct the highlighted values. Check DPI, sensitivity, FOV, aspect ratio, equipment penalty, and matching coefficient."}
              </p>
            </div>
          )}
        </section>
      </div>

      <section
        id="calibration"
        className="panel evidence"
        aria-labelledby="evidence-title"
      >
        <div className="section-title">
          <span>03</span>
          <div>
            <h2 id="evidence-title">
              <span aria-hidden="true">ПРОВЕРКА / </span>Calibration and sources
            </h2>
            <p>Check your setup with a measured turn.</p>
          </div>
        </div>
        <div className="evidence-grid">
          <div className="calibration">
            <div className="subhead">
              <h3>Manual calibration</h3>
              <button
                type="button"
                onClick={() =>
                  setTrials((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      distance: 47.23,
                      unit: "cm",
                      rotation: 360,
                    },
                  ])
                }
              >
                Add trial
              </button>
            </div>
            <p>
              Measure mouse travel for a known turn. Three or more slow trials
              reduce ruler, start-point, and rotation error.
            </p>
            {trials.map((trial, index) => (
              <div className="trial" key={trial.id}>
                <b>#{index + 1}</b>
                <label>
                  <span>Travel</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.001"
                    value={trial.distance}
                    onChange={(event) =>
                      setTrials((current) =>
                        current.map((item) =>
                          item.id === trial.id
                            ? {
                                ...item,
                                distance: numberValue(event.target.value),
                              }
                            : item
                        )
                      )
                    }
                  />
                </label>
                <div className="field">
                  <span>Unit</span>
                  <Selector
                    label={`Trial ${index + 1} unit`}
                    value={trial.unit}
                    onChange={(event) =>
                      setTrials((current) =>
                        current.map((item) =>
                          item.id === trial.id
                            ? {
                                ...item,
                                unit: event.target.value as "cm" | "in",
                              }
                            : item
                        )
                      )
                    }
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </Selector>
                </div>
                <div className="field">
                  <span>Rotation</span>
                  <Selector
                    label={`Trial ${index + 1} rotation`}
                    value={trial.rotation}
                    onChange={(event) =>
                      setTrials((current) =>
                        current.map((item) =>
                          item.id === trial.id
                            ? {
                                ...item,
                                rotation: numberValue(event.target.value),
                              }
                            : item
                        )
                      )
                    }
                  >
                    <option value="90">90°</option>
                    <option value="180">180°</option>
                    <option value="360">360°</option>
                  </Selector>
                </div>
                <button
                  type="button"
                  aria-label={`Remove trial ${index + 1}`}
                  onClick={() =>
                    setTrials((current) =>
                      current.filter((item) => item.id !== trial.id)
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
            {!trials.length && (
              <p className="empty-inline">
                No trials yet. Add a trial to record your mouse travel.
              </p>
            )}
            {trials.length > 0 && !calibration && (
              <p className="error" role="alert">
                Enter positive travel, DPI, and sensitivity to calculate your
                measurement.
              </p>
            )}
            {calibration && (
              <div className="cal-result">
                <div>
                  <span>AVERAGE</span>
                  <strong>{format(calibration.averageCm, 3)} cm/360</strong>
                </div>
                <div>
                  <span>INFERRED YAW</span>
                  <strong>{format(calibration.inferredYaw, 8)}</strong>
                </div>
                <div>
                  <span>TRIALS</span>
                  <strong>
                    {trials.length}{" "}
                    {trials.length < 3 ? "· add more" : "· usable"}
                  </strong>
                </div>
              </div>
            )}
            <button
              className="primary"
              type="button"
              disabled={!calibration}
              onClick={() => {
                if (calibration) {
                  update("customYaw", calibration.inferredYaw)
                  update("method", "manual")
                }
              }}
            >
              Use calibration as source
            </button>
          </div>
          <div className="assumptions">
            <h3>Current source profile</h3>
            <dl>
              <div>
                <dt>Confidence</dt>
                <dd>
                  {resolved.mode === "ads"
                    ? "Calibration recommended"
                    : source.confidence}
                </dd>
              </div>
              <div>
                <dt>Yaw model</dt>
                <dd>{sourceYaw ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>FOV convention</dt>
                <dd>{resolved.fovConvention}</dd>
              </div>
              <div>
                <dt>Gear</dt>
                <dd>
                  {resolved.isTarkov
                    ? "Simple multiplier model; modeling default, not equipment claim."
                    : "Not applied to this game."}
                </dd>
              </div>
              <div>
                <dt>ADS</dt>
                <dd>{source.adsBehavior}</dd>
              </div>
              <div>
                <dt>Verified</dt>
                <dd>{source.verified}</dd>
              </div>
            </dl>
            {resolved.isTarkov && (
              <p className="warning">
                Tarkov ADS cannot be exact without build, optic, magnification,
                weapon, FOV, aspect, animation, and equipment measurements.
                Razor 1x remains calibration recommended.
              </p>
            )}
            <p>
              Review source registry at{" "}
              <code>apps/aim-converter/SOURCES.md</code>.
            </p>
          </div>
          <div className="method-note">
            <h3>Why two recommendations?</h3>
            <p>
              <strong>cm/360</strong> preserves physical turning distance.
              Monitor-distance matching preserves one chosen screen-space
              relationship. No sensitivity preserves every movement amplitude
              when FOV changes.
            </p>
            <p>
              0% matching emphasizes tiny center-screen corrections. 100%
              horizontal or vertical matching anchors motion at that screen
              edge. ADS practice can benefit from a different method than
              hipfire.
            </p>
            <p>
              All preferences remain in this browser. Export copies JSON to
              clipboard. No request sends sensitivity data anywhere. Item and
              game artwork loads from tarkov.dev, Steam, Twitch, Battlestate
              Games, Riot, and Wikimedia image servers.
            </p>
          </div>
        </div>
      </section>
      <footer className="app-footer">
        <span>КАЛИБР / KALIBR</span>
        <p>settings stay in this browser. conversions update as you type.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
      <div
        className={`copy-status${copyStatus ? "visible" : ""}`}
        role="status"
      >
        {copyStatus}
        {copyStatus && (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setCopyStatus("")}
          >
            ×
          </button>
        )}
      </div>
    </main>
  )
}
