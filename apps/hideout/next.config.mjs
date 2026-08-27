/** @type {import('next').NextConfig} */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  // Two shapes, one codebase. GitHub Pages gets a static export with the CMS
  // stripped out; the self-hosted server gets a standalone bundle that carries
  // its own node_modules, so the image does not have to ship a monorepo.
  ...(isPagesBuild ? { output: "export" } : { output: "standalone" }),
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  // The toolkit ships TypeScript source, not a build. Next compiles it with
  // the app, which is what makes an edit in packages/ui show up here without
  // a publish step.
  transpilePackages: ["@workspace/ui"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
    // GLSL lives in real .vert/.frag files. raw-loader hands them to the
    // bundler as strings; both bundlers need telling separately, and they
    // have to agree or dev and build disagree about what a shader import is.
    rules: {
      "*.vert": { loaders: ["raw-loader"], as: "*.js" },
      "*.frag": { loaders: ["raw-loader"], as: "*.js" },
    },
  },

  webpack(config) {
    // asset/source is webpack's built-in equivalent, so the production build
    // needs no loader dependency of its own.
    config.module.rules.push({
      test: /\.(vert|frag|glsl)$/,
      type: "asset/source",
    });
    return config;
  },
  trailingSlash: isPagesBuild,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
