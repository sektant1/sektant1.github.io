"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Textarea } from "@workspace/ui/components/textarea"

/**
 * A labelled control with its error message.
 *
 * The error is wired through aria-describedby and aria-invalid rather than
 * only shown in red, so a screen reader hears why the field was rejected.
 */
function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="font-mono text-[0.7rem] text-terminal-ink-dim"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[0.7rem] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.7rem] text-terminal-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  type?: string
  placeholder?: string
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  placeholder,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  )
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  rows = 3,
}: Omit<TextFieldProps, "type" | "placeholder"> & { rows?: number }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  )
}

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  hint,
  error,
}: {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  hint?: string
  error?: string
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <NativeSelect
        id={id}
        className="w-full"
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </FieldShell>
  )
}

/**
 * Tags as a comma-separated line.
 *
 * A chip editor with its own keyboard model would be more to learn than the
 * two or three tags a post carries are worth; this is the same text the front
 * matter holds, edited directly.
 */
export function TagsField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}) {
  // Held as text while typing, or a trailing comma would be eaten mid-word and
  // "vim, se" would never get to be "vim, setup".
  //
  // Seeded once and not synced back from the prop: this field is the only
  // thing that writes these tags, so a prop that disagreed with the text could
  // only be the parent overwriting what is being typed.
  const [text, setText] = React.useState(() => value.join(", "))

  return (
    <FieldShell id={id} label={label} hint="Comma separated" error={error}>
      <Input
        id={id}
        value={text}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          setText(event.target.value)
          onChange(
            event.target.value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          )
        }}
      />
    </FieldShell>
  )
}
