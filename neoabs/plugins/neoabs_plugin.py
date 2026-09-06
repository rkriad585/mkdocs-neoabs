"""NeoAbs theme plugin for MkDocs."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timezone
from typing import ClassVar

from mkdocs.config.base import PlainConfigSchema
from mkdocs.config.config_options import Type
from mkdocs.exceptions import ConfigurationError
from mkdocs.plugins import BasePlugin

# Phase 1 - Design token overrides.
#
# Maps `theme.neoabs.<group>.<key>` to the CSS custom property it drives.
# Every target property has a default baked into the compiled stylesheet; a
# user-supplied value here is rendered into a site-wide override block.
_NEOABS_TOKEN_MAP = {
    "colors": {
        "primary": "--neoabs-accent",
        "primary_light": "--neoabs-accent-glow",
        "primary_dark": "--neoabs-accent-strong",
        "background": "--neoabs-ink",
        "surface": "--neoabs-glass-bg",
        "surface_light": "--neoabs-glass-bg-strong",
        "text": "--neoabs-text-primary",
        "text_secondary": "--neoabs-text-secondary",
        "border": "--neoabs-glass-border",
        "overlay": "--neoabs-overlay-color",
    },
    "typography": {
        "font_family": "--neoabs-font-body",
        "font_family_display": "--neoabs-font-display",
        "font_family_mono": "--neoabs-font-mono",
        "font_size_base": "--neoabs-font-size-base",
        "font_size_sm": "--neoabs-font-size-sm",
        "font_size_lg": "--neoabs-font-size-lg",
        "line_height": "--neoabs-line-height",
        "heading_weight": "--neoabs-heading-weight",
        "heading_letter_spacing": "--neoabs-heading-letter-spacing",
    },
    "spacing": {
        "sidebar_width": "--neoabs-sidebar-width",
        "toc_width": "--neoabs-toc-width",
        "header_height": "--neoabs-header-height",
        "content_max_width": "--neoabs-content-max-width",
        "content_padding": "--neoabs-content-padding",
        "section_gap": "--neoabs-section-gap",
    },
    "border_radius": {
        "small": "--neoabs-radius-sm",
        "medium": "--neoabs-radius-md",
        "large": "--neoabs-radius-lg",
    },
    "transitions": {
        "duration": "--neoabs-transition-duration",
        "easing": "--neoabs-transition-easing",
    },
    "shadows": {
        "small": "--neoabs-shadow-sm",
        "medium": "--neoabs-shadow-md",
        "large": "--neoabs-shadow-lg",
    },
}

# Phase 2 - Component visibility toggles.
#
# Every configurable component/section of the theme plus its default state.
# Every default is ON: the theme ships fully featured, and a user can opt
# specific pieces out from `theme.neoabs.components.<name>.<key>`.
_NEOABS_DEFAULT_COMPONENTS = {
    "header": {
        "show": True,
        "show_logo": True,
        "show_site_name": True,
        "show_search": True,
        "show_repo_link": True,
        "show_palette_toggle": True,
        "show_page_title": True,
    },
    "sidebar": {
        "show": True,
        "show_header": True,
        "show_search": True,
    },
    "toc": {
        "show": True,
        "title": "On this page",
        "show_level_h2": True,
        "show_level_h3": True,
        "show_level_h4": True,
    },
    "footer": {
        "show": True,
        "show_prev_next": True,
        "show_copyright": True,
        "copyright_text": "",
    },
    "content": {
        "show": True,
        "show_progress_bar": True,
        "show_back_to_top": True,
    },
    "search": {
        "show": True,
        "shortcut_key": "/",
        "placeholder": "Search...",
    },
    "notes": {
        "show": True,
        "shortcut_key": "Ctrl+Shift+N",
    },
    "code": {
        "show_copy_button": True,
        "show_line_numbers": False,
        "highlight_lines": True,
    },
    "admonitions": {
        "show": True,
    },
    "mermaid": {
        "show": True,
        "cdn_url": "",
    },
    "math": {
        "show": True,
        "cdn_url": "",
    },
    "highlighting": {
        "show": True,
        "cdn_url": "",
        "theme_dark": "github-dark",
        "theme_light": "github",
    },
    "repo_popover": {
        "show": True,
    },
    "tags": {
        "show": True,
    },
    "toast": {
        "show": True,
    },
    "keyboard_help": {
        "show": True,
    },
}

# Phase 7 - Keyboard shortcuts.
#
# Every built-in shortcut is configurable and ON by default. `custom` holds
# user-defined shortcuts that dispatch to built-in action names; a built-in
# set of actions (scroll_to_top, toggle_sidebar, toggle_toc, toggle_notes,
# open_search, open_help, toggle_reading_mode) is resolved in `neoabs.js`.
_NEOABS_DEFAULT_KEYBOARD = {
    "enabled": True,
    "shortcuts": {
        "search": {"key": "/", "label": "Open search", "enabled": True},
        "close": {"key": "Escape", "label": "Close active overlay", "enabled": True},
        "search_up": {
            "key": "ArrowUp",
            "label": "Navigate search results up",
            "enabled": True,
        },
        "search_down": {
            "key": "ArrowDown",
            "label": "Navigate search results down",
            "enabled": True,
        },
        "search_open": {
            "key": "Enter",
            "label": "Open selected result",
            "enabled": True,
        },
        "tab_left": {
            "key": "ArrowLeft",
            "label": "Switch to previous tab",
            "enabled": True,
        },
        "tab_right": {
            "key": "ArrowRight",
            "label": "Switch to next tab",
            "enabled": True,
        },
        "toggle_sidebar": {
            "key": "Ctrl+Shift+B",
            "label": "Toggle sidebar",
            "enabled": True,
            "persisted": True,
        },
        "toggle_toc": {
            "key": "Ctrl+Shift+T",
            "label": "Toggle table of contents",
            "enabled": True,
            "persisted": True,
        },
        "toggle_notes": {
            "key": "Ctrl+Shift+N",
            "label": "Toggle notes panel",
            "enabled": True,
        },
        "help": {"key": "?", "label": "Show keyboard shortcuts", "enabled": True},
    },
    "custom": [],
}

# Phase 11 - Content area customization.
#
# `theme.neoabs.content` gives full control over content rendering. Empty
# string values mean "keep the theme default"; absent booleans keep the
# previous behavior. Explicitly-set keys that overlap the legacy `components`
# surface (show_progress_bar, show_back_to_top, code.*, admonitions.enabled)
# are propagated so both layers stay in sync.
_NEOABS_DEFAULT_CONTENT = {
    "max_width": "",
    "padding": "",
    "glass": False,
    "show_progress_bar": True,
    "progress_bar_color": "",
    "show_back_to_top": True,
    "back_to_top_threshold": 500,
    "back_to_top_label": "Back to top",
    "typography": {
        "heading_anchor": True,
        "anchor_symbol": "",
        "link_behavior": "smooth",
        "image_behavior": "normal",
        "video_behavior": "responsive",
    },
    "code": {
        "show_copy_button": True,
        "copy_label": "",
        "copied_label": "",
        "show_line_numbers": False,
        "line_number_start": 1,
        "highlight_lines": True,
        "line_number_color": "",
    },
    "admonitions": {
        "enabled": True,
        "types": {
            "note": {"color": "", "icon": ""},
            "tip": {"color": "", "icon": ""},
            "warning": {"color": "", "icon": ""},
            "danger": {"color": "", "icon": ""},
            "info": {"color": "", "icon": ""},
            "success": {"color": "", "icon": ""},
        },
    },
    "tables": {
        "responsive": True,
        "striped": False,
        "bordered": False,
    },
    "task_lists": {
        "enabled": True,
        "custom_checkbox": True,
        "persist_state": True,
    },
}


def _deep_merge(defaults, user):
    """Merge user config over defaults; nested dicts merge recursively."""
    merged = dict(defaults)
    if isinstance(user, dict):
        for key, value in user.items():
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = _deep_merge(merged[key], value)
            else:
                merged[key] = value
    return merged


def _css_safe_url(value):
    """Wrap an admonition icon's CSS url() so it survives the CSS tokenizer."""
    if value.startswith(('url("', "url('")):
        return value
    if value.startswith("url(") and value.endswith(")"):
        inner = value[4:-1].strip()
        safe = inner.replace("\\", "\\\\").replace('"', '\\"')
        return 'url("' + safe + '")'
    return value


