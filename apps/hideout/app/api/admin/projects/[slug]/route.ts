import { NextResponse } from "next/server"
import { cmsProjects } from "@/lib/cms/projects"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params
  const project = await cmsProjects.read(slug)
  if (!project)
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  return NextResponse.json({ project })
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params
    const project = await cmsProjects.update(slug, await request.json())
    return NextResponse.json({ project })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update project.",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params
    const result = await cmsProjects.remove(slug)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete project.",
      },
      { status: 400 }
    )
  }
}
