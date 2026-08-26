import type { RouteObject } from "react-router"

import { AppShell } from "@/layout/app-shell"

function Stub({ name }: { name: string }) {
  return <h1 className="font-mono text-sm">{name}</h1>
}

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Stub name="Codex" /> },
      { path: "/topic/:slug", element: <Stub name="Topic" /> },
      { path: "/courses", element: <Stub name="Courses" /> },
      { path: "/courses/:slug", element: <Stub name="Lesson" /> },
      { path: "/tasks", element: <Stub name="Tasks" /> },
      { path: "/notes", element: <Stub name="Notes" /> },
      { path: "/snippets", element: <Stub name="Snippets" /> },
      { path: "/practice", element: <Stub name="Practice" /> },
      { path: "/submit", element: <Stub name="Submit" /> },
      { path: "/components", element: <Stub name="Components" /> },
    ],
  },
]
