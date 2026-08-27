import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PostBrowser } from "@/components/posts/post-browser";
import { getAllSeries, getPublicPostMetas } from "@/lib/content/posts";
import { buildContentTree } from "@/lib/content/tree";
import { getPostSearchHits } from "@/lib/search/posts";

export const metadata: Metadata = { title: "Posts" };

export default async function PostsPage() {
  const [posts, series, tree] = await Promise.all([
    getPublicPostMetas(),
    getAllSeries(),
    buildContentTree("/posts"),
  ]);
  const searchHits = await getPostSearchHits(posts);

  return (
    <SiteShell
      path="content/posts"
      tree={tree}
      status={[
        { label: "posts", value: posts.length },
        { label: "series", value: series.length },
      ]}
    >
      <div className="tube-on mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        {/* useSearchParams reads the request URL, which is only known at
            request time — the boundary keeps the rest of the page static. */}
        <Suspense fallback={null}>
          <PostBrowser posts={posts} series={series} searchHits={searchHits} />
        </Suspense>
      </div>
    </SiteShell>
  );
}
