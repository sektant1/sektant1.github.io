import type { RouteObject } from "react-router"

import { AppShell } from "@/layout/app-shell"
import { Codex } from "@/pages/codex"
import { Courses } from "@/pages/courses"
import { Lesson } from "@/pages/lesson"
import { Notes } from "@/pages/notes"
import { Snippets } from "@/pages/snippets"
import { Practice } from "@/pages/practice"
import { Stub } from "@/pages/stub"
import { Submit } from "@/pages/submit"
import { Tasks } from "@/pages/tasks"
import { Topic } from "@/pages/topic"

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Codex /> },
      { path: "/topic/:slug", element: <Topic /> },
      { path: "/courses", element: <Courses /> },
      { path: "/courses/:slug", element: <Lesson /> },
      { path: "/tasks", element: <Tasks /> },
      { path: "/notes", element: <Notes /> },
      { path: "/snippets", element: <Snippets /> },
      { path: "/practice", element: <Practice /> },
      { path: "/submit", element: <Submit /> },
      { path: "/components", element: <Stub name="Components" /> },
    ],
  },
]
