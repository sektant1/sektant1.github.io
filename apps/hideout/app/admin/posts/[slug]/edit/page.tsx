import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getAllSeries, getPostBySlug } from "@/lib/content/posts";

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params;
  const [post, series] = await Promise.all([
    getPostBySlug(slug, { includeDrafts: true }),
    getAllSeries({ includeDrafts: true }),
  ]);
  if (!post) notFound();

  return (
    <PostForm
      mode="edit"
      post={{ ...post.meta, body: post.body }}
      series={series}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
