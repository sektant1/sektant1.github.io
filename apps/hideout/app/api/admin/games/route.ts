import { NextResponse } from "next/server";
import { createCmsGame, listCmsGames } from "@/lib/cms/games";

export async function GET() {
  const games = await listCmsGames();
  return NextResponse.json({ games });
}

export async function POST(request: Request) {
  try {
    const created = await createCmsGame(await request.json());
    return NextResponse.json({ game: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create game." },
      { status: 400 },
    );
  }
}
