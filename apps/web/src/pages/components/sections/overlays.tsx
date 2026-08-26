import { IconDots, IconInfoCircle } from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  HoverCard,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

import { Row, type SectionMap } from "@/pages/components/section"

export const overlays: SectionMap = {
  dialog: () => (
    <Row label="trigger">
      <DialogTrigger>
        <Button variant="outline">Open dialog</Button>
        <Dialog>
          <DialogHeader>
            <DialogTitle>A dialog</DialogTitle>
            <DialogDescription>
              Modal, focus-trapped, dismissed with Escape.
            </DialogDescription>
          </DialogHeader>
        </Dialog>
      </DialogTrigger>
    </Row>
  ),

  "alert-dialog": () => (
    <Row label="trigger">
      <AlertDialogTrigger>
        <Button variant="destructive">Delete something</Button>
        <AlertDialog>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This one cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
      </AlertDialogTrigger>
    </Row>
  ),

  drawer: () => (
    <Row label="trigger">
      {/* Drawer is base-ui, so the root wraps trigger and content —
          the inverse of react-aria's Dialog above. */}
      <Drawer>
        <DrawerTrigger
          render={<Button variant="outline">Open drawer</Button>}
        />
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>A drawer</DrawerTitle>
            <DrawerDescription>Slides up from the edge.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </Row>
  ),

  sheet: () => (
    <Row label="trigger">
      <SheetTrigger>
        <Button variant="outline">Open sheet</Button>
        <Sheet>
          <SheetHeader>
            <SheetTitle>A sheet</SheetTitle>
            <SheetDescription>Anchored to the inline end.</SheetDescription>
          </SheetHeader>
        </Sheet>
      </SheetTrigger>
    </Row>
  ),

  popover: () => (
    <Row label="trigger">
      <PopoverTrigger>
        <Button variant="outline">
          <IconInfoCircle />
          Open popover
        </Button>
        <Popover className="w-64">
          <PopoverHeader>
            <PopoverTitle>A popover</PopoverTitle>
            <PopoverDescription>
              Positioned against its trigger.
            </PopoverDescription>
          </PopoverHeader>
        </Popover>
      </PopoverTrigger>
    </Row>
  ),

  tooltip: () => (
    <Row label="hover">
      <TooltipTrigger>
        <Button variant="outline">Hover me</Button>
        <Tooltip>The tooltip content</Tooltip>
      </TooltipTrigger>
    </Row>
  ),

  "hover-card": () => (
    <Row label="hover">
      <HoverCardTrigger>
        <Button variant="link">Hover for a card</Button>
        <HoverCard className="max-w-xs">
          <span className="text-xs">
            Richer than a tooltip, and it can hold interactive content.
          </span>
        </HoverCard>
      </HoverCardTrigger>
    </Row>
  ),

  "dropdown-menu": () => (
    <Row label="trigger">
      <DropdownMenuTrigger>
        <Button variant="outline" size="icon" aria-label="Open menu">
          <IconDots />
        </Button>
        <DropdownMenu>
          <DropdownMenuItem>First action</DropdownMenuItem>
          <DropdownMenuItem>Second action</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Something else</DropdownMenuItem>
        </DropdownMenu>
      </DropdownMenuTrigger>
    </Row>
  ),

  "context-menu": () => (
    <Row label="right-click">
      <ContextMenuTrigger>
        <div className="flex h-16 w-56 items-center justify-center border border-dashed border-border text-xs text-foreground/60">
          Right-click here
        </div>
        <ContextMenu>
          <ContextMenuItem>Cut</ContextMenuItem>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Delete</ContextMenuItem>
        </ContextMenu>
      </ContextMenuTrigger>
    </Row>
  ),

  command: () => (
    <div className="w-full max-w-sm border border-border">
      <Command aria-label="Example command palette">
        <CommandInput placeholder="Type to filter…" />
        <CommandList aria-label="Example results">
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup>
            <CommandItem textValue="rendering">Rendering</CommandItem>
            <CommandItem textValue="physics">Physics</CommandItem>
            <CommandItem textValue="netcode">Netcode</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
}
