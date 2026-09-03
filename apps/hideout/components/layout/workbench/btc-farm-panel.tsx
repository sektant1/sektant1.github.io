"use client"

import * as React from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupCaret,
  InputGroupInput,
} from "@workspace/ui/components/input-group"

import {
  ModelIcon,
  ModelIconLayer,
  type ModelFront,
} from "@/components/models/model-icon"
import { MAX_CARDS, clampCards, runFarm } from "@/lib/btc-farm"
import { formatRoubles, type FleaState, type TrackedKey } from "@/lib/tarkov"

/**
 * The farm that makes the thing in the viewer, as a calculator.
 *
 * The instrument draws a physical bitcoin, so the panel under it answers the
 * question a reader actually has about one: how many graphics cards it takes,
 * what the generator's fuel costs against it, and how long the rack takes to
 * pay for itself. The cycle and the fuel burn are game constants named in
 * `lib/btc-farm.ts`.
 *
 * The three prices are the market's when a market answers, and the reader's
 * otherwise: every one is a field seeded from the live figure, so the farm runs
 * with both markets down and runs against tomorrow's prices today. What it
 * never does is print a figure nobody supplied — an empty price is a dash.
 *
 * The answer is at the top whether or not there is one, and when there is not
 * it is one line asking for what is missing. A console that opens with five
 * rows of dashes has put an empty state where its result goes; a console that
 * moves its blocks around when the sum completes tears the field the reader is
 * typing into out of the tree on that keystroke. One order, one line.
 *
 */
