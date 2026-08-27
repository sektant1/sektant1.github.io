"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export type ContentRow = {
  slug: string
  title: string
  date: string
  published: boolean
  /** Series membership, stack — whatever the collection wants in column four. */
  note?: string
}

/**
 * The content listing.
 *
 * Drafts are marked rather than hidden or sorted away: the reason to open this
 * screen is usually the piece that is not finished, and it should be the
 * easiest thing to find.
 *
 * Rows are the table's own selection rather than links inside cells — the grid
 * already handles arrow keys and Enter, and a link per row would put a second,
 * competing keyboard model inside it.
 */
export function ContentTable({
  rows,
  editBase,
  label,
  noteLabel = "note",
}: {
  rows: ContentRow[]
  /** `/admin/posts` — opening a row goes to `${editBase}/${slug}/edit`. */
  editBase: string
  label: string
  noteLabel?: string
}) {
  const router = useRouter()

  if (rows.length === 0) {
    return (
      <p className="border border-terminal-rule p-4 text-xs text-terminal-ink-dim">
        Nothing here yet. Use “New” above to write the first one.
      </p>
    )
  }

  return (
    <Table
      aria-label={label}
      selectionMode="single"
      selectionBehavior="replace"
      onRowAction={(key) => router.push(`${editBase}/${key}/edit`)}
    >
      <TableHeader>
        <TableHead id="status" className="w-24">
          status
        </TableHead>
        <TableHead id="title" isRowHeader>
          title
        </TableHead>
        <TableHead id="date" className="w-28">
          date
        </TableHead>
        <TableHead id="note" className="w-48">
          {noteLabel}
        </TableHead>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.slug} id={row.slug} className="cursor-pointer">
            <TableCell>
              <Badge
                variant={row.published ? "default" : "outline"}
                className="font-mono"
              >
                {row.published ? "published" : "draft"}
              </Badge>
            </TableCell>

            <TableCell>
              <span className="block text-foreground">{row.title}</span>
              <span className="block font-mono text-[0.65rem] text-terminal-ink-faint">
                {row.slug}
              </span>
            </TableCell>

            <TableCell className="font-mono text-[0.7rem] text-terminal-ink-dim tabular-nums">
              {row.date}
            </TableCell>

            <TableCell className="font-mono text-[0.7rem] text-terminal-ink-dim">
              {row.note ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
