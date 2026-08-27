"use client"

import * as React from "react"

import { ContentEditor, type Errors } from "@/components/admin/content-editor"
import {
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields"
import type {
  PostSeriesMeta,
  PostSeriesSummary,
  PostStatus,
} from "@/lib/content/types"
import { slugify } from "@/lib/mdx/slugify"

export type PostDraft = {
  title: string
  slug: string
  description: string
  date: string
  status: PostStatus
  tags: string[]
  thumbnail?: string
  series?: PostSeriesMeta
  body: string
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const STANDALONE = ""
const NEW_SERIES = "__new"

export function PostForm({
  mode,
  post,
  series = [],
  today,
}: {
  mode: "create" | "edit"
  post?: PostDraft
  series?: PostSeriesSummary[]
  /** Passed in from the server so the date is the machine's, not the client's. */
  today: string
}) {
  const initial: PostDraft = post ?? {
    title: "",
    slug: "",
    description: "",
    date: today,
    status: "draft",
    tags: [],
    thumbnail: "",
    body: "## Field note\n\nWrite here.\n",
  }

  // Once the slug has been typed, the title stops driving it — renaming a post
  // should not silently move the folder it lives in.
  const slugPinned = React.useRef(mode === "edit")

  return (
    <ContentEditor<PostDraft>
      kind="posts"
      mode={mode}
      initial={initial}
      originalSlug={post?.slug}
      slugOf={(value) => value.slug}
      bodyOf={(value) => value.body}
      setBody={(value, body) => ({ ...value, body })}
      validate={validatePost}
      actions={[
        {
          label: "Save as draft",
          variant: "outline",
          apply: (value) => ({ ...value, status: "draft" }),
        },
        {
          label: "Publish",
          apply: (value) => ({ ...value, status: "published" }),
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
              update(
                slugPinned.current
                  ? { title }
                  : { title, slug: slugify(title) }
              )
            }
          />

          <TextField
            id="slug"
            label="slug"
            value={value.slug}
            error={errors.slug}
            hint="The folder name under content/posts"
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
            id="status"
            label="status"
            value={value.status}
            options={[
              { value: "draft", label: "draft" },
              { value: "published", label: "published" },
            ]}
            onChange={(status) => update({ status: status as PostStatus })}
          />

          <TagsField
            id="tags"
            label="tags"
            value={value.tags}
            onChange={(tags) => update({ tags })}
          />

          <TextField
            id="thumbnail"
            label="thumbnail"
            value={value.thumbnail ?? ""}
            error={errors.thumbnail}
            hint="A file in this post's folder, e.g. thumb.gif"
            onChange={(thumbnail) => update({ thumbnail })}
          />

          <SeriesFields
            value={value}
            update={update}
            errors={errors}
            series={series}
          />
        </>
      )}
    />
  )
}

/**
 * Series membership.
 *
 * Attaching to an existing series fills the next free position, because that
 * is what "add to this series" almost always means — and the number stays
 * editable for the case where it does not.
 */
function SeriesFields({
  value,
  update,
  errors,
  series,
}: {
  value: PostDraft
  update: (next: Partial<PostDraft>) => void
  errors: Errors
  series: PostSeriesSummary[]
}) {
  const selected = value.series
    ? series.some((entry) => entry.id === value.series?.id)
      ? value.series.id
      : NEW_SERIES
    : STANDALONE

  function attach(id: string) {
    if (id === STANDALONE) return update({ series: undefined })
    if (id === NEW_SERIES) {
      return update({
        series: value.series ?? { id: "", title: "", order: 1 },
      })
    }

    const target = series.find((entry) => entry.id === id)
    if (!target) return

    const nextOrder =
      Math.max(0, ...target.posts.map((post) => post.series?.order ?? 0)) + 1

    update({ series: { id: target.id, title: target.title, order: nextOrder } })
  }

  return (
    <>
      <SelectField
        id="series"
        label="series"
        value={selected}
        options={[
          { value: STANDALONE, label: "standalone" },
          ...series.map((entry) => ({
            value: entry.id,
            label: `${entry.title} (${entry.count})`,
          })),
          { value: NEW_SERIES, label: "new series…" },
        ]}
        onChange={attach}
      />

      {value.series ? (
        <div className="flex flex-col gap-4 border-s-2 border-terminal-edge ps-3">
          <TextField
            id="series-id"
            label="series id"
            value={value.series.id}
            error={errors.seriesId}
            onChange={(id) =>
              update({ series: { ...value.series!, id: slugify(id) } })
            }
          />
          <TextField
            id="series-title"
            label="series title"
            value={value.series.title}
            error={errors.seriesTitle}
            onChange={(title) => update({ series: { ...value.series!, title } })}
          />
          <TextField
            id="series-order"
            label="part number"
            type="number"
            value={
              Number.isFinite(value.series.order) ? String(value.series.order) : ""
            }
            error={errors.seriesOrder}
            onChange={(order) =>
              update({
                series: { ...value.series!, order: Number.parseInt(order, 10) },
              })
            }
          />
        </div>
      ) : null}
    </>
  )
}

function validatePost(value: PostDraft): Errors {
  const errors: Errors = {}

  if (!value.title.trim()) errors.title = "A title is required."
  if (!value.slug.trim()) errors.slug = "A slug is required."
  else if (!SLUG.test(value.slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens."
  }
  if (!value.description.trim()) errors.description = "A description is required."
  if (!Number.isFinite(Date.parse(value.date))) errors.date = "Use YYYY-MM-DD."
  if (value.thumbnail?.includes("..")) {
    errors.thumbnail = "A thumbnail cannot point outside its own folder."
  }
  if (value.series) {
    if (!value.series.id.trim()) errors.seriesId = "A series id is required."
    if (!value.series.title.trim()) errors.seriesTitle = "A series title is required."
    if (!Number.isFinite(value.series.order)) {
      errors.seriesOrder = "A part number is required."
    }
  }

  return errors
}
