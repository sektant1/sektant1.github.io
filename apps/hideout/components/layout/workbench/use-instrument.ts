"use client"

import * as React from "react"

import {
  INSTRUMENT_BUSY,
  instrument,
  type InstrumentOwner,
} from "@/lib/workbench-state"

/**
 * Ask for the instrument, and find out whether you got it.
 *
 * A surface claims for as long as it is mounted and shown; the claim with the
 * highest standing draws the scene and every other one draws the plate. The
 * lifetime is the claim, so nothing has to remember to hand it back — closing
 * the dock, collapsing the panel or moving the pointer off a preview releases
 * it by unmounting.
 *
 * Returns null when this surface has it, or the line to print when it does
 * not: "running in the dock", "running in the preview".
 */
export function useInstrument(owner: InstrumentOwner, active = true) {
  const holder = React.useSyncExternalStore(
    instrument.subscribe,
    instrument.read,
    instrument.serverSnapshot
  )

  React.useEffect(() => {
    if (!active) return
    instrument.claim(owner)
    return () => instrument.release(owner)
  }, [owner, active])

  if (!active) return INSTRUMENT_BUSY[owner]
  return holder && holder !== owner ? INSTRUMENT_BUSY[holder] : null
}
