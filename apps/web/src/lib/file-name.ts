/**
 * Names a route the way an editor names a buffer. The extension carries the
 * kind of thing the route holds, which is the only reason an extension is
 * worth showing at all.
 */
export function toFileName(pathname: string) {
  if (pathname === "/") return "codex.md"

  const [, group, slug] = pathname.split("/")
  const leaf = slug || group

  const extension =
    group === "tasks"
      ? "todo"
      : group === "snippets"
        ? "code"
        : group === "submit"
          ? "form"
          : group === "components"
            ? "tsx"
            : slug && group === "courses"
              ? "lesson"
              : "md"

  return `${leaf}.${extension}`
}
