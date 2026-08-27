#!/usr/bin/env python3
"""Generate raster favicons + apple-icon + og image from phosphor theme."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BG = (4, 20, 10, 255)        # #04140a
FG = (44, 255, 122, 255)     # #2cff7a
FG2 = (98, 255, 154, 255)    # #62ff9a
APP = Path("app")
PUB = Path("public")


def find_mono_font(size: int):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def rounded_panel(size: int, radius: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    inset = max(2, size // 14)
    d.rounded_rectangle(
        [inset, inset, size - 1 - inset, size - 1 - inset],
        radius=max(2, radius - inset),
        outline=FG, width=max(1, size // 64),
    )
    return img


def draw_glyph(img: Image.Image, letter="S"):
    size = img.size[0]
    d = ImageDraw.Draw(img)
    font = find_mono_font(int(size * 0.55))
    bbox = d.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.02
    d.text((x, y), letter, font=font, fill=FG)
    # blink cursor block
    cw, ch = max(2, size // 12), max(2, size // 18)
    d.rectangle([x + tw + cw * 0.4, y + th - ch, x + tw + cw * 1.4, y + th], fill=FG2)


def make_icon(size: int, path: Path):
    img = rounded_panel(size, radius=max(3, size // 6))
    draw_glyph(img, "S")
    img.save(path)
    print(f"wrote {path} ({size}x{size})")


def make_og(path: Path):
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), BG)
    d = ImageDraw.Draw(img)
    pad = 40
    d.rounded_rectangle([pad, pad, w - pad, h - pad], radius=18, outline=FG, width=2)
    title_font = find_mono_font(96)
    sub_font = find_mono_font(36)
    d.text((90, 180), "SEKTANT'S HIDEOUT", font=title_font, fill=FG)
    d.text((92, 300), "// field reports · anomaly notes · transmissions", font=sub_font, fill=FG2)
    d.text((92, 480), "▮ exclusion zone terminal", font=sub_font, fill=FG)
    img.save(path)
    print(f"wrote {path} (1200x630)")


if __name__ == "__main__":
    make_icon(180, APP / "apple-icon.png")
    make_icon(32, PUB / "favicon.png")
    make_og(APP / "opengraph-image.png")
