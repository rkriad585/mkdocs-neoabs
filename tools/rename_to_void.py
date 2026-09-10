"""tools/rename_to_void.py -- rename mkdocs-neoabs -> mkdocs-void.

Dry-run by default. Use --apply to write. Run against a scratch copy first:
    python tools/rename_to_void.py --root C:/tmp/void-test        # dry run
    python tools/rename_to_void.py --root C:/tmp/void-test --apply
Then run on the real checkout:
    python tools/rename_to_void.py --apply

The root directory itself is never renamed -- only its children. Binary files,
.git/, node_modules/, site/, void-logos/, scratch temp dirs and planning docs
are left untouched.
"""

import argparse
import os
import sys
from pathlib import Path

# Ordered: longest/most-specific first so partial matches never survive.
REPLACEMENTS = [
    ("mkdocs_neoabs", "mkdocs_void"),
    ("mkdocs-neoabs", "mkdocs-void"),
    ("NeoAbs", "Void"),
    ("NEOABS", "VOID"),
    ("neoabs", "void"),
]

# Directories never entered.
SKIP_DIR = {
    ".git",
    "node_modules",
    "site",
    "void-logos",
    ".ruff_cache",
    "__pycache__",
    "Screenshots",
}

# Files skipped regardless of location (historical/planning docs keep the old
# brand; RENAME-PLAN.md documents the change itself; the tool skips itself so
# a real apply never rewrites its own token tables into no-ops).
SKIP_NAME = {
    "RENAME-PLAN.md",
    "PLAN.md",
    "WHY_PLAN.md",
    "DOCS_WIKI_PLAN.md",
    "rename_to_void.py",
}

SKIP_EXT = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".pyc",
    ".gitkeep",
}

BINARY_MARKERS = (b"\0",)


def is_binary(path: Path) -> bool:
    try:
        with open(path, "rb") as fh:
            head = fh.read(4096)
    except OSError:
        return True
    return any(marker in head for marker in BINARY_MARKERS)


def transform_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text


def token_expand(part: str) -> str:
    """Rename a single path component ('void.js' -> 'void.js')."""
    for old, new in REPLACEMENTS:
        if old in part:
            return part.replace(old, new)
    return part


def renamed_relative(rel: Path) -> Path:
    """Return the destination relative path for `rel`, renaming every part."""
    return Path(*[token_expand(part) for part in rel.parts])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=os.getcwd(), help="tree to rename")
    ap.add_argument(
        "--apply",
        action="store_true",
        help="actually rename; default is a dry-run report",
    )
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        sys.exit(f"not a directory: {root}")

    # The root folder itself is never renamed; only children are processed.
    # This keeps a local working dir stable (e.g. ".../Projects/mkdocs-void").

    files: list[Path] = []
    for abs_path in sorted(root.rglob("*")):
        rel = abs_path.relative_to(root)
        if any(part in SKIP_DIR for part in rel.parts):
            continue
        if abs_path.is_file():
            if abs_path.name in SKIP_NAME or abs_path.suffix.lower() in SKIP_EXT:
                continue
            files.append(abs_path)

    changed_text_files: list[str] = []
    for abs_path in files:
        if is_binary(abs_path):
            continue
        try:
            text = abs_path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new_text = transform_text(text)
        if new_text != text:
            changed_text_files.append(str(abs_path.relative_to(root)))
            if args.apply:
                abs_path.write_text(new_text, encoding="utf-8")

    moves: list[tuple[Path, Path]] = []
    for abs_path in files:
        rel = abs_path.relative_to(root)
        dst = renamed_relative(rel)
        if dst != rel:
            moves.append((rel, dst))

    if args.apply:
        # deepest paths first so directories empty out bottom-up
        for src_rel, dst_rel in sorted(
            moves, key=lambda t: len(t[0].parts), reverse=True
        ):
            src = root / src_rel
            dst = root / dst_rel
            if src == dst or not src.exists():
                continue
            dst.parent.mkdir(parents=True, exist_ok=True)
            if dst.exists():
                dst.unlink()
            src.rename(dst)
            print(f"moved {src_rel}  ->  {dst_rel}")

        # remove now-empty old directories (bottom-up)
        dirs = sorted(
            (p for p in root.rglob("*") if p.is_dir()),
            key=lambda p: len(p.relative_to(root).parts),
            reverse=True,
        )
        for d in dirs:
            if any(part in SKIP_DIR for part in d.relative_to(root).parts):
                continue
            if not any(d.iterdir()):
                try:
                    d.rmdir()
                    print(f"removed empty dir {d.relative_to(root)}")
                except OSError:
                    pass

    print(
        f"\n{'APPLIED' if args.apply else 'DRY-RUN'} -- "
        f"{len(changed_text_files)} file(s) text-changed, "
        f"{len(moves)} path(s) to be renamed"
    )

    # Leftovers are expected in a dry run (nothing moved yet); fail hard only
    # after an actual apply so a half-rename never looks green.
    if not args.apply:
        return 0

    leftovers = sorted(
        str(p.relative_to(root))
        for p in root.rglob("*")
        if "void" in p.name.lower()
        and not any(part in SKIP_DIR for part in p.relative_to(root).parts)
    )
    if leftovers:
        print("leftover void paths:")
        for lo in leftovers:
            print("  ", lo)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
