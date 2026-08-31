import { NextResponse } from "next/server"
import { cmsGames } from "@/lib/cms/games"

export async function GET() {
  const games = await cmsGames.list()
  return NextResponse.json({ games })
}

export async function POST(request: Request) {
  try {
    const created = await cmsGames.create(await request.json())
    return NextResponse.json({ game: created }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create game.",
      },
      { status: 400 }
    )
  }
}
