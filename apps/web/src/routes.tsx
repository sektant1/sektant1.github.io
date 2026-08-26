import type { RouteObject } from "react-router"

import { AppShell } from "@/layout/app-shell"
import { Codex } from "@/pages/codex"
import { Courses } from "@/pages/courses"
import { Lesson } from "@/pages/lesson"
import { Stub } from "@/pages/stub"
import { Topic } from "@/pages/topic"

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Codex /> },
      { path: "/topic/:slug", element: <Topic /> },
      { path: "/courses", element: <Courses /> },
      { path: "/courses/:slug", element: <Lesson /> },
      { path: "/tasks", element: <Stub name="Tasks" /> },
      { path: "/notes", element: <Stub name="Notes" /> },
      { path: "/snippets", element: <Stub name="Snippets" /> },
      { path: "/practice", element: <Stub name="Practice" /> },
      { path: "/submit", element: <Stub name="Submit" /> },
      { path: "/components", element: <Stub name="Components" /> },
    ],
  },
]
