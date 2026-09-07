"""Emit the canonical NeoAbs config reference from the plugin's own source.

Walks the real `neoabs_plugin` constants (`_NEOABS_TOKEN_MAP`,
`_neoabs_defaults`, and every `_NEOABS_DEFAULT_*` module dict) and writes
`docs/_config_ref.generated.md` so the published config page can never drift
from the shipped code.

Run from the repo root:

    python tools/emit_config_reference.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - guarded at runtime
    yaml = None

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = REPO_ROOT / "docs" / "_config_ref.generated.md"

# Default dicts to document, in declaration order.
DEFAULT_DICTS = (
    "_NEOABS_DEFAULT_COMPONENTS",
    "_NEOABS_DEFAULT_KEYBOARD",
    "_NEOABS_DEFAULT_READING_MODE",
    "_NEOABS_DEFAULT_ACTION_CLUSTER",
    "_NEOABS_DEFAULT_TIMER",
    "_NEOABS_DEFAULT_CONTENT",
    "_NEOABS_DEFAULT_AI_READER",
)

# Human titles for the default dicts, matching the config sections users know.
DEFAULT_TITLES = {
    "_NEOABS_DEFAULT_COMPONENTS": "components (visible surfaces)",
    "_NEOABS_DEFAULT_KEYBOARD": "keyboard (shortcuts)",
    "_NEOABS_DEFAULT_READING_MODE": "reading_mode",
    "_NEOABS_DEFAULT_ACTION_CLUSTER": "action_cluster",
    "_NEOABS_DEFAULT_TIMER": "timer",
    "_NEOABS_DEFAULT_CONTENT": "content",
    "_NEOABS_DEFAULT_AI_READER": "ai_reader",
}


def _collect() -> dict:
    """Pull every canonical config surface out of the plugin module."""
    import neoabs.plugins.neoabs_plugin as plugin

    token_map = sorted(
        (group, dict(mapping.items()))
        for group, mapping in plugin._NEOABS_TOKEN_MAP.items()
    )
    scalar_defaults = dict(plugin.NeoAbsPlugin._neoabs_defaults)
    named_defaults = {}
    for name in DEFAULT_DICTS:
        value = getattr(plugin, name)
        if isinstance(value, dict):
            named_defaults[DEFAULT_TITLES[name]] = value
    return {
        "tokens": dict(token_map),
        "defaults": scalar_defaults,
        "sections": named_defaults,
    }


def _emit() -> str:
    data = _collect()
    header = (
        "<!-- generated: do not edit. Run `python tools/emit_config_reference.py` "
        f"({datetime.now(tz=timezone.utc).date().isoformat()}). -->\n"
    )
    if yaml is None:
        # Fatal but informative: the build includes this file, so PyYAML is a
        # hard prerequisite for regeneration.
        raise SystemExit("PyYAML is required to regenerate the config reference")
    body = yaml.safe_dump(data, sort_keys=True, default_flow_style=False)
    return header + "```yaml\n" + body + "```\n"


def main(argv=None) -> int:
    try:
        text = _emit()
    except ImportError as exc:  # pragma: no cover - unlikely outside venv
        print(f"error: {exc}", file=sys.stderr)
        return 1
    OUT_FILE.write_text(text, encoding="utf-8")
    print(f"wrote {OUT_FILE.relative_to(REPO_ROOT)} ({len(text.splitlines())} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
