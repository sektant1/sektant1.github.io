import { useState } from "react"
import { Selector } from "./selector.tsx"
import {
  equipment,
  selectedCarrier,
  compatiblePlates,
  changeEquipment,
} from "../data/equipment.ts"
import type { Equipment } from "../data/equipment.ts"
const slots = [
  ["armor", "Body armor"],
  ["rig", "Rig / armored rig"],
  ["helmet", "Helmet"],
  ["attachment", "Face shield / armor attachment"],
  ["backpack", "Backpack"],
] as const
const percent = (value: number | null) =>
  value === null ? "Unknown" : `${Number((value * 100).toFixed(2))}%`

export function EquipmentPicker({
  value,
  onChange,
  arena,
}: {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  arena: boolean
}) {
  const [failed, setFailed] = useState<string[]>([])
  const torso = selectedCarrier(value)
  const plateSlots = torso?.plateSlots ?? []
  const renderSlot = (key: string, label: string, options: Equipment[]) => {
    const selected = options.find((item) => item.id === value[key])
    return (
      <div className="equipment-slot" key={key}>
        <div className="field">
          <span>{label}</span>
          <Selector
            label={label}
            value={selected?.id ?? ""}
            onChange={(event) => {
              onChange(changeEquipment(value, key, event.target.value))
            }}
          >
            <option value="">
              {key.startsWith("plate:") ? "Empty slot" : "None"}
            </option>
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.armorClass
                  ? ` · class ${item.armorClass}`
                  : ` · ${item.capacity} slots`}
                {key.startsWith("plate:")
                  ? ` · turn ${percent(item.turnPenalty)}`
                  : ""}
              </option>
            ))}
          </Selector>
        </div>
        {key.startsWith("plate:") && (
          <small className="field-hint">
            {options.length
              ? `${options.length} compatible class 4+ plates`
              : "No compatible class 4+ plates in this snapshot."}
          </small>
        )}
        {selected && (
          <div className="equipment-details">
            <div className="equipment-image">
              {failed.includes(selected.id) ? (
                <span>Image unavailable</span>
              ) : (
                <img
                  src={selected.imageLink}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    if (event.currentTarget.src !== selected.iconLink)
                      event.currentTarget.src = selected.iconLink
                    else setFailed((current) => [...current, selected.id])
                  }}
                />
              )}
            </div>
            <dl>
              <div>
                <dt>Move speed</dt>
                <dd>{percent(selected.speedPenalty)}</dd>
              </div>
              <div>
                <dt>Turn speed</dt>
                <dd>{percent(selected.turnPenalty)}</dd>
              </div>
              <div>
                <dt>Ergonomics</dt>
                <dd>{percent(selected.ergoPenalty)}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>
                  {selected.weight === null
                    ? "Unknown"
                    : `${selected.weight} kg`}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    )
  }
  return (
    <details className="equipment-picker wide">
      <summary>Armor, helmet & backpack</summary>
      <p>
        Class 4+ armor, plates, helmets and attachments. Unarmored rigs have 16+
        slots; backpacks have 20+. These are size filters, not popularity
        rankings.
      </p>
      {arena && (
        <p className="equipment-note">
          Tarkov item stats for reference. Arena availability and modifiers may
          differ.
        </p>
      )}
      {slots.map(([kind, label]) => (
        <div key={kind}>
          {renderSlot(
            kind,
            label,
            equipment.filter((item) => item.kind === kind)
          )}
          {torso?.kind === kind && (
            <fieldset className="carrier-plates">
              <legend>Plates for {torso.shortName}</legend>
              <p>
                Each slot lists only plates allowed by this carrier. Select each
                plate separately.
              </p>
              {plateSlots.length === 0 && (
                <p>This armor has no replaceable plate slots in the catalog.</p>
              )}
              {plateSlots.map((slot) =>
                renderSlot(
                  `plate:${slot.name}`,
                  slot.name.replaceAll("_", " "),
                  compatiblePlates(slot)
                )
              )}
            </fieldset>
          )}
        </div>
      ))}
      {!torso && (
        <p>
          Select body armor or an armored rig to choose compatible class 4+
          plates.
        </p>
      )}
      <p>
        Stats describe each item. Loaded weight, attachments and skills can
        change the result. Enter your in-game turn penalty above; movement and
        ergonomics are not mouse-sensitivity multipliers.
      </p>
    </details>
  )
}
