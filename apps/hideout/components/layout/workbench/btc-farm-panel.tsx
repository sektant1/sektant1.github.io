"use client"

import * as React from "react"

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
 * Same rows as the console band — a label, a value on a leader — because a
 * second grammar for a second panel is how a console stops being one machine.
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
    <div className="flex flex-col gap-1">
      <Rule label="Result" stamp={`${cards} cards${solar ? " · solar" : ""}`} />

      {farm ? (
        <>
          <div className="grid grid-cols-2 gap-1">
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
        </>
      ) : (
        /* No figure without a price behind it — and no row of dashes standing
           in for one either. One line saying what is missing. */
        <p className="console-note text-terminal-ink-dim">
          the farm runs on all three prices below.
        </p>
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
          <label htmlFor="farm-cards">Cards</label>
          <span className="text-terminal-ink tabular-nums">
            {String(cards).padStart(2, "0")} / {MAX_CARDS}
          </span>
        </p>

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
        <span className="console-value shrink-0 text-terminal-ink lowercase">
          {solar ? "built" : "none"}
        </span>
      </button>
    </div>
  )

  /* The prices, editable whether or not a market answered. */
  const priceBlock = (
    <div className="flex flex-col gap-1">
      <Rule label="Prices" stamp="₽ each" />

      {PRICES.map((field) => (
        <PriceField
          key={field.key}
          label={field.label}
          icon={market[field.key].icon}
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
     the caret at the moment it finally answered. The empty result is one line
     instead, which is small enough to sit above the fields it is asking for. */
  return (
    <section className="flex flex-col gap-3">
      {result}
      {controls}
      {priceBlock}
    </section>
  )
}

type PriceKey = TrackedKey

const PRICES: { key: PriceKey; label: string }[] = [
  { key: "bitcoin", label: "Btc" },
  { key: "gpu", label: "Gpu" },
  { key: "fuel", label: "Fuel" },
]

type MarketRow = { price: number | null; icon: string | null; name: string }

/** The three items the market supplied, each of which may be missing. */
function readMarket(report: FleaState): Record<PriceKey, MarketRow> {
  const blank = { price: null, icon: null, name: "" }
  if ("error" in report) return { bitcoin: blank, gpu: blank, fuel: blank }

  const row = (key: PriceKey): MarketRow => {
    const item = report.items.find((candidate) => candidate.key === key)
    return {
      price: item?.price ?? null,
      icon: item?.icon ?? null,
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
  icon,
  name,
  value,
  fromMarket,
  onChange,
}: {
  label: string
  icon: string | null
  name: string
  value: number | null
  fromMarket: boolean
  onChange: (value: number | null) => void
}) {
  const id = `farm-price-${label.toLowerCase()}`
  const sourceId = `${id}-source`
  const source = fromMarket ? "from the market" : value ? "set by you" : ""

  return (
    <p className="flex items-center gap-1.5">
      {/* The item, as the market draws it. A plain img: the Pages build is a
          static export, where next/image cannot optimise a remote host
          anyway, and a missing icon has to cost the row nothing. */}
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center border border-terminal-rule bg-terminal-wash/20"
      >
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon}
            alt=""
            loading="lazy"
            className="size-7 object-contain"
          />
        ) : (
          <span className="console-value text-terminal-chrome-dim">?</span>
        )}
      </span>

      {/* The market's full name for the item rides in the label rather than in
          a title attribute: a tooltip on the row was reachable with a pointer
          and with nothing else. */}
      <label
        htmlFor={id}
        className="console-label w-9 shrink-0 text-terminal-chrome-dim"
      >
        {label}
        {name ? <span className="sr-only"> — {name}</span> : null}
      </label>

      <input
        id={id}
        type="number"
        inputMode="numeric"
        autoComplete="off"
        min={0}
        step={1000}
        value={value ?? ""}
        placeholder="—"
        aria-describedby={source ? sourceId : undefined}
        onChange={(event) => {
          if (event.target.value === "") return onChange(null)
          const next = event.target.valueAsNumber
          onChange(Number.isFinite(next) ? Math.max(0, next) : null)
        }}
        className="console-value min-h-11 min-w-0 flex-1 border border-terminal-rule bg-terminal-wash/20 px-2 text-end text-terminal-ink placeholder:text-terminal-ink-faint focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      />

      <span
        aria-hidden="true"
        className="console-value shrink-0 text-terminal-chrome-dim"
      >
        ₽
      </span>

      {/* Where the figure came from, said at the row rather than in a legend:
          the reader is about to trust one of them. The column holds its width
          on an empty row so the three fields stay in one line, and the mark is
          three letters to the eye and a sentence to a screen reader. */}
      <span
        id={sourceId}
        className="console-note w-6 shrink-0 text-terminal-ink-faint"
      >
        <span aria-hidden="true">
          {fromMarket ? "mkt" : value ? "set" : ""}
        </span>
        <span className="sr-only">{source}</span>
      </span>
    </p>
  )
}

/** Both markets are quiet: what that means, and what can be done about it. */
function MarketDown({ keyed }: { keyed: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <p className="console-note text-terminal-ink-dim">
        no live prices. type them in and the farm runs anyway.
      </p>

      {keyed ? null : (
        <>
          <p className="console-note text-terminal-ink-faint">
            to wire the backup market up:
          </p>

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
            className="console-note inline-flex min-h-11 w-fit items-center gap-1.5 border border-terminal-rule px-2 text-terminal-ink-dim crt-persist hover:border-primary hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span aria-hidden="true" className="text-terminal-chrome-dim">
              &gt;
            </span>
            get a key
          </a>
        </>
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
    <p className="flex min-w-0 flex-col gap-0.5 border border-terminal-rule bg-terminal-wash/20 px-2 py-1.5">
      <span className="console-label truncate text-terminal-chrome-dim">
        {label}
      </span>
      <span
        className={
          lit
            ? "console-figure truncate text-primary crt-glow-soft"
            : "console-figure truncate text-terminal-ink"
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
