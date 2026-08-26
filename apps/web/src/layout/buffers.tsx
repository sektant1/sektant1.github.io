/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { useLocation } from "react-router"

const MAX_BUFFERS = 6

type BuffersValue = {
  open: string[]
  close: (path: string) => void
}

const BuffersContext = React.createContext<BuffersValue | null>(null)

export function useBuffers() {
  const context = React.useContext(BuffersContext)
  if (!context)
    throw new Error("useBuffers must be used within BuffersProvider")
  return context
}

/**
 * Open buffers, in visit order. Session-only on purpose: a tab strip that
 * survived a reload would be claiming to restore work it never held.
 */
export function BuffersProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const [open, setOpen] = React.useState<string[]>([pathname])

  // Tracked during render rather than from an effect, so the tab for the
  // route being rendered exists in the same paint.
  const [seen, setSeen] = React.useState(pathname)
  if (seen !== pathname) {
    setSeen(pathname)
    setOpen((current) =>
      current.includes(pathname)
        ? current
        : [...current, pathname].slice(-MAX_BUFFERS)
    )
  }

  const close = React.useCallback((path: string) => {
    setOpen((current) => current.filter((item) => item !== path))
  }, [])

  const value = React.useMemo(() => ({ open, close }), [open, close])

  return (
    <BuffersContext.Provider value={value}>{children}</BuffersContext.Provider>
  )
}
