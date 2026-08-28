"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "sonner"

import { AdminShell } from "@/components/admin/admin-shell"
import { MdxPreview } from "@/components/admin/mdx-preview"

export type Errors = Record<string, string>

/** The collection name, as it reads in a sentence. */
const SINGULAR = { posts: "post", projects: "project", games: "game" } as const

/** Whether what was just written will show up on the public site. */
function describeState(value: unknown) {
  const record = value as { status?: string; visibility?: string }
  const state = record.status ?? record.visibility
  return state === "published" ? "Live on the site." : "Saved as a draft."
}

type ContentEditorProps<T> = {
  /** Which collection this writes to; also the API path segment. */
  kind: "posts" | "projects" | "games"
  mode: "create" | "edit"
  initial: T
  /** The slug the file is stored under today, for edits. */
  originalSlug?: string
  slugOf: (value: T) => string
  bodyOf: (value: T) => string
  setBody: (value: T, body: string) => T
  validate: (value: T) => Errors
  /** Front matter controls. Rendered in the left column. */
  fields: (state: {
    value: T
    update: (next: Partial<T>) => void
    errors: Errors
  }) => React.ReactNode
  /** Quick status changes, e.g. save as draft / publish. */
  actions?: {
    label: string
    apply: (value: T) => T
    variant?: "default" | "outline"
  }[]
}

/**
 * The write surface: front matter on the left, body on the right.
 *
 * The two are side by side rather than stacked because they are edited
 * together — a writer sets the slug and the title in the same pass as the
 * first paragraph, and a form that makes them scroll between the two turns
 * that into a chore.
 *
 * Saving is explicit. This edits files in a git repository, and an autosave
 * that writes every keystroke to disk would fill the working tree with states
 * the writer never chose.
 */
export function ContentEditor<T>({
  kind,
  mode,
  initial,
  originalSlug,
  slugOf,
  bodyOf,
  setBody,
  validate,
  fields,
  actions = [],
}: ContentEditorProps<T>) {
  const router = useRouter()
  const [value, setValue] = React.useState(initial)
  const [errors, setErrors] = React.useState<Errors>({})
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  // The saved snapshot, not the prop: after a save the file on disk is what
  // the form holds, so the unsaved marker has to clear.
  const [committed, setCommitted] = React.useState(() =>
    JSON.stringify(initial)
  )
  const dirty = JSON.stringify(value) !== committed

  React.useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2400)
    return () => clearTimeout(timer)
  }, [saved])

  // The browser's own guard against closing a tab with unsaved work. It is the
  // one interruption a writer expects here.
  React.useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function update(next: Partial<T>) {
    setValue((current) => ({ ...current, ...next }))
  }

  async function submit(transform: (value: T) => T = (input) => input) {
    const payload = transform(value)
    const found = validate(payload)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error("Nothing was saved", {
        description: `Check ${Object.keys(found).join(", ")}.`,
      })
      return
    }

    setSaving(true)

    const endpoint =
      mode === "create"
        ? `/api/admin/${kind}`
        : `/api/admin/${kind}/${originalSlug}`

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok)
        throw new Error(body.error ?? "The file was not written.")

      setValue(payload)
      setCommitted(JSON.stringify(payload))
      setSaved(true)
      toast.success(
        `Wrote content/${kind}/${slugOf(payload)}/index.mdx`,
        // The status the file landed in, because the quick actions change it
        // and the writer should see which one took.
        { description: describeState(payload) }
      )

      const slug = slugOf(payload)
      if (mode === "create" || slug !== originalSlug) {
        router.replace(`/admin/${kind}/${slug}/edit`)
      }
      router.refresh()
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "The file was not written."
      toast.error("The file was not written", { description: message })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!originalSlug) return
    // A file delete cannot be undone from here, so it is confirmed first.
    if (
      !window.confirm(
        `Delete content/${kind}/${originalSlug}? This removes the folder.`
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/${kind}/${originalSlug}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error ?? "The file was not deleted.")
      }
      toast.success(`Deleted content/${kind}/${originalSlug}`)
      router.replace(`/admin/${kind}`)
      router.refresh()
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "The file was not deleted."
      toast.error("The file was not deleted", { description: message })
      setSaving(false)
    }
  }

  const slug = slugOf(value)
  const path = `content/${kind}/${slug || "«slug»"}/index.mdx`

  return (
    <AdminShell
      path={path}
      mode="edit"
      dirty={dirty}
      status={[
        { label: "file", value: mode === "create" ? "new" : "on disk" },
        ...(saved && !dirty ? [{ label: "written", value: "ok" }] : []),
      ]}
      actions={
        <>
          {actions.map((action) => (
            <Button
              key={action.label}
              size="xs"
              variant={action.variant ?? "outline"}
              isDisabled={saving}
              onPress={() => void submit(action.apply)}
            >
              {action.label}
            </Button>
          ))}
          <Button size="xs" isDisabled={saving} onPress={() => void submit()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-4 p-4 md:p-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <h2 className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
              front matter
            </h2>
            {fields({ value, update, errors })}

            {mode === "edit" ? (
              <Button
                variant="destructive"
                size="sm"
                className="mt-2 self-start"
                isDisabled={saving}
                onPress={() => void remove()}
              >
                Delete this {SINGULAR[kind]}
              </Button>
            ) : null}
          </div>

          <Tabs
            defaultSelectedKey="write"
            className="flex min-w-0 flex-col gap-2"
          >
            <TabsList variant="line">
              <TabsTrigger id="write">write</TabsTrigger>
              <TabsTrigger id="preview">preview</TabsTrigger>
            </TabsList>

            <TabsContent id="write">
              <Textarea
                aria-label="Post body, in MDX"
                spellCheck={false}
                value={bodyOf(value)}
                onChange={(event) =>
                  setValue(setBody(value, event.target.value))
                }
                className="min-h-[28rem] resize-y font-mono text-xs leading-relaxed"
              />
            </TabsContent>

            <TabsContent id="preview">
              <MdxPreview source={bodyOf(value)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminShell>
  )
}
