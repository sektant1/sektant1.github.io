import { Button } from "@workspace/ui/components/button"

export function App() {
  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Chakra Petch — sans</h1>
        <p className="text-sm text-muted-foreground">
          The quick brown fox jumps over the lazy dog 0123456789
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-2xl font-medium">IBM Plex Mono</h2>
        <p className="font-mono text-sm text-muted-foreground">
          const shadow = 0; // radius: 0rem
        </p>
      </div>
      <Button className="w-fit">Button</Button>
    </div>
  )
}
