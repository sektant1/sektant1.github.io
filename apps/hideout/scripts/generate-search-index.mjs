import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const postsRoot = path.join(root, "content", "posts");
const searchRoot = path.join(root, "public", "search");
const postSearchPath = path.join(searchRoot, "posts.json");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asTags(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function asStatus(value) {
  return value === "draft" ? "draft" : "published";
}

function normalizeBody(value) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~|[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(description, body) {
  const explicit = description.trim();
  if (explicit) return explicit;
  return body.slice(0, 180);
}

async function readPost(entry, index) {
  const file = path.join(postsRoot, entry.name, "index.mdx");
  if (!(await exists(file))) return null;

  const raw = await fs.readFile(file, "utf8");
  const parsed = matter(raw);
  if (asStatus(parsed.data.status) !== "published") return null;

  const slug = asString(parsed.data.slug, entry.name);
  const title = asString(parsed.data.title, slug);
  const description = asString(parsed.data.description);
  const date = asString(parsed.data.date);
  const tags = asTags(parsed.data.tags);
  const body = normalizeBody(parsed.content);
  const snippet = excerpt(description, body);

  return {
    id: `${slug}-${index}`,
    href: `/posts/${slug}`,
    title,
    date,
    tags,
    snippet,
    text: [title, description, date, ...tags, body].filter(Boolean).join(" "),
  };
}

await fs.mkdir(searchRoot, { recursive: true });

const entries = (await fs.readdir(postsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

const posts = [];
for (const [index, entry] of entries.entries()) {
  const post = await readPost(entry, index);
  if (post) posts.push(post);
}

posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

await fs.writeFile(`${postSearchPath}.tmp`, `${JSON.stringify(posts, null, 2)}\n`);
await fs.rename(`${postSearchPath}.tmp`, postSearchPath);
console.log(`Generated ${path.relative(root, postSearchPath)} (${posts.length} posts)`);
