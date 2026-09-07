# Copyright (c) 2025 mkdocs-neoabs contributors

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
# sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.

"""NeoAbs command-line interface.

Phase 2 scaffolder: `neoabs new [TARGET]` creates a working NeoAbs docs
project (mkdocs.yml + docs/index.md) with zero custom CSS, ready for
`mkdocs serve`.
"""

from __future__ import annotations

import sys
from pathlib import Path

TEMPLATE = {
    "mkdocs.yml": (
        "site_name: New Docs\n"
        'site_url: ""\n'
        "theme:\n"
        "  name: neoabs\n"
        "  features:\n"
        "    - navigation.sections\n"
        "    - navigation.top\n"
        "    - navigation.footer\n"
        "    - content.code.copy\n"
        "    - search.suggest\n"
        "    - search.highlight\n"
        "  neoabs:\n"
        "    glass: medium\n"
        "    dot_matrix: true\n"
        "    animation: normal\n"
        "    border: thin\n"
        "plugins:\n"
        "  - search\n"
        "  - neoabs\n"
    ),
    "docs/index.md": "# Welcome\n\nBuilt with NeoAbs.\n",
}

USAGE = "usage: neoabs new [TARGET]  (scaffold a NeoAbs project; default: current directory)"


def main(argv=None) -> int:
    args = list(argv) if argv is not None else sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(USAGE)
        return 0
    if args[0] != "new":
        print(f"neoabs: unknown command {args[0]!r} (expected 'new')", file=sys.stderr)
        print(USAGE, file=sys.stderr)
        return 2
    target = Path(args[1]) if len(args) > 1 else Path(".")
    if (target / "mkdocs.yml").exists():
        print(
            f"refusing to overwrite existing project at {target}",
            file=sys.stderr,
        )
        return 1
    for name, body in TEMPLATE.items():
        p = target / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body, encoding="utf-8")
    print(f"NeoAbs project scaffolded at {target}. Run: mkdocs serve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
