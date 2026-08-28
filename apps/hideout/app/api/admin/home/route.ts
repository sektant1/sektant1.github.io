import { NextResponse } from "next/server"
import { readCmsHome, updateCmsHome } from "@/lib/cms/home"

export async function GET() {
  const home = await readCmsHome()
  return NextResponse.json({ home })
}

export async function PUT(request: Request) {
  try {
    const home = await updateCmsHome(await request.json())
    return NextResponse.json({ home })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save the front page.",
      },
      { status: 400 }
    )
  }
}
