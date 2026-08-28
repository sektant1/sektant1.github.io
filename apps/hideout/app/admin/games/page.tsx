import { AdminAction, AdminShell } from "@/components/admin/admin-shell"
import { ContentTable } from "@/components/admin/content-table"
import { getAllGames } from "@/lib/content/games"

export default async function AdminGamesPage() {
  const games = await getAllGames({ includeDrafts: true })

  return (
    <AdminShell
      path="content/games"
      status={[{ label: "games", value: games.length }]}
      actions={<AdminAction href="/admin/games/new">New game</AdminAction>}
    >
      <div className="p-4 md:p-6">
        <ContentTable
          label="Games"
          editBase="/admin/games"
          noteLabel="platforms"
          rows={games.map((game) => ({
            slug: game.meta.slug,
            title: game.meta.title,
            date: game.meta.date,
            published: game.meta.visibility === "published",
            note: game.meta.platforms.join(" / ") || undefined,
          }))}
        />
      </div>
    </AdminShell>
  )
}
