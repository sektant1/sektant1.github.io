"use client"

import * as React from "react"
import {
  DisclosurePanel as AccordionContentPrimitive,
  Heading as AccordionHeaderPrimitive,
  Disclosure as AccordionItemPrimitive,
  DisclosureGroup as AccordionPrimitive,
  Button as AccordionTriggerPrimitive,
  type ButtonProps,
  type DisclosureGroupProps,
  type DisclosurePanelProps,
  type DisclosureProps,
} from "react-aria-components"

import { cn } from "@workspace/ui/lib/utils"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

function Accordion({ className, ...props }: DisclosureGroupProps) {
  return (
    <AccordionPrimitive
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: DisclosureProps) {
  return (
    <AccordionItemPrimitive
      data-slot="accordion-item"
      /* The group is what the panel reads its open state from. react-aria puts
         data-expanded on the Disclosure, not on the panel. */
      className={cn("group/accordion-item not-last:border-b", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: Omit<ButtonProps, "children"> & { children: React.ReactNode }) {
  return (
    <AccordionHeaderPrimitive className="flex">
      <AccordionTriggerPrimitive
        slot="trigger"
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-none border border-transparent py-2.5 text-start text-xs font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ms-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        <IconChevronDown
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <IconChevronUp
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionTriggerPrimitive>
    </AccordionHeaderPrimitive>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: DisclosurePanelProps) {
  return (
    /* Opens and closes on grid-template-rows, 0fr to 1fr.
     *
     * What was here before could not have worked in either half. The height
     * came from h-(--disclosure-panel-height), a variable react-aria does not
     * set — an unresolvable var makes the declaration invalid at computed-value
     * time, so the panel fell back to height:auto and the transition-[height]
     * beside it had two auto endpoints to interpolate between. The animation
     * came from data-open/data-closed, which are not attributes react-aria sets
     * either (the panel gets `hidden`, the Disclosure gets `data-expanded`), and
     * pointed at accordion-down/up keyframes that read --radix-* variables. Four
     * things that all had to be true, and none of them was.
     *
     * A grid track needs no measurement, animates in every current engine, and
     * react-aria explicitly waits on getAnimations() before it sets `hidden`,
     * so the close plays out rather than being cut off. */
    <AccordionContentPrimitive
      data-slot="accordion-content"
      className="grid grid-rows-[0fr] overflow-clip text-xs opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out group-data-expanded/accordion-item:grid-rows-[1fr] group-data-expanded/accordion-item:opacity-100 motion-reduce:transition-none"
      {...props}
    >
      {/* min-h-0 is what lets the 0fr track actually collapse: a grid item's
          default min-height:auto floors it at its content height. */}
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
            className
          )}
        >
          {children}
        </div>
      </div>
    </AccordionContentPrimitive>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
