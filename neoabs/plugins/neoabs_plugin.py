"""NeoAbs theme plugin for MkDocs."""

from __future__ import annotations

import fnmatch
import logging
import os
import posixpath
import re
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import ClassVar

from mkdocs.config.base import PlainConfigSchema
from mkdocs.config.config_options import Type
from mkdocs.exceptions import ConfigurationError
from mkdocs.plugins import BasePlugin

# Theme version for the Phase 19 mirror watermark (`watermark.include_version`).
from .. import __version__ as _NEOABS_THEME_VERSION

_AI_LOGGER = logging.getLogger("mkdocs.plugins.neoabs")

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
    },
    "code": {
        "show_copy_button": True,
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
# open_search, open_help, toggle_reading_mode, toggle_action_cluster) is
# resolved in `neoabs.js`.
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
        "toggle_reading_mode": {
            "key": "Alt+Shift+R",
            "label": "Toggle reading mode",
            "enabled": True,
            "persisted": True,
        },
    },
    "custom": [],
}

# Phase 15 - Reading mode.
#
# One keypress (default Alt+Shift+R) enters a distraction-free reading view:
# the header, sidebars, TOC, footer, and progress chrome are hidden, and the
# article is re-measured. The view keeps the active color scheme (dark by
# default); `reading_mode.scheme.colors` optionally overrides it. Every aspect
# is configurable via `theme.neoabs.reading_mode`; the defaults keep the
# feature fully ON.
_NEOABS_DEFAULT_READING_MODE = {
    "enabled": True,
    "shortcut_key": "Alt+Shift+R",
    "sections": {
        "header": True,
        "sidebar": True,
        "toc": True,
        "footer": True,
        "progress": True,
    },
    "notes": {
        "show": True,
        "open_on_enter": False,
    },
    "persisted": True,
    "typography": {
        "font_size": "1.125rem",
        "line_height": "1.75",
        "measure": "100%",
    },
}

# The only `scheme.colors` keys a reading mode may set. Each maps 1:1 onto a
# compiled-CSS token (--neoabs-ink, --neoabs-glass-bg, --neoabs-text-primary,
# --neoabs-text-secondary, --neoabs-glass-border, --neoabs-accent). Unknown
# keys are rejected so a typo cannot silently produce a dead config value.
_VALID_READING_COLOR_KEYS = frozenset(
    ("background", "surface", "text", "text_secondary", "border", "accent")
)

# Phase 16 - Action cluster (plus menu).
#
# A floating "plus" button that expands into a cluster of quick actions
# (keyboard help, notes, focus timer, reading mode). Every visible and
# behavioral aspect is configurable via `theme.neoabs.action_cluster`; the
# defaults keep the feature fully ON with all four action slots rendered. Each
# action dispatches through the `keyboardActions` registry in the JS, so
# features built later (the Phase 17 timer) light up automatically.
_NEOABS_DEFAULT_ACTION_CLUSTER = {
    "enabled": True,
    "position": "bottom-left",
    "offset": {"bottom": "16px", "left": "16px"},
    "main": {
        "icon": "plus",
        "size": "44px",
        "glass": True,
        "icon_transform": True,
    },
    "behavior": {
        "min_actions": 2,
        "close_on_select": True,
        "close_on_escape": True,
        "close_on_outside": True,
        "animation": "normal",
        "tooltips": True,
        "focus_trap": True,
    },
    "actions": [
        {
            "id": "keyboard_help",
            "icon": "help",
            "label": "Keyboard shortcuts",
            "shortcut": "?",
            "badge": "none",
            "enabled": True,
        },
        {
            "id": "notes",
            "icon": "notes",
            "label": "Open notes panel",
            "shortcut": "Ctrl+Shift+N",
            "badge": "none",
            "enabled": True,
        },
        {
            "id": "timer",
            "icon": "timer",
            "label": "Focus timer",
            "shortcut": "Alt+Shift+T",
            "badge": "time",
            "enabled": True,
        },
        {
            "id": "reading_mode",
            "icon": "reading",
            "label": "Reading mode",
            "shortcut": "Alt+Shift+R",
            "badge": "none",
            "enabled": True,
        },
    ],
    "replaces_notes_button": True,
}

# Allowed enums / keys for the action cluster so a typo fails the build loudly.
_NEOABS_ACTION_CLUSTER_POSITIONS = ("bottom-left", "bottom-right")
_NEOABS_ACTION_CLUSTER_ICONS = ("plus", "menu", "notes", "help", "timer", "reading")
_NEOABS_ACTION_CLUSTER_ANIMATIONS = ("normal", "reduced", "none")
_NEOABS_ACTION_CLUSTER_IDS = ("keyboard_help", "notes", "timer", "reading_mode")
_NEOABS_ACTION_CLUSTER_OFFSET_KEYS = ("bottom", "left", "right")
_NEOABS_ACTION_CLUSTER_BADGES = ("none", "time")
_NEOABS_ACTION_CLUSTER_BEHAVIOR_BOOLS = (
    "close_on_select",
    "close_on_escape",
    "close_on_outside",
    "tooltips",
    "focus_trap",
)