export function BtcFarmPanel({ report }: { report: FleaState }) {
  const market = readMarket(report)
  const [cards, setCards] = React.useState(25)
  const [solar, setSolar] = React.useState(true)
  const [typed, setTyped] = React.useState<
    Partial<Record<PriceKey, number | undefined>>
  >({})

  const prices = {
    bitcoin: typed.bitcoin ?? market.bitcoin.price,
    gpu: typed.gpu ?? market.gpu.price,
    fuel: typed.fuel ?? market.fuel.price,
  }
  const missing = PRICES.filter(({ key }) => !prices[key]).map(({ label }) =>
    label.toLowerCase()
  )

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

  /* The answer, and the working that reached it. The two figures the reader
     came for are drawn a tier above the rows that explain them. */
  const result = (
    <div className="flex flex-col gap-1.5">
      <Rule
        label="Result"
        stamp={`${String(cards).padStart(2, "0")} gpu · ${solar ? "solar" : "generator"}`}
      />

      {farm ? (
        <>
          <div className="grid grid-cols-2 divide-x divide-terminal-rule bg-terminal-wash/30 py-2">
            <Figure
              label="Net / day"
              value={formatRoubles(Math.round(farm.netPerDay))}
              lit={farm.netPerDay > 0}
            />
            <Figure
              label="Payback"
              value={
                farm.paybackDays === null
                  ? "never"
                  : `${farm.paybackDays.toFixed(1)} d`
              }
              lit={farm.paybackDays !== null}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Line label="Rate" value={`${farm.coinsPerDay.toFixed(2)} btc`} />
            <Line label="Cycle" value={`${farm.cycleHours.toFixed(1)} h`} />
            <Line
              label="Gross"
              value={formatRoubles(Math.round(farm.grossPerDay))}
            />
            <Line
              label="Fuel"
              value={`-${formatRoubles(Math.round(farm.fuelPerDay))}`}
            />
            <Line label="Rack" value={formatRoubles(farm.buildCost)} />
          </div>
        </>
      ) : (
        <div className="flex min-h-16 flex-col justify-center gap-0.5 bg-terminal-wash/20 px-2.5 py-2">
          <p className="console-label text-terminal-chrome-dim">
            Input required
          </p>
          <p className="console-note text-terminal-ink-dim">
            enter {missing.join(" / ")}{" "}
            {missing.length === 1 ? "price" : "prices"} below.
          </p>
        </div>
      )}
    </div>
  )

  /* The rack and its generator: the two settings the answer moves with. */
  const controls = (
    <div className="flex flex-col gap-2">
      <Rule label="Farm" stamp={"error" in report ? "manual" : report.source} />

      {/* The rack, on a slider: fifty cards is fifty presses on a pair of keys,
          and the reader is sweeping for a payback figure rather than setting an
          exact count. */}
      <div className="flex flex-col border border-terminal-rule bg-terminal-wash/20 px-2.5 pt-2">
        <p className="console-label flex items-baseline justify-between text-terminal-chrome-dim">
          <label htmlFor="farm-cards">Gpu rack</label>
          <output
            htmlFor="farm-cards"
            className="text-terminal-ink tabular-nums"
          >
            {String(cards).padStart(2, "0")} / {MAX_CARDS}
          </output>
        </p>

        <Rack cards={cards} />

        <input
          id="farm-cards"
          type="range"
          // Chrome restores form values across a reload, which would hand the
          // reader a rack they did not set on a page they thought was fresh.
          autoComplete="off"
          min={1}
          max={MAX_CARDS}
          step={1}
          value={cards}
          aria-valuetext={`${cards} of ${MAX_CARDS} graphics cards`}
          onChange={(event) => setCards(clampCards(event.target.valueAsNumber))}
          className="console-slider w-full"
        />
      </div>

      <button
        type="button"
        onClick={() => setSolar(!solar)}
        aria-pressed={solar}
        className="stash-switch flex min-h-11 w-full items-center gap-2.5 border border-terminal-rule bg-terminal-wash/20 px-2.5 text-start crt-persist hover:border-terminal-edge focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span aria-hidden="true" className="w-7 shrink-0">
          <span
            data-thrown={solar || undefined}
            data-lit
            className="stash-track relative block h-4 w-7 border border-terminal-edge"
          />
        </span>
        <span className="console-label min-w-0 flex-1 truncate text-terminal-chrome-dim">
          Solar
        </span>
        <span className="console-value shrink-0 text-terminal-ink">
          {solar ? "BUILT" : "ABSENT"}
        </span>
      </button>
    </div>
  )

  /* The prices, editable whether or not a market answered. */
  const priceBlock = (
    <div className="flex flex-col gap-1.5">
      <Rule label="Prices" stamp="₽ each" />

      <div className="relative flex flex-col gap-1.5">
        <ModelIconLayer />
        {PRICES.map((field) => (
          <PriceField
            key={field.key}
            label={field.label}
            model={field.model}
            name={market[field.key].name}
            value={prices[field.key]}
            fromMarket={
              typed[field.key] === undefined && market[field.key].price !== null
            }
            onChange={(next) =>
              setTyped((current) => ({
                ...current,
                [field.key]: next ?? undefined,
              }))
            }
          />
        ))}
      </div>

      {"error" in report ? (
        <MarketDown keyed={report.keyed} />
      ) : report.updated ? (
        <p className="console-sign text-terminal-ink-faint tabular-nums">
          {report.source} {stamp(report.updated)}
        </p>
      ) : null}
    </div>
  )

  /* One order, always. Swapping the blocks around when the last price lands
     would tear the price fields out of the tree and build them again at a new
     index on the very keystroke that completed the sum — React reconciles a
     fragment by position, and the field the reader is typing into would lose
     the caret at the moment it finally answered. */
  return (
    <section className="btc-farm-panel flex flex-col gap-4">
      {result}
      {controls}
      {priceBlock}
    </section>
  )
}

type PriceKey = TrackedKey

type PriceModel = { src: string; front: ModelFront; fallback: string }

const PRICE_MODELS: Record<PriceKey, PriceModel> = {
  bitcoin: { src: "/models/bitcoin.glb", front: "z", fallback: "₿" },
  gpu: { src: "/models/gpu.glb", front: "-y", fallback: "GPU" },
  fuel: { src: "/models/fuel_can.glb", front: "z", fallback: "FUEL" },
}

