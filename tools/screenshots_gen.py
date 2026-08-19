#!/usr/bin/env python3
"""
NeoAbs Screenshot Generator

Captures screenshots from a running MkDocs dev server using the system's
built-in browser (Chrome or Edge) in headless mode. Zero external dependencies
beyond Pillow for placeholder fallback.

Usage:
    python tools/screenshots_gen.py              # Generate placeholders
    python tools/screenshots_gen.py --real        # Real screenshots via system browser
    python tools/screenshots_gen.py --real --wait 3000  # Extra wait (ms) before capture

Requirements:
    pip install Pillow                # only for placeholders
    Chrome or Edge installed          # only for --real

The MkDocs dev server must be running before executing this script.
Set MKDOCS_SERVER env var to override the default server URL.
"""

import argparse
import os
import platform
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    Image = None

SERVER_URL = os.environ.get("MKDOCS_SERVER", "http://127.0.0.1:8000/mkdocs-neoabs")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "Screenshots"
WIDTH = 1440
HEIGHT = 900

PAGES = [
    ("home.png", "", "Home page"),
    ("dark-mode.png", "", "Dark mode"),
    ("getting-started.png", "getting-started/installation/", "Installation"),
    ("configuration.png", "getting-started/configuration/", "Configuration"),
    ("design-overview.png", "design/overview/", "Design overview"),
    ("colors.png", "design/colors/", "Color tokens"),
    ("typography.png", "design/typography/", "Typography"),
    ("glass.png", "design/glass/", "Glass effects"),
    ("buttons.png", "components/buttons/", "Buttons"),
    ("cards.png", "components/cards/", "Cards"),
    ("forms.png", "components/forms/", "Forms"),
    ("plugin.png", "plugins/neoabs/", "Plugin"),
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
                candidates.append(os.path.join(base, "Google", "Chrome", "Application", "chrome.exe"))
                candidates.append(os.path.join(base, "Microsoft", "Edge", "Application", "msedge.exe"))
        candidates += ["chrome.exe", "msedge.exe"]
    elif system == "Darwin":
        candidates += [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
    else:
        candidates += ["google-chrome", "google-chrome-stable", "chromium-browser", "chromium", "microsoft-edge"]
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
    except URLError:
        return False


# ---------------------------------------------------------------------------
# Placeholder generation
# ---------------------------------------------------------------------------

def create_placeholder(name, caption, width, height):
    if Image is None:
        print("Error: Pillow required. pip install Pillow")
        sys.exit(1)
    img = Image.new("RGB", (width, height), color=(10, 10, 10))
    draw = ImageDraw.Draw(img)
    try:
        fl = ImageFont.truetype("arial.ttf", 48)
        fs = ImageFont.truetype("arial.ttf", 24)
    except (OSError, IOError):
        fl = fs = ImageFont.load_default()
    draw.rectangle([1, 1, width - 2, height - 2], outline=(255, 48, 48), width=2)
    t = f"NeoAbs \u2014 {caption}"
    bb = draw.textbbox((0, 0), t, font=fl)
    draw.text(((width - bb[2] + bb[0]) // 2, height // 2 - 40), t, fill="white", font=fl)
    bb2 = draw.textbbox((0, 0), name, font=fs)
    draw.text(((width - bb2[2] + bb2[0]) // 2, height // 2 + 30), name, fill=(150, 150, 150), font=fs)
    draw.ellipse([width // 2 - 8, height // 2 + 70, width // 2 + 8, height // 2 + 86], fill=(255, 48, 48))
    return img


# ---------------------------------------------------------------------------
# Headless browser screenshot via subprocess
# ---------------------------------------------------------------------------

def capture_screenshot(browser, url, output_path, width, height, wait_ms):
    with tempfile.TemporaryDirectory(prefix="neoabs_ss_") as tmpdir:
        args = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-extensions",
            "--disable-background-networking",
            f"--window-size={width},{height}",
            f"--user-data-dir={tmpdir}",
            f"--virtual-time-budget={wait_ms}",
            f"--screenshot={output_path}",
            url,
        ]
        proc = subprocess.run(args, capture_output=True, text=True, timeout=60)
        if not os.path.isfile(output_path):
            stderr = proc.stderr[:500] if proc.stderr else "no stderr"
            raise RuntimeError(f"Browser did not produce screenshot. {stderr}")


# ---------------------------------------------------------------------------
# Run real screenshots
# ---------------------------------------------------------------------------

def run_real(args):
    browser = find_browser()
    if not browser:
        print("Error: No browser found. Install Chrome or Edge.")
        print("  Windows: Chrome or Edge in Program Files")
        print("  macOS:   Google Chrome.app or Microsoft Edge.app")
        print("  Linux:   google-chrome, chromium, or microsoft-edge")
        sys.exit(1)

    name = Path(browser).name
    print(f"Using browser: {name}")
    print(f"  Path: {browser}\n")

    if not check_server(args.url):
        print(f"Error: Dev server not found at {args.url or SERVER_URL}")
        print("Start it first: mkdocs serve")
        sys.exit(1)

    base_url = args.url or SERVER_URL
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = 0
    failed = 0

    for filename, path, caption in PAGES:
        output_path = str(OUTPUT_DIR / filename)
        url = f"{base_url}/{path}"
        try:
            print(f"  [{filename}] {url}")
            capture_screenshot(browser, url, output_path, WIDTH, HEIGHT, args.wait)
            generated += 1
            print(f"    -> Screenshots/{filename}")
        except Exception as e:
            failed += 1
            print(f"    FAILED: {e}")

    print(f"\nGenerated {generated} screenshots ({failed} failed) in {OUTPUT_DIR}/")


# ---------------------------------------------------------------------------
# Run placeholder screenshots
# ---------------------------------------------------------------------------

def run_placeholder(url=None):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if not check_server(url):
        print(f"Warning: Dev server not found at {url or SERVER_URL}")
        print("Generating placeholder screenshots.")
        print("To capture real screenshots: python tools/screenshots_gen.py --real\n")

    generated = 0
    for filename, path, caption in PAGES:
        output_path = str(OUTPUT_DIR / filename)
        img = create_placeholder(filename, caption, WIDTH, HEIGHT)
        img.save(output_path, "PNG")
        generated += 1
        print(f"  Created: Screenshots/{filename}")

    print(f"\nGenerated {generated} placeholder screenshots in {OUTPUT_DIR}/")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate screenshots for the NeoAbs theme.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tools/screenshots_gen.py                       Placeholders
  python tools/screenshots_gen.py --real                Real via system browser
  python tools/screenshots_gen.py --real --wait 5000    Extra wait (ms) before capture

Requires a running MkDocs dev server:
  mkdocs serve
        """,
    )
    parser.add_argument(
        "--real",
        action="store_true",
        help="Capture real screenshots using system browser (Chrome/Edge). No pip install needed.",
    )
    parser.add_argument(
        "--wait",
        type=int,
        default=1500,
        metavar="MS",
        help="Virtual time budget in ms before capture (default: 1500)",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help=f"Override server URL (default: {SERVER_URL})",
    )
    args = parser.parse_args()

    if args.real:
        run_real(args)
    else:
        run_placeholder(args.url)


if __name__ == "__main__":
    main()