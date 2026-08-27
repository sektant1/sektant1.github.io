"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import { PostList } from "@/components/posts/post-list"
import { SeriesList } from "@/components/posts/series-list"
import type { PostMeta, PostSeriesSummary } from "@/lib/content/types"
import type { PostSearchHit } from "@/lib/search/types"

const PER_PAGE = 10

const SORTS = [
  { value: "newest", label: "newest first" },
  { value: "oldest", label: "oldest first" },
  { value: "shortest", label: "short reads" },
  { value: "longest", label: "long reads" },
] as const

type Sort = (typeof SORTS)[number]["value"]

function minutes(readingTime?: string) {
  const match = /(\d+)/.exec(readingTime ?? "")
  return match ? Number.parseInt(match[1], 10) : 0
}

function published(post: PostMeta) {
  const time = Date.parse(post.date)
  return Number.isFinite(time) ? time : 0
}

/**
 * The posts screen: filter controls above the listing.
 *
 * Controls are labelled like editor commands (`:find`, `:sort`) because that
 * is what they are — the same actions a reader would type at a prompt. The
 * state is mirrored into the URL so a filtered view can be linked and
 * restored, but through replaceState rather than a navigation, so filtering
 * does not fill the back button with intermediate keystrokes.
 */
export function PostBrowser({
  posts,
  series,
  searchHits,
}: {
  posts: PostMeta[]
  series: PostSeriesSummary[]
  searchHits: PostSearchHit[]
}) {
  const params = useSearchParams()

  const [tab, setTab] = React.useState(
    params.get("tab") === "series" ? "series" : "posts"
  )
  const [query, setQuery] = React.useState(params.get("q") ?? "")
  const [tag, setTag] = React.useState<string | null>(params.get("tag"))
  const [sort, setSort] = React.useState<Sort>(() => {
    const requested = params.get("sort")
    return SORTS.some((option) => option.value === requested)
      ? (requested as Sort)
      : "newest"
  })
  const [page, setPage] = React.useState(() => {
    const requested = Number.parseInt(params.get("page") ?? "", 10)
    return Number.isFinite(requested) && requested > 0 ? requested : 1
  })

  const tagCounts = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const post of posts) {
      for (const item of post.tags) counts.set(item, (counts.get(item) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [posts])

  // Full-text search runs against the prebuilt index of post bodies, so a
  // query matches what a post says, not only what its front matter says.
  const matches = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return null
    return new Set(
      searchHits
        .filter((hit) => hit.text.toLowerCase().includes(term))
        .map((hit) => hit.href)
    )
  }, [searchHits, query])

  const filtered = React.useMemo(
    () =>
      posts.filter(
        (post) =>
          (!matches || matches.has(`/posts/${post.slug}`)) &&
          (!tag || post.tags.includes(tag))
      ),
    [posts, matches, tag]
  )

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sort === "oldest") return published(a) - published(b)
        if (sort === "shortest") return minutes(a.readingTime) - minutes(b.readingTime)
        if (sort === "longest") return minutes(b.readingTime) - minutes(a.readingTime)
        return published(b) - published(a)
      }),
    [filtered, sort]
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PER_PAGE
  const visible = sorted.slice(start, start + PER_PAGE)
  const isFiltered = Boolean(query || tag || sort !== "newest")

  React.useEffect(() => {
    const next = new URLSearchParams()
    if (tab === "series") {
      next.set("tab", "series")
    } else {
      if (query) next.set("q", query)
      if (tag) next.set("tag", tag)
      if (sort !== "newest") next.set("sort", sort)
      if (currentPage > 1) next.set("page", String(currentPage))
    }
    const href = next.toString() ? `/posts?${next}` : "/posts"
    if (href !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", href)
    }
  }, [tab, query, tag, sort, currentPage])

  function clear() {
    setQuery("")
    setTag(null)
    setSort("newest")
    setPage(1)
  }

  return (
    <Tabs
      selectedKey={tab}
      onSelectionChange={(key) => {
        setTab(String(key))
        setPage(1)
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-terminal-rule pb-2">
        <TabsList variant="line">
          <TabsTrigger id="posts">posts ({posts.length})</TabsTrigger>
          <TabsTrigger id="series">series ({series.length})</TabsTrigger>
        </TabsList>

        <span className="font-mono text-[0.7rem] text-terminal-chrome-dim tabular-nums">
          {tab === "series"
            ? `${series.length} series`
            : `${filtered.length} / ${posts.length}`}
        </span>
      </div>

      <TabsContent id="posts" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-0 flex-1 basis-56 flex-col gap-1 sm:max-w-xs">
              <span className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim">
                :find
              </span>
              <Input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="search post text"
                aria-label="Search posts"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim">
                :sort
              </span>
              <NativeSelect
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as Sort)
                  setPage(1)
                }}
                aria-label="Sort posts"
              >
                {SORTS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>

            <Button
              variant="ghost"
              size="sm"
              isDisabled={!isFiltered}
              onPress={clear}
            >
              :clear
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem]">
            <span className="text-terminal-chrome-dim">tags</span>
            <TagFilter
              label="all"
              count={posts.length}
              active={!tag}
              onSelect={() => {
                setTag(null)
                setPage(1)
              }}
            />
            {tagCounts.map(([item, count]) => (
              <TagFilter
                key={item}
                label={item}
                count={count}
                active={tag === item}
                onSelect={() => {
                  setTag(item)
                  setPage(1)
                }}
              />
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No posts match this filter</EmptyTitle>
              <EmptyDescription>
                Clear the filter to see all {posts.length} posts.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" onPress={clear}>
                :clear
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <PostList posts={visible} startIndex={start} />

            {totalPages > 1 ? (
              <nav
                aria-label="Post pages"
                className="flex items-center justify-between gap-3 font-mono text-[0.7rem]"
              >
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={currentPage === 1}
                  onPress={() => setPage(currentPage - 1)}
                >
                  ← prev
                </Button>
                <span className="text-terminal-ink-faint tabular-nums">
                  {start + 1}–{Math.min(start + PER_PAGE, sorted.length)} of{" "}
                  {sorted.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={currentPage === totalPages}
                  onPress={() => setPage(currentPage + 1)}
                >
                  next →
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </TabsContent>

      <TabsContent id="series">
        <SeriesList series={series} />
      </TabsContent>
    </Tabs>
  )
}

function TagFilter({
  label,
  count,
  active,
  onSelect,
}: {
  label: string
  count: number
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "border border-transparent px-1.5 py-0.5 text-terminal-ink-dim hover:border-terminal-edge hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        active && "border-primary text-primary crt-glow-soft"
      )}
    >
      {label}
      <span className="ms-1 text-terminal-ink-faint tabular-nums">{count}</span>
    </button>
  )
}
