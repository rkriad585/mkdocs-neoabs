"""NeoAbs social-card image generator (1200x630).

Clean, professional share cards in the theme's palette: a soft near-black
canvas, a white wrapped headline, a muted one-line description, the site's own
logo (resolved from `theme.logo` / `extra.neoabs_logo_*` when it points at a
local file) and a thin accent rule at the bottom.

PNG output when Pillow is installed, otherwise a standalone SVG; the logo is
embedded in both cases (drawn directly for PNG, as a data URI for SVG).
"""

from __future__ import annotations

import base64
import os
import re
import struct

CARD_WIDTH = 1200
CARD_HEIGHT = 630
ACCENT = "#ff3030"
CANVAS = "#111114"
TEXT = "#ffffff"
MUTED = "#a6a7b3"

PAD_X = 80
BRAND_Y = 44
LOGO_H = 40
MAX_LOGO_WIDTH = 200
REGION_TOP = 150
REGION_BOTTOM = 570
HEADLINE_SIZE = 52
LINE_H = 66
DESC_SIZE = 24

_FONT_CANDIDATES_BOLD = (
    "DejaVuSans-Bold.ttf",
    "DejaVuSans.ttf",
    "arial-bold.ttf",
    "Arial Bold.ttf",
    "seguisb.ttf",
)
_FONT_CANDIDATES_REGULAR = (
    "DejaVuSans.ttf",
    "arial.ttf",
    "Arial.ttf",
    "segoeui.ttf",
)
_SEARCH_DIRS = (
    os.environ.get("SYSTEMROOT", "C:\\Windows") + "\\Fonts",
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts",
    "/System/Library/Fonts",
    "/Library/Fonts",
)


def available_format() -> str:
    """Return ``"png"`` when Pillow is importable, else ``"svg"``."""
    try:
        from PIL import Image  # noqa: F401
    except (ImportError, ModuleNotFoundError):
        return "svg"
    return "png"


def render_card(title, site_name, out_stem, *, description=None, logo_path=None):
    """Render a 1200x630 share card to ``<out_stem>.<ext>`` (png|svg).

    Returns the path of the file written. PNG is used when Pillow is available;
    the SVG fallback is a standalone vector card with the same layout. Either
    format embeds the site logo when ``logo_path`` resolves to a readable file.
    """
    fmt = available_format()
    out_path = str(out_stem) + "." + fmt
    parent = os.path.dirname(os.path.abspath(out_path))
    if parent:
        os.makedirs(parent, exist_ok=True)
    if fmt == "png":
        return _render_png(title, site_name, out_path, description, logo_path)
    return _render_svg(title, site_name, out_path, description, logo_path)


# -- shared layout helpers ----------------------------------------------------


def _wrap(text, max_chars):
    """Greedy word-wrap by character budget; at least one line is returned."""
    words = str(text or "").split()
    lines = []
    current = ""
    for word in words:
        trial = word if not current else current + " " + word
        if len(trial) <= max_chars:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def _monogram(site_name):
    for character in str(site_name or ""):
        if character.isalnum():
            return character.upper()
    return "N"


def _scale_to_height(size, height):
    width, natural_h = size
    if natural_h <= 0:
        return height, height
    ratio = height / natural_h
    width = round(width * ratio)
    width = min(max(1, width), MAX_LOGO_WIDTH)
    return width, height


def _logo_size(logo_path):
    """Natural (width, height) of the logo without opening it in Pillow.

    Reads PNG dimensions from the header and SVG dimensions from the root
    element; anything else falls back to a square box.
    """
    try:
        if not logo_path or not os.path.isfile(logo_path):
            return None
        ext = os.path.splitext(logo_path)[1].lower()
        if ext == ".png":
            with open(logo_path, "rb") as handle:
                head = handle.read(24)
            if head[:8] == b"\x89PNG\r\n\x1a\n":
                width, height = struct.unpack(">II", head[16:24])
                return width, height
        elif ext == ".svg":
            with open(logo_path, encoding="utf-8") as handle:
                data = handle.read(4096)
            width = _svg_dimension(data, "width")
            height = _svg_dimension(data, "height")
            if not width or not height:
                match = re.search(
                    r'viewBox="\s*[\d.e+-]+\s+[\d.e+-]+\s+([\d.e+-]+)\s+'
                    r"([\d.e+-]+)\s*\"",
                    data,
                )
                if match:
                    width = float(match.group(1))
                    height = float(match.group(2))
            if width and height:
                return width, height
    except OSError:
        return None
    return None


