export type PostStatus = "draft" | "published";
export type ProjectOpenTarget = "project" | "website" | "repo";

export interface ContentMetaBase {
  title: string;
  slug: string;
  description: string;
  date: string;
  tags: string[];
  thumbnail?: string;
}

export interface PostSeriesMeta {
  id: string;
  title: string;
  order: number;
}

export interface PostMeta extends ContentMetaBase {
  status: PostStatus;
  readingTime?: string;
  series?: PostSeriesMeta;
}

export interface PostSeriesSummary {
  id: string;
  title: string;
  posts: PostMeta[];
  count: number;
  firstPost?: PostMeta;
  latestPost?: PostMeta;
  description?: string;
  tags: string[];
}

export interface PostSeriesContext {
  series: PostSeriesMeta;
  posts: PostMeta[];
  currentIndex: number;
  previous: PostMeta | null;
  next: PostMeta | null;
}

export interface PostDocument {
  meta: PostMeta;
  body: string;
  absolutePath: string;
  assetBasePath: string;
}

export interface ProjectMeta extends ContentMetaBase {
  stack: string[];
  href?: string;
  repo?: string;
  open?: ProjectOpenTarget;
  status?: string;
  visibility: PostStatus;
}

/** Where a game can be played. Order is the order the buttons appear in. */
export type GamePlayKind = "play" | "download" | "store" | "repo";

export interface GameMeta extends ContentMetaBase {
  /** What it was built with — Godot, Unity, raven-engine. */
  engine?: string;
  /** Windows, Linux, Web, Android. */
  platforms: string[];
  /** Playable in the browser, right now. */
  playHref?: string;
  /** A build to download, or an itch.io page.  */
  downloadHref?: string;
  storeHref?: string;
  repo?: string;
  /** Free text: "released", "prototype", "abandoned", "in progress". */
  status?: string;
  /** A jam this was made for, and how it placed. */
  jam?: string;
  visibility: PostStatus;
}

export interface GameDocument {
  meta: GameMeta;
  body: string;
  absolutePath: string;
  assetBasePath: string;
}

export interface ProjectDocument {
  meta: ProjectMeta;
  body: string;
  absolutePath: string;
  assetBasePath: string;
}

/**
 * A node in the sidebar's file tree.
 *
 * The tree is built from the real `content/` directory, so a leaf is a file
 * on disk and a directory is a directory — the sidebar is not a menu that
 * happens to look like a tree.
 */
export type ContentTreeNode =
  | { kind: "leaf"; label: string; href: string; active?: boolean }
  | {
      kind: "dir";
      label: string;
      children: ContentTreeNode[];
      defaultOpen?: boolean;
    };

export interface TocItem {
  label: string;
  href: string;
  glyph?: string;
  children?: TocItem[];
}
