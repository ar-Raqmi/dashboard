"""Builds the installed-app icons from the original artwork in public/logo.png:  python3 scripts/build-icons.py

macOS and Android draw an icon on whatever is behind it, so the icons carry their own white tile:
  icon-192.png / icon-512.png  macOS-style: a white rounded tile with a margin around it, glyph large inside
  icon-maskable-512.png        full-bleed white with the glyph inside the safe zone, for launcher masks
  apple-touch-icon.png         full-bleed white; iOS rounds the corners itself
Needs Pillow.
"""
from pathlib import Path
from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parent.parent / 'public'
SUPERSAMPLE = 4
TILE_RATIO = 824 / 1024          # Apple's icon grid: the tile fills 80% of the canvas
CORNER_RADIUS = 0.2237           # share of the tile, as on Apple's icon grid
GLYPH_ON_TILE = 0.70             # glyph width as a share of the tile
GLYPH_ON_FULL_BLEED = 0.62       # smaller, so a circular launcher mask never clips it


def glyph() -> Image.Image:
    source = Image.open(PUBLIC / 'logo.png').convert('RGBA')
    return source.crop(source.getchannel('A').getbbox())


def tile_mask(size: int) -> Image.Image:
    big = size * SUPERSAMPLE
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=big * CORNER_RADIUS, fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def with_glyph(canvas: Image.Image, box: tuple[int, int, int, int], share: float) -> None:
    art = glyph()
    width = round((box[2] - box[0]) * share)
    height = round(width * art.height / art.width)
    art = art.resize((width, height), Image.LANCZOS)
    canvas.alpha_composite(art, (box[0] + (box[2] - box[0] - width) // 2, box[1] + (box[3] - box[1] - height) // 2))


def tile_icon(size: int) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    tile = round(size * TILE_RATIO)
    left = (size - tile) // 2
    white = Image.new('RGBA', (tile, tile), (255, 255, 255, 255))
    canvas.paste(white, (left, left), tile_mask(tile))
    with_glyph(canvas, (left, left, left + tile, left + tile), GLYPH_ON_TILE)
    return canvas


def full_bleed_icon(size: int) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    with_glyph(canvas, (0, 0, size, size), GLYPH_ON_FULL_BLEED)
    return canvas


for name, image in {
    'icon-192.png': tile_icon(192),
    'icon-512.png': tile_icon(512),
    'icon-maskable-512.png': full_bleed_icon(512),
    'apple-touch-icon.png': full_bleed_icon(180),
}.items():
    image.save(PUBLIC / name, optimize=True)
    print('wrote public/' + name)
