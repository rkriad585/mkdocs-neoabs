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

`neoabs new [TARGET]` creates a working NeoAbs docs project (mkdocs.yml +
docs/index.md) with zero custom CSS, ready for `mkdocs serve`.

`neoabs doctor [--config-file FILE]` audits the current project and prints a
health report: mkdocs + neoabs versions, `site_url`, theme, fonts, node, and
the service-worker cache version. Exits 0 on a healthy project, 1 when a
check fails, and 2 on usage or YAML errors.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

from . import __version__ as _NEOABS_CLI_VERSION

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

USAGE = "usage: neoabs new [TARGET] | doctor [--config-file FILE]"
DOCTOR_USAGE = "usage: neoabs doctor [--config-file FILE]  (default: mkdocs.yml in the current directory)"


def main(argv=None) -> int:
    args = list(argv) if argv is not None else sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(USAGE)
        return 0
    command = args[0]
    if command == "new":
        return _cmd_new(args[1:])
    if command == "doctor":
        return _cmd_doctor(args[1:])
    print(
        f"neoabs: unknown command {command!r} (expected 'new' or 'doctor')",
        file=sys.stderr,
    )
    print(USAGE, file=sys.stderr)
    return 2


def _cmd_new(argv) -> int:
    target = Path(argv[0]) if argv else Path(".")
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


def _sw_cache_versions(sw_text: str):
    static = re.search(r'CACHE_STATIC\s*=\s*"([^"]+)"', sw_text)
    cdn = re.search(r'CACHE_CDN\s*=\s*"([^"]+)"', sw_text)
    return (
        static.group(1) if static else None,
        cdn.group(1) if cdn else None,
    )


def _cmd_doctor(argv) -> int:
    import mkdocs  # imported lazily so `neoabs new` stays light
    from mkdocs.utils.yaml import (
        yaml_load,
    )  # MkDocs' loader handles !ENV and !!python/name tags
    from yaml import YAMLError

    config_file = "mkdocs.yml"
    if argv and argv[0] in ("-h", "--help"):
        print(DOCTOR_USAGE)
        return 0
    if argv:
        if argv[0] == "--config-file":
            if len(argv) < 2:
                print(
                    "neoabs doctor: --config-file requires a path",
                    file=sys.stderr,
                )
                return 2
            config_file = argv[1]
        else:
            print(f"neoabs doctor: unknown option {argv[0]!r}", file=sys.stderr)
            print(DOCTOR_USAGE, file=sys.stderr)
            return 2

    fails = 0
    warns = 0
    print(f"mkdocs {mkdocs.__version__}  neoabs {_NEOABS_CLI_VERSION}")

    config_path = Path(config_file)
    if not config_path.exists():
        print(
            f"[fail] config file not found: {config_path} (run neoabs doctor from the project root)",
        )
        return 1
    with config_path.open("r", encoding="utf-8") as fh:
        try:
            data = yaml_load(fh) or {}
        except YAMLError as exc:
            print(f"[fail] {config_path} is not valid YAML: {exc}")
            return 2

    site_url = str(data.get("site_url") or "").strip()
    if site_url:
        print(f"[ok] site_url: {site_url}")
    else:
        warns += 1
        print("[warn] site_url is empty - set it in mkdocs.yml before going live")

    theme = data.get("theme") or {}
    if theme.get("name") == "neoabs":
        print("[ok] theme.name: neoabs")
    else:
        fails += 1
        print(f"[fail] theme.name is {theme.get('name')!r} - expected 'neoabs'")

    font = theme.get("font") or {}
    font_text = font.get("text") or "Space Grotesk"
    font_code = font.get("code") or "Space Mono"
    print(f"[ok] fonts: text={font_text} code={font_code}")

    plugins = data.get("plugins") or []
    has_neoabs = any(
        p == "neoabs" or (isinstance(p, dict) and "neoabs" in p) for p in plugins
    )
    if has_neoabs:
        print("[ok] plugins include the neoabs plugin")
    else:
        warns += 1
        print("[warn] the `neoabs` plugin is not enabled - add it under `plugins:`")

    node = shutil.which("node")
    if node:
        proc = subprocess.run(
            [node, "--version"], capture_output=True, text=True, check=False
        )
        node_ver = (proc.stdout or "").strip() or "unknown"
        print(f"[ok] node: {node_ver}")
    else:
        warns += 1
        print(
            "[warn] node not found - install Node.js to rebuild the theme CSS (`npm run build`)",
        )

    package_sw = Path(__file__).resolve().parent / "templates" / "sw.js"
    if package_sw.exists():
        static_v, cdn_v = _sw_cache_versions(package_sw.read_text(encoding="utf-8"))
        site_sw = Path("site") / "sw.js"
        if site_sw.exists():
            s_static, s_cdn = _sw_cache_versions(site_sw.read_text(encoding="utf-8"))
            if (s_static, s_cdn) == (static_v, cdn_v):
                print(
                    f"[ok] sw.js cache versions match the theme (static={static_v}, cdn={cdn_v})",
                )
            else:
                warns += 1
                print(
                    f"[warn] site/sw.js is stale (site static={s_static}, cdn={s_cdn}; "
                    f"theme static={static_v}, cdn={cdn_v}) - rebuild with `mkdocs build`",
                )
        else:
            print(
                f"[ok] sw.js cache versions (static={static_v}, cdn={cdn_v}) - "
                "build the site to register it",
            )

    extra = data.get("extra") or {}
    version_buster = extra.get("neoabs_version")
    if version_buster:
        print(f"[ok] extra.neoabs_version: {version_buster}")
    else:
        warns += 1
        print("[warn] extra.neoabs_version is not set - assets ship with ?v=1")

    if fails:
        print(
            f"neoabs doctor: {fails} problem(s), {warns} warning(s) - project is not healthy"
        )
        return 1
    if warns:
        print(f"neoabs doctor: {warns} warning(s), 0 problems - project is healthy")
        return 0
    print("neoabs doctor: project is healthy")
    return 0


if __name__ == "__main__":
    sys.exit(main())
