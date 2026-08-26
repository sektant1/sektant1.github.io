import * as React from "react"
import { IconCalendar, IconEye } from "@tabler/icons-react"
import { toast, Toaster } from "sonner"
import { z } from "zod"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Calendar } from "@workspace/ui/components/calendar"
import { Dialog, DialogTrigger } from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Popover, PopoverTrigger } from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { Textarea } from "@workspace/ui/components/textarea"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { AREAS, type Difficulty } from "@/data/topics"

const DIFFICULTIES: Difficulty[] = ["intro", "working", "deep"]
const SUBMIT_MS = 800
const SUMMARY_MAX = 280

const schema = z.object({
  title: z
    .string()
    .min(8, "At least 8 characters.")
    .max(80, "At most 80 characters."),
  area: z.string().min(1, "Pick an area."),
  difficulty: z.string().min(1, "Pick a level."),
  summary: z
    .string()
    .min(1, "A summary is required.")
    .max(SUMMARY_MAX, `At most ${SUMMARY_MAX} characters.`),
  source: z.string().min(3, "Where does this come from?"),
})

type Values = z.infer<typeof schema>
type Errors = Partial<Record<keyof Values, string>>

const EMPTY: Values = {
  title: "",
  area: "",
  difficulty: "working",
  summary: "",
  source: "",
}

export function Submit() {
  const [values, setValues] = React.useState<Values>(EMPTY)
  const [errors, setErrors] = React.useState<Errors>({})
  const [notify, setNotify] = React.useState(true)
  const [date, setDate] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const isMobile = useIsMobile()

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse(values)

    if (!result.success) {
      const next: Errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Values
        next[key] ??= issue.message
      }
      setErrors(next)
      return
    }

    setErrors({})
    setSubmitting(true)
    timer.current = setTimeout(() => {
      setSubmitting(false)
      setValues(EMPTY)
      setDate(null)
      toast.success("Submission received", {
        description: "Nothing left this browser — there is no backend.",
      })
    }, SUBMIT_MS)
  }

  const preview = (
    <div className="flex flex-col gap-3 p-4">
      <span className="font-mono text-xs tracking-widest text-primary uppercase crt-glow-soft">
        Preview
      </span>
      <dl className="flex flex-col gap-2 text-[0.72rem]">
        <Row label="Title" value={values.title || "—"} />
        <Row label="Area" value={values.area || "—"} />
        <Row label="Level" value={values.difficulty} />
        <Row label="Source" value={values.source || "—"} />
        <Row label="Publish" value={date ?? "—"} />
        <Row label="Notify" value={notify ? "yes" : "no"} />
      </dl>
      <p className="text-[0.72rem] leading-relaxed text-foreground/70">
        {values.summary || "No summary yet."}
      </p>
    </div>
  )

  return (
    <div className="flex max-w-3xl min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <AsciiBanner text="SUBMIT" size="default" />
        <p className="text-xs text-foreground/75">
          Propose a technique or exercise for the codex.
        </p>
      </header>

      <TerminalFrame title="new submission" footer="draft">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 p-4"
          noValidate
        >
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="What is it called?"
              aria-invalid={errors.title ? true : undefined}
            />
            {errors.title ? <FieldError>{errors.title}</FieldError> : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="area">Area</FieldLabel>
              {/* Select is a composite: trigger, popover and list. The
                  items cannot sit directly under it. */}
              <Select
                aria-label="Area"
                selectedKey={values.area || null}
                onSelectionChange={(key) => set("area", String(key ?? ""))}
              >
                <SelectTrigger id="area">
                  {values.area || (
                    <span className="text-muted-foreground">Pick an area</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectList>
                    {AREAS.map((area) => (
                      <SelectItem key={area} id={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectContent>
              </Select>
              {errors.area ? <FieldError>{errors.area}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel>Level</FieldLabel>
              <ButtonGroup>
                {DIFFICULTIES.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={
                      values.difficulty === level ? "default" : "outline"
                    }
                    size="sm"
                    onPress={() => set("difficulty", level)}
                  >
                    {level}
                  </Button>
                ))}
              </ButtonGroup>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="summary">Summary</FieldLabel>
            <Textarea
              id="summary"
              value={values.summary}
              onChange={(event) => set("summary", event.target.value)}
              placeholder="Two or three sentences."
              className="min-h-24"
              aria-invalid={errors.summary ? true : undefined}
            />
            <FieldDescription>
              {values.summary.length} / {SUMMARY_MAX}
            </FieldDescription>
            {errors.summary ? <FieldError>{errors.summary}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="source">Source</FieldLabel>
            <InputGroup>
              <InputGroupAddon>https://</InputGroupAddon>
              <InputGroupInput
                id="source"
                value={values.source}
                onChange={(event) => set("source", event.target.value)}
                placeholder="example.com/article"
                aria-invalid={errors.source ? true : undefined}
              />
            </InputGroup>
            {errors.source ? <FieldError>{errors.source}</FieldError> : null}
          </Field>

          <div className="flex flex-wrap items-center gap-4">
            <PopoverTrigger>
              <Button variant="outline" size="sm">
                <IconCalendar />
                {date ?? "Publish date"}
              </Button>
              <Popover className="p-0">
                <Calendar
                  aria-label="Publish date"
                  onChange={(value) => setDate(value?.toString() ?? null)}
                />
              </Popover>
            </PopoverTrigger>

            <Field orientation="horizontal">
              <Switch id="notify" isSelected={notify} onChange={setNotify} />
              <FieldLabel htmlFor="notify">Notify me on review</FieldLabel>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <Button type="submit" size="sm" isDisabled={submitting}>
              {submitting ? <Spinner /> : null}
              {submitting ? "Sending" : "Submit"}
            </Button>

            {/* A dialog is wrong on a phone-sized viewport, so the same
                preview opens as a drawer there. */}
            {isMobile ? (
              <Drawer>
                <DrawerTrigger
                  render={
                    <Button type="button" variant="outline" size="sm">
                      <IconEye />
                      Preview
                    </Button>
                  }
                />
                <DrawerContent>{preview}</DrawerContent>
              </Drawer>
            ) : (
              <DialogTrigger>
                <Button type="button" variant="outline" size="sm">
                  <IconEye />
                  Preview
                </Button>
                <Dialog>{preview}</Dialog>
              </DialogTrigger>
            )}

            <span className="ms-auto text-[0.65rem] text-foreground/60">
              Nothing is sent anywhere.
            </span>
          </div>
        </form>
      </TerminalFrame>

      <Toaster position="bottom-right" />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="opacity-60">{label}</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  )
}
