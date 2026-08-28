import { NextResponse } from "next/server"
import { deleteCmsPost, readCmsPost, updateCmsPost } from "@/lib/cms/posts"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params
  const post = await readCmsPost(slug)
  if (!post)
    return NextResponse.json({ error: "Post not found." }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params
    const post = await updateCmsPost(slug, await request.json())
    return NextResponse.json({ post })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update post.",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params
    const result = await deleteCmsPost(slug)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete post.",
      },
      { status: 400 }
    )
  }
}