# Phase 17 - Focus timer.
#
# A built-in focus timer driven from the cluster's timer action or its own
# shortcut. The session runs off `Date.now()` accounting in the JS so browser
# throttling never drifts the time; the TOC widget and the reading-mode chip are
# the visible surfaces. Every knob is `theme.neoabs.timer` configurable and the
# defaults ship fully ON with a 25-minute Pomodoro-style default session.
# Phase 18 adds the remaining-time badge in the cluster, the `mm:ss`/`m:ss`/`SS`
# display format, an opt-in tab-title countdown, and `start_with_reading` (both
# surfaced in the JS; `document_title` / `start_with_reading` are opt-in by
# design because they change visible page behavior).
_NEOABS_DEFAULT_TIMER = {
    "enabled": True,
    "default_minutes": 25,
    "toc": {"show": True, "position": "bottom", "style": "ring"},
    "reading": {"show": True},
    "notifications": {"enabled": True, "toast": True, "sound": True},
    "persist": True,
    "settings_popup": True,
    "start_with_reading": False,
    "display_format": "mm:ss",
    "document_title": False,
    "badge_in_cluster": True,
    "colors": {"progress": "#8a5a33"},
}

# Allowed enums for the focus timer so a typo fails the build loudly.
_NEOABS_TIMER_TOC_POSITIONS = ("top", "bottom")
_NEOABS_TIMER_TOC_STYLES = ("ring", "bar", "digits")
_NEOABS_TIMER_DISPLAY_FORMATS = ("mm:ss", "m:ss", "SS")

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


# Phase 19 - AI-readable content mode.
#
# Every page gets a watermarked markdown mirror next to its HTML output so AI
# agents can `curl`/`webfetch` the source directly instead of scraping rendered
# markup. The HTML page advertises the mirror with a machine-readable comment
# plus a `<link rel="alternate" type="text/markdown">` head tag; an index
# (`llms.txt`) and a concatenated dump (`llms-full.txt`) are emitted at the
# site root. Everything ships ON except the destructive `overwrite` knob and
# the empty `exclude` list, exactly as the phase mandates.
_NEOABS_DEFAULT_AI_READER = {
    "enabled": True,
    "markup": True,
    "url_style": "sidecar",
    "overwrite": False,
    "auto_title": True,
    "exclude": [],
    "llms": True,
    "llms_full": True,
    "sitemap": True,
    "description": "",
    "watermark": {
        "enabled": True,
        "header": True,
        "footer": True,
        "text": "Generated by NeoAbs for AI agents.",
        "include_site": True,
        "include_url": True,
        "include_generated": True,
        "include_version": True,
    },
}

# Allowed enums / key sets for the AI reader so a typo fails the build loudly.
_NEOABS_AI_READER_URL_STYLES = ("sidecar", "inline")
_NEOABS_AI_READER_BOOLS = (
    "enabled",
    "markup",
    "overwrite",
    "auto_title",
    "llms",
    "llms_full",
    "sitemap",
)
_NEOABS_AI_READER_WATERMARK_BOOLS = (
    "enabled",
    "header",
    "footer",
    "include_site",
    "include_url",
    "include_generated",
    "include_version",
)


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


