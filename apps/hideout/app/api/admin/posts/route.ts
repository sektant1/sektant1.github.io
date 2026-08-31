import { NextResponse } from "next/server"
import { cmsPosts } from "@/lib/cms/posts"

export async function GET() {
  const posts = await cmsPosts.list()
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  try {
    const created = await cmsPosts.create(await request.json())
    return NextResponse.json({ post: created }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create post.",
      },
      { status: 400 }
    )
  }
}
