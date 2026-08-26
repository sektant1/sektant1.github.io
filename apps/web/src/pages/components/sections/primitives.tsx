import { IconArrowRight, IconBell, IconTrash } from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button, LinkButton } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { Toggle } from "@workspace/ui/components/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { Row, type SectionMap } from "@/pages/components/section"

const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const

export const primitives: SectionMap = {
  button: () => (
    <>
      <Row label="variant">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </Row>
      <Row label="size">
        {BUTTON_SIZES.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </Row>
      <Row label="icon">
        <Button size="icon-xs" aria-label="xs">
          <IconBell />
        </Button>
        <Button size="icon-sm" aria-label="sm">
          <IconBell />
        </Button>
        <Button size="icon" aria-label="default">
          <IconBell />
        </Button>
        <Button size="icon-lg" aria-label="lg">
          <IconBell />
        </Button>
      </Row>
      <Row label="state">
        <Button isDisabled>disabled</Button>
        <Button>
          <Spinner />
          loading
        </Button>
        <LinkButton href="/components" variant="outline">
          link button
          <IconArrowRight />
        </LinkButton>
      </Row>
    </>
  ),

  "button-group": () => (
    <Row label="grouped">
      <ButtonGroup>
        <Button variant="outline">left</Button>
        <Button variant="outline">middle</Button>
        <Button variant="outline">right</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button>save</Button>
        <Button size="icon" aria-label="More">
          <IconTrash />
        </Button>
      </ButtonGroup>
    </Row>
  ),

  badge: () => (
    <Row label="variant">
      <Badge>default</Badge>
      <Badge variant="secondary">secondary</Badge>
      <Badge variant="outline">outline</Badge>
      <Badge variant="destructive">destructive</Badge>
    </Row>
  ),

  avatar: () => (
    <>
      <Row label="single">
        <Avatar>
          <AvatarFallback>SK</AvatarFallback>
        </Avatar>
        <Avatar className="size-10">
          <AvatarFallback>GF</AvatarFallback>
        </Avatar>
      </Row>
      <Row label="group">
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>B</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      </Row>
    </>
  ),

  label: () => (
    <Row label="default">
      <Label>A field label</Label>
    </Row>
  ),

  separator: () => (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Row label="horizontal">
        <div className="w-full">
          <Separator />
        </div>
      </Row>
      <Row label="vertical">
        <div className="flex h-8 items-center gap-3">
          <span className="text-xs">one</span>
          <Separator orientation="vertical" />
          <span className="text-xs">two</span>
        </div>
      </Row>
    </div>
  ),

  skeleton: () => (
    <Row label="shapes">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-20 w-32" />
    </Row>
  ),

  spinner: () => (
    <Row label="sizes">
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8 text-primary" />
    </Row>
  ),

  kbd: () => (
    <Row label="keys">
      <Kbd>k</Kbd>
      <KbdGroup>
        <Kbd>ctrl</Kbd>
        <Kbd>shift</Kbd>
        <Kbd>p</Kbd>
      </KbdGroup>
    </Row>
  ),

  toggle: () => (
    <Row label="default">
      <Toggle>off by default</Toggle>
      <Toggle defaultSelected>on by default</Toggle>
      <Toggle isDisabled>disabled</Toggle>
    </Row>
  ),

  "toggle-group": () => (
    <>
      <Row label="single">
        <ToggleGroup
          aria-label="Single selection"
          selectionMode="single"
          defaultSelectedKeys={["b"]}
        >
          <ToggleGroupItem id="a">a</ToggleGroupItem>
          <ToggleGroupItem id="b">b</ToggleGroupItem>
          <ToggleGroupItem id="c">c</ToggleGroupItem>
        </ToggleGroup>
      </Row>
      <Row label="multiple">
        <ToggleGroup
          aria-label="Multiple selection"
          selectionMode="multiple"
          defaultSelectedKeys={["a", "c"]}
        >
          <ToggleGroupItem id="a">a</ToggleGroupItem>
          <ToggleGroupItem id="b">b</ToggleGroupItem>
          <ToggleGroupItem id="c">c</ToggleGroupItem>
        </ToggleGroup>
      </Row>
    </>
  ),
}