def _normalize_admonition_icons(content):
    """Keep author-supplied admonition icons valid when inlined into the
    `neoabs-content-tokens` <style>. A raw `url(...)` fails CSS tokenization
    when the data URI contains unescaped quotes or spaces, so rewrite it into
    a double-quoted url string with inner quotes/backslashes escaped."""
    types = content.get("admonitions", {}).get("types")
    if not isinstance(types, dict):
        return
    for entry in types.values():
        if not isinstance(entry, dict):
            continue
        icon = entry.get("icon")
        if isinstance(icon, str) and icon.strip():
            entry["icon"] = _css_safe_url(icon.strip())


def _validate_shortcut_entry(name, entry):
    """Validate a single `theme.neoabs.keyboard.shortcuts.<name>` mapping."""
    if not isinstance(entry, dict):
        raise ConfigurationError(
            f"theme.neoabs.keyboard.shortcuts.{name} must be a mapping with "
            "a 'key' and 'label'."
        )
    key_value = entry.get("key")
    if key_value is not None and (
        not isinstance(key_value, str) or not key_value.strip()
    ):
        raise ConfigurationError(
            f"theme.neoabs.keyboard.shortcuts.{name}.key must be a non-empty string."
        )
    label_value = entry.get("label")
    if label_value is not None and not isinstance(label_value, str):
        raise ConfigurationError(
            f"theme.neoabs.keyboard.shortcuts.{name}.label must be a string."
        )
    for field in ("enabled", "persisted"):
        value = entry.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.keyboard.shortcuts.{name}.{field} must be a boolean."
            )


