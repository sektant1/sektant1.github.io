import type { TocItem } from "@/lib/content/types";
import { createHeadingSlugger } from "@/lib/mdx/headings";

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const items: TocItem[] = [];
  const stack: Array<{ level: number; item: TocItem }> = [];
  const slugHeading = createHeadingSlugger();
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed) || /^~~~/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (!match) continue;

    const level = match[1].length;
    const clean = match[2].replace(/[#*`]/g, "").trim();
    const item: TocItem = {
      label: clean,
      href: `#${slugHeading(clean)}`,
      glyph: level <= 2 ? "▸" : "·",
    };

    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.item;
    if (parent) {
      parent.children ??= [];
      parent.children.push(item);
    } else {
      items.push(item);
    }

    stack.push({ level, item });
  }

  return items;
}
