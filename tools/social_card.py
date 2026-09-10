"""CLI for Void social-card generation.

Usage:
    python tools/social_card.py --title "Page title" --site "My Docs" --out .cache/card

Renders ``<out>.png`` when Pillow is installed, else ``<out>.svg``, using the
same code the plugin's build hooks run. Useful for a quick preview or for a
sit-wide fallback card without running a full build.
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from void.social_card import render_card


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Generate a Void social-card image.")
    parser.add_argument("--title", default="", help="Headline text drawn on the card.")
    parser.add_argument(
        "--site",
        default="",
        help="Site name shown beside the logo at the top of the card.",
    )
    parser.add_argument(
        "--description",
        default="",
        help="Optional muted description line under the headline.",
    )
    parser.add_argument(
        "--logo",
        default="",
        help="Path to a local logo image to embed in the top-left corner.",
    )
    parser.add_argument(
        "--out",
        default=".cache/cards/card",
        help="Output path stem; '.png' or '.svg' is appended.",
    )
    args = parser.parse_args(argv)

    if not args.title.strip():
        parser.error("--title is required")

    path = render_card(
        args.title,
        args.site,
        args.out,
        description=args.description,
        logo_path=args.logo or None,
    )
    print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