def _validate_reading_mode(reading_mode):
    """Validate a merged `theme.neoabs.reading_mode` mapping, raising a clear
    MkDocs configuration error for malformed entries instead of silently
    degrading the reading view."""
    if not isinstance(reading_mode, dict):
        raise ConfigurationError("theme.neoabs.reading_mode must be a mapping.")

    for field in ("enabled", "persisted"):
        value = reading_mode.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.reading_mode.{field} must be a boolean."
            )

    shortcut = reading_mode.get("shortcut_key")
    if shortcut is not None and (not isinstance(shortcut, str) or not shortcut.strip()):
        raise ConfigurationError(
            "theme.neoabs.reading_mode.shortcut_key must be a non-empty string."
        )

    sections = reading_mode.get("sections")
    if isinstance(sections, dict):
        for name in ("header", "sidebar", "toc", "footer", "progress"):
            value = sections.get(name)
            if value is not None and not isinstance(value, bool):
                raise ConfigurationError(
                    f"theme.neoabs.reading_mode.sections.{name} must be a boolean."
                )
    elif sections is not None:
        raise ConfigurationError(
            "theme.neoabs.reading_mode.sections must be a mapping."
        )

    notes = reading_mode.get("notes")
    if isinstance(notes, dict):
        for field in ("show", "open_on_enter"):
            value = notes.get(field)
            if value is not None and not isinstance(value, bool):
                raise ConfigurationError(
                    f"theme.neoabs.reading_mode.notes.{field} must be a boolean."
                )
    elif notes is not None:
        raise ConfigurationError("theme.neoabs.reading_mode.notes must be a mapping.")

    scheme = reading_mode.get("scheme")
    if isinstance(scheme, dict):
        enabled = scheme.get("enabled")
        if enabled is not None and not isinstance(enabled, bool):
            raise ConfigurationError(
                "theme.neoabs.reading_mode.scheme.enabled must be a boolean."
            )
        name = scheme.get("name")
        if name is not None and (not isinstance(name, str) or not name.strip()):
            raise ConfigurationError(
                "theme.neoabs.reading_mode.scheme.name must be a non-empty string."
            )
        colors = scheme.get("colors")
        if colors is not None:
            if not isinstance(colors, dict):
                raise ConfigurationError(
                    "theme.neoabs.reading_mode.scheme.colors must be a mapping."
                )
            for key in colors:
                if key not in _VALID_READING_COLOR_KEYS:
                    raise ConfigurationError(
                        f"theme.neoabs.reading_mode.scheme.colors.{key} is not a "
                        "valid color key; expected one of "
                        f"{sorted(_VALID_READING_COLOR_KEYS)}."
                    )
    elif scheme is not None:
        raise ConfigurationError("theme.neoabs.reading_mode.scheme must be a mapping.")

    typography = reading_mode.get("typography")
    if isinstance(typography, dict):
        for field in ("font_size", "line_height", "measure"):
            value = typography.get(field)
            if value is not None and (not isinstance(value, str) or not value.strip()):
                raise ConfigurationError(
                    f"theme.neoabs.reading_mode.typography.{field} must be a "
                    "non-empty string."
                )
    elif typography is not None:
        raise ConfigurationError(
            "theme.neoabs.reading_mode.typography must be a mapping."
        )


