import type { Metadata } from "next";
import { GameGrid } from "@/components/games/game-grid";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteShell } from "@/components/layout/site-shell";
import { getAllGames } from "@/lib/content/games";
import { buildContentTree } from "@/lib/content/tree";

export const metadata: Metadata = {
  title: "Games",
  description: "Games I have made, and where to play them.",
};

export default async function GamesPage() {
  const [games, tree] = await Promise.all([
    getAllGames(),
    buildContentTree("/games"),
  ]);

  const playable = games.filter((game) => game.meta.playHref).length;

  return (
    <SiteShell
      path="content/games"
      tree={tree}
      status={[
        { label: "games", value: games.length },
        ...(playable ? [{ label: "playable", value: playable }] : []),
      ]}
    >
      <div className="tube-on mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <SectionHeading path="content/games" title="games">
          <p className="max-w-prose text-xs text-terminal-ink-dim">
            Things I built to be played. Where there is a browser build, the
            first button starts it.
          </p>
        </SectionHeading>

        <GameGrid games={games} />
      </div>
    </SiteShell>
  );
}
