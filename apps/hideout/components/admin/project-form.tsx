"use client"

import * as React from "react"

import { ContentEditor, type Errors } from "@/components/admin/content-editor"
import {
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields"
import type { PostStatus, ProjectOpenTarget } from "@/lib/content/types"
import { slugify } from "@/lib/mdx/slugify"

export type ProjectDraft = {
  title: string
  slug: string
  description: string
  date: string
  tags: string[]
  stack: string[]
  thumbnail?: string
  href?: string
  repo?: string
  open?: ProjectOpenTarget
  status?: string
  visibility: PostStatus
  body: string
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function ProjectForm({
  mode,
  project,
  today,
}: {
  mode: "create" | "edit"
  project?: ProjectDraft
  today: string
}) {
  const initial: ProjectDraft = project ?? {
    title: "",
    slug: "",
    description: "",
    date: today,
    tags: [],
    stack: [],
    thumbnail: "",
    href: "",
    repo: "",
    open: "website",
    status: "active",
    visibility: "draft",
    body: "## What it is\n\nWrite here.\n",
  }

  const slugPinned = React.useRef(mode === "edit")

  return (
    <ContentEditor<ProjectDraft>
      kind="projects"
      mode={mode}
      initial={initial}
      originalSlug={project?.slug}
      slugOf={(value) => value.slug}
      bodyOf={(value) => value.body}
      setBody={(value, body) => ({ ...value, body })}
      validate={validateProject}
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
              update(
                slugPinned.current ? { title } : { title, slug: slugify(title) }
              )
            }
          />

          <TextField
            id="slug"
            label="slug"
            value={value.slug}
            error={errors.slug}
            hint="The folder name under content/projects"
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
            label="project status"
            value={value.status ?? ""}
            hint="Shown on the card, e.g. active, shipped, archived"
            onChange={(status) => update({ status })}
          />

          <TagsField
            id="stack"
            label="stack"
            value={value.stack}
            onChange={(stack) => update({ stack })}
          />

          <TagsField
            id="tags"
            label="tags"
            value={value.tags}
            onChange={(tags) => update({ tags })}
          />

          <TextField
            id="repo"
            label="repository"
            value={value.repo ?? ""}
            error={errors.repo}
            onChange={(repo) => update({ repo })}
          />

          <TextField
            id="href"
            label="live site"
            value={value.href ?? ""}
            error={errors.href}
            onChange={(href) => update({ href })}
          />

          {/* Which of the three the card opens. The list only offers the ones
              that have somewhere to go. */}
          <SelectField
            id="open"
            label="card opens"
            value={value.open ?? "website"}
            options={[
              { value: "project", label: "the write-up here" },
              ...(value.href
                ? [{ value: "website", label: "the live site" }]
                : []),
              ...(value.repo
                ? [{ value: "repo", label: "the repository" }]
                : []),
            ]}
            onChange={(open) => update({ open: open as ProjectOpenTarget })}
          />

          <TextField
            id="thumbnail"
            label="logo"
            value={value.thumbnail ?? ""}
            error={errors.thumbnail}
            hint="A file in this project's folder, e.g. logo.png"
            onChange={(thumbnail) => update({ thumbnail })}
          />
        </>
      )}
    />
  )
}

function validateProject(value: ProjectDraft): Errors {
  const errors: Errors = {}

  if (!value.title.trim()) errors.title = "A title is required."
  if (!value.slug.trim()) errors.slug = "A slug is required."
  else if (!SLUG.test(value.slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens."
  }
  if (!value.description.trim())
    errors.description = "A description is required."
  if (!Number.isFinite(Date.parse(value.date))) errors.date = "Use YYYY-MM-DD."
  if (value.thumbnail?.includes("..")) {
    errors.thumbnail = "A logo cannot point outside its own folder."
  }
  for (const key of ["repo", "href"] as const) {
    const url = value[key]
    if (url && !/^https?:\/\//.test(url)) {
      errors[key] = "Use a full URL, starting with https://."
    }
  }

  return errors
}