def _validate_action_cluster(action_cluster):
    """Validate a merged `theme.neoabs.action_cluster` mapping, raising a clear
    MkDocs configuration error for malformed entries instead of silently
    degrading the plus menu."""
    if not isinstance(action_cluster, dict):
        raise ConfigurationError("theme.neoabs.action_cluster must be a mapping.")

    enabled = action_cluster.get("enabled")
    if enabled is not None and not isinstance(enabled, bool):
        raise ConfigurationError(
            "theme.neoabs.action_cluster.enabled must be a boolean."
        )

    position = action_cluster.get("position")
    if position is not None and position not in _NEOABS_ACTION_CLUSTER_POSITIONS:
        raise ConfigurationError(
            f"theme.neoabs.action_cluster.position must be one of "
            f"{sorted(_NEOABS_ACTION_CLUSTER_POSITIONS)}; got {position!r}."
        )

    offset = action_cluster.get("offset")
    if isinstance(offset, dict):
        for key, value in offset.items():
            if key not in _NEOABS_ACTION_CLUSTER_OFFSET_KEYS:
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.offset.{key} is not a valid "
                    "offset key; expected one of "
                    f"{sorted(_NEOABS_ACTION_CLUSTER_OFFSET_KEYS)}."
                )
            if not isinstance(value, str) or not value.strip():
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.offset.{key} must be a "
                    "non-empty string."
                )
    elif offset is not None:
        raise ConfigurationError(
            "theme.neoabs.action_cluster.offset must be a mapping."
        )

    main = action_cluster.get("main")
    if isinstance(main, dict):
        icon = main.get("icon")
        if icon is not None and icon not in _NEOABS_ACTION_CLUSTER_ICONS:
            raise ConfigurationError(
                f"theme.neoabs.action_cluster.main.icon must be one of "
                f"{sorted(_NEOABS_ACTION_CLUSTER_ICONS)}; got {icon!r}."
            )
        size = main.get("size")
        if size is not None and (not isinstance(size, str) or not size.strip()):
            raise ConfigurationError(
                "theme.neoabs.action_cluster.main.size must be a non-empty string."
            )
        for field in ("glass", "icon_transform"):
            value = main.get(field)
            if value is not None and not isinstance(value, bool):
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.main.{field} must be a boolean."
                )
    elif main is not None:
        raise ConfigurationError("theme.neoabs.action_cluster.main must be a mapping.")

    behavior = action_cluster.get("behavior")
    if isinstance(behavior, dict):
        min_actions = behavior.get("min_actions")
        if min_actions is not None and (
            isinstance(min_actions, bool) or not isinstance(min_actions, int)
        ):
            raise ConfigurationError(
                "theme.neoabs.action_cluster.behavior.min_actions must be an integer."
            )
        animation = behavior.get("animation")
        if animation is not None and animation not in _NEOABS_ACTION_CLUSTER_ANIMATIONS:
            raise ConfigurationError(
                f"theme.neoabs.action_cluster.behavior.animation must be one of "
                f"{sorted(_NEOABS_ACTION_CLUSTER_ANIMATIONS)}; got {animation!r}."
            )
        for field in _NEOABS_ACTION_CLUSTER_BEHAVIOR_BOOLS:
            value = behavior.get(field)
            if value is not None and not isinstance(value, bool):
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.behavior.{field} must be a boolean."
                )
    elif behavior is not None:
        raise ConfigurationError(
            "theme.neoabs.action_cluster.behavior must be a mapping."
        )

    replaces = action_cluster.get("replaces_notes_button")
    if replaces is not None and not isinstance(replaces, bool):
        raise ConfigurationError(
            "theme.neoabs.action_cluster.replaces_notes_button must be a boolean."
        )

    actions = action_cluster.get("actions")
    if actions is not None:
        if not isinstance(actions, list):
            raise ConfigurationError(
                "theme.neoabs.action_cluster.actions must be a list."
            )
        seen = set()
        for index, entry in enumerate(actions):
            if not isinstance(entry, dict):
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}] must be a "
                    "mapping with 'id', 'icon', 'label', 'shortcut', 'badge', "
                    "and 'enabled'."
                )
            action_id = entry.get("id")
            if action_id not in _NEOABS_ACTION_CLUSTER_IDS:
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].id is not a "
                    "known action id; expected one of "
                    f"{sorted(_NEOABS_ACTION_CLUSTER_IDS)}."
                )
            if action_id in seen:
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].id duplicates "
                    f"action {action_id!r}."
                )
            seen.add(action_id)
            icon = entry.get("icon")
            if icon is not None and icon not in _NEOABS_ACTION_CLUSTER_ICONS:
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].icon must be "
                    f"one of {sorted(_NEOABS_ACTION_CLUSTER_ICONS)}; got {icon!r}."
                )
            label_value = entry.get("label")
            if label_value is not None and (
                not isinstance(label_value, str) or not label_value.strip()
            ):
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].label must be "
                    "a non-empty string."
                )
            shortcut = entry.get("shortcut")
            if shortcut is not None and (
                not isinstance(shortcut, str) or not shortcut.strip()
            ):
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].shortcut must "
                    "be a non-empty key string (e.g. 'Alt+Shift+T')."
                )
            badge = entry.get("badge")
            if badge is not None and badge not in _NEOABS_ACTION_CLUSTER_BADGES:
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].badge must be "
                    f"one of {sorted(_NEOABS_ACTION_CLUSTER_BADGES)}; got "
                    f"{badge!r}."
                )
            action_enabled = entry.get("enabled")
            if action_enabled is not None and not isinstance(action_enabled, bool):
                raise ConfigurationError(
                    f"theme.neoabs.action_cluster.actions[{index}].enabled must "
                    "be a boolean."
                )


