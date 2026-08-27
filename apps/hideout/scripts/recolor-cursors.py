#!/usr/bin/env python3
"""Recolor .cur set to phosphor green, emit PNGs + hotspots."""
import struct, json, os
from pathlib import Path
from PIL import Image

SRC = Path("public/cursor/green-4")
OUT = Path("public/cursor/phosphor")
TINT = (0x62, 0xFF, 0x9A)  # --magenta #62ff9a
GAMMA = 0.45  # lift midtones so cursor reads brighter

OUT.mkdir(parents=True, exist_ok=True)
hotspots = {}

for cur in sorted(SRC.glob("*.cur")):
    with open(cur, "rb") as f:
        data = f.read()
    # ICONDIR: 6 bytes; first entry at offset 6
    # Entry bytes: w,h,colors,reserved,hsx(2),hsy(2),size(4),offset(4)
    hsx = struct.unpack_from("<H", data, 10)[0]
    hsy = struct.unpack_from("<H", data, 12)[0]

    img = Image.open(cur).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # luminance, gamma-lifted so dark outlines still read green
            L = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            L = L ** GAMMA
            px[x, y] = (
                min(255, int(TINT[0] * L)),
                min(255, int(TINT[1] * L)),
                min(255, int(TINT[2] * L)),
                a,
            )
    name = cur.stem.lower().replace(" ", "-") + ".png"
    img.save(OUT / name)
    hotspots[name] = [hsx, hsy]
    print(f"{name}: {w}x{h} hotspot=({hsx},{hsy})")

(OUT / "hotspots.json").write_text(json.dumps(hotspots, indent=2))
print(f"\nWrote {len(hotspots)} cursors → {OUT}")
