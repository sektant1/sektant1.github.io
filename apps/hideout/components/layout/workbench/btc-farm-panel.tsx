"use client"

import * as React from "react"
import {
  IconMinus,
  IconPlus,
  IconSun,
  IconChevronDown,
} from "@tabler/icons-react"

import {
  ModelIcon,
  ModelIconLayer,
  type ModelFront,
} from "@/components/models/model-icon"
import { MAX_CARDS, clampCards, runFarm } from "@/lib/btc-farm"
import { formatRoubles, type FleaState, type TrackedKey } from "@/lib/tarkov"

export function BtcFarmPanel({ report }: { report: FleaState }) {
  const market = readMarket(report)
  const [cards, setCards] = React.useState(25)
  const [solar, setSolar] = React.useState(true)
  const [typed, setTyped] = React.useState<
    Partial<Record<PriceKey, number | null>>
  >({})

  const prices = {
    bitcoin: typed.bitcoin === undefined ? market.bitcoin.price : typed.bitcoin,
    gpu: typed.gpu === undefined ? market.gpu.price : typed.gpu,
    fuel: typed.fuel === undefined ? market.fuel.price : typed.fuel,
  }
  const missing = PRICES.filter(({ key }) => !prices[key])
  const hasOverrides = Object.keys(typed).length > 0
  const farm =
    prices.bitcoin && prices.gpu && prices.fuel
      ? runFarm({
          cards,
          solar,
          bitcoinPrice: prices.bitcoin,
          cardPrice: prices.gpu,
          tankPrice: prices.fuel,
        })
      : null
  const resultState = !farm
    ? "awaiting prices"
    : farm.netPerDay > 0
      ? "profitable"
      : farm.netPerDay < 0
        ? "operating at a loss"
        : "break-even"

  return (
    <section className="btc-farm-panel" aria-label="Bitcoin farm calculator">
      <div
        className="btc-farm-result"
        data-loss={(farm && farm.netPerDay < 0) || undefined}
      >
        <div className="btc-farm-section-head">
          <h3 className="btc-farm-caption">
            <span aria-hidden="true">РАСЧЁТ</span>
            <span className="sr-only">Projection</span>
          </h3>
          <span className="btc-farm-status">{resultState}</span>
        </div>
        <div className="btc-farm-figures" aria-live="polite" aria-atomic="true">
          <Figure
            label="Net / day"
            value={farm ? formatRoubles(Math.round(farm.netPerDay)) : ""}
            pending={!farm}
            primary
          />
          <Figure
            label="GPU payback"
            value={
              !farm
                ? ""
                : farm.paybackDays === null
                  ? "never"
                  : `${farm.paybackDays.toFixed(1)} d`
            }
            pending={!farm}
          />
        </div>
        <div className="btc-farm-production">
          {farm ? (
            <>
              <span>
                <strong>{farm.coinsPerDay.toFixed(2)}</strong> BTC / day
              </span>
              <span>
                <strong>{farm.cycleHours.toFixed(1)} h</strong> / coin
              </span>
            </>
          ) : (
            <p>
              enter {missing.length} {missing.length === 1 ? "price" : "prices"}{" "}
              below to calculate returns.
            </p>
          )}
        </div>
      </div>

      <div className="btc-farm-module">
        <div className="btc-farm-section-head">
          <h3>
            <label htmlFor="farm-cards" className="btc-farm-caption">
              GPU rack
            </label>
          </h3>
          <output htmlFor="farm-cards" className="btc-farm-capacity">
            <strong>{String(cards).padStart(2, "0")}</strong> / {MAX_CARDS}
          </output>
        </div>
        <Rack cards={cards} />
        <div className="btc-farm-slider-row">
          <button
            type="button"
            className="btc-farm-key"
            aria-label="Remove one graphics card"
            disabled={cards === 1}
            onClick={() => setCards((current) => clampCards(current - 1))}
          >
            <IconMinus size={16} aria-hidden="true" />
          </button>
          <input
            id="farm-cards"
            type="range"
            autoComplete="off"
            min={1}
            max={MAX_CARDS}
            step={1}
            value={cards}
            aria-valuetext={`${cards} of ${MAX_CARDS} graphics cards`}
            onChange={(event) =>
              setCards(clampCards(event.target.valueAsNumber))
            }
            className="console-slider"
          />
          <button
            type="button"
            className="btc-farm-key"
            aria-label="Add one graphics card"
            disabled={cards === MAX_CARDS}
            onClick={() => setCards((current) => clampCards(current + 1))}
          >
            <IconPlus size={16} aria-hidden="true" />
          </button>
        </div>
        <div
          className="btc-farm-presets"
          role="group"
          aria-label="GPU count presets"
        >
          {[10, 25, MAX_CARDS].map((count) => (
            <button
              key={count}
              type="button"
              className="btc-farm-key"
              aria-pressed={cards === count}
              onClick={() => setCards(count)}
            >
              {count} GPU
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btc-farm-solar"
          aria-pressed={solar}
          onClick={() => setSolar((current) => !current)}
        >
          <IconSun size={20} aria-hidden="true" />
          <span className="btc-farm-solar-label">
            <span className="btc-farm-caption">Solar power</span>
            <span className="btc-farm-note">
              {solar ? "fuel consumption halved" : "standard fuel consumption"}
            </span>
          </span>
          <span className="btc-farm-toggle" aria-hidden="true">
            {solar ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      <div className="btc-farm-prices">
        <div className="btc-farm-section-head">
          <h3 className="btc-farm-caption">
            <span aria-hidden="true">ЦЕНЫ</span>
            <span className="sr-only">Item prices</span>
          </h3>
          <button
            type="button"
            className="btc-farm-key btc-farm-reset"
            disabled={!hasOverrides}
            onClick={() => setTyped({})}
          >
            Reset prices
          </button>
        </div>
        <div className="btc-farm-price-list">
          <ModelIconLayer />
          {PRICES.map((field) => (
            <PriceField
              key={field.key}
              field={field}
              value={prices[field.key]}
              fromMarket={
                typed[field.key] === undefined &&
                market[field.key].price !== null
              }
              onChange={(next) =>
                setTyped((current) => ({ ...current, [field.key]: next }))
              }
            />
          ))}
        </div>
        {"error" in report ? (
          <p className="btc-farm-note btc-farm-feed">
            market unavailable. enter your own prices.
          </p>
        ) : (
          <p className="btc-farm-note btc-farm-feed">
            prices from {report.source}
            {report.updated ? (
              <>
                {" "}
                · <time dateTime={report.updated}>{stamp(report.updated)}</time>
              </>
            ) : null}
          </p>
        )}
      </div>

      <details className="btc-farm-breakdown">
        <summary>
          <span>Cost breakdown</span>
          <IconChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="btc-farm-breakdown-body">
          <dl>
            <Line
              label="Revenue / day"
              value={
                farm ? formatRoubles(Math.round(farm.grossPerDay)) : "pending"
              }
            />
            <Line
              label="Fuel / day"
              value={
                farm ? formatRoubles(Math.round(farm.fuelPerDay)) : "pending"
              }
            />
            <Line
              label="GPU investment"
              value={farm ? formatRoubles(farm.buildCost) : "pending"}
            />
          </dl>
          <p className="btc-farm-note">
            assumes continuous production and charges all generator fuel to the
            farm. GPU payback excludes hideout construction and solar upgrade
            costs.
          </p>
        </div>
      </details>
    </section>
  )
}

type PriceKey = TrackedKey
type PriceModel = { src: string; front: ModelFront; fallback: string }
type PriceFieldSpec = { key: PriceKey; label: string; model: PriceModel }

const PRICES: PriceFieldSpec[] = [
  {
    key: "bitcoin",
    label: "Physical bitcoin",
    model: { src: "/models/bitcoin.glb", front: "z", fallback: "₿" },
  },
  {
    key: "gpu",
    label: "Graphics card",
    model: { src: "/models/gpu.glb", front: "-y", fallback: "GPU" },
  },
  {
    key: "fuel",
    label: "Metal fuel tank",
    model: { src: "/models/fuel_can.glb", front: "z", fallback: "FUEL" },
  },
]

function Rack({ cards }: { cards: number }) {
  return (
    <div aria-hidden="true" className="btc-farm-rack">
      {Array.from({ length: MAX_CARDS }, (_, index) => (
        <span key={index} data-filled={index < cards || undefined} />
      ))}
    </div>
  )
}

function readMarket(
  report: FleaState
): Record<PriceKey, { price: number | null }> {
  const row = (key: PriceKey) => ({
    price:
      "error" in report
        ? null
        : (report.items.find((item) => item.key === key)?.price ?? null),
  })
  return { bitcoin: row("bitcoin"), gpu: row("gpu"), fuel: row("fuel") }
}

function PriceField({
  field,
  value,
  fromMarket,
  onChange,
}: {
  field: PriceFieldSpec
  value: number | null
  fromMarket: boolean
  onChange: (value: number | null) => void
}) {
  const id = `farm-price-${field.key}`
  const source = !value ? "required" : fromMarket ? "market" : "custom"

  return (
    <div className="btc-farm-price-row" data-required={!value || undefined}>
      <ModelIcon
        src={field.model.src}
        front={field.model.front}
        fallback={
          <span className="btc-farm-caption">{field.model.fallback}</span>
        }
        className="btc-farm-item-icon"
      />
      <div className="btc-farm-price-body">
        <div className="btc-farm-price-label">
          <label htmlFor={id}>{field.label}</label>
          <span id={`${id}-source`} className="btc-farm-source">
            {source}
          </span>
        </div>
        <div className="btc-farm-price-control">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={1}
            step={1}
            value={value ?? ""}
            placeholder="enter price"
            aria-label={`${field.label} price in roubles`}
            aria-describedby={`${id}-source`}
            aria-invalid={(value !== null && value <= 0) || undefined}
            onChange={(event) => {
              const next = event.target.valueAsNumber
              onChange(Number.isFinite(next) ? Math.max(0, next) : null)
            }}
            className="btc-farm-price-input"
          />
          <span aria-hidden="true">₽</span>
        </div>
      </div>
    </div>
  )
}

function Figure({
  label,
  value,
  primary,
  pending,
}: {
  label: string
  value: string
  primary?: boolean
  pending: boolean
}) {
  return (
    <p className="btc-farm-figure" data-primary={primary || undefined}>
      <span className="btc-farm-caption">{label}</span>
      <span className="btc-farm-result-value">
        {pending ? (
          <>
            <span aria-hidden="true">···</span>
            <span className="sr-only">awaiting prices</span>
          </>
        ) : (
          value
        )}
      </span>
    </p>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="btc-farm-line">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function stamp(iso: string) {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return iso
  return `${at.toISOString().slice(0, 10)} ${at.toISOString().slice(11, 16)} UTC`
}
