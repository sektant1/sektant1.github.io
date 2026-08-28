import { NextResponse } from "next/server"
import { serialize } from "next-mdx-remote/serialize"
import { remarkCodeMeta } from "@/lib/mdx/remark-code-meta"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const source = typeof body.source === "string" ? body.source : ""
    const mdx = await serialize(source, {
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: [remarkCodeMeta] },
    })
    return NextResponse.json({ mdx })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to compile MDX.",
      },
      { status: 400 }
    )
  }
}
