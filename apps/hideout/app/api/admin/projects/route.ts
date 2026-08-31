import { NextResponse } from "next/server"
import { cmsProjects } from "@/lib/cms/projects"

export async function GET() {
  const projects = await cmsProjects.list()
  return NextResponse.json({ projects })
}

export async function POST(request: Request) {
  try {
    const created = await cmsProjects.create(await request.json())
    return NextResponse.json({ project: created }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create project.",
      },
      { status: 400 }
    )
  }
}