def _svg_dimension(data, attribute):
    match = re.search(r"<svg[^>]*\b" + attribute + r'="([\d.]+)"', data)
    if match:
        return float(match.group(1))
    return None


def _logo_uri(logo_path):
    mimes = {
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    ext = os.path.splitext(logo_path)[1].lower()
    with open(logo_path, "rb") as handle:
        payload = base64.b64encode(handle.read()).decode("ascii")
    return f"data:{mimes.get(ext, 'image/png')};base64,{payload}"


def _escape(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


# -- SVG renderer -------------------------------------------------------------


def _render_svg(title, site_name, out_path, description, logo_path):
    headline = _wrap(title, 42)
    block_h = len(headline) * LINE_H
    first_y = REGION_TOP + ((REGION_BOTTOM - REGION_TOP) - block_h) // 2
    tspans = "\n".join(
        f'      <tspan x="{PAD_X}" dy="{LINE_H if i else 0}">{_escape(line)}</tspan>'
        for i, line in enumerate(headline)
    )
    desc = ""
    if description:
        desc = _escape((description or "").strip())[:96].rstrip()
        if len(_escape((description or "").strip())) > 96:
            desc += "\u2026"
    desc_y = min(first_y + block_h + 30, 542)

    brand = _svg_brand(site_name, logo_path)

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="{0}" height="{1}" '
        'viewBox="0 0 {0} {1}" role="img" aria-label="{2}">\n'
        '  <rect width="{0}" height="{1}" fill="{3}"/>\n'
        '  <rect x="0" y="{4}" width="{0}" height="6" fill="{5}"/>\n'
        "{6}\n"
        '  <text x="80" y="{7}" font-size="52" font-weight="700" fill="{8}" '
        'font-family="Space Grotesk, DejaVu Sans, sans-serif">\n'
        "{9}\n"
        "  </text>\n"
    ).format(
        CARD_WIDTH,
        CARD_HEIGHT,
        _escape(title or ""),
        CANVAS,
        CARD_HEIGHT - 6,
        ACCENT,
        brand,
        first_y + 46,
        TEXT,
        tspans,
    )
    if desc:
        svg += (
            f'  <text x="80" y="{desc_y}" font-size="24" fill="{MUTED}" '
            f'font-family="Space Mono, DejaVu Sans Mono, monospace">{desc}</text>\n'
        )
    svg += "</svg>\n"

    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write(svg)
    return out_path


def _svg_brand(site_name, logo_path):
    size = _logo_size(logo_path)
    name = _escape((site_name or "").strip())
    if size is None and not name:
        return ""
    parts = []
    if size is not None:
        width, height = _scale_to_height(size, LOGO_H)
        parts.append(
            f'  <image href="{_logo_uri(logo_path)}" x="{PAD_X}" y="{BRAND_Y}" '
            f'width="{width}" height="{height}"/>'
        )
        name_x = PAD_X + width + 18
    else:
        parts.append(
            f'  <rect x="{PAD_X}" y="{BRAND_Y}" width="40" height="40" rx="8" '
            'fill="#ff3030"/>'
        )
        parts.append(
            f'  <text x="{PAD_X + 20}" y="{BRAND_Y + 29}" font-size="22" '
            'font-weight="700" text-anchor="middle" fill="#ffffff" '
            'font-family="Space Grotesk, DejaVu Sans, sans-serif">'
            f"{_escape(_monogram(site_name))}</text>"
        )
        name_x = PAD_X + 58
    if name:
        parts.append(
            f'  <text x="{name_x}" y="{BRAND_Y + 29}" font-size="18" '
            'fill="#a6a7b3" letter-spacing="4" font-family="Space Mono, '
            f'DejaVu Sans Mono, monospace">{name}</text>'
        )
    return "\n".join(parts)


# -- PNG renderer -------------------------------------------------------------


def _load_font(size, bold):
    from PIL import ImageFont

    names = _FONT_CANDIDATES_BOLD if bold else _FONT_CANDIDATES_REGULAR
    candidates = []
    for name in names:
        candidates.append(name)
        for directory in _SEARCH_DIRS:
            candidates.append(os.path.join(directory, name))
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    try:
        return ImageFont.truetype("Arial", size)
    except OSError:
        try:
            return ImageFont.load_default(size)
        except TypeError:
            return ImageFont.load_default()


def _text_width(draw, text, font):
    try:
        left, _, right, _ = draw.textbbox((0, 0), text, font=font)
        return right - left
    except AttributeError:
        return draw.textlength(text, font=font)


def _wrap_px(text, font, draw, max_width):
    words = str(text or "").split()
    lines = []
    current = ""
    for word in words:
        trial = word if not current else current + " " + word
        if _text_width(draw, trial, font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def _load_logo_png(logo_path, height):
    try:
        from PIL import Image

        ext = os.path.splitext(logo_path or "")[1].lower()
        if ext == ".svg":
            from io import BytesIO

            import cairosvg  # type: ignore[import-not-found]

            payload = cairosvg.svg2png(url=logo_path, output_height=height)
            image = Image.open(BytesIO(payload)).convert("RGBA")
        else:
            image = Image.open(logo_path).convert("RGBA")
        try:
            resample = Image.Resampling.LANCZOS
        except AttributeError:
            resample = Image.LANCZOS  # type: ignore[attr-defined]
        ratio = height / image.size[1]
        width = round(image.size[0] * ratio)
        width = min(max(1, width), MAX_LOGO_WIDTH)
        if width == MAX_LOGO_WIDTH:
            ratio = width / image.size[0]
            height = round(image.size[1] * ratio)
        return image.resize((width, height), resample)
    except (OSError, ValueError, TypeError, ImportError):
        return None


def _render_png(title, site_name, out_path, description, logo_path):
    from PIL import Image, ImageDraw

    img = Image.new("RGBA", (CARD_WIDTH, CARD_HEIGHT), CANVAS + "ff")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, CARD_HEIGHT - 6, CARD_WIDTH, CARD_HEIGHT), fill=ACCENT)

    brand_font = _load_font(18, False)
    headline_font = _load_font(HEADLINE_SIZE, True)
    desc_font = _load_font(DESC_SIZE, False)

    logo = _load_logo_png(logo_path, LOGO_H)
    name = (site_name or "").strip()
    if logo is not None:
        img.paste(logo, (PAD_X, BRAND_Y), logo)
        name_x = PAD_X + logo.size[0] + 18
    else:
        draw.rounded_rectangle(
            (PAD_X, BRAND_Y, PAD_X + 40, BRAND_Y + LOGO_H),
            radius=8,
            fill=ACCENT,
        )
        name_x = PAD_X + 40 + 18
        letter = _monogram(site_name)
        letter_font = _load_font(22, True)
        letter_w = _text_width(draw, letter, letter_font)
        draw.text(
            ((PAD_X + 40) / 2 - letter_w / 2 + PAD_X / 2, BRAND_Y + 8),
            letter,
            font=letter_font,
            fill=TEXT,
        )
    if name:
        draw.text(
            (name_x, BRAND_Y + 7),
            name.upper(),
            font=brand_font,
            fill=MUTED,
        )

    lines = _wrap_px(title, headline_font, draw, CARD_WIDTH - 2 * PAD_X)
    block_h = len(lines) * LINE_H
    first_y = REGION_TOP + ((REGION_BOTTOM - REGION_TOP) - block_h) // 2
    for index, line in enumerate(lines):
        draw.text(
            (PAD_X, first_y + index * LINE_H),
            line,
            font=headline_font,
            fill=TEXT,
        )

    desc = (description or "").strip()
    if desc:
        desc_font = _fit_desc(desc, desc_font, draw)
        draw.text(
            (PAD_X, min(first_y + block_h + 30, 542)),
            desc,
            font=desc_font,
            fill=MUTED,
        )

    img.save(out_path)
    return out_path


def _fit_desc(desc, font, draw):
    """Return a font for a one-line description that fits the card width."""
    size = getattr(font, "size", 18)
    while size > 18 and _text_width(draw, desc, font) > (CARD_WIDTH - 2 * PAD_X):
        size -= 2
        font = _load_font(size, False)
    return font
