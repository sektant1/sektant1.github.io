import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles.css"
import { App } from "./App.tsx"

// A phosphor tube has one mode. The class is fixed rather than toggled, so
// there is no theme to store and no flash to script around.
document.documentElement.classList.add("dark")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
