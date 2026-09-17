import { Children, isValidElement } from "react"
import type { ReactNode } from "react"
import {
  Autocomplete,
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  SearchField,
  Select,
  SelectValue,
  Text,
  useFilter,
} from "react-aria-components"
import { sourceControls } from "../data/source-controls.ts"
import { equipment } from "../data/equipment.ts"
import snapshotText from "../data/tarkov-items.json?raw"
import { ArtworkImage } from "./artwork-image.tsx"

const catalog = JSON.parse(snapshotText) as {
  items: { name: string; iconLink: string; shortName: string }[]
}
const artwork = new Map<string, string>([
  ...Object.entries(sourceControls).map(([id, control]): [string, string] => [
    id,
    control.image ?? "",
  ]),
  ...equipment.map((item): [string, string] => [item.id, item.iconLink]),
  ...catalog.items.map((item): [string, string] => [item.name, item.iconLink]),
])
const fallbackArtwork = new Map(
  Object.entries(sourceControls).map(([id, control]) => [
    id,
    control.imageFallback,
  ])
)

function textContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? textContent(child.props.children)
        : String(child)
    )
    .join("")
}

export function SelectorIcon({ value }: { value: string }) {
  const url = artwork.get(value)
  return (
    <span className="selector-icon" aria-hidden="true">
      <ArtworkImage src={url} fallback={fallbackArtwork.get(value)} />
    </span>
  )
}

export function Selector({
  label,
  value,
  onChange,
  children,
  disabled = false,
  invalid = false,
}: {
  label: string
  value: string | number
  onChange: (event: { target: { value: string } }) => void
  children: ReactNode
  disabled?: boolean
  invalid?: boolean
}) {
  const { contains } = useFilter({ sensitivity: "base" })
  const options = Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number
        children?: ReactNode
        disabled?: boolean
      }>(child)
    )
      return []
    const name = textContent(child.props.children)
    return [
      {
        id: String(child.props.value ?? name),
        name,
        disabled: child.props.disabled,
      },
    ]
  })
  const list = (
    <ListBox
      className="selector-list"
      items={options}
      disabledKeys={options
        .filter((item) => item.disabled)
        .map((item) => item.id)}
      renderEmptyState={() => (
        <div className="selector-empty">No matches. Try a shorter name.</div>
      )}
    >
      {(item) => (
        <ListBoxItem
          className="selector-option"
          id={item.id}
          textValue={item.name}
        >
          {({ isSelected }) => (
            <>
              <SelectorIcon value={item.id} />
              <Text slot="label">{item.name}</Text>
              <span className="selector-check" aria-hidden="true">
                {isSelected ? "✓" : ""}
              </span>
            </>
          )}
        </ListBoxItem>
      )}
    </ListBox>
  )
  return (
    <Select
      className="selector"
      selectedKey={String(value)}
      onSelectionChange={(key) => {
        if (key !== null) onChange({ target: { value: String(key) } })
      }}
      isDisabled={disabled}
      isInvalid={invalid}
    >
      <Label className="sr-only">{label}</Label>
      <Button className="selector-trigger">
        <SelectorIcon value={String(value)} />
        <SelectValue className="selector-value">
          {({ selectedText }) => selectedText || "Choose an option"}
        </SelectValue>
        <svg
          className="selector-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Button>
      <Popover
        className="selector-popover"
        placement="bottom start"
        offset={6}
        containerPadding={12}
      >
        {options.length > 7 ? (
          <Autocomplete filter={contains}>
            <SearchField
              className="selector-search"
              aria-label={`Search ${label}`}
              autoFocus
            >
              <Input placeholder={`Search ${label.toLowerCase()}…`} />
              <Button aria-label="Clear search">×</Button>
            </SearchField>
            {list}
          </Autocomplete>
        ) : (
          list
        )}
      </Popover>
    </Select>
  )
}
