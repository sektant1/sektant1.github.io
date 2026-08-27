import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import { remarkCodeMeta } from "./remark-code-meta";

export const mdxOptions: NonNullable<MDXRemoteProps["options"]> = {
  mdxOptions: {
    remarkPlugins: [remarkCodeMeta],
  },
};