const PRICES: { key: PriceKey; label: string; model: PriceModel }[] = [
  { key: "bitcoin", label: "Btc", model: PRICE_MODELS.bitcoin },
  { key: "gpu", label: "Gpu", model: PRICE_MODELS.gpu },
  { key: "fuel", label: "Fuel", model: PRICE_MODELS.fuel },
]

type MarketRow = { price: number | null; name: string }

function Rack({ cards }: { cards: number }) {
  return (
    <div aria-hidden="true" className="btc-farm-rack mt-2">
      {Array.from({ length: MAX_CARDS }, (_, index) => (
        <span key={index} data-filled={index < cards || undefined} />
      ))}
    </div>
  )
}

/** The three items the market supplied, each of which may be missing. */
function readMarket(report: FleaState): Record<PriceKey, MarketRow> {
  const blank = { price: null, name: "" }
  if ("error" in report) return { bitcoin: blank, gpu: blank, fuel: blank }

  const row = (key: PriceKey): MarketRow => {
    const item = report.items.find((candidate) => candidate.key === key)
    return {
      price: item?.price ?? null,
      name: item?.name ?? "",
    }
  }

  return { bitcoin: row("bitcoin"), gpu: row("gpu"), fuel: row("fuel") }
}

/**
 * One price the calculator runs on.
 *
 * A field rather than a readout even when the market answered: the reader's
 * own flea is the one they are trading on, so the live figure is a starting
 * point rather than the last word.
 *
 * Emptying the field is a real state, not a zero. It hands the row back to the
 * market — clearing what was typed restores the live figure, and with no live
 * figure the row is blank and the farm says so. A cleared field that wrote 0
 * meant the reader could destroy the calculation with a backspace and had no
 * key to get back from it.
 */
function PriceField({
  label,
  model,
  name,
  value,
  fromMarket,
  onChange,
}: {
  label: string
  model: PriceModel
  name: string
  value: number | null
  fromMarket: boolean
  onChange: (value: number | null) => void
}) {
  const id = `farm-price-${label.toLowerCase()}`
  const sourceId = `${id}-source`
  const source = fromMarket ? "MKT" : value ? "SET" : "REQ"
  const sourceLabel = fromMarket
    ? "market price"
    : value
      ? "price set by you"
      : "price required"

  return (
    <div className="btc-farm-price-row min-w-0 items-center gap-1.5">
      <ModelIcon
        src={model.src}
        front={model.front}
        fallback={
          <span className="console-sign text-terminal-chrome-dim">
            {model.fallback}
          </span>
        }
        className="size-11 border border-terminal-rule bg-terminal-wash/20"
      />

      {/* The market's full name for the item rides in the label rather than in
          a title attribute: a tooltip on the row was reachable with a pointer
          and with nothing else. */}
      <label
        htmlFor={id}
        className="flex min-w-0 flex-col justify-center leading-none"
      >
        <span className="console-label truncate text-terminal-chrome-dim">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="console-value truncate text-terminal-ink-faint"
        >
          {source}
        </span>
        <span className="sr-only">
          {name ? ` — ${name}` : null} price in roubles
        </span>
      </label>

      <InputGroup className="btc-farm-price-control min-h-11 rounded-none border-terminal-rule bg-terminal-wash/20 transition-none dark:bg-terminal-wash/20">
        <InputGroupInput
          id={id}
          type="number"
          inputMode="numeric"
          autoComplete="off"
          min={0}
          step={1000}
          value={value ?? ""}
          aria-describedby={sourceId}
          onChange={(event) => {
            if (event.target.value === "") return onChange(null)
            const next = event.target.valueAsNumber
            onChange(Number.isFinite(next) ? Math.max(0, next) : null)
          }}
          className="btc-farm-price-input console-value min-h-11 py-0 text-end text-terminal-ink placeholder:text-terminal-ink-faint"
        />
        <InputGroupCaret className="end-4 text-primary" />
        <InputGroupAddon
          align="inline-end"
          className="console-value text-terminal-chrome-dim"
        >
          ₽
        </InputGroupAddon>
      </InputGroup>
      <span id={sourceId} className="sr-only">
        {sourceLabel}
      </span>
    </div>
  )
}

