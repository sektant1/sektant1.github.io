import { notFound } from "next/navigation"
import { GameForm } from "@/components/admin/game-form"
import { getGameBySlug } from "@/lib/content/games"

interface EditGamePageProps {
  params: Promise<{ slug: string }>
}

export default async function EditGamePage({ params }: EditGamePageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug, { includeDrafts: true })
  if (!game) notFound()

  return (
    <GameForm
      mode="edit"
      game={{ ...game.meta, body: game.body }}
      today={new Date().toISOString().slice(0, 10)}
    />
  )
}