def _validate_timer(timer):
    """Validate a merged `theme.neoabs.timer` mapping, raising a clear MkDocs
    configuration error for malformed entries instead of silently degrading
    the focus timer."""
    if not isinstance(timer, dict):
        raise ConfigurationError("theme.neoabs.timer must be a mapping.")

    enabled = timer.get("enabled")
    if enabled is not None and not isinstance(enabled, bool):
        raise ConfigurationError("theme.neoabs.timer.enabled must be a boolean.")

    default_minutes = timer.get("default_minutes")
    if default_minutes is not None and (
        isinstance(default_minutes, bool)
        or not isinstance(default_minutes, int)
        or default_minutes < 1
    ):
        raise ConfigurationError(
            "theme.neoabs.timer.default_minutes must be a positive integer."
        )

    toc = timer.get("toc")
    if isinstance(toc, dict):
        toc_show = toc.get("show")
        if toc_show is not None and not isinstance(toc_show, bool):
            raise ConfigurationError("theme.neoabs.timer.toc.show must be a boolean.")
        position = toc.get("position")
        if position is not None and position not in _NEOABS_TIMER_TOC_POSITIONS:
            raise ConfigurationError(
                f"theme.neoabs.timer.toc.position must be one of "
                f"{sorted(_NEOABS_TIMER_TOC_POSITIONS)}; got {position!r}."
            )
        style = toc.get("style")
        if style is not None and style not in _NEOABS_TIMER_TOC_STYLES:
            raise ConfigurationError(
                f"theme.neoabs.timer.toc.style must be one of "
                f"{sorted(_NEOABS_TIMER_TOC_STYLES)}; got {style!r}."
            )
    elif toc is not None:
        raise ConfigurationError("theme.neoabs.timer.toc must be a mapping.")

    reading = timer.get("reading")
    if isinstance(reading, dict):
        reading_show = reading.get("show")
        if reading_show is not None and not isinstance(reading_show, bool):
            raise ConfigurationError(
                "theme.neoabs.timer.reading.show must be a boolean."
            )
    elif reading is not None:
        raise ConfigurationError("theme.neoabs.timer.reading must be a mapping.")

    notifications = timer.get("notifications")
    if isinstance(notifications, dict):
        for field in ("enabled", "toast", "sound"):
            value = notifications.get(field)
            if value is not None and not isinstance(value, bool):
                raise ConfigurationError(
                    f"theme.neoabs.timer.notifications.{field} must be a boolean."
                )
    elif notifications is not None:
        raise ConfigurationError("theme.neoabs.timer.notifications must be a mapping.")

    for field in (
        "persist",
        "settings_popup",
        "start_with_reading",
        "document_title",
        "badge_in_cluster",
    ):
        value = timer.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(f"theme.neoabs.timer.{field} must be a boolean.")

    display_format = timer.get("display_format")
    if (
        display_format is not None
        and display_format not in _NEOABS_TIMER_DISPLAY_FORMATS
    ):
        raise ConfigurationError(
            f"theme.neoabs.timer.display_format must be one of "
            f"{sorted(_NEOABS_TIMER_DISPLAY_FORMATS)}; got {display_format!r}."
        )

    colors = timer.get("colors")
    if isinstance(colors, dict):
        progress = colors.get("progress")
        if progress is not None and (
            not isinstance(progress, str) or not progress.strip()
        ):
            raise ConfigurationError(
                "theme.neoabs.timer.colors.progress must be a non-empty string."
            )
    elif colors is not None:
        raise ConfigurationError("theme.neoabs.timer.colors must be a mapping.")