/** Both markets are quiet: what that means, and what can be done about it. */
function MarketDown({ keyed }: { keyed: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <p className="console-note text-terminal-ink-dim">
        no live prices. enter prices above to run it manually.
      </p>

      {keyed ? null : (
        <details className="btc-farm-market-help group border border-terminal-rule bg-terminal-wash/20">
          <summary className="console-label flex min-h-11 cursor-pointer list-none items-center gap-2 px-2.5 text-terminal-chrome-dim focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none">
            <span aria-hidden="true" className="w-4 text-primary">
              <span className="group-open:hidden">[+]</span>
              <span className="hidden group-open:inline">[-]</span>
            </span>
            Wire market feed
          </summary>

          <div className="flex flex-col gap-2 border-t border-terminal-rule px-2.5 py-2.5">
            <ol className="console-note flex flex-col gap-1 text-terminal-ink-faint">
              {STEPS.map((step, index) => (
                <li key={step.text} className="flex gap-1.5">
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-terminal-chrome-dim tabular-nums"
                  >
                    {index + 1}.
                  </span>
                  <span className="min-w-0">
                    {step.text}
                    {step.code ? (
                      <code className="ms-1 break-all text-primary normal-case">
                        {step.code}
                      </code>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>

            <a
              href="https://tarkov-market.com/dev/api"
              target="_blank"
              rel="noreferrer"
              className="console-note inline-flex min-h-11 w-fit items-center gap-1.5 text-terminal-ink-dim underline underline-offset-4 crt-persist hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span aria-hidden="true" className="text-terminal-chrome-dim">
                &gt;
              </span>
              get a market key
            </a>
          </div>
        </details>
      )}
    </div>
  )
}

const STEPS = [
  { text: "request a free key at tarkov-market.com/dev/api" },
  {
    text: "add it to apps/hideout/.env.local:",
    code: "TARKOV_MARKET_API_KEY=",
  },
  { text: "restart the server." },
]

function Rule({ label, stamp }: { label: string; stamp: string }) {
  return (
    <p className="console-sign flex items-center gap-2 text-terminal-chrome-dim">
      {label}
      <span aria-hidden="true" className="h-px flex-1 bg-terminal-rule" />
      <span className="text-terminal-ink-faint">{stamp}</span>
    </p>
  )
}

/**
 * A headline figure, boxed.
 *
 * The two the reader came for are drawn a tier above the working, so the panel
 * answers before it explains.
 */
function Figure({
  label,
  value,
  lit,
}: {
  label: string
  value: string
  lit?: boolean
}) {
  return (
    <p className="flex min-w-0 flex-col gap-0.5 px-2.5">
      <span className="console-label truncate text-terminal-chrome-dim">
        {label}
      </span>
      <span
        className={
          lit
            ? "btc-farm-result-value truncate font-mono text-primary tabular-nums crt-glow-soft"
            : "btc-farm-result-value truncate font-mono text-terminal-ink tabular-nums"
        }
      >
        {value}
      </span>
    </p>
  )
}

/** One figure on a dotted leader, the way every value on this console prints. */
function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="console-label shrink-0 text-terminal-chrome-dim">
        {label}
      </span>
      {/* The leader is nudged up off the baseline the row is aligned on, or it
          draws through the descenders of the label rather than under them. */}
      <span
        aria-hidden="true"
        className="min-w-3 flex-1 translate-y-[-0.15em] border-b border-dotted border-terminal-rule"
      />
      <span className="console-value shrink-0 text-terminal-ink">{value}</span>
    </p>
  )
}

/** The market's own timestamp, printed the way the status bar prints time. */
function stamp(iso: string) {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return iso

  const pad = (value: number) => String(value).padStart(2, "0")
  return `${pad(at.getUTCDate())}${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}Z`
}
