"use client"

import * as React from "react"

import { crtScreenOn } from "@/lib/crt-screen"
import { tube, type Tube } from "@/lib/tube"

/**
 * The two switches on this console, as hooks.
 *
 * Both write a stored preference *and* an attribute on `<html>`, because the
 * head script reads that attribute before first paint. Getting one of those
 * two right and not the other is how a screen ends up switched off in storage
 * and on in front of the reader, so the pair lives here rather than being
 * written out again beside every key that offers it.
 */

export function useCrtScreen() {
  const on = React.useSyncExternalStore(
    crtScreenOn.subscribe,
    crtScreenOn.read,
    crtScreenOn.serverSnapshot
  )

  const toggle = React.useCallback(() => {
    const next = !crtScreenOn.read()
    document.documentElement.dataset.crt = next ? "on" : "off"
    crtScreenOn.write(next)
  }, [])

  return [on, toggle] as const
}

export function useTube() {
  const current = React.useSyncExternalStore(
    tube.subscribe,
    tube.read,
    tube.serverSnapshot
  )

  const toggle = React.useCallback(() => {
    const next: Tube = tube.read() === "amber" ? "green" : "amber"
    // Green is the default and carries no attribute, matching the setup script.
    if (next === "green") delete document.documentElement.dataset.tube
    else document.documentElement.dataset.tube = next
    tube.write(next)
  }, [])

  return [current, toggle] as const
}