def _validate_ai_reader(ai_reader):
    """Validate a merged `theme.neoabs.ai_reader` mapping, raising a clear MkDocs
    configuration error for malformed entries instead of silently degrading the
    AI-readable content surface."""
    if not isinstance(ai_reader, dict):
        raise ConfigurationError("theme.neoabs.ai_reader must be a mapping.")

    for field in _NEOABS_AI_READER_BOOLS:
        value = ai_reader.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.ai_reader.{field} must be a boolean."
            )

    url_style = ai_reader.get("url_style")
    if url_style is not None and url_style not in _NEOABS_AI_READER_URL_STYLES:
        raise ConfigurationError(
            f"theme.neoabs.ai_reader.url_style must be one of "
            f"{sorted(_NEOABS_AI_READER_URL_STYLES)}; got {url_style!r}."
        )

    description = ai_reader.get("description")
    if description is not None and not isinstance(description, str):
        raise ConfigurationError("theme.neoabs.ai_reader.description must be a string.")

    exclude = ai_reader.get("exclude")
    if exclude is not None:
        if not isinstance(exclude, list):
            raise ConfigurationError(
                "theme.neoabs.ai_reader.exclude must be a list of glob strings "
                '(e.g. "drafts/*.md").'
            )
        for pattern in exclude:
            if not isinstance(pattern, str) or not pattern.strip():
                raise ConfigurationError(
                    "theme.neoabs.ai_reader.exclude entries must be non-empty "
                    'glob strings (e.g. "drafts/*.md").'
                )

    watermark = ai_reader.get("watermark")
    if isinstance(watermark, dict):
        for field in _NEOABS_AI_READER_WATERMARK_BOOLS:
            value = watermark.get(field)
            if value is not None and not isinstance(value, bool):
                raise ConfigurationError(
                    f"theme.neoabs.ai_reader.watermark.{field} must be a boolean."
                )
        if watermark.get("enabled"):
            text = watermark.get("text")
            if not isinstance(text, str) or not text.strip():
                raise ConfigurationError(
                    "theme.neoabs.ai_reader.watermark.text must be a non-empty "
                    "string when watermark.enabled is true."
                )
    elif watermark is not None:
        raise ConfigurationError("theme.neoabs.ai_reader.watermark must be a mapping.")


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
        ("reading_mode", Type(dict)),
        ("action_cluster", Type(dict)),
        ("timer", Type(dict)),
        ("ai_reader", Type(dict)),
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

        # Phase 15: resolve reading-mode settings. Defaults are all-ON
        # (distraction-free view + Ink palette); user overrides are deep-merged
        # and validated, then the shortcut is seeded into the Phase 7 layer.
        provided_reading = neoabs.get("reading_mode")
        if not isinstance(provided_reading, dict):
            provided_reading = {}
        reading_mode = _deep_merge(_NEOABS_DEFAULT_READING_MODE, provided_reading)
        _validate_reading_mode(reading_mode)
        neoabs["reading_mode"] = reading_mode
        theme["neoabs"] = neoabs

        # Phase 16: resolve the action cluster (plus menu). Defaults ship all
        # four action slots ON (`keyboard_help`, `notes`, `timer`,
        # `reading_mode`); user overrides are deep-merged and validated, then
        # the toggle shortcut is seeded into the Phase 7 layer below so an
        # explicit `keyboard.shortcuts.toggle_action_cluster` the author set
        # still wins.
        provided_action_cluster = neoabs.get("action_cluster")
        if not isinstance(provided_action_cluster, dict):
            provided_action_cluster = {}
        action_cluster = _deep_merge(
            _NEOABS_DEFAULT_ACTION_CLUSTER, provided_action_cluster
        )
        _validate_action_cluster(action_cluster)
        neoabs["action_cluster"] = action_cluster
        theme["neoabs"] = neoabs

        # Phase 17: resolve the focus timer. Defaults ship fully ON (TOC
        # widget, reading chip, notifications, settings popup); user overrides
        # are deep-merged and validated, then the toggle shortcut is seeded
        # into the Phase 7 layer below so an explicit
        # `keyboard.shortcuts.timer_toggle` the author set still wins.
        provided_timer = neoabs.get("timer")
        if not isinstance(provided_timer, dict):
            provided_timer = {}
        timer = _deep_merge(_NEOABS_DEFAULT_TIMER, provided_timer)
        _validate_timer(timer)
        neoabs["timer"] = timer
        theme["neoabs"] = neoabs

        # Phase 19: resolve the AI-readable content mode. The whole surface
        # (mirrors, llms.txt, llms-full.txt, sitemap extension, watermarks)
        # ships ON by default; only `overwrite` (which could clobber a real
        # source) defaults to off, exactly as the phase mandates.
        provided_ai_reader = neoabs.get("ai_reader")
        if not isinstance(provided_ai_reader, dict):
            provided_ai_reader = {}
        ai_reader = _deep_merge(_NEOABS_DEFAULT_AI_READER, provided_ai_reader)
        _validate_ai_reader(ai_reader)
        neoabs["ai_reader"] = ai_reader
        theme["neoabs"] = neoabs

        # Mirror bookkeeping for the Phase 19 build hooks (a fresh build always
        # resets both so a plugin instance is never reused across builds).
        self._ai_mirrors = []
        self._ai_claimed = set()
        self._ai_warned_overwrite = False

        # Phase 18: mirror `timer.start_with_reading` into the reading-mode
        # layer. `setdefault` keeps an explicit `reading_mode.start_with_reading`
        # the author may have set earlier authoritative, while every site gets a
        # defined value (default False). The JS reads it from the merged reading
        # block so the boot-restore path (SPA refresh mid-session) still counts.
        reading_mode.setdefault("start_with_reading", timer["start_with_reading"])
        neoabs["reading_mode"] = reading_mode
        theme["neoabs"] = neoabs

        # Phase 7: resolve keyboard shortcuts. Defaults are all-ON (every
        # shortcut works out of the box); user overrides are deep-merged and
        # validated so a malformed key or custom action fails the build with a
        # clear message instead of silently disabling the shortcut layer.
        provided_keyboard = neoabs.get("keyboard")
        if not isinstance(provided_keyboard, dict):
            provided_keyboard = {}

        # Phase 15: seed the reading-mode shortcut from `reading_mode` before
        # the Phase 7 deep-merge, so an explicit
        # `keyboard.shortcuts.toggle_reading_mode` the author set still wins.
        seeded_keyboard = dict(provided_keyboard)
        if isinstance(provided_keyboard.get("shortcuts"), dict):
            seeded_keyboard["shortcuts"] = dict(provided_keyboard["shortcuts"])
        else:
            seeded_keyboard.setdefault("shortcuts", {})
        seeded_keyboard["shortcuts"].setdefault(
            "toggle_reading_mode",
            {
                "key": reading_mode.get("shortcut_key")
                or _NEOABS_DEFAULT_READING_MODE["shortcut_key"],
                "label": "Toggle reading mode",
                "enabled": reading_mode.get("enabled"),
                "persisted": reading_mode.get("persisted"),
            },
        )

        # Phase 16: seed the action-cluster shortcut from `action_cluster` so
        # an explicit `keyboard.shortcuts.toggle_action_cluster` wins.
        seeded_keyboard["shortcuts"].setdefault(
            "toggle_action_cluster",
            {
                "key": "Alt+Shift+A",
                "label": "Toggle action cluster",
                "enabled": action_cluster.get("enabled"),
                "persisted": False,
            },
        )

        # Phase 17: seed the focus-timer shortcut from `timer` so an explicit
        # `keyboard.shortcuts.timer_toggle` wins. The shortcut is never
        # persisted on its own; the timer *session* persistence is tracked
        # separately by the `timer.persist` knob.
        seeded_keyboard["shortcuts"].setdefault(
            "timer_toggle",
            {
                "key": "Alt+Shift+T",
                "label": "Toggle focus timer",
                "enabled": timer.get("enabled"),
                "persisted": False,
            },
        )

        keyboard = _deep_merge(_NEOABS_DEFAULT_KEYBOARD, seeded_keyboard)
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
        extra["neoabs_reading_mode"] = reading_mode
        extra["neoabs_action_cluster"] = action_cluster
        extra["neoabs_timer"] = timer
        extra["neoabs_ai_reader"] = ai_reader

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

    # -- Phase 19: AI-readable content mode -----------------------------------

    def on_post_page(self, output, *, page, config):
        """Write a watermarked markdown mirror beside the page's HTML output and
        advertise it in the rendered markup (alternate link + comment)."""
        extra = config.get("extra") or {}
        ai_reader = extra.get("neoabs_ai_reader") or _NEOABS_DEFAULT_AI_READER
        if not ai_reader.get("enabled") or not ai_reader.get("markup"):
            return output

        src_path = page.file.src_path.replace("\\", "/")
        if any(
            fnmatch.fnmatch(src_path, pattern)
            for pattern in (ai_reader.get("exclude") or [])
        ):
            return output

        rel = self._ai_mirror_rel(page, ai_reader.get("url_style"))
        if not rel:
            return output

        if not ai_reader.get("overwrite") and rel in self._ai_claimed:
            if not self._ai_warned_overwrite:
                self._ai_warned_overwrite = True
                _AI_LOGGER.warning(
                    "neoabs ai_reader: markdown mirror %r already has an "
                    "owner in this build; skipped. Set "
                    "theme.neoabs.ai_reader.overwrite to true to allow "
                    "clobbering.",
                    rel,
                )
            return output

        dest = os.path.join(config["site_dir"], *rel.split("/"))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        mirror_url = self._ai_mirror_url(rel, config)
        content = self._ai_mirror_content(ai_reader, page, mirror_url, config)
        with open(dest, "w", encoding="utf-8") as handle:
            handle.write(content)
        self._ai_claimed.add(rel)

        self._ai_mirrors.append(
            {
                "rel": rel,
                "url": mirror_url,
                "title": page.title or "",
                "description": self._ai_page_description(ai_reader, page),
            }
        )

        return self._ai_decorate_html(output, mirror_url)

    def on_post_build(self, *, config):
        """Emit llms.txt / llms-full.txt at the site root and extend sitemap.xml
        with the mirror URLs."""
        extra = config.get("extra") or {}
        ai_reader = extra.get("neoabs_ai_reader") or _NEOABS_DEFAULT_AI_READER
        if not ai_reader.get("enabled"):
            return

        mirrors = list(self._ai_mirrors)
        site_dir = config["site_dir"]
        if ai_reader.get("llms") and mirrors:
            self._ai_write_llms(site_dir, config, ai_reader, mirrors)
        if ai_reader.get("llms_full") and mirrors:
            self._ai_write_llms_full(site_dir, mirrors)
        if ai_reader.get("sitemap") and mirrors:
            self._ai_extend_sitemap(site_dir, mirrors)

    def _ai_mirror_rel(self, page, url_style):
        """POSIX relative site path of a page's markdown mirror.

        ``sidecar`` keeps the raw source-relative path (`foo/bar.md`); ``inline``
        places an `index.md` next to the page's directory URL (`foo/bar/index.md`).
        Index pages collapse to their own path in both styles.
        """
        if url_style != "inline":
            return page.file.src_path.replace("\\", "/")
        url = (getattr(page, "url", "") or "").rstrip("/")
        if not url or url.endswith("/index.html") or url == "index.html":
            return "index.md"
        if url.endswith(".html"):
            return url[: -len(".html")] + ".md"
        return posixpath.join(url, "index.md")

    def _ai_mirror_url(self, rel, config):
        """Absolute mirror URL when `site_url` is set, else a site-relative one."""
        site_url = (config.get("site_url") or "").rstrip("/")
        return f"{site_url}/{rel}" if site_url else rel

    def _ai_mirror_content(self, ai_reader, page, mirror_url, config):
        """Assemble the mirror: optional `# Title` (no duplicate H1) + watermark
        header/body/footer. The body is `page.markdown`, the raw source MkDocs
        already stripped of front matter, giving agents the highest fidelity."""
        watermark = ai_reader.get("watermark") or {}
        body = page.markdown or ""
        if ai_reader.get("auto_title") and not self._ai_has_h1(body):
            title = (page.title or "").strip()
            if title:
                body = f"# {title}\n\n{body}"

        parts = []
        header_lines = self._ai_watermark_lines(ai_reader, page, mirror_url, config)
        if header_lines:
            parts.append("\n".join(header_lines))
        parts.append(body.strip(" \t"))
        if watermark.get("footer"):
            parts.append("<!-- End of markdown mirror. -->")
        return "\n\n".join(parts).rstrip() + "\n"

    def _ai_watermark_lines(self, ai_reader, page, mirror_url, config):
        """Metadata block gating each `include_*` key (site/url/generated/version)."""
        watermark = ai_reader.get("watermark") or {}
        lines = []
        if not watermark.get("header"):
            return lines
        lines.append(
            f"<!-- {watermark.get('text', 'Generated by NeoAbs for AI agents.')} -->"
        )
        if watermark.get("include_site"):
            site_name = config.get("site_name") or ""
            if site_name:
                lines.append(f"<!-- Site: {site_name} -->")
        if watermark.get("include_url"):
            lines.append(f"<!-- URL: {mirror_url} -->")
        if watermark.get("include_generated"):
            stamp = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            lines.append(f"<!-- Generated: {stamp} -->")
        if watermark.get("include_version"):
            lines.append(f"<!-- Version: {_NEOABS_THEME_VERSION} -->")
        return lines

    @staticmethod
    def _ai_has_h1(text):
        """True when the markdown body already opens with a level-1 heading."""
        return any(line.lstrip().startswith("# ") for line in text.splitlines())

    def _ai_page_description(self, ai_reader, page):
        """llms.txt description: configured override, else `page.meta.description`,
        else the page title."""
        configured = ai_reader.get("description")
        if configured:
            return configured
        meta = getattr(page, "meta", None) or {}
        meta_desc = meta.get("description")
        if meta_desc:
            return str(meta_desc)
        return page.title or ""

    def _ai_decorate_html(self, output, mirror_url):
        """Add the `<link rel="alternate" type="text/markdown">` head tag and the
        machine-readable comment at the very top of `<body>`."""
        link = f'    <link rel="alternate" type="text/markdown" href="{mirror_url}">\n'
        if "</head>" in output:
            output = output.replace("</head>", link + "</head>", 1)
        body_match = re.search(r"<body[^>]*>", output)
        if body_match:
            comment = f"<!-- neoabs-ai-readable: {mirror_url} -->\n"
            output = (
                output[: body_match.end()] + "\n" + comment + output[body_match.end() :]
            )
        return output

    def _ai_write_llms(self, site_dir, config, ai_reader, mirrors):
        """Write llms.txt: site title + one `<url>\t<description>` line per mirror."""
        lines = [f"# {config.get('site_name') or 'NeoAbs'}", ""]
        for mirror in mirrors:
            lines.append(f"{mirror['url']}\t{mirror['description']}")
        with open(os.path.join(site_dir, "llms.txt"), "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")

    def _ai_write_llms_full(self, site_dir, mirrors):
        """Write llms-full.txt: every watermarked mirror concatenated in page
        order, separated by `--- (site) ---`."""
        contents = []
        for mirror in mirrors:
            path = os.path.join(site_dir, *mirror["rel"].split("/"))
            try:
                with open(path, encoding="utf-8") as handle:
                    contents.append(handle.read().strip())
            except OSError:
                continue
        with open(
            os.path.join(site_dir, "llms-full.txt"), "w", encoding="utf-8"
        ) as handle:
            handle.write("\n\n--- (site) ---\n\n".join(contents) + "\n")

    def _ai_extend_sitemap(self, site_dir, mirrors):
        """Append deduped mirror URLs to the generated sitemap.xml."""
        sitemap_path = os.path.join(site_dir, "sitemap.xml")
        if not os.path.exists(sitemap_path):
            return
        with open(sitemap_path, encoding="utf-8") as handle:
            content = handle.read()
        if "</urlset>" not in content:
            return
        existing = set(re.findall(r"<loc>(.*?)</loc>", content))
        entries = []
        for mirror in mirrors:
            url = (
                mirror["url"]
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
            )
            if url in existing:
                continue
            existing.add(url)
            entries.append(f"  <url><loc>{url}</loc></url>")
        if not entries:
            return
        block = "\n".join(entries) + "\n"
        with open(sitemap_path, "w", encoding="utf-8") as handle:
            handle.write(content.replace("</urlset>", block + "</urlset>", 1))
