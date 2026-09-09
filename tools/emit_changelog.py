"""Keep the `[Unreleased]` changelog section in sync with commit history.

The changelog is a hand-curated Keep-a-Changelog file, so this tool never
touches the written prose. It regenerates a small, clearly-marked machine
block inside `## [Unreleased]` listing every commit since the last tag —
the repo's commit history already follows Conventional Commits prefixes
(`feat:` / `fix:` / `docs:` / …), which is the "formalise and wire to
releases" step Phase 10 calls for.

Modes:

- default — rewrite the auto block under `## [Unreleased]` from
  `git log <last-tag>..HEAD`
- `--release <tag>` — promote `[Unreleased]` into a dated `## [<version>]`
  section and start a fresh, empty `[Unreleased]` (run from the release
  workflow when a tag is pushed)

Run from the repo root:

    python tools/emit_changelog.py
    python tools/emit_changelog.py --release v0.1.3
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = REPO_ROOT / "CHANGELOG.md"
AUTO_START = "<!-- AUTO-CHANGELOG:start -->"
AUTO_END = "<!-- AUTO-CHANGELOG:end -->"
AUTO_HEADING = "### Commits since the last release (auto)"

# Conventional-commit prefix -> Keep-a-Changelog category tag shown in parens.
_PREFIX_CATEGORY = {
    "feat": "Added",
    "feature": "Added",
    "add": "Added",
    "fix": "Fixed",
    "bugfix": "Fixed",
    "hotfix": "Fixed",
    "perf": "Changed",
    "refactor": "Changed",
    "chore": "Changed",
    "ci": "Changed",
    "build": "Changed",
    "docs": "Changed",
    "test": "Changed",
    "style": "Changed",
}
_PREFIX_RE = re.compile(r"^([a-z]+)(?:\(([^)]*)\))?[:!] ?")


def _last_tag() -> str:
    proc = subprocess.run(
        ["git", "describe", "--abbrev=0", "--tags"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    return proc.stdout.strip() if proc.returncode == 0 else ""


def _subjects_since(after: str) -> list[str]:
    if not after:
        return []
    proc = subprocess.run(
        ["git", "log", f"{after}..HEAD", "--format=%s"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if proc.returncode != 0:
        return []
    return [line.strip() for line in proc.stdout.splitlines() if line.strip()]


def _categorized(subjects: list[str]) -> dict[str, list[str]]:
    buckets = {"Added": [], "Changed": [], "Fixed": []}
    for subject in subjects:
        match = _PREFIX_RE.match(subject)
        prefix = match.group(1) if match else ""
        category = _PREFIX_CATEGORY.get(prefix, "Changed")
        buckets[category].append(subject)
    return buckets


def _auto_block(subjects: list[str]) -> str:
    buckets = _categorized(subjects)
    lines = [AUTO_START, AUTO_HEADING]
    if not subjects:
        lines.append("- no commits since the last release")
    else:
        for category in ("Added", "Fixed", "Changed"):
            for subject in buckets[category]:
                lines.append(f"- [{category}] {subject}")
    lines.append(AUTO_END)
    return "\n".join(lines)


def _find_unreleased(lines: list[str]) -> int | None:
    for idx, line in enumerate(lines):
        if line == "## [Unreleased]":
            return idx
    return None


def _write(text: str, out: Path) -> None:
    old = out.read_text(encoding="utf-8") if out.is_file() else None
    out.write_text(text, encoding="utf-8")
    print(
        f"wrote {out.relative_to(REPO_ROOT)} ({'changed' if text != old else 'unchanged'})"
    )


def update_unreleased(subjects: list[str]) -> None:
    lines = OUT_FILE.read_text(encoding="utf-8").splitlines()
    unreleased = _find_unreleased(lines)
    if unreleased is None:
        raise SystemExit("CHANGELOG.md has no `## [Unreleased]` section; aborting.")
    section_end = len(lines)
    for idx in range(unreleased + 1, len(lines)):
        if lines[idx].startswith("## [") and lines[idx] != "## [Unreleased]":
            section_end = idx
            break
    block = _auto_block(subjects).splitlines()
    new_lines = []
    in_auto = False
    replaced = False
    for idx, line in enumerate(lines[unreleased:section_end], start=unreleased):
        if line == AUTO_START:
            in_auto = True
            replaced = True
            new_lines.extend(block)
            continue
        if line == AUTO_END:
            in_auto = False
            continue
        if in_auto:
            continue
        new_lines.append(line)
    if not replaced:
        # Refreshed section: keep the hand prose, then append the auto block.
        trailing_blank = 0
        while new_lines and new_lines[-1] == "":
            trailing_blank += 1
            new_lines.pop()
        new_lines.append("")
        new_lines.extend(block)
        new_lines.append("")
        if trailing_blank:
            new_lines.append("")
    lines = lines[:unreleased] + new_lines + lines[section_end:]
    _write("\n".join(lines) + "\n", OUT_FILE)


def promote_release(tag: str) -> None:
    version = tag[1:] if tag.startswith("v") else tag
    date = datetime.now(tz=timezone.utc).date().isoformat()
    lines = OUT_FILE.read_text(encoding="utf-8").splitlines()
    unreleased = _find_unreleased(lines)
    if unreleased is None:
        raise SystemExit("CHANGELOG.md has no `## [Unreleased]` section; aborting.")
    header = lines[:unreleased]
    section_end = len(lines)
    for idx in range(unreleased + 1, len(lines)):
        if lines[idx].startswith("## [") and lines[idx] != "## [Unreleased]":
            section_end = idx
            break
    released_section = lines[unreleased + 1 : section_end]
    while released_section and released_section[0] == "":
        released_section.pop(0)
    while released_section and released_section[-1] == "":
        released_section.pop()
    new_lines = (
        header
        + ["## [Unreleased]", ""]
        + _auto_block([]).splitlines()
        + ["", "", f"## [{version}] - {date}", ""]
        + released_section
        + lines[section_end:]
    )
    _write("\n".join(new_lines) + "\n", OUT_FILE)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--release",
        default="",
        help="promote [Unreleased] to a dated release section for this tag",
    )
    args = parser.parse_args(argv)

    if args.release:
        promote_release(args.release)
        return 0

    update_unreleased(_subjects_since(_last_tag()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
