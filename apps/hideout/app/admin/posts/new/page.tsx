import { PostForm } from "@/components/admin/post-form"
import { getAllSeries } from "@/lib/content/posts"

export default async function NewPostPage() {
  const series = await getAllSeries({ includeDrafts: true })

  return (
    <PostForm
      mode="create"
      series={series}
      today={new Date().toISOString().slice(0, 10)}
    />
  )
}