def _validate_keyboard(keyboard):
    """Validate a merged `theme.neoabs.keyboard` mapping, raising a clear
    MkDocs configuration error for malformed entries instead of silently
    degrading the shortcut layer."""
    shortcuts = keyboard.get("shortcuts")
    if isinstance(shortcuts, dict):
        for name, entry in shortcuts.items():
            _validate_shortcut_entry(name, entry)

    custom = keyboard.get("custom")
    if custom is None:
        return
    if not isinstance(custom, list):
        raise ConfigurationError("theme.neoabs.keyboard.custom must be a list.")
    for index, entry in enumerate(custom):
        if not isinstance(entry, dict):
            raise ConfigurationError(
                f"theme.neoabs.keyboard.custom[{index}] must be a mapping with "
                "'key', 'action', and 'label'."
            )
        for field in ("key", "action", "label"):
            value = entry.get(field)
            if value is not None and not isinstance(value, str):
                raise ConfigurationError(
                    f"theme.neoabs.keyboard.custom[{index}].{field} must be a string."
                )
        if not isinstance(entry.get("action"), str) or not entry["action"].strip():
            raise ConfigurationError(
                f"theme.neoabs.keyboard.custom[{index}].action is required."
            )


_NEOABS_GLASS_VALUES = ("light", "medium", "heavy", "none")
_NEOABS_ANIMATION_VALUES = ("normal", "reduced", "none")
_NEOABS_BORDER_VALUES = ("none", "thin", "thick")


