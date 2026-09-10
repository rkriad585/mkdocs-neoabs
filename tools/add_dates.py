"""Stamp every docs Markdown page with a `date:` front-matter key.

The Void footer renders a "Last updated" line from the page's front matter
(`date:`), so each page should carry an explicit, current date. This tool walks
a directory tree (default: `docs/`), skips MkDocs `_`-prefixed files such as
the generated config reference, and for every `*.md` file either adds a
`date:` key to the existing YAML front matter or creates a minimal front-matter
block up front. Any existing `date:` value is refreshed to the supplied date.

By default the date is *today* (the latest date) as `YYYY-MM-DD`, matching the
`{date.now()}` template marker; override it explicitly for reproducibility.

Run from the repo root:

    python tools/add_dates.py                 # stamp docs/ with today's date
    python tools/add_dates.py --date 2026-09-07
    python tools/add_dates.py --root docs --date 2026-09-07
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

_DATE_LINE = re.compile(r"^(\s*)date\s*:\s*.*$")
_YAML_DELIM = "---"


def _split_lines(text: str) -> list[str]:
    return text.split("\n")


def _stamp(lines: list[str], stamp: str) -> bool:
    """Insert/refresh the `date:` key in `lines`; return True if modified."""
    if not lines:
        return False
    if lines[0].strip() != _YAML_DELIM:
        return False  # no front matter (caller prepends a block instead)
    for i in range(1, len(lines)):
        if lines[i].strip() == _YAML_DELIM:
            break
    else:
        return False  # unterminated delimiter — leave untouched
    body = lines[1:i]
    for j, line in enumerate(body):
        m = _DATE_LINE.match(line)
        if not m:
            continue
        if m.group(1) + "date: " + stamp == line:
            return False
        body[j] = m.group(1) + "date: " + stamp
        lines[1:i] = body
        return True
    body.insert(0, "date: " + stamp)
    lines[1:i] = body
    return True


def stamp_file(path: Path, stamp: str) -> bool:
    raw = path.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8-sig")
    lines = _split_lines(text.replace("\r\n", "\n"))

    has_fm = bool(lines) and lines[0].strip() == _YAML_DELIM
    if has_fm:
        if not _stamp(lines, stamp):
            return False  # front matter exists and date already set — unchanged
    else:
        block = [_YAML_DELIM, "date: " + stamp, _YAML_DELIM, ""]
        lines = block + lines

    newline = "\r\n" if crlf else "\n"
    text_out = newline.join(lines)
    if not text_out.endswith(newline):
        text_out += newline
    path.write_bytes(text_out.encode("utf-8"))
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        default="docs",
        help="directory tree to walk for *.md files (default: docs)",
    )
    parser.add_argument(
        "--date",
        default=None,
        help="date stamp to write, YYYY-MM-DD (default: today / latest date)",
    )
    args = parser.parse_args()

    stamp = args.date or datetime.now(tz=timezone.utc).date().isoformat()
    root = (REPO_ROOT / args.root).resolve()
    if not root.is_dir():
        raise SystemExit(f"no such directory: {root}")

    changed: list[Path] = []
    for path in sorted(root.rglob("*.md")):
        if path.name.startswith("_"):  # MkDocs ignores _-prefixed files
            continue
        if stamp_file(path, stamp):
            changed.append(path)

    if not changed:
        print(f"{root}: no markdown files needed a date stamp ({stamp}).")
        return
    print(f"Stamped {len(changed)} file(s) with date {stamp}:")
    for path in changed:
        print("  - " + path.relative_to(REPO_ROOT).as_posix())


if __name__ == "__main__":
    main()
