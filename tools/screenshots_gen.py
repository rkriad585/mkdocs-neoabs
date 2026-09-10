#!/usr/bin/env python3
"""
Void Screenshot Generator (gold edition)

Captures real, retina-quality screenshots of the project from a running MkDocs
dev server using Playwright + the system's Chrome/Edge browser, then wraps every
shot in a premium pixel frame:

  * Desktop pages  -> macOS-style window chrome (traffic lights, title bar,
                      rounded corners, soft drop shadow)
  * Mobile page    -> phone bezel with dynamic island, side buttons and caption

Features
  * Real browser rendering (JS, WebFonts, highlight.js, mermaid, search)
  * Deterministic color scheme: light-mode shot uses media emulation +
    a seeded localStorage preference (no theme changes required)
  * Live interactions: opens the search modal with a typed query and opens the
    mobile drawer navigation before capturing
  * deviceScaleFactor=2 for crisp high-density output
  * Zero placeholders — every PAGES entry renders a genuine page capture

Usage:
    python tools/screenshots_gen.py --real                      # all pages
    python tools/screenshots_gen.py --real --wait 2000          # extra settle
    python tools/screenshots_gen.py --real --url <server url>   # custom server

Requirements:
    pip install playwright pillow
    Chrome or Edge installed, and a running MkDocs dev server:
        mkdocs serve

Set MKDOCS_SERVER (env) to override the default server URL.
"""

import argparse
import os
import platform
import shutil
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:  # pragma: no cover - guarded at runtime
    Image = None

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover - guarded at runtime
    sync_playwright = None

SERVER_URL = os.environ.get("MKDOCS_SERVER", "http://127.0.0.1:8000/mkdocs-void")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "Screenshots"
WIDTH = 1440
HEIGHT = 900
SCALE = 2
PHONE_WIDTH = 390
PHONE_HEIGHT = 844

# (filename, url_path, caption, options)
# options: frame  ("mac" | "phone"), scheme   ("dark" | "light"),
#          width, height, title, open_search (bool), query (str), open_drawer (bool)
PAGES = [
    ("home.png", "", "Home Page", {}),
    ("dark-mode.png", "", "Dark Mode", {}),
    ("light-mode.png", "", "Light Mode", {"scheme": "light"}),
    ("search.png", "", "Search", {"open_search": True, "query": "installation"}),
    ("sidebar.png", "", "Sidebar Navigation", {}),
    ("code-blocks.png", "components/code-highlighting/", "Code Blocks", {}),
    (
        "mobile.png",
        "",
        "Mobile View",
        {
            "width": PHONE_WIDTH,
            "height": PHONE_HEIGHT,
            "frame": "phone",
            "open_drawer": True,
        },
    ),
    ("getting-started.png", "getting-started/installation/", "Installation", {}),
    ("configuration.png", "getting-started/configuration/", "Configuration", {}),
    ("design-overview.png", "design/overview/", "Design Overview", {}),
    ("colors.png", "design/colors/", "Color Tokens", {}),
    ("typography.png", "design/typography/", "Typography", {}),
    ("glass.png", "design/glass/", "Glass Effects", {}),
    ("buttons.png", "components/buttons/", "Buttons", {}),
    ("cards.png", "components/cards/", "Cards", {}),
    ("forms.png", "components/forms/", "Forms", {}),
    ("plugin.png", "plugins/void/", "Plugin", {}),
]


# ---------------------------------------------------------------------------
# Browser detection
# ---------------------------------------------------------------------------


