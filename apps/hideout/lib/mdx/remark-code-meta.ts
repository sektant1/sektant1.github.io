import { visit } from "unist-util-visit";
import type { Root, Code } from "mdast";
import type { Plugin } from "unified";

const ATTR_RE = /([a-zA-Z_][\w-]*)\s*=\s*"([^"]*)"|([a-zA-Z_][\w-]*)\s*=\s*'([^']*)'|([a-zA-Z_][\w-]*)\s*=\s*([^\s]+)/g;

function parseMeta(meta: string): Record<string, string> {
  const out: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(meta)) !== null) {
    const key = match[1] || match[3] || match[5];
    const val = match[2] ?? match[4] ?? match[6];
    if (key) out[key.toLowerCase()] = val;
  }
  return out;
}

export const remarkCodeMeta: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node: Code) => {
    if (!node.meta) return;
    const parsed = parseMeta(node.meta);
    const filename = parsed.filename ?? parsed.title ?? parsed.file;
    if (!filename) return;
    const data = (node.data = node.data || {});
    const props = (data.hProperties = data.hProperties || {});
    (props as Record<string, unknown>)["data-filename"] = filename;
  });
};