def _coerce_bool(value, label):
    """Coerce YAML-ish booleans (true/false, 1/0, on/off, yes/no) to ``bool``."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "1", "yes", "on"):
            return True
        if lowered in ("false", "0", "no", "off"):
            return False
    raise ConfigurationError(f"{label} must be a boolean, got {value!r}.")


def _validate_visual_options(neoabs, plugin_options):
    """Validate and normalize the merged top-level visual options.

    Runs on the single merged surface (``theme.neoabs`` + ``plugins.neoabs``)
    so a malformed value fails the build loudly no matter which source defined
    it. Keys supplied by the plugin dict are labeled accordingly.
    """

    def label(key):
        base = "plugins.neoabs" if key in plugin_options else "theme.neoabs"
        return f"{base}.{key}"

    if "dot_matrix" in neoabs:
        dot = neoabs["dot_matrix"]
        if isinstance(dot, dict):
            if "enabled" in dot:
                dot["enabled"] = _coerce_bool(
                    dot["enabled"], label("dot_matrix") + ".enabled"
                )
        else:
            neoabs["dot_matrix"] = _coerce_bool(dot, label("dot_matrix"))

    for key in ("highlight", "notes"):
        if key in neoabs:
            neoabs[key] = _coerce_bool(neoabs[key], label(key))

    notes_ttl = neoabs.get("notes_ttl")
    if notes_ttl is not None and (
        isinstance(notes_ttl, bool) or not isinstance(notes_ttl, int)
    ):
        raise ConfigurationError(
            f"{label('notes_ttl')} must be an integer, got {notes_ttl!r}."
        )

    visual = {
        "glass": ("intensity", _NEOABS_GLASS_VALUES),
        "animation": ("mode", _NEOABS_ANIMATION_VALUES),
        "border": ("width", _NEOABS_BORDER_VALUES),
    }
    for key, (inner_key, allowed) in visual.items():
        value = neoabs.get(key)
        if value is None:
            continue
        if isinstance(value, str):
            allowed_values = ", ".join(allowed)
            if value not in allowed:
                raise ConfigurationError(
                    f"{label(key)} must be one of {allowed_values}; got {value!r}."
                )
        elif isinstance(value, dict):
            inner = value.get(inner_key)
            if inner is not None and isinstance(inner, str) and inner not in allowed:
                allowed_values = ", ".join(allowed)
                raise ConfigurationError(
                    f"{label(key)}.{inner_key} must be one of {allowed_values}; "
                    f"got {inner!r}."
                )
        else:
            raise ConfigurationError(
                f"{label(key)} must be a string or a mapping, got {value!r}."
            )


class NeoAbsPlugin(BasePlugin):
    """Plugin that enhances the NeoAbs theme with additional context."""

    # Phase 14: every `theme.neoabs` key is also accepted as a `- neoabs:`
    # plugin option, plus the plugin-specific scalars (highlight, notes,
    # notes_ttl). Options given here win over `theme.neoabs`. Option entries
    # deliberately carry no default: an absent key stays `None` and is skipped
    # during the merge so defaults keep flowing from `theme.neoabs`.
    config_scheme: ClassVar[PlainConfigSchema] = [  # type: ignore[assignment]
        ("glass", Type((str, dict))),
        ("dot_matrix", Type((bool, dict))),
        ("animation", Type((str, dict))),
        ("border", Type((str, dict))),
        ("highlight", Type(bool)),
        ("notes", Type(bool)),
        ("notes_ttl", Type(int)),
        ("colors", Type(dict)),
        ("typography", Type(dict)),
        ("spacing", Type(dict)),
        ("border_radius", Type(dict)),
        ("transitions", Type(dict)),
        ("shadows", Type(dict)),
        ("components", Type(dict)),
        ("header", Type(dict)),
        ("footer", Type(dict)),
        ("sidebar", Type(dict)),
        ("toc", Type(dict)),
        ("search", Type(dict)),
        ("keyboard", Type(dict)),
        ("content", Type(dict)),
        ("custom_css", Type(list)),
        ("custom_js", Type(list)),
    ]

    _neoabs_defaults: ClassVar[dict[str, object]] = {
        "glass": "medium",
        "dot_matrix": True,
        "animation": "normal",
        "border": "thin",
        "highlight": True,
        "notes": True,
    }

    def on_config(self, config, **kwargs):
        theme = config.get("theme") or {}

        neoabs = theme.get("neoabs") if "neoabs" in theme else {}
        if not isinstance(neoabs, dict):
            neoabs = {}

        # Phase 14: the `- neoabs:` plugin options are a first-class settings
        # surface. Keys supplied inline in the plugin dict are deep-merged over
        # `theme.neoabs` (the plugin wins), then the merged result is validated
        # and normalized as a single unit so a bad value fails loudly no matter
        # which source defined it.
        plugin_opts = self.config if isinstance(self.config, Mapping) else {}
        known_plugin_keys = {name for name, _ in self.config_scheme}
        plugin_opts = {
            key: value
            for key, value in plugin_opts.items()
            if key in known_plugin_keys and value is not None
        }
        neoabs = _deep_merge(neoabs, plugin_opts)
        _validate_visual_options(neoabs, plugin_opts)
        for key, value in self._neoabs_defaults.items():
            neoabs.setdefault(key, value)
        theme["neoabs"] = neoabs

        # Phase 2: resolve component visibility toggles. User overrides are
        # deep-merged onto the all-ON defaults and exposed to templates plus
        # the JS bootstrap (serialized into `#__config` as `components`).
        provided_components = neoabs.get("components")
        if not isinstance(provided_components, dict):
            provided_components = {}
        components = _deep_merge(_NEOABS_DEFAULT_COMPONENTS, provided_components)
        neoabs["components"] = components
        theme["neoabs"] = neoabs

        # Phase 11: resolve content-area customization. Defaults are kept (empty
        # strings / existing booleans); keys the author explicitly set are
        # exposed as `extra.neoabs_content` for templates and JS, and propagated
        # onto the matching legacy `components` toggles so existing reads stay
        # in sync (only when the author supplied them here).
        provided_content = neoabs.get("content")
        if not isinstance(provided_content, dict):
            provided_content = {}
        content = _deep_merge(_NEOABS_DEFAULT_CONTENT, provided_content)
        _normalize_admonition_icons(content)
        neoabs["content"] = content
        theme["neoabs"] = neoabs

        provided_code = provided_content.get("code")
        provided_code = provided_code if isinstance(provided_code, dict) else {}
        provided_admonitions = provided_content.get("admonitions")
        provided_admonitions = (
            provided_admonitions if isinstance(provided_admonitions, dict) else {}
        )
        for key in ("show_progress_bar", "show_back_to_top"):
            if key in provided_content:
                components["content"][key] = content[key]
        for key in ("show_copy_button", "show_line_numbers", "highlight_lines"):
            if key in provided_code:
                components["code"][key] = content["code"][key]
        if "enabled" in provided_admonitions:
            components["admonitions"]["show"] = content["admonitions"]["enabled"]

        # Phase 7: resolve keyboard shortcuts. Defaults are all-ON (every
        # shortcut works out of the box); user overrides are deep-merged and
        # validated so a malformed key or custom action fails the build with a
        # clear message instead of silently disabling the shortcut layer.
        provided_keyboard = neoabs.get("keyboard")
        if not isinstance(provided_keyboard, dict):
            provided_keyboard = {}
        keyboard = _deep_merge(_NEOABS_DEFAULT_KEYBOARD, provided_keyboard)
        _validate_keyboard(keyboard)
        neoabs["keyboard"] = keyboard
        theme["neoabs"] = neoabs

        # B2: inject current year for the footer copyright far from relying on a
        # Jinja `now` global that MkDocs does not provide.
        # C1-C3: surface the neoabs theme options to templates so they can be
        # applied to the rendered output (glass, dot matrix, animation, border).
        extra = config.get("extra") or {}
        extra["neoabs_copyright_year"] = datetime.now(tz=timezone.utc).year
        extra["neoabs_glass"] = neoabs["glass"]
        dot_matrix = neoabs["dot_matrix"]
        dot_enabled = (
            dot_matrix.get("enabled", True)
            if isinstance(dot_matrix, dict)
            else dot_matrix
        )
        extra["neoabs_dot_matrix"] = bool(dot_enabled)
        extra["neoabs_animation"] = neoabs["animation"]
        extra["neoabs_border"] = neoabs["border"]
        extra["neoabs_highlight"] = bool(
            neoabs["highlight"] and components["highlighting"]["show"]
        )
        extra["neoabs_notes"] = bool(neoabs["notes"] and components["notes"]["show"])
        extra["neoabs_notes_ttl"] = neoabs.get("notes_ttl")
        extra["neoabs_components"] = components
        extra["neoabs_keyboard"] = keyboard
        extra["neoabs_content"] = content

        # Phase 1: collect user-supplied design tokens. Only values the author
        # explicitly set are collected; defaults live in the compiled CSS.
        tokens = []
        for group, mapping in _NEOABS_TOKEN_MAP.items():
            provided = neoabs.get(group)
            if not isinstance(provided, dict):
                continue
            for key, var_name in mapping.items():
                value = provided.get(key)
                if value is None:
                    continue
                if isinstance(value, str) and not value.strip():
                    continue
                tokens.append({"var": var_name, "value": value})
        extra["neoabs_tokens"] = tokens

        config["extra"] = extra

        # Search: the built-in MkDocs `search` plugin injects `search/main.js`
        # into `config.extra_javascript`. We drive its worker (`search/worker.js`
        # + lunr index) directly from our own themed UI instead, so drop the stock
        # main.js to avoid a second, incompatible search controller.
        if "search" in config.get("plugins", []):
            extra_js = config.get("extra_javascript") or []
            config["extra_javascript"] = [p for p in extra_js if p != "search/main.js"]

        return config