def find_browser():
    system = platform.system()
    candidates = []
    if system == "Windows":
        for ev in ["PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"]:
            base = os.environ.get(ev, "")
            if base:
                candidates.append(
                    os.path.join(base, "Google", "Chrome", "Application", "chrome.exe")
                )
                candidates.append(
                    os.path.join(base, "Microsoft", "Edge", "Application", "msedge.exe")
                )
        candidates += ["chrome.exe", "msedge.exe"]
    elif system == "Darwin":
        candidates += [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
    else:
        candidates += [
            "google-chrome",
            "google-chrome-stable",
            "chromium-browser",
            "chromium",
            "microsoft-edge",
        ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    for n in candidates:
        found = shutil.which(n)
        if found:
            return found
    return None


def check_server(url=None):
    target = url or SERVER_URL
    try:
        urlopen(target, timeout=5)
        return True
    except (URLError, OSError):
        return False


# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------


def load_font(size, bold=False):
    names = (
        ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else [
            "segoeui.ttf",
            "arial.ttf",
            "DejaVuSans.ttf",
            "Helvetica.ttc",
            "Arial.ttf",
        ]
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# macOS window frame
# ---------------------------------------------------------------------------


def frame_macos(content, title, light, scale):
    margin = 20 * scale
    bar_h = 40 * scale
    radius = 16 * scale
    bar_radius = max(radius // 2, 8 * scale)
    W = content.width + margin * 2
    H = content.height + bar_h + margin * 2

    bg = (236, 238, 242, 255) if light else (22, 24, 28, 255)
    card_bg = (248, 248, 250, 255) if light else (43, 45, 50, 255)
    win_x, win_y = margin, margin
    win_w = content.width
    win_h = content.height + bar_h

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base = Image.new("RGBA", (W, H), bg)
    canvas = Image.alpha_composite(canvas, base)

    # Soft drop shadow behind the window.
    shadow = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [
            win_x + 5 * scale,
            win_y + 7 * scale,
            win_x + win_w + 5 * scale,
            win_y + win_h + 7 * scale,
        ],
        radius=radius + 5 * scale,
        fill=48,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(14 * scale))
    black = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    canvas = Image.alpha_composite(
        canvas,
        Image.composite(black, Image.new("RGBA", (W, H), (0, 0, 0, 0)), shadow),
    )

    # Window card (rounded, macOS title bar on top).
    card = Image.new("RGBA", (win_w, win_h), (0, 0, 0, 255))
    card_mask = Image.new("L", (win_w, win_h), 0)
    ImageDraw.Draw(card_mask).rounded_rectangle(
        [0, 0, win_w - 1, win_h - 1], radius=radius, fill=255
    )
    card = Image.composite(
        card, Image.new("RGBA", (win_w, win_h), (0, 0, 0, 0)), card_mask
    )
    card_draw = ImageDraw.Draw(card)
    card_draw.rectangle([0, bar_h, win_w, win_h], fill=card_bg)
    card_draw.rounded_rectangle(
        [0, 0, win_w - 1, bar_h - 1], radius=bar_radius, fill=card_bg
    )

    # Content with rounded bottom corners to match the card.
    content_mask = Image.new("L", (content.width, content.height), 0)
    ImageDraw.Draw(content_mask).rounded_rectangle(
        [0, 0, content.width - 1, content.height - 1],
        radius=radius if content.height > radius else 0,
        fill=255,
    )
    content_boxed = Image.composite(
        content,
        Image.new("RGBA", (content.width, content.height), (0, 0, 0, 255)),
        content_mask,
    )

    canvas.paste(card, (win_x, win_y), card_mask)
    canvas.paste(content_boxed, (win_x, win_y + bar_h), content_mask)

    draw = ImageDraw.Draw(canvas)

    # Traffic lights (close / minimize / maximize).
    cy = win_y + bar_h // 2
    x0 = win_x + 16 * scale
    r = 6.5 * scale
    gap = 1.4 * scale
    for i, col in enumerate(
        [(255, 95, 86, 255), (254, 188, 46, 255), (40, 201, 63, 255)]
    ):
        x = x0 + i * (r * 2 + gap)
        draw.ellipse([x - r, cy - r, x + r, cy + r], fill=col)

    # Window title, centered like macOS.
    font = load_font(round(13.5 * scale), bold=True)
    tb = draw.textbbox((0, 0), title, font=font)
    tx = (W - (tb[2] - tb[0])) / 2 - tb[0]
    ty = win_y + bar_h / 2 - (tb[3] - tb[1]) / 2 - tb[1]
    draw.text(
        (tx, ty),
        title,
        font=font,
        fill=(62, 62, 70, 255) if light else (222, 224, 230, 255),
    )

    return canvas.convert("RGB")


# ---------------------------------------------------------------------------
# Phone bezel frame
# ---------------------------------------------------------------------------


def frame_phone(content, title, scale):
    bezel = 14 * scale
    body_r = 58 * scale
    screen_r = 30 * scale
    caption_h = 46 * scale
    W = content.width + bezel * 2
    H = content.height + bezel * 2 + caption_h

    canvas = Image.new("RGB", (W, H), (246, 247, 249))
    body = Image.new("RGBA", (W, H - caption_h), (12, 14, 19, 255))
    body_mask = Image.new("L", (W, H - caption_h), 0)
    ImageDraw.Draw(body_mask).rounded_rectangle(
        [0, 0, W - 1, H - caption_h - 1], radius=body_r, fill=255
    )
    body = Image.composite(
        body, Image.new("RGBA", (W, H - caption_h), (0, 0, 0, 0)), body_mask
    )

    # Screen content clipped to the display area.
    screen_box = [bezel, bezel, W - bezel, H - caption_h - bezel]
    screen_w = screen_box[2] - screen_box[0]
    screen_h = screen_box[3] - screen_box[1]
    screen_mask = Image.new("L", (screen_w, screen_h), 0)
    ImageDraw.Draw(screen_mask).rounded_rectangle(
        [0, 0, screen_w - 1, screen_h - 1], radius=screen_r, fill=255
    )
    content_fit = content.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    screen = Image.composite(
        content_fit,
        Image.new("RGBA", (screen_w, screen_h), (0, 0, 0, 255)),
        screen_mask,
    )

    body.paste(screen, (bezel, bezel), screen_mask)

    canvas.paste(body, (0, 0), body_mask)
    draw = ImageDraw.Draw(canvas)

    # Dynamic island.
    island_w = 122 * scale
    island_h = 34 * scale
    cx = W / 2
    iy = bezel + 10 * scale
    draw.rounded_rectangle(
        [cx - island_w / 2, iy, cx + island_w / 2, iy + island_h],
        radius=island_h / 2,
        fill=(6, 8, 12, 255),
    )

    # Side buttons (left edge).
    btn_len = 44 * scale
    btn_w = 3 * scale
    by = (H - caption_h) / 2
    draw.rounded_rectangle(
        [0, by - btn_len, btn_w, by], radius=btn_w / 2, fill=(42, 46, 54, 255)
    )
    draw.rounded_rectangle(
        [0, by + btn_len // 2, btn_w, by + btn_len // 2 + btn_len],
        radius=btn_w / 2,
        fill=(42, 46, 54, 255),
    )

    # Caption.
    font = load_font(round(14 * scale), bold=True)
    tb = draw.textbbox((0, 0), title, font=font)
    tx = (W - (tb[2] - tb[0])) / 2 - tb[0]
    ty = H - caption_h + (caption_h - (tb[3] - tb[1])) / 2 - tb[1]
    draw.text((tx, ty), title, font=font, fill=(94, 98, 106, 255))

    return canvas.convert("RGB")


# ---------------------------------------------------------------------------
# Playwright capture
# ---------------------------------------------------------------------------


def capture_page(browser_exe, url, target, opts, settle_ms):
    scale = int(opts.get("scale", SCALE))
    width = int(opts.get("width", WIDTH))
    height = int(opts.get("height", HEIGHT))
    scheme = opts.get("scheme", "dark")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=browser_exe,
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--hide-scrollbars",
            ],
        )
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=scale,
        )
        page = context.new_page()

        # Deterministic scheme: seed the persisted preference before any theme
        # script runs, then mirror it through media emulation.
        stored = "default" if scheme == "light" else "slate"
        page.add_init_script(
            f"try {{ localStorage.setItem('void-color-scheme', '{stored}'); }} catch (e) {{}}"
        )
        page.emulate_media(color_scheme="light" if scheme == "light" else "dark")

        page.goto(url, wait_until="load", timeout=45000)
        time.sleep(0.6)

        if opts.get("open_search"):
            try:
                page.click(".void-header__search", timeout=5000)
            except Exception as e:
                page.evaluate(
                    "() => { const el = document.querySelector('.void-search');"
                    " if (el && el._voidOpen) el._voidOpen(); }"
                )
                if e:
                    print("      (search button missing \u2014 opened via JS)")
            time.sleep(0.5)
        if opts.get("open_drawer"):
            try:
                page.click(".void-header__hamburger", timeout=5000)
            except Exception as e:
                page.evaluate(
                    "() => { const cb = document.getElementById('void-drawer');"
                    " if (cb && cb._voidToggle) cb._voidToggle(); }"
                )
                if e:
                    print("      (hamburger missing \u2014 opened drawer via JS)")
            time.sleep(0.6)
        if opts.get("query"):
            try:
                page.fill(".void-search__input", opts["query"])
            except Exception as e:
                print(f"      (search input unavailable: {e})")
            time.sleep(0.9)

        time.sleep(max(0, settle_ms / 1000.0))
        page.screenshot(path=str(target))
        browser.close()


# ---------------------------------------------------------------------------
# Frame & save
# ---------------------------------------------------------------------------


def frame_and_save(raw_path, out_path, entry, scheme, opts):
    _, _, caption, _ = entry
    scale = int(opts.get("scale", SCALE))
    frame_style = opts.get("frame", "mac")
    title = opts.get("title") or f"Void \u2014 {caption}"
    light = scheme == "light"

    content = Image.open(raw_path).convert("RGBA")

    if frame_style == "phone":
        framed = frame_phone(content, title, scale)
    else:
        framed = frame_macos(content, title, light, scale)

    framed.save(out_path, "PNG")


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------


def run_real(args):
    if sync_playwright is None:
        print("Error: Playwright is required. Install it with: pip install playwright")
        sys.exit(1)
    if Image is None:
        print(
            "Error: Pillow is required for window/phone framing. Install: pip install pillow"
        )
        sys.exit(1)

    browser = find_browser()
    if not browser:
        print("Error: No browser found. Install Chrome or Edge.")
        sys.exit(1)
    print(f"Using browser: {Path(browser).name}")
    print(f"  Path: {browser}\n")

    if not check_server(args.url):
        print(f"Error: Dev server not found at {args.url or SERVER_URL}")
        print("Start it first: mkdocs serve")
        sys.exit(1)

    base_url = args.url or SERVER_URL
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    tmpdir = Path(__file__).resolve().parent.parent / ".screenshots_tmp"
    tmpdir.mkdir(parents=True, exist_ok=True)

    generated = 0
    failed = 0
    for entry in PAGES:
        filename, path, _caption, opts = entry
        page_opts = dict(opts)
        page_opts.setdefault("scale", args.scale or SCALE)
        url = f"{base_url}/{path}"
        print(f"  [{filename}] {url}")
        try:
            raw = tmpdir / ("raw_" + filename)
            capture_page(browser, url, raw, page_opts, args.wait)
            scheme = opts.get("scheme", "dark")
            frame_and_save(raw, OUTPUT_DIR / filename, entry, scheme, page_opts)
            raw.unlink(missing_ok=True)
            generated += 1
            print(f"    -> Screenshots/{filename}")
        except Exception as e:
            failed += 1
            print(f"    FAILED: {e}")

    tmpdir.rmdir()
    print(f"\nGenerated {generated} screenshots ({failed} failed) in {OUTPUT_DIR}/")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Real retina screenshots of the Void theme with premium "
        "macOS / phone frames.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  python tools/screenshots_gen.py --real
  python tools/screenshots_gen.py --real --wait 2500
  python tools/screenshots_gen.py --real --url http://127.0.0.1:8001/mkdocs-void

Requirements: pip install playwright pillow
Requires a running MkDocs dev server:  mkdocs serve
""",
    )
    parser.add_argument(
        "--real",
        action="store_true",
        help="Capture real screenshots via Playwright + Chrome/Edge.",
    )
    parser.add_argument(
        "--wait",
        type=int,
        default=1500,
        metavar="MS",
        help="Extra settle time (ms) before capture (default: 1500).",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help=f"Override server URL (default: {SERVER_URL})",
    )
    parser.add_argument(
        "--scale",
        type=int,
        default=SCALE,
        help=f"Device scale factor / image density (default: {SCALE}).",
    )
    args = parser.parse_args()

    if not args.real:
        parser.print_help()
        print(
            "\nUse --real to capture actual screenshots (no placeholders are generated)."
        )
        sys.exit(1)

    run_real(args)


if __name__ == "__main__":
    main()
