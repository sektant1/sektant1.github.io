"use client"

import * as React from "react"

import { ContentEditor, type Errors } from "@/components/admin/content-editor"
import {
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields"
import type { PostStatus } from "@/lib/content/types"
import { slugify } from "@/lib/mdx/slugify"

export type GameDraft = {
  title: string
  slug: string
  description: string
  date: string
  tags: string[]
  platforms: string[]
  engine?: string
  thumbnail?: string
  playHref?: string
  downloadHref?: string
  storeHref?: string
  repo?: string
  status?: string
  jam?: string
  visibility: PostStatus
  body: string
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function GameForm({
  mode,
  game,
  today,
}: {
  mode: "create" | "edit"
  game?: GameDraft
  today: string
}) {
  const initial: GameDraft = game ?? {
    title: "",
    slug: "",
    description: "",
    date: today,
    tags: [],
    platforms: [],
    engine: "",
    thumbnail: "",
    playHref: "",
    downloadHref: "",
    storeHref: "",
    repo: "",
    status: "prototype",
    jam: "",
    visibility: "draft",
    body: "## What it is\n\nWrite here.\n\n## How it plays\n\n",
  }

  // Once the slug has been typed, the title stops driving it — renaming a game
  // should not silently move the folder it lives in.
  const slugPinned = React.useRef(mode === "edit")

  return (
    <ContentEditor<GameDraft>
      kind="games"
      mode={mode}
      initial={initial}
      originalSlug={game?.slug}
      slugOf={(value) => value.slug}
      bodyOf={(value) => value.body}
      setBody={(value, body) => ({ ...value, body })}
      validate={validateGame}
      actions={[
        {
          label: "Save as draft",
          variant: "outline",
          apply: (value) => ({ ...value, visibility: "draft" }),
        },
        {
          label: "Publish",
          apply: (value) => ({ ...value, visibility: "published" }),
        },
      ]}
      fields={({ value, update, errors }) => (
        <>
          <TextField
            id="title"
            label="title"
            value={value.title}
            error={errors.title}
            onChange={(title) =>
              update(slugPinned.current ? { title } : { title, slug: slugify(title) })
            }
          />

          <TextField
            id="slug"
            label="slug"
            value={value.slug}
            error={errors.slug}
            hint="The folder name under content/games"
            onChange={(slug) => {
              slugPinned.current = true
              update({ slug })
            }}
          />

          <TextAreaField
            id="description"
            label="description"
            value={value.description}
            error={errors.description}
            onChange={(description) => update({ description })}
          />

          <TextField
            id="date"
            label="date"
            type="date"
            value={value.date}
            error={errors.date}
            onChange={(date) => update({ date })}
          />

          <SelectField
            id="visibility"
            label="visibility"
            value={value.visibility}
            options={[
              { value: "draft", label: "draft" },
              { value: "published", label: "published" },
            ]}
            onChange={(visibility) =>
              update({ visibility: visibility as PostStatus })
            }
          />

          <TextField
            id="status"
            label="state"
            value={value.status ?? ""}
            hint="Shown on the card: released, prototype, abandoned"
            onChange={(status) => update({ status })}
          />

          <TextField
            id="engine"
            label="engine"
            value={value.engine ?? ""}
            hint="Godot, Unity, raven-engine"
            onChange={(engine) => update({ engine })}
          />

          <TagsField
            id="platforms"
            label="platforms"
            value={value.platforms}
            onChange={(platforms) => update({ platforms })}
          />

          <TagsField
            id="tags"
            label="tags"
            value={value.tags}
            onChange={(tags) => update({ tags })}
          />

          <TextField
            id="jam"
            label="jam"
            value={value.jam ?? ""}
            hint="Which jam it was made for, and how it placed"
            onChange={(jam) => update({ jam })}
          />

          {/* Play comes first here too, matching the order on the card. */}
          <TextField
            id="playHref"
            label="play in browser"
            value={value.playHref ?? ""}
            error={errors.playHref}
            onChange={(playHref) => update({ playHref })}
          />

          <TextField
            id="downloadHref"
            label="download"
            value={value.downloadHref ?? ""}
            error={errors.downloadHref}
            hint="An itch.io page or a direct build link"
            onChange={(downloadHref) => update({ downloadHref })}
          />

          <TextField
            id="storeHref"
            label="store"
            value={value.storeHref ?? ""}
            error={errors.storeHref}
            onChange={(storeHref) => update({ storeHref })}
          />

          <TextField
            id="repo"
            label="source"
            value={value.repo ?? ""}
            error={errors.repo}
            onChange={(repo) => update({ repo })}
          />

          <TextField
            id="thumbnail"
            label="cover"
            value={value.thumbnail ?? ""}
            error={errors.thumbnail}
            hint="A file in this game's folder, e.g. cover.png"
            onChange={(thumbnail) => update({ thumbnail })}
          />
        </>
      )}
    />
  )
}

function validateGame(value: GameDraft): Errors {
  const errors: Errors = {}

  if (!value.title.trim()) errors.title = "A title is required."
  if (!value.slug.trim()) errors.slug = "A slug is required."
  else if (!SLUG.test(value.slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens."
  }
  if (!value.description.trim()) errors.description = "A description is required."
  if (!Number.isFinite(Date.parse(value.date))) errors.date = "Use YYYY-MM-DD."
  if (value.thumbnail?.includes("..")) {
    errors.thumbnail = "A cover cannot point outside its own folder."
  }

  for (const key of ["playHref", "downloadHref", "storeHref", "repo"] as const) {
    const url = value[key]
    if (url && !/^https?:\/\//.test(url)) {
      errors[key] = "Use a full URL, starting with https://."
    }
  }

  return errors
}
