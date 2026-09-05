"""NeoAbs theme plugin for MkDocs."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import ClassVar

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


class NeoAbsPlugin(BasePlugin):
    """Plugin that enhances the NeoAbs theme with additional context."""

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

        # B2: inject current year for the footer copyright far from relying on a
        # Jinja `now` global that MkDocs does not provide.
        # C1-C3: surface the neoabs theme options to templates so they can be
        # applied to the rendered output (glass, dot matrix, animation, border).
        extra = config.get("extra") or {}
        extra["neoabs_copyright_year"] = datetime.now(tz=timezone.utc).year
        extra["neoabs_glass"] = neoabs["glass"]
        extra["neoabs_dot_matrix"] = bool(neoabs["dot_matrix"])
        extra["neoabs_animation"] = neoabs["animation"]
        extra["neoabs_border"] = neoabs["border"]
        extra["neoabs_highlight"] = bool(
            neoabs["highlight"] and components["highlighting"]["show"]
        )
        extra["neoabs_notes"] = bool(neoabs["notes"] and components["notes"]["show"])
        extra["neoabs_notes_ttl"] = neoabs.get("notes_ttl")
        extra["neoabs_components"] = components

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
