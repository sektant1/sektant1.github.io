"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields"
import {
  RENDER_STYLES,
  RENDER_STYLE_LABELS,
  isRenderStyle,
} from "@/lib/render-style"
import {
  DEFAULT_HOME_CONTENT,
  MAX_QUICK_LINKS,
  type HomeContent,
  type HomeQuickLink,
} from "@/lib/content/home-schema"

type Errors = Record<string, string>

const ASCII_ONLY = /^[\x20-\x7e]*$/

/**
 * The front page, as a form.
 *
 * Every field is optional: the placeholder shows the copy that ships with the
 * site, and an empty field renders exactly that. Clearing a field is how you
 * put the original back, which is why nothing here is marked required.
 *
 * Saving is explicit and writes content/pages/home.json, the same way the post
 * editor writes MDX — commit the file to publish it.
 */
export function HomeForm({ home }: { home: HomeContent }) {
  const router = useRouter()
  const [value, setValue] = React.useState(home)
  const [errors, setErrors] = React.useState<Errors>({})
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [committed, setCommitted] = React.useState(() => JSON.stringify(home))

  const dirty = JSON.stringify(value) !== committed

  React.useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2400)
    return () => clearTimeout(timer)
  }, [saved])

  React.useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function renderStyle(style: string) {
    if (!isRenderStyle(style)) return
    setValue((current) => ({ ...current, render: { style } }))
  }

  function hero(next: Partial<HomeContent["hero"]>) {
    setValue((current) => ({ ...current, hero: { ...current.hero, ...next } }))
  }

  function section(
    key: keyof HomeContent["sections"],
    next: Partial<HomeContent["sections"][keyof HomeContent["sections"]]>
  ) {
    setValue((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [key]: { ...current.sections[key], ...next },
      },
    }))
  }

  function quickLinks(next: HomeQuickLink[]) {
    hero({ quickLinks: next })
  }

  async function save() {
    const found = validate(value)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error("Nothing was saved", {
        description: `Check ${Object.keys(found).join(", ")}.`,
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/home", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value),
      })
      const body = await response.json()
      if (!response.ok)
        throw new Error(body.error ?? "The file was not written.")

      // The server fills empty fields from the defaults, so what comes back is
      // what the page will render — not necessarily what was typed.
      setValue(body.home)
      setCommitted(JSON.stringify(body.home))
      setSaved(true)
      toast.success("Wrote content/pages/home.json", {
        description: "Commit the file to publish it.",
      })
      router.refresh()
    } catch (cause) {
      toast.error("The file was not written", {
        description: cause instanceof Error ? cause.message : "Unknown error.",
      })
    } finally {
      setSaving(false)
    }
  }

  function restore() {
    if (
      !window.confirm("Replace every field with the copy the site ships with?")
    ) {
      return
    }
    setValue(DEFAULT_HOME_CONTENT)
    setErrors({})
  }

  const d = DEFAULT_HOME_CONTENT

  return (
    <AdminShell
      path="content/pages/home.json"
      mode="edit"
      dirty={dirty}
      status={[
        { label: "file", value: "on disk" },
        ...(saved && !dirty ? [{ label: "written", value: "ok" }] : []),
      ]}
      actions={
        <>
          <Button
            size="xs"
            variant="outline"
            isDisabled={saving}
            onPress={() => restore()}
          >
            Restore original
          </Button>
          <Button size="xs" isDisabled={saving} onPress={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex max-w-3xl flex-col gap-8 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-sans text-lg text-foreground">Front page text</h1>
          <p className="text-xs text-terminal-ink-dim">
            Every string the home page renders. Leave a field empty to keep the
            text the site ships with — shown greyed out as the placeholder.
          </p>
        </div>

        <Group title="banner">
          <TextField
            id="bannerWide"
            label="wide banner"
            value={value.hero.bannerWide}
            error={errors.bannerWide}
            placeholder={d.hero.bannerWide}
            hint="Drawn as ASCII art on wide screens. ASCII characters only."
            onChange={(bannerWide) => hero({ bannerWide })}
          />
          <TextField
            id="bannerStackedTop"
            label="stacked banner, line 1"
            value={value.hero.bannerStackedTop}
            error={errors.bannerStackedTop}
            placeholder={d.hero.bannerStackedTop}
            onChange={(bannerStackedTop) => hero({ bannerStackedTop })}
          />
          <TextField
            id="bannerStackedBottom"
            label="stacked banner, line 2"
            value={value.hero.bannerStackedBottom}
            error={errors.bannerStackedBottom}
            placeholder={d.hero.bannerStackedBottom}
            onChange={(bannerStackedBottom) => hero({ bannerStackedBottom })}
          />
          <TextField
            id="srTitle"
            label="heading for screen readers"
            value={value.hero.srTitle}
            error={errors.srTitle}
            placeholder={d.hero.srTitle}
            hint="The ASCII banner is decoration; this is the page's real h1."
            onChange={(srTitle) => hero({ srTitle })}
          />
        </Group>

        <Group title="intro">
          <TextField
            id="tagline"
            label="tagline"
            value={value.hero.tagline}
            error={errors.tagline}
            placeholder={d.hero.tagline}
            onChange={(tagline) => hero({ tagline })}
          />
          <TextAreaField
            id="description"
            label="description"
            value={value.hero.description}
            error={errors.description}
            rows={2}
            onChange={(description) => hero({ description })}
          />
          <TextField
            id="operator"
            label="operator line"
            value={value.hero.operator}
            error={errors.operator}
            placeholder={d.hero.operator}
            onChange={(operator) => hero({ operator })}
          />
        </Group>

        <Group title="panel chrome">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="systemLabel"
              label="system label"
              value={value.hero.systemLabel}
              error={errors.systemLabel}
              placeholder={d.hero.systemLabel}
              onChange={(systemLabel) => hero({ systemLabel })}
            />
            <TextField
              id="systemUnit"
              label="unit"
              value={value.hero.systemUnit}
              error={errors.systemUnit}
              placeholder={d.hero.systemUnit}
              onChange={(systemUnit) => hero({ systemUnit })}
            />
            <TextField
              id="linkStatus"
              label="link status"
              value={value.hero.linkStatus}
              error={errors.linkStatus}
              placeholder={d.hero.linkStatus}
              onChange={(linkStatus) => hero({ linkStatus })}
            />
            <TextField
              id="summaryTitle"
              label="summary title"
              value={value.hero.summaryTitle}
              error={errors.summaryTitle}
              placeholder={d.hero.summaryTitle}
              onChange={(summaryTitle) => hero({ summaryTitle })}
            />
            <TextField
              id="summaryRef"
              label="summary reference"
              value={value.hero.summaryRef}
              error={errors.summaryRef}
              placeholder={d.hero.summaryRef}
              onChange={(summaryRef) => hero({ summaryRef })}
            />
            <TextField
              id="metricPosts"
              label="posts metric"
              value={value.hero.metricPosts}
              error={errors.metricPosts}
              placeholder={d.hero.metricPosts}
              onChange={(metricPosts) => hero({ metricPosts })}
            />
            <TextField
              id="metricProjects"
              label="projects metric"
              value={value.hero.metricProjects}
              error={errors.metricProjects}
              placeholder={d.hero.metricProjects}
              onChange={(metricProjects) => hero({ metricProjects })}
            />
            <TextField
              id="metricMinutes"
              label="reading metric"
              value={value.hero.metricMinutes}
              error={errors.metricMinutes}
              placeholder={d.hero.metricMinutes}
              onChange={(metricMinutes) => hero({ metricMinutes })}
            />
          </div>
        </Group>

        <Group title="quick access">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="quickAccessTitle"
              label="panel title"
              value={value.hero.quickAccessTitle}
              error={errors.quickAccessTitle}
              placeholder={d.hero.quickAccessTitle}
              onChange={(quickAccessTitle) => hero({ quickAccessTitle })}
            />
            <TextField
              id="quickAccessRef"
              label="panel reference"
              value={value.hero.quickAccessRef}
              error={errors.quickAccessRef}
              placeholder={d.hero.quickAccessRef}
              onChange={(quickAccessRef) => hero({ quickAccessRef })}
            />
          </div>

          <ul className="flex flex-col gap-3">
            {value.hero.quickLinks.map((link, index) => (
              <li
                key={index}
                className="flex flex-col gap-3 border-s-2 border-terminal-rule ps-3 sm:flex-row sm:items-end"
              >
                {/* The number is the row's position, the way the page draws
                    it — moving a row renumbers it, so it is not editable. */}
                <span className="font-mono text-[0.7rem] text-terminal-chrome-dim sm:pb-2.5">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <TextField
                    id={`quickLink-${index}-label`}
                    label="label"
                    value={link.label}
                    error={errors[`quickLink${index}Label`]}
                    onChange={(label) =>
                      quickLinks(
                        value.hero.quickLinks.map((entry, position) =>
                          position === index ? { ...entry, label } : entry
                        )
                      )
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <TextField
                    id={`quickLink-${index}-href`}
                    label="destination"
                    value={link.href}
                    error={errors[`quickLink${index}Href`]}
                    onChange={(href) =>
                      quickLinks(
                        value.hero.quickLinks.map((entry, position) =>
                          position === index ? { ...entry, href } : entry
                        )
                      )
                    }
                  />
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  className="sm:mb-0.5"
                  onPress={() =>
                    quickLinks(
                      value.hero.quickLinks.filter(
                        (_, position) => position !== index
                      )
                    )
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>

          <Button
            size="xs"
            variant="outline"
            className="self-start"
            isDisabled={value.hero.quickLinks.length >= MAX_QUICK_LINKS}
            onPress={() =>
              quickLinks([...value.hero.quickLinks, { label: "", href: "/" }])
            }
          >
            Add a link
          </Button>
        </Group>

        <Group title="tag index">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="tagsTitle"
              label="panel title"
              value={value.hero.tagsTitle}
              error={errors.tagsTitle}
              placeholder={d.hero.tagsTitle}
              onChange={(tagsTitle) => hero({ tagsTitle })}
            />
            <TextField
              id="tagsRef"
              label="panel reference"
              value={value.hero.tagsRef}
              error={errors.tagsRef}
              placeholder={d.hero.tagsRef}
              onChange={(tagsRef) => hero({ tagsRef })}
            />
          </div>
          <p className="text-xs text-terminal-ink-faint">
            The tags themselves come from the posts, so there is nothing to edit
            here beyond what the panel is called.
          </p>
        </Group>

        <Group title="render style">
          <SelectField
            id="renderStyle"
            label="how the globe and the coin are drawn"
            value={value.render.style}
            options={RENDER_STYLES.map((style) => ({
              value: style,
              label: RENDER_STYLE_LABELS[style],
            }))}
            onChange={renderStyle}
          />
          <p className="text-xs text-terminal-ink-faint">
            ascii lights the model and reduces it to characters. hologram drops
            the lighting, draws the model as a self-lit low-poly surface, and
            rasterises it on a square grid with scanlines.
          </p>
        </Group>

        <Group title="globe panel">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="globeTitle"
              label="caption"
              value={value.hero.globeTitle}
              error={errors.globeTitle}
              placeholder={d.hero.globeTitle}
              onChange={(globeTitle) => hero({ globeTitle })}
            />
            <TextField
              id="globeFooterEnd"
              label="footer, right"
              value={value.hero.globeFooterEnd}
              error={errors.globeFooterEnd}
              placeholder={d.hero.globeFooterEnd}
              onChange={(globeFooterEnd) => hero({ globeFooterEnd })}
            />
          </div>
          <p className="text-xs text-terminal-ink-faint">
            The status, the readouts and the left footer are measured, not
            written: the panel prints the bearing and range from Prypiat to
            wherever the reader is, and says so when it cannot get a fix.
          </p>
        </Group>

        {(["posts", "games", "projects"] as const).map((key) => (
          <Group key={key} title={`${key} section`}>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id={`${key}-title`}
                label="heading"
                value={value.sections[key].title}
                error={errors[`${key}Title`]}
                placeholder={d.sections[key].title}
                onChange={(title) => section(key, { title })}
              />
              <TextField
                id={`${key}-path`}
                label="path shown"
                value={value.sections[key].path}
                error={errors[`${key}Path`]}
                placeholder={d.sections[key].path}
                onChange={(path) => section(key, { path })}
              />
              <TextField
                id={`${key}-action`}
                label="link label"
                value={value.sections[key].actionLabel}
                error={errors[`${key}Action`]}
                placeholder={d.sections[key].actionLabel}
                onChange={(actionLabel) => section(key, { actionLabel })}
              />
            </div>
          </Group>
        ))}
      </div>
    </AdminShell>
  )
}

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * The checks worth catching before a round trip. The server validates the same
 * rules and is the one that decides — this is here so a typo in a link does
 * not need a save to be reported.
 */
function validate(value: HomeContent): Errors {
  const errors: Errors = {}

  for (const field of [
    "bannerWide",
    "bannerStackedTop",
    "bannerStackedBottom",
  ] as const) {
    if (!ASCII_ONLY.test(value.hero[field])) {
      errors[field] = "The ASCII font has no glyph for these characters."
    }
  }

  value.hero.quickLinks.forEach((link, index) => {
    const label = link.label.trim()
    const href = link.href.trim()
    // A row with nothing in it is dropped on save rather than rejected.
    if (!label && !href) return
    if (!label) errors[`quickLink${index}Label`] = "A label is required."
    if (!href) errors[`quickLink${index}Href`] = "A destination is required."
    else if (!href.startsWith("/") && !/^https?:\/\//i.test(href)) {
      errors[`quickLink${index}Href`] = "Use /posts, or a full https:// URL."
    } else if (href.includes("..")) {
      errors[`quickLink${index}Href`] = "A path cannot contain '..'."
    }
  })

  return errors
}
