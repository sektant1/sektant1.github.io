import { NextResponse } from "next/server"
import { cmsGames } from "@/lib/cms/games"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params
  const game = await cmsGames.read(slug)
  if (!game)
    return NextResponse.json({ error: "Game not found." }, { status: 404 })
  return NextResponse.json({ game })
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params
    const game = await cmsGames.update(slug, await request.json())
    return NextResponse.json({ game })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update game.",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params
    const result = await cmsGames.remove(slug)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete game.",
      },
      { status: 400 }
    )
  }
}
