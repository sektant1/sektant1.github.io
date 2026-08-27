import type { Metadata } from "next";
import { AsciiBanner } from "@workspace/ui/components/ascii-banner";
import { LinkButton } from "@workspace/ui/components/button";
import { SiteShell } from "@/components/layout/site-shell";
import { buildContentTree } from "@/lib/content/tree";

export const metadata: Metadata = {
  title: "404",
  description: "No file at this path.",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const tree = await buildContentTree();

  return (
    <SiteShell path="404" tree={tree} status={[{ label: "signal", value: "lost" }]}>
      <div className="tube-on mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 md:px-6">
        <div aria-hidden="true">
          <AsciiBanner text="404" size="lg" effect="glitch" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-xl text-foreground">
            No file at this path
          </h1>
          {/* The error says what happened and what to do about it. It does not
              apologise, and it does not stay vague about which of the two
              likely causes it was. */}
          <p className="max-w-prose text-xs leading-relaxed text-terminal-ink-dim">
            The page was moved, or the address has a typo in it. The sidebar
            lists everything that is here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <LinkButton href="/" size="sm">
            Go to the index
          </LinkButton>
          <LinkButton href="/posts" variant="outline" size="sm">
            Browse posts
          </LinkButton>
          <LinkButton href="/projects" variant="outline" size="sm">
            Browse projects
          </LinkButton>
        </div>
      </div>
    </SiteShell>
  );
}
