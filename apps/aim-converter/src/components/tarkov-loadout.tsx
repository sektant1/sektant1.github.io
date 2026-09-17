import { useState } from "react"
import { Selector } from "./selector.tsx"
import snapshotText from "../data/tarkov-items.json?raw"

type Item = {
  id: string
  name: string
  shortName: string
  kind: "weapon" | "optic"
  iconLink: string
  imageLink: string
  zoomLevels: number[]
  link: string
}
const snapshot = JSON.parse(snapshotText) as {
  retrieved: string
  source: string
  items: Item[]
}

export function TarkovLoadout({
  weapon,
  optic,
  magnification,
  onWeaponChange,
  onOpticChange,
  onMagnificationChange,
}: {
  weapon: string
  optic: string
  magnification: string
  onWeaponChange: (value: string) => void
  onOpticChange: (value: string) => void
  onMagnificationChange: (value: string) => void
}) {
  const [showIcons, setShowIcons] = useState(true)
  const [failedIcons, setFailedIcons] = useState<string[]>([])
  const selectedOptic = snapshot.items.find(
    (item) =>
      item.name === optic ||
      (optic === "Vortex Razor HD Gen.2" &&
        item.id === "618ba27d9008e4636a67f61d")
  )
  const zooms = selectedOptic?.zoomLevels.map((zoom) => `${zoom}x`) ?? []
  return (
    <details className="item-catalog wide">
      <summary>Weapon, optic & magnification</summary>
      <div className="subhead">
        <h3>Loadout reference</h3>
        <button
          type="button"
          aria-pressed={showIcons}
          onClick={() => setShowIcons(!showIcons)}
        >
          {showIcons ? "Hide icons" : "Show icons"}
        </button>
      </div>
      {(["weapon", "optic"] as const).map((kind) => {
        const name = kind === "weapon" ? weapon : optic
        const item =
          kind === "optic"
            ? selectedOptic
            : snapshot.items.find(
                (entry) => entry.kind === kind && entry.name === name
              )
        return (
          <div className="loadout-field" key={kind}>
            <div className="field">
              <span>
                {kind === "weapon" ? "Weapon / combination" : "Optic"}
              </span>
              <Selector
                label={kind === "weapon" ? "Weapon / combination" : "Optic"}
                value={item?.name ?? "custom"}
                onChange={(event) => {
                  const value =
                    event.target.value === "custom" ? "" : event.target.value
                  if (kind === "weapon") onWeaponChange(value)
                  else {
                    onOpticChange(value)
                    const match = snapshot.items.find(
                      (entry) => entry.kind === "optic" && entry.name === value
                    )
                    if (match?.zoomLevels.length)
                      onMagnificationChange(`${match.zoomLevels[0]}x`)
                  }
                }}
              >
                {snapshot.items
                  .filter((entry) => entry.kind === kind)
                  .map((entry) => (
                    <option key={entry.id} value={entry.name}>
                      {entry.name}
                    </option>
                  ))}
                <option value="custom">Custom / unlisted {kind}</option>
              </Selector>
            </div>
            {!item && (
              <label className="field">
                <span>Custom {kind} name</span>
                <input
                  value={name}
                  onChange={(event) =>
                    kind === "weapon"
                      ? onWeaponChange(event.target.value)
                      : onOpticChange(event.target.value)
                  }
                />
              </label>
            )}
            <div className="catalog-item">
              <div className="catalog-icon">
                {showIcons && item && !failedIcons.includes(item.id) ? (
                  <img
                    key={item.id}
                    src={item.imageLink}
                    alt=""
                    width={160}
                    height={96}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedIcons((current) => [...current, item.id])
                    }
                  />
                ) : (
                  <span>
                    {!item ? "CUSTOM" : showIcons ? "NO IMAGE" : "HIDDEN"}
                  </span>
                )}
              </div>
              <div>
                <strong>{item?.shortName ?? "Custom / unlisted"}</strong>
                {item && (
                  <small>
                    {item.kind === "optic"
                      ? `Catalog zoom: ${item.zoomLevels.map((zoom) => `${zoom}×`).join(" / ") || "not supplied"}`
                      : "Weapon reference · configuration not verified"}
                  </small>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div className="field">
        <span>Magnification</span>
        <Selector
          label="Magnification"
          value={zooms.includes(magnification) ? magnification : "custom"}
          onChange={(event) =>
            onMagnificationChange(
              event.target.value === "custom" ? "" : event.target.value
            )
          }
        >
          {zooms.map((zoom) => (
            <option key={zoom} value={zoom}>
              {zoom}
            </option>
          ))}
          <option value="custom">Custom magnification</option>
        </Selector>
      </div>
      {!zooms.includes(magnification) && (
        <label className="field">
          <span>Custom magnification</span>
          <input
            value={magnification}
            placeholder="e.g. 2.5x"
            onChange={(event) => onMagnificationChange(event.target.value)}
          />
        </label>
      )}
      <p>
        Catalog zoom is not rendered ADS FOV. Measure ADS for this setup;
        selecting equipment does not change the yaw model.
      </p>
      <small className="catalog-source">
        <a href={snapshot.source} referrerPolicy="no-referrer">
          tarkov.dev catalog
        </a>{" "}
        · {snapshot.items.length} weapons & optics · {snapshot.retrieved}
      </small>
    </details>
  )
}
