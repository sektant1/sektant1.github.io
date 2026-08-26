import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

import { useTheme } from "@/components/theme-provider"

const ORDER = ["light", "dark", "system"] as const

const LABEL = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
} as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]

  return (
    <TooltipTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${LABEL[theme]}. Switch to ${LABEL[next].toLowerCase()}`}
        onPress={() => setTheme(next)}
      >
        {theme === "light" ? (
          <IconSun />
        ) : theme === "dark" ? (
          <IconMoon />
        ) : (
          <IconDeviceDesktop />
        )}
      </Button>
      <Tooltip>{LABEL[theme]} — press d to toggle</Tooltip>
    </TooltipTrigger>
  )
}
