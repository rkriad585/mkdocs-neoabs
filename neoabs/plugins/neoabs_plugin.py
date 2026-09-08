"""NeoAbs theme plugin for MkDocs."""

from __future__ import annotations

import fnmatch
import json
import logging
import mimetypes
import os
import posixpath
import re
import struct
import urllib.parse
import urllib.request
from collections.abc import Mapping, MutableMapping
from datetime import datetime, timezone
from typing import ClassVar

from mkdocs.config.base import PlainConfigSchema
from mkdocs.config.config_options import Type
from mkdocs.exceptions import ConfigurationError
from mkdocs.plugins import BasePlugin

# Theme version for the Phase 19 mirror watermark (`watermark.include_version`).
from .. import __version__ as _NEOABS_THEME_VERSION
from .. import social_card as _social_card

_AI_LOGGER = logging.getLogger("mkdocs.plugins.neoabs")

# Build-time cap for fetching a remote manifest icon (seconds). A slow/unreachable
# icon host must never hang a docs build — a failed fetch logs a warning and the
# manifest is emitted without an icon list instead.
_PWA_ICON_FETCH_TIMEOUT = 10

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
        "show_meta": True,
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
        "cdn_css_url": "",
    },
    "highlighting": {
        "show": True,
        "cdn_url": "",
        "cdn_css_url": "",
        "theme_dark": "github-dark",
        "theme_light": "github",
    },
    "prefetch": {
        # Phase 8 - prefetch-on-hover (InstantLoading-style). ON by default.
        # The hostname-relative check means on-site links are previewed as the
        # pointer hovers them; `external: true` optionally opts into off-site
        # links too, and `exclude` holds URL substrings that must never be
        # prefetched. `show: false` disables the whole feature.
        "show": True,
        "external": False,
        "exclude": [],
    },
    "repo_popover": {
        # Default ON: hover the header repo icon to preview the project. Every
        # info section is shipped by default; `fields` lets an author opt out
        # of specific sections (only what they list is rendered).
        "show": True,
        "fields": [
            "description",
            "owner_bio",
            "author",
            "followers",
            "public_repos",
            "location",
            "stars",
            "watchers",
            "forks",
            "open_issues",
            "language",
            "license",
            "default_branch",
            "commits",
            "tags",
            "latest_commit",
            "commit_msg",
            "created",
            "updated",
            "pushed",
        ],
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
    "feedback": {
        "show": True,
    },
    "announcement_bar": {
        "show": True,
    },
    "cookie_consent": {
        "show": True,
    },
    "giscus": {
        "show": True,
    },
}

# Phase 7 - Keyboard shortcuts.
#
# Every built-in shortcut is configurable and ON by default. `custom` holds
# user-defined shortcuts that dispatch to built-in action names; a built-in
# set of actions (scroll_to_top, toggle_sidebar, toggle_toc, toggle_notes,
# open_search, open_help, toggle_reading_mode, toggle_action_cluster,
# toggle_scheme, toggle_repo_popover, open_repo) is resolved in `neoabs.js`.
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
        "toggle_scheme": {
            "key": "Ctrl+Shift+L",
            "label": "Toggle color scheme",
            "enabled": True,
        },
        "toggle_repo_popover": {
            "key": "Ctrl+Shift+G",
            "label": "Toggle repo popover",
            "enabled": True,
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
        "image_lightbox": True,
    },
    "code": {
        "show_copy_button": True,
        "copy_label": "",
        "copied_label": "",
        "show_line_numbers": False,
        "line_number_start": 1,
        "highlight_lines": True,
        "line_number_color": "",
        "annotate": True,
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

# Phase 4: social cards & structured data. `extra.neoabs_og_image` set to the
# literal `"__auto__"` switches per-page card generation on; these keys gate the
# whole surface and its two halves (Article JSON-LD, card images) independently.
# Everything ships ON by default (working rule 5).
_NEOABS_DEFAULT_SOCIAL_CARDS = {
    "enabled": True,
    "jsonld": True,
    "cards": True,
}

# Allowed key sets for social cards so a typo fails the build loudly.
_NEOABS_SOCIAL_CARDS_BOOLS = ("enabled", "jsonld", "cards")

# Phase 5 - page metadata bar: last-updated date + edit-on-GitHub link.
_NEOABS_DEFAULT_META = {
    "enabled": True,
    "show_last_updated": True,
    "show_edit_on_github": True,
    "last_updated_label": "Last updated",
    "edit_label": "Edit this page",
    "date_source": "auto",
    "branch": "main",
    "source_dir": "docs",
}

_NEOABS_META_BOOLS = ("enabled", "show_last_updated", "show_edit_on_github")

# Phase 6 - engagement & privacy surfaces. Feedback opens a prefilled GitHub
# issue (no tracking); the announcement bar is a dismissable one-liner; cookie
# consent only shows when an integration that could touch personal data is
# configured; comments are opt-in via giscus (the only supported provider).
_NEOABS_DEFAULT_FEEDBACK = {
    "enabled": True,
    "show": True,
    "title": "Was this page helpful?",
    "positive": "Yes — thanks!",
    "negative": "No — open an issue",
    "github_labels": ["feedback"],
}

_NEOABS_FEEDBACK_BOOLS = ("enabled", "show")

_NEOABS_DEFAULT_ANNOUNCEMENT_BAR = {
    # Off by default: the bar renders only for sites that opt in with
    # `enabled: true` (plus a non-empty `text`).
    "enabled": False,
    "show": True,
    "text": "",
    "dismissable": True,
    "position": "bottom",
}

_NEOABS_ANNOUNCEMENT_BAR_BOOLS = ("enabled", "show", "dismissable")

_NEOABS_DEFAULT_COOKIE_CONSENT = {
    "enabled": True,
    "show": True,
    "render": "auto",
    "message": "This site stores nothing about you unless you enable integrations.",
    "accept_label": "Accept",
    "decline_label": "Decline",
    "privacy_policy": "",
    "position": "bottom",
}

_NEOABS_COOKIE_CONSENT_BOOLS = ("enabled", "show")
_NEOABS_COOKIE_CONSENT_RENDER = ("auto", "always", "never")
# Floating placement for the announcement bar and cookie consent: top/right/
# bottom/left pin a floating card to an edge; center shows a centered popup.
_NEOABS_FIXED_POSITIONS = ("top", "right", "bottom", "left", "center")

# Repo popover (Phase 14) info sections. Every section ships by default; an
# author opts out of individual sections via `components.repo_popover.fields`.
_REPO_POPOVER_FIELDS = (
    "description",
    "owner_bio",
    "author",
    "followers",
    "public_repos",
    "location",
    "stars",
    "watchers",
    "forks",
    "open_issues",
    "language",
    "license",
    "default_branch",
    "commits",
    "tags",
    "latest_commit",
    "commit_msg",
    "created",
    "updated",
    "pushed",
)

_NEOABS_DEFAULT_COMMENTS = {
    # Comments are opt-in: hidden by default. A site that configures `repo` +
    # `repo_id` but never sets `enabled: true` renders no comment section.
    "enabled": False,
    "provider": "giscus",
    "repo": "",
    "repo_id": "",
    "category": "",
    "category_id": "",
    "mapping": "pathname",
    "term": "",
    "language": "",
    "theme": {"light": "light", "dark": "dark"},
}

_NEOABS_COMMENTS_BOOLS = ("enabled",)
_NEOABS_COMMENTS_PROVIDERS = ("", "giscus")
_NEOABS_COMMENTS_MAPPINGS = ("pathname", "url", "title", "og:title", "specific")

# Phase 7 - UI-string i18n. This is the single source of truth for the chrome
# strings the JS and templates read from `#__config.translations` (clipboard,
# search, TOC, comments, a11y add-ons, footer). An author overrides any key via
# `theme.neoabs.i18n` — either the nested group form or the concise flat aliases
# (`search_placeholder`, `toc_title`, `back_to_top`, ...) which are normalized
# onto the nested structure below.
_NEOABS_DEFAULT_I18N = {
    "clipboard": {
        "copy": "Copy to clipboard",
        "copied": "Copied to clipboard",
        "copyLink": "Copy link",
        "linkCopied": "Link copied",
        "copyLinkFailed": "Copy link failed — clipboard unavailable",
    },
    "search": {
        "placeholder": "Search",
        "results": "Results",
        "noResults": "No results found",
        "startTyping": "Start typing to search...",
        "loading": "Loading search...",
        "loadError": "Search index could not be loaded.",
        "suggestions": "Search suggestions",
    },
    "toc": {
        "title": "On this page",
        "backToTop": "Back to top",
    },
    "comments": {
        "title": "Comments",
    },
    "zoom": {
        "preview": "Image preview",
        "close": "Close preview",
        "previous": "Previous image",
        "next": "Next image",
        "zoomIn": "Zoom in",
        "zoomOut": "Zoom out",
        "copyImage": "Copy image",
        "downloadImage": "Download image",
    },
    "a11y": {
        "breadcrumb": "Breadcrumb",
        "skipToContent": "Skip to content",
    },
    "repo": {
        "status": "Status",
        "noPublicData": "No public data",
        "loadError": "Unable to load repo data",
        "licenseNone": "None",
        "latestTag": "latest ",
        "author": "Author",
        "followers": "Followers",
        "publicRepos": "Public repos",
        "location": "Location",
        "stars": "Stars",
        "watchers": "Watchers",
        "forks": "Forks",
        "openIssues": "Open issues",
        "language": "Language",
        "license": "License",
        "defaultBranch": "Default branch",
        "commits": "Commits",
        "tags": "Tags",
        "latestCommit": "Latest commit",
        "commitMsg": "Last commit msg",
        "created": "Created",
        "updated": "Last updated",
        "pushed": "Last pushed",
    },
    "notes": {
        "notes": "Notes",
        "close": "Close notes",
        "add": "+ Add note",
        "exportMd": "Export .md",
        "exportJson": "Export .json",
        "placeholder": "Write a note…",
        "cancel": "Cancel",
        "save": "Save",
        "saveChanges": "Save changes",
        "colorPrefix": "Color ",
        "delete": "Delete",
        "empty": "No notes yet.",
    },
    "timer": {
        "focus": "Focus",
        "title": "Focus Timer",
        "settings": "Focus timer settings",
        "close": "Close",
        "sessionLength": "Session length (minutes)",
        "tocStyle": "TOC timer style",
        "tocPosition": "TOC timer position",
        "readingChip": "Reading-mode chip",
        "toastNotify": "Toast on completion",
        "chime": "Chime on completion",
        "cancel": "Cancel",
        "startSession": "Start session",
        "start": "Start timer",
        "restart": "Restart timer",
        "stop": "Stop timer",
        "reset": "Reset timer",
        "controls": "Timer controls",
        "complete": "Focus session complete",
        "ring": "Ring",
        "bar": "Bar",
        "digits": "Digits",
        "top": "Top",
        "bottom": "Bottom",
    },
    "footer": {
        "previous": "Previous",
        "next": "Next",
    },
    "navigation": {
        "label": "Navigation",
    },
    "help": {
        "title": "Keyboard shortcuts",
    },
}

# Phase 7 - flat alias -> nested i18n group/child path. Keeps the documented
# one-level `i18n:` block (`search_placeholder`, `toc_title`, `back_to_top`)
# working while the JS consumes the nested shape above.
_NEOABS_I18N_FLAT_ALIASES = {
    "search_placeholder": ("search", "placeholder"),
    "search_results": ("search", "results"),
    "search_no_results": ("search", "noResults"),
    "search_start_typing": ("search", "startTyping"),
    "search_loading": ("search", "loading"),
    "search_load_error": ("search", "loadError"),
    "search_suggestions": ("search", "suggestions"),
    "toc_title": ("toc", "title"),
    "back_to_top": ("toc", "backToTop"),
    "copy_to_clipboard": ("clipboard", "copy"),
    "copied_to_clipboard": ("clipboard", "copied"),
    "copy_link": ("clipboard", "copyLink"),
    "link_copied": ("clipboard", "linkCopied"),
    "comments_title": ("comments", "title"),
    "skip_to_content": ("a11y", "skipToContent"),
    "breadcrumb_label": ("a11y", "breadcrumb"),
    "previous_page": ("footer", "previous"),
    "next_page": ("footer", "next"),
}

# Phase 7 - breadcrumbs. A trail above the content top whenever a page has
# ancestors; the toggle ships ON so nothing has to be configured.
_NEOABS_DEFAULT_BREADCRUMBS = {"show": True}
_NEOABS_BREADCRUMBS_BOOLS = ("show",)

# Phase 7 - PWA identity. The plugin auto-generates `manifest.webmanifest` so a
# docs build is installable with the service worker the theme already ships.
# `theme_color` / `start_url` fall back to `extra.neoabs_theme_color` /
# `site_url`; icons resolve from the local logo. Ships ON by default (a logo-less
# site simply gets a manifest without an icon list).
_NEOABS_DEFAULT_PWA = {
    "manifest": True,
    "display": "standalone",
    "icons": True,
    "theme_color": "",
    "background_color": "#111114",
    "start_url": "",
}
_NEOABS_PWA_BOOLS = ("manifest", "icons")
_NEOABS_PWA_DISPLAYS = ("standalone", "fullscreen", "minimal-ui", "browser")

# Phase 8 - asset referencing (`cdn | local | bundle`) + inline critical CSS.
#
# `cdn` (the default) keeps today's runtime CDN loading exactly as-is: builds
# stay deterministic and need no network. `local` and `bundle` are opt-in: the
# plugin vendors the three lazy libraries (highlight.js, KaTeX, Mermaid) into
# `site/<vendor_dir>` at build time and points the component loaders at the
# local copies, so the built site is self-hosted and offline-capable. `bundle`
# additionally concatenates the vendored JS into a single file (each loader
# then dedupes onto the same URL). Google Fonts stay external in every mode.
_NEOABS_ASSET_MODES = frozenset({"cdn", "local", "bundle"})
_NEOABS_DEFAULT_ASSETS = {
    "mode": "cdn",
    "inline_critical_css": False,
    "vendor_dir": "assets/vendor",
    "timeout": 20,
}
_NEOABS_ASSET_BOOLS = ("inline_critical_css",)

# The exact CDN URLs the theme would request at runtime in `cdn` mode. `mode:
# local`/`bundle` fetches precisely these files so the vendored output matches
# what a `cdn` build would have loaded (the same strings `neoabs.js` and
# `base.html` fall back to when no component `cdn_url` is set).
_NEOABS_ASSET_CDN = {
    "highlighting_js": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
    "highlighting_css": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/",
    "mermaid_js": "https://cdn.jsdelivr.net/npm/mermaid@10.9.8/dist/mermaid.min.js",
    "math_css": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
    "math_js": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
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


def _normalize_i18n_overrides(provided):
    """Fold the concise flat alias keys (`theme.neoabs.i18n.search_placeholder`)
    into the nested groups the JS consumes (`search.placeholder`) so both the
    documented one-level block and the full nested form produce the same shape."""
    normalized = {}
    if not isinstance(provided, dict):
        return normalized
    for key, value in provided.items():
        alias = _NEOABS_I18N_FLAT_ALIASES.get(key)
        if alias is not None:
            group, child = alias
            normalized.setdefault(group, {})[child] = value
        elif isinstance(value, dict):
            normalized[key] = value
        else:
            normalized[key] = value
    return normalized


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


def _validate_social_cards(social_cards):
    """Validate a merged `theme.neoabs.social_cards` mapping, raising a clear MkDocs
    configuration error for malformed entries instead of silently degrading the
    social-card / structured-data surface."""
    if not isinstance(social_cards, dict):
        raise ConfigurationError("theme.neoabs.social_cards must be a mapping.")

    for field in _NEOABS_SOCIAL_CARDS_BOOLS:
        value = social_cards.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.social_cards.{field} must be a boolean."
            )


def _validate_meta(meta):
    """Validate a merged `theme.neoabs.meta` mapping, raising a clear MkDocs
    configuration error for malformed entries instead of silently dropping the
    last-updated / edit-on-GitHub page metadata bar."""
    if not isinstance(meta, dict):
        raise ConfigurationError("theme.neoabs.meta must be a mapping.")

    for field in _NEOABS_META_BOOLS:
        value = meta.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(f"theme.neoabs.meta.{field} must be a boolean.")

    date_source = meta.get("date_source")
    if date_source not in (None, "", "auto", "front_matter", "git"):
        raise ConfigurationError(
            "theme.neoabs.meta.date_source must be one of: "
            "'auto', 'front_matter', 'git'."
        )

    for field in ("branch", "source_dir"):
        value = meta.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(f"theme.neoabs.meta.{field} must be a string.")

    for field in ("last_updated_label", "edit_label"):
        value = meta.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(f"theme.neoabs.meta.{field} must be a string.")


def _validate_feedback(feedback):
    """Validate a merged `theme.neoabs.feedback` mapping, raising a clear MkDocs
    configuration error for malformed entries instead of silently dropping the
    shared-issue feedback widget."""
    if not isinstance(feedback, dict):
        raise ConfigurationError("theme.neoabs.feedback must be a mapping.")

    for field in _NEOABS_FEEDBACK_BOOLS:
        value = feedback.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.feedback.{field} must be a boolean."
            )

    for field in ("title", "positive", "negative"):
        value = feedback.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(f"theme.neoabs.feedback.{field} must be a string.")

    labels = feedback.get("github_labels")
    if labels is not None:
        if not isinstance(labels, list):
            raise ConfigurationError(
                "theme.neoabs.feedback.github_labels must be a list of "
                "GitHub label strings."
            )
        for label in labels:
            if not isinstance(label, str) or not label.strip():
                raise ConfigurationError(
                    "theme.neoabs.feedback.github_labels entries must be "
                    "non-empty strings."
                )


def _validate_announcement_bar(announcement_bar):
    """Validate a merged `theme.neoabs.announcement_bar` mapping, raising a clear
    MkDocs configuration error for malformed entries instead of silently dropping
    the announcement bar."""
    if not isinstance(announcement_bar, dict):
        raise ConfigurationError("theme.neoabs.announcement_bar must be a mapping.")

    for field in _NEOABS_ANNOUNCEMENT_BAR_BOOLS:
        value = announcement_bar.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.announcement_bar.{field} must be a boolean."
            )

    text = announcement_bar.get("text")
    if text is not None and not isinstance(text, str):
        raise ConfigurationError("theme.neoabs.announcement_bar.text must be a string.")

    position = announcement_bar.get("position")
    if position is not None and position not in _NEOABS_FIXED_POSITIONS:
        raise ConfigurationError(
            "theme.neoabs.announcement_bar.position must be one of "
            f"{sorted(_NEOABS_FIXED_POSITIONS)}; got {position!r}."
        )


def _validate_cookie_consent(cookie_consent):
    """Validate a merged `theme.neoabs.cookie_consent` mapping, raising a clear
    MkDocs configuration error for malformed entries instead of silently dropping
    the consent banner."""
    if not isinstance(cookie_consent, dict):
        raise ConfigurationError("theme.neoabs.cookie_consent must be a mapping.")

    for field in _NEOABS_COOKIE_CONSENT_BOOLS:
        value = cookie_consent.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.cookie_consent.{field} must be a boolean."
            )

    for field in ("message", "accept_label", "decline_label", "privacy_policy"):
        value = cookie_consent.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(
                f"theme.neoabs.cookie_consent.{field} must be a string."
            )

    render = cookie_consent.get("render")
    if render not in (None,) + _NEOABS_COOKIE_CONSENT_RENDER:
        raise ConfigurationError(
            "theme.neoabs.cookie_consent.render must be one of "
            f"{sorted(_NEOABS_COOKIE_CONSENT_RENDER)}; got {render!r}."
        )

    position = cookie_consent.get("position")
    if position is not None and position not in _NEOABS_FIXED_POSITIONS:
        raise ConfigurationError(
            "theme.neoabs.cookie_consent.position must be one of "
            f"{sorted(_NEOABS_FIXED_POSITIONS)}; got {position!r}."
        )


def _validate_repo_popover(repo_popover):
    """Validate a merged `theme.neoabs.components.repo_popover` mapping. `show`
    gates the whole feature (default on); `fields` picks which info sections are
    rendered (default: every section)."""
    if not isinstance(repo_popover, dict):
        raise ConfigurationError(
            "theme.neoabs.components.repo_popover must be a mapping."
        )

    show = repo_popover.get("show")
    if show is not None and not isinstance(show, bool):
        raise ConfigurationError(
            "theme.neoabs.components.repo_popover.show must be a boolean."
        )

    fields = repo_popover.get("fields")
    if fields is not None:
        if not isinstance(fields, (list, tuple)):
            raise ConfigurationError(
                "theme.neoabs.components.repo_popover.fields must be a list of "
                "field names."
            )
        for field in fields:
            if not isinstance(field, str) or field not in _REPO_POPOVER_FIELDS:
                raise ConfigurationError(
                    "theme.neoabs.components.repo_popover.fields contains an "
                    f"unknown field {field!r}; allowed fields: "
                    f"{', '.join(_REPO_POPOVER_FIELDS)}."
                )


def _validate_comments(comments):
    """Validate a merged `theme.neoabs.comments` mapping, raising a clear MkDocs
    configuration error for malformed entries instead of silently dropping the
    giscus comments integration."""
    if not isinstance(comments, dict):
        raise ConfigurationError("theme.neoabs.comments must be a mapping.")

    for field in _NEOABS_COMMENTS_BOOLS:
        value = comments.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.comments.{field} must be a boolean."
            )

    provider = comments.get("provider")
    if provider not in (None, "") and provider not in _NEOABS_COMMENTS_PROVIDERS:
        raise ConfigurationError(
            "theme.neoabs.comments.provider must be one of "
            f"{sorted(_NEOABS_COMMENTS_PROVIDERS)}; got {provider!r}."
        )

    mapping = comments.get("mapping")
    if mapping not in (None, "") and mapping not in _NEOABS_COMMENTS_MAPPINGS:
        raise ConfigurationError(
            "theme.neoabs.comments.mapping must be one of "
            f"{sorted(_NEOABS_COMMENTS_MAPPINGS)}; got {mapping!r}."
        )

    for field in ("repo", "repo_id", "category", "category_id", "term", "language"):
        value = comments.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(f"theme.neoabs.comments.{field} must be a string.")

    repo = comments.get("repo") or ""
    if isinstance(repo, str) and repo.strip() and "/" not in repo:
        raise ConfigurationError(
            "theme.neoabs.comments.repo must be in the 'owner/repo' form "
            "(e.g. 'user/mkdocs-docs')."
        )

    theme = comments.get("theme")
    if isinstance(theme, dict):
        for field in ("light", "dark"):
            value = theme.get(field)
            if value is not None and not isinstance(value, str):
                raise ConfigurationError(
                    f"theme.neoabs.comments.theme.{field} must be a string."
                )
    elif theme is not None:
        raise ConfigurationError("theme.neoabs.comments.theme must be a mapping.")


_NEOABS_GLASS_VALUES = ("light", "medium", "heavy", "none")
_NEOABS_ANIMATION_VALUES = ("normal", "reduced", "none")
_NEOABS_BORDER_VALUES = ("none", "thin", "thick")


def _validate_i18n(i18n):
    """Validate a merged `theme.neoabs.i18n` mapping. Values are nested string
    groups (`search.placeholder`); a top-level scalar is a typo'd flat alias and
    fails the build loudly so no dead config key survives."""
    if not isinstance(i18n, dict):
        raise ConfigurationError("theme.neoabs.i18n must be a mapping.")

    for key, value in i18n.items():
        if isinstance(value, dict):
            for child_key, child_value in value.items():
                if not isinstance(child_value, str):
                    raise ConfigurationError(
                        f"theme.neoabs.i18n.{key}.{child_key} must be a string."
                    )
            continue
        if isinstance(value, str):
            raise ConfigurationError(
                "theme.neoabs.i18n contains an unknown flat key "
                f"{key!r}; supported flat keys: "
                f"{', '.join(sorted(_NEOABS_I18N_FLAT_ALIASES))}."
            )
        raise ConfigurationError(
            f"theme.neoabs.i18n.{key} must be a string or a mapping."
        )


def _validate_breadcrumbs(breadcrumbs):
    """Validate a merged `theme.neoabs.breadcrumbs` mapping, raising a clear
    MkDocs configuration error for a malformed `show` toggle."""
    if not isinstance(breadcrumbs, dict):
        raise ConfigurationError("theme.neoabs.breadcrumbs must be a mapping.")

    for field in _NEOABS_BREADCRUMBS_BOOLS:
        value = breadcrumbs.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(
                f"theme.neoabs.breadcrumbs.{field} must be a boolean."
            )


def _validate_pwa(pwa):
    """Validate a merged `theme.neoabs.pwa` mapping. `manifest`/`icons` gates
    the generated manifest surface; `display` must be a valid web-app display
    mode so the emitted manifest can never be malformed."""
    if not isinstance(pwa, dict):
        raise ConfigurationError("theme.neoabs.pwa must be a mapping.")

    for field in _NEOABS_PWA_BOOLS:
        value = pwa.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(f"theme.neoabs.pwa.{field} must be a boolean.")

    display = pwa.get("display")
    if display not in (None,) + _NEOABS_PWA_DISPLAYS:
        raise ConfigurationError(
            "theme.neoabs.pwa.display must be one of "
            f"{sorted(_NEOABS_PWA_DISPLAYS)}; got {display!r}."
        )

    for field in ("theme_color", "background_color", "start_url"):
        value = pwa.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(f"theme.neoabs.pwa.{field} must be a string.")


def _validate_assets(assets):
    """Validate a merged `theme.neoabs.assets` mapping. `mode` gates how the
    lazy libraries (highlight.js, KaTeX, Mermaid) are referenced at runtime;
    `vendor_dir` is the site-relative directory vendored copies are stored under
    in `local`/`bundle` mode; `timeout` bounds the build-time downloads."""
    if not isinstance(assets, dict):
        raise ConfigurationError("theme.neoabs.assets must be a mapping.")

    for field in _NEOABS_ASSET_BOOLS:
        value = assets.get(field)
        if value is not None and not isinstance(value, bool):
            raise ConfigurationError(f"theme.neoabs.assets.{field} must be a boolean.")

    mode = assets.get("mode")
    if mode not in (None,) + tuple(sorted(_NEOABS_ASSET_MODES)):
        raise ConfigurationError(
            "theme.neoabs.assets.mode must be one of "
            f"{sorted(_NEOABS_ASSET_MODES)}; got {mode!r}."
        )

    for field in ("vendor_dir",):
        value = assets.get(field)
        if value is not None and not isinstance(value, str):
            raise ConfigurationError(f"theme.neoabs.assets.{field} must be a string.")

    timeout = assets.get("timeout")
    if timeout is not None and (not isinstance(timeout, int) or timeout <= 0):
        raise ConfigurationError(
            "theme.neoabs.assets.timeout must be a positive integer."
        )


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
        ("social_cards", Type(dict)),
        ("meta", Type(dict)),
        ("feedback", Type(dict)),
        ("announcement_bar", Type(dict)),
        ("cookie_consent", Type(dict)),
        ("comments", Type(dict)),
        ("i18n", Type(dict)),
        ("breadcrumbs", Type(dict)),
        ("pwa", Type(dict)),
        ("assets", Type(dict)),
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

        # Production `site_url` captured at on_config time. `mkdocs serve`
        # overwrites `config.site_url` with the live server URL only after the
        # plugins run, so this is the one place the deployed URL is still
        # visible. It powers the JS link rebase: links baked with the main site
        # URL fall back to localhost:{port} during previews. If the configured
        # value already points at a local server, keep it empty so nothing is
        # rewritten.
        raw_site_url = (config.get("site_url") or "").strip().rstrip("/")
        if raw_site_url.startswith(
            ("http://localhost", "http://127.0.0.1", "http://[::1]", "file://")
        ):
            raw_site_url = ""

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
        _validate_repo_popover(components.get("repo_popover"))
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

        # Phase 4: resolve social cards & structured data. The whole surface
        # (per-page Article JSON-LD + auto card images) ships ON by default;
        # `cards` only fires when `extra.neoabs_og_image` is also `__auto__`.
        provided_social_cards = neoabs.get("social_cards")
        if not isinstance(provided_social_cards, dict):
            provided_social_cards = {}
        social_cards = _deep_merge(_NEOABS_DEFAULT_SOCIAL_CARDS, provided_social_cards)
        _validate_social_cards(social_cards)
        neoabs["social_cards"] = social_cards
        theme["neoabs"] = neoabs

        # Phase 5 - page metadata bar: last-updated date + edit-on-GitHub link.
        provided_meta = neoabs.get("meta")
        if not isinstance(provided_meta, dict):
            provided_meta = {}
        meta = _deep_merge(_NEOABS_DEFAULT_META, provided_meta)
        _validate_meta(meta)
        neoabs["meta"] = meta
        theme["neoabs"] = neoabs

        # Phase 6 - engagement & privacy: shared-issue feedback widget. The PRD
        # config uses `show: true`; the master `enabled` switch keeps the surface
        # consistent with every other NeoAbs feature that ships ON by default.
        provided_feedback = neoabs.get("feedback")
        if not isinstance(provided_feedback, dict):
            provided_feedback = {}
        feedback = _deep_merge(_NEOABS_DEFAULT_FEEDBACK, provided_feedback)
        _validate_feedback(feedback)
        neoabs["feedback"] = feedback
        theme["neoabs"] = neoabs

        # Phase 6 - announcement bar. `announcement_bar.text` is the primary
        # source; the legacy `extra.neoabs_announce` string from the PRD config
        # block is honored as a convenience alias when the dict text is unset.
        provided_announcement_bar = neoabs.get("announcement_bar")
        if not isinstance(provided_announcement_bar, dict):
            provided_announcement_bar = {}
        announcement_bar = _deep_merge(
            _NEOABS_DEFAULT_ANNOUNCEMENT_BAR, provided_announcement_bar
        )
        _validate_announcement_bar(announcement_bar)
        if not announcement_bar["text"]:
            legacy_announce = (config.get("extra") or {}).get("neoabs_announce")
            if isinstance(legacy_announce, str) and legacy_announce.strip():
                announcement_bar["text"] = legacy_announce.strip()
        neoabs["announcement_bar"] = announcement_bar
        theme["neoabs"] = neoabs

        # Phase 6 - cookie consent. The banner is purely informational and
        # stores no data itself; `consent_needed` (computed below) ties its
        # appearance to an actual third-party integration being configured.
        provided_cookie_consent = neoabs.get("cookie_consent")
        if not isinstance(provided_cookie_consent, dict):
            provided_cookie_consent = {}
        cookie_consent = _deep_merge(
            _NEOABS_DEFAULT_COOKIE_CONSENT, provided_cookie_consent
        )
        _validate_cookie_consent(cookie_consent)
        neoabs["cookie_consent"] = cookie_consent
        theme["neoabs"] = neoabs

        # Phase 6 - comments. giscus is injected only when `repo` + `repo_id`
        # are configured; everything else (labels, mapping, theme sync) is
        # additive and optional.
        provided_comments = neoabs.get("comments")
        if not isinstance(provided_comments, dict):
            provided_comments = {}
        comments = _deep_merge(_NEOABS_DEFAULT_COMMENTS, provided_comments)
        _validate_comments(comments)
        neoabs["comments"] = comments
        theme["neoabs"] = neoabs

        # Phase 7 - UI-string i18n. Defaults carry the complete English chrome
        # string set; author overrides (nested groups or the flat aliases) are
        # normalized, deep-merged and validated so a typo fails the build.
        provided_i18n = neoabs.get("i18n")
        if not isinstance(provided_i18n, dict):
            provided_i18n = {}
        i18n = _deep_merge(
            _NEOABS_DEFAULT_I18N, _normalize_i18n_overrides(provided_i18n)
        )
        _validate_i18n(i18n)
        neoabs["i18n"] = i18n
        theme["neoabs"] = neoabs

        # Phase 7 - breadcrumbs. Renders above the content top whenever a page
        # has ancestors; the toggle ships ON by default.
        provided_breadcrumbs = neoabs.get("breadcrumbs")
        if not isinstance(provided_breadcrumbs, dict):
            provided_breadcrumbs = {}
        breadcrumbs_cfg = _deep_merge(_NEOABS_DEFAULT_BREADCRUMBS, provided_breadcrumbs)
        _validate_breadcrumbs(breadcrumbs_cfg)
        neoabs["breadcrumbs"] = breadcrumbs_cfg
        theme["neoabs"] = neoabs

        # Phase 7 - PWA identity. Auto-generated manifest + app meta ships ON by
        # default; theme_color/start_url/icons fall back to site config when the
        # author leaves them empty.
        provided_pwa = neoabs.get("pwa")
        if not isinstance(provided_pwa, dict):
            provided_pwa = {}
        pwa = _deep_merge(_NEOABS_DEFAULT_PWA, provided_pwa)
        _validate_pwa(pwa)
        neoabs["pwa"] = pwa
        theme["neoabs"] = neoabs

        # Phase 8 - asset referencing (`cdn | local | bundle`) + inline critical
        # CSS. Default `cdn` keeps today's runtime CDN loading exactly as-is;
        # `local`/`bundle` (opt-in) point the highlighting/mermaid/math loaders
        # at vendored copies that on_pre_build downloads under `vendor_dir`. The
        # original (author-supplied or empty) component URLs are snapshotted so
        # a failed download can restore the CDN fallback instead of leaving a
        # dangling local reference. `inline_critical_css` only makes sense with
        # vendored CSS, so it is ignored with a warning under `cdn`.
        provided_assets = neoabs.get("assets")
        if not isinstance(provided_assets, dict):
            provided_assets = {}
        assets = _deep_merge(_NEOABS_DEFAULT_ASSETS, provided_assets)
        _validate_assets(assets)
        neoabs["assets"] = assets
        theme["neoabs"] = neoabs

        mode = assets["mode"]
        self._asset_originals = {}
        if mode in ("local", "bundle"):
            vendor = str(assets["vendor_dir"] or "").strip().strip("/")
            if not vendor:
                vendor = str(_NEOABS_DEFAULT_ASSETS["vendor_dir"]).strip("/")
            vendor = vendor + "/"
            hljs_cfg = components["highlighting"]
            mermaid_cfg = components["mermaid"]
            math_cfg = components["math"]
            self._asset_originals = {
                ("highlighting", "cdn_url"): hljs_cfg.get("cdn_url"),
                ("highlighting", "cdn_css_url"): hljs_cfg.get("cdn_css_url"),
                ("mermaid", "cdn_url"): mermaid_cfg.get("cdn_url"),
                ("math", "cdn_url"): math_cfg.get("cdn_url"),
                ("math", "cdn_css_url"): math_cfg.get("cdn_css_url"),
            }
            bundle_js = f"{vendor}bundle/neoabs-offline.js"
            hljs_cfg["cdn_url"] = (
                bundle_js if mode == "bundle" else f"{vendor}highlight/highlight.min.js"
            )
            mermaid_cfg["cdn_url"] = (
                bundle_js if mode == "bundle" else f"{vendor}mermaid/mermaid.min.js"
            )
            math_cfg["cdn_url"] = (
                bundle_js if mode == "bundle" else f"{vendor}katex/dist/katex.min.js"
            )
            hljs_cfg["cdn_css_url"] = f"{vendor}highlight/styles/"
            math_cfg["cdn_css_url"] = f"{vendor}katex/dist/katex.min.css"
        elif assets.get("inline_critical_css"):
            _AI_LOGGER.warning(
                "neoabs assets: inline_critical_css only applies when "
                "assets.mode is 'local' or 'bundle'; ignored under 'cdn'."
            )

        # Phase 6 - consent gating. NeoAbs ships no trackers, so the consent
        # banner renders only when an integration that could collect personal
        # data is actually configured: `theme.analytics.gtag` (Google Analytics)
        # or a configured giscus comments provider. A site with neither is never
        # disturbed by a consent dialog (the privacy-first default).
        analytics = theme.get("analytics") if hasattr(theme, "get") else None
        gtag = ""
        if isinstance(analytics, Mapping):
            gtag = str(analytics.get("gtag") or "")
        giscus_configured = bool(
            comments.get("enabled")
            and comments.get("provider") == "giscus"
            and str(comments.get("repo") or "").strip()
            and str(comments.get("repo_id") or "").strip()
        )
        consent_on = bool(cookie_consent.get("enabled") and cookie_consent.get("show"))
        render = cookie_consent.get("render") or "auto"
        consent_needed = bool(
            consent_on
            and render != "never"
            and (render == "always" or bool(gtag.strip()) or giscus_configured)
        )

        # Mirror bookkeeping for the Phase 19 build hooks (a fresh build always
        # resets both so a plugin instance is never reused across builds).
        self._ai_mirrors = []
        self._ai_claimed = set()
        self._ai_warned_overwrite = False
        # Phase 4 bookkeeping: per-page social cards resolved during the render;
        # the image format is locked at config time so the stamped og:image URLs
        # and the files written by on_post_build always agree.
        self._social_pages = []
        self._social_format = _social_card.available_format()

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
        extra["neoabs_social_cards"] = social_cards
        extra["neoabs_meta"] = meta
        extra["neoabs_feedback"] = feedback
        extra["neoabs_announcement_bar"] = announcement_bar
        extra["neoabs_cookie_consent"] = cookie_consent
        extra["neoabs_comments"] = comments
        extra["neoabs_consent_needed"] = consent_needed
        extra["neoabs_i18n"] = i18n
        extra["neoabs_breadcrumbs"] = breadcrumbs_cfg
        extra["neoabs_pwa"] = pwa
        extra["neoabs_assets"] = assets
        extra["neoabs_site_url"] = raw_site_url

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
        # Phase 1: wire theme.font so a standard MkDocs theme.font block drives
        # the body/code font stacks. Appended last so it wins over any matching
        # neoabs.typography token the author set on the same vars.
        theme_font = theme.get("font")
        if isinstance(theme_font, dict):
            if theme_font.get("text"):
                tokens.append(
                    {
                        "var": "--neoabs-font-body",
                        "value": theme_font["text"] + ", sans-serif",
                    }
                )
            if theme_font.get("code"):
                tokens.append(
                    {
                        "var": "--neoabs-font-mono",
                        "value": theme_font["code"] + ", monospace",
                    }
                )
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

    # -- Phase 8: asset vendoring -------------------------------------------------

    def _asset_fetch(self, url, site_abs_path, timeout):
        """Download ``url`` into an absolute path under the site dir.

        Never raises: a failed (or timed-out) fetch logs a warning and returns
        ``False`` so the caller can fall back to the component's CDN URL. This
        keeps a docs build resilient to transient network problems — the build
        itself never fails because a CDN was unreachable at build time."""
        try:
            request = urllib.request.Request(
                url, headers={"User-Agent": "mkdocs-neoabs/{}/+assets".format("1")}
            )
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = response.read()
            if not data:
                return False
        except (OSError, ValueError):
            _AI_LOGGER.warning(
                "neoabs assets: could not vendor %s at build time — the "
                "component falls back to its CDN URL in the built site.",
                url,
            )
            return False
        if site_abs_path is None:
            return False
        os.makedirs(os.path.dirname(site_abs_path), exist_ok=True)
        with open(site_abs_path, "wb") as handle:
            handle.write(data)
        return True

    def _asset_rebase_urls(self, text, css_url, dest_dir, site_dir, timeout):
        """Store the KaTeX stylesheet and fetch every font it references.

        KaTeX's ``katex.min.css`` references its glyphs with relative
        ``url(fonts/...)`` paths. Copying the file keeps those relative
        references valid only if the font files keep the same relative layout,
        so this helper downloads each referenced font next to the stylesheet.
        Returns ``True`` only when the stylesheet and all of its font files were
        stored successfully (offline math needs the glyphs, not just the CSS).
        """
        try:
            decoded = text.decode("utf-8")
        except UnicodeDecodeError:
            decoded = text.decode("latin-1")
        base_url = urllib.parse.urljoin(css_url, ".")
        refs = re.findall(r"url\(\s*(['\"]?)([^'\")\s]+)\1\s*\)", decoded)
        ok = True
        for _, ref in refs:
            ref = ref.strip().strip("'\"")
            if not ref or ref.startswith(("data:", "#")):
                continue
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", ref):
                font_url = ref
                rel = urllib.parse.urlsplit(ref).path.lstrip("/")
            else:
                font_url = urllib.parse.urljoin(base_url, ref)
                rel = ref.lstrip("/")
            if not rel or not rel.lower().endswith(
                (".woff2", ".woff", ".ttf", ".otf", ".eot")
            ):
                continue
            dest = os.path.abspath(os.path.join(dest_dir, *rel.split("/")))
            site_abs = os.path.abspath(site_dir)
            if not dest.startswith(site_abs + os.sep):
                _AI_LOGGER.warning(
                    "neoabs assets: refusing to store vendored font outside the "
                    "site dir (%s).",
                    dest,
                )
                ok = False
                continue
            if not self._asset_fetch(font_url, dest, timeout):
                ok = False
        return ok

    def on_pre_build(self, *, config):
        """Vendor the lazy CDN libraries when ``assets.mode`` is ``local``/``bundle``.

        MkDocs runs ``on_pre_build`` *before* it cleans the site directory, so a
        vendored tree written here would immediately be wiped by the clean step
        that follows. The downloads therefore happen in ``on_files`` (which runs
        after the site dir is cleaned and before any page renders); this hook
        only reverts the component URL overrides when there is no site dir to
        vendor into (e.g. a config-only run), so nothing references a local path
        that could never exist."""
        extra = config.get("extra") or {}
        assets = extra.get("neoabs_assets") or {}
        mode = assets.get("mode") or _NEOABS_DEFAULT_ASSETS["mode"]
        if mode not in ("local", "bundle"):
            return

        components = extra.get("neoabs_components") or {}
        hljs = components.get("highlighting") or {}
        mermaid = components.get("mermaid") or {}
        math = components.get("math") or {}
        originals = getattr(self, "_asset_originals", {}) or {}
        if not str(config.get("site_dir") or ""):
            self._asset_revert(hljs, mermaid, math, originals)

    def _asset_revert(self, hljs, mermaid, math, originals):
        """Restore component CDN overrides to their pre-vendoring values."""
        hljs["cdn_url"] = originals.get(("highlighting", "cdn_url")) or ""
        hljs["cdn_css_url"] = originals.get(("highlighting", "cdn_css_url")) or ""
        mermaid["cdn_url"] = originals.get(("mermaid", "cdn_url")) or ""
        math["cdn_url"] = originals.get(("math", "cdn_url")) or ""
        math["cdn_css_url"] = originals.get(("math", "cdn_css_url")) or ""

    def on_files(self, files, *, config):
        """Vendor the lazy CDN libraries after the site dir is cleaned.

        MkDocs cleans ``site_dir`` *after* ``on_pre_build`` (so a tree written
        there is wiped) and before ``on_files`` — this hook is the first point
        where vendored files are guaranteed to survive to the end of the build,
        and it runs before any page renders so inline critical CSS is ready
        when templates are emitted. Only needs a network when the author opted
        into vendoring; a failed download restores the component's original CDN
        URL instead of leaving a dangling local reference, and the build still
        succeeds with the CDN fallback."""
        extra = config.get("extra") or {}
        assets = extra.get("neoabs_assets") or {}
        mode = assets.get("mode") or _NEOABS_DEFAULT_ASSETS["mode"]
        if mode in ("local", "bundle"):
            components = extra.get("neoabs_components") or {}
            originals = getattr(self, "_asset_originals", {}) or {}
            site_dir = str(config.get("site_dir") or "")
            if site_dir:
                self._asset_vendor(site_dir, extra, components, assets, originals)
        return files

    def _asset_vendor(self, site_dir, extra, components, assets, originals):
        hljs = components.get("highlighting") or {}
        mermaid = components.get("mermaid") or {}
        math = components.get("math") or {}
        mode = assets.get("mode") or _NEOABS_DEFAULT_ASSETS["mode"]
        vendor = (
            str(assets.get("vendor_dir") or _NEOABS_DEFAULT_ASSETS["vendor_dir"])
            .strip()
            .strip("/")
        )
        if not vendor:
            vendor = str(_NEOABS_DEFAULT_ASSETS["vendor_dir"]).strip("/")
        timeout = int(assets.get("timeout") or _NEOABS_DEFAULT_ASSETS["timeout"])
        inline = bool(assets.get("inline_critical_css"))

        hljs_js = (
            originals.get(("highlighting", "cdn_url"))
            or _NEOABS_ASSET_CDN["highlighting_js"]
        )
        hljs_css = (
            originals.get(("highlighting", "cdn_css_url"))
            or originals.get(("highlighting", "cdn_url"))
            or _NEOABS_ASSET_CDN["highlighting_css"]
        )
        hljs_light = str(
            hljs.get("theme_light")
            or _NEOABS_DEFAULT_COMPONENTS["highlighting"]["theme_light"]
        )
        hljs_dark = str(
            hljs.get("theme_dark")
            or _NEOABS_DEFAULT_COMPONENTS["highlighting"]["theme_dark"]
        )
        mermaid_js = (
            originals.get(("mermaid", "cdn_url")) or _NEOABS_ASSET_CDN["mermaid_js"]
        )
        math_js = originals.get(("math", "cdn_url")) or _NEOABS_ASSET_CDN["math_js"]
        math_css = (
            originals.get(("math", "cdn_css_url")) or _NEOABS_ASSET_CDN["math_css"]
        )

        dest_root = os.path.join(site_dir, *vendor.split("/"))

        hljs_js_ok = self._asset_fetch(
            hljs_js, os.path.join(dest_root, "highlight", "highlight.min.js"), timeout
        )
        hljs_light_ok = self._asset_fetch(
            hljs_css + hljs_light + ".min.css",
            os.path.join(dest_root, "highlight", "styles", f"{hljs_light}.min.css"),
            timeout,
        )
        hljs_dark_ok = self._asset_fetch(
            hljs_css + hljs_dark + ".min.css",
            os.path.join(dest_root, "highlight", "styles", f"{hljs_dark}.min.css"),
            timeout,
        )
        mermaid_ok = self._asset_fetch(
            mermaid_js,
            os.path.join(dest_root, "mermaid", "mermaid.min.js"),
            timeout,
        )
        math_js_ok = self._asset_fetch(
            math_js,
            os.path.join(dest_root, "katex", "dist", "katex.min.js"),
            timeout,
        )
        math_css_ok = False
        try:
            request = urllib.request.Request(
                math_css,
                headers={"User-Agent": "mkdocs-neoabs/{}/+assets".format("1")},
            )
            with urllib.request.urlopen(request, timeout=timeout) as response:
                css_payload = response.read()
        except (OSError, ValueError):
            css_payload = None
        if css_payload:
            katex_dir = os.path.join(dest_root, "katex", "dist")
            os.makedirs(katex_dir, exist_ok=True)
            with open(os.path.join(katex_dir, "katex.min.css"), "wb") as handle:
                handle.write(css_payload)
            math_css_ok = self._asset_rebase_urls(
                css_payload, math_css, katex_dir, site_dir, timeout
            )

        changed = False
        if not hljs_js_ok:
            hljs["cdn_url"] = originals.get(("highlighting", "cdn_url")) or ""
            changed = True
        if not (hljs_light_ok and hljs_dark_ok):
            hljs["cdn_css_url"] = originals.get(("highlighting", "cdn_css_url")) or ""
            changed = True
        if not mermaid_ok:
            mermaid["cdn_url"] = originals.get(("mermaid", "cdn_url")) or ""
            changed = True
        if not math_js_ok:
            math["cdn_url"] = originals.get(("math", "cdn_url")) or ""
            changed = True
        if not math_css_ok:
            math["cdn_css_url"] = originals.get(("math", "cdn_css_url")) or ""
            changed = True
        if changed:
            _AI_LOGGER.warning(
                "neoabs assets: at least one vendored asset failed to download — "
                "affected components fall back to their CDN URLs. Use "
                "assets.timeout or re-run with reachable libraries to vendor fully."
            )

        if mode == "bundle":
            bundle_parts = []
            for part in (
                os.path.join(dest_root, "highlight", "highlight.min.js"),
                os.path.join(dest_root, "katex", "dist", "katex.min.js"),
                os.path.join(dest_root, "mermaid", "mermaid.min.js"),
            ):
                if os.path.isfile(part):
                    with open(part, "rb") as handle:
                        bundle_parts.append(handle.read())
            if bundle_parts:
                bundle_dir = os.path.join(dest_root, "bundle")
                os.makedirs(bundle_dir, exist_ok=True)
                with open(
                    os.path.join(bundle_dir, "neoabs-offline.js"), "wb"
                ) as handle:
                    handle.write(b"\n\n".join(bundle_parts))

        if inline:
            light_path = os.path.join(
                dest_root, "highlight", "styles", f"{hljs_light}.min.css"
            )
            dark_path = os.path.join(
                dest_root, "highlight", "styles", f"{hljs_dark}.min.css"
            )
            if os.path.isfile(light_path) and os.path.isfile(dark_path):
                for key, path in (
                    ("neoabs_hljs_css_inline_light", light_path),
                    ("neoabs_hljs_css_inline_dark", dark_path),
                ):
                    with open(path, encoding="utf-8") as handle:
                        extra[key] = handle.read()
                katex_css_path = os.path.join(
                    dest_root, "katex", "dist", "katex.min.css"
                )
                if math_css_ok and os.path.isfile(katex_css_path):
                    with open(katex_css_path, encoding="utf-8") as handle:
                        extra["neoabs_math_css_inline"] = handle.read()
                    extra["neoabs_math_css_font_base"] = f"{vendor}/katex/dist/fonts/"
            else:
                _AI_LOGGER.warning(
                    "neoabs assets: inline_critical_css skipped — vendored "
                    "highlight.js theme stylesheets were not available."
                )

    # -- Phase 4: social cards & structured data -------------------------------

    def on_page_context(self, context, *, page, config, nav):
        """In `__auto__` og-image mode, stamp the page's social-card URL onto
        `page.meta.image` before the template renders, so base.html can publish
        the per-page `og:image`. Cards are generated from the accumulated pages
        in `on_post_build`. A `page.meta.image` the author set explicitly wins."""
        extra = config.get("extra") or {}
        social_cards = extra.get("neoabs_social_cards") or _NEOABS_DEFAULT_SOCIAL_CARDS
        og_image = (extra.get("neoabs_og_image") or "").strip()
        if not (social_cards.get("enabled") and social_cards.get("cards")):
            return
        if og_image != "__auto__":
            return

        meta = getattr(page, "meta", None)
        if not isinstance(meta, MutableMapping):
            meta = {}
            page.meta = meta
        if (meta.get("image") or "").strip():
            return

        rel = self._social_card_rel(page)
        if not rel:
            return
        meta["image"] = rel
        self._social_pages.append(
            {
                "rel": rel,
                "title": (page.title or config.get("site_name") or "NeoAbs").strip(),
                "description": (meta.get("description") or "").strip(),
            }
        )
        return

    @staticmethod
    def _social_card_rel(page):
        """Site-relative og:image path for a page's auto card, mirroring the card
        file the build writes: `assets/social-cards/<src_stem>.<format>`."""
        src = ((getattr(page, "file", None) and page.file.src_path) or "").replace(
            "\\", "/"
        )
        stem = posixpath.splitext(src)[0]
        if not stem:
            return ""
        return f"assets/social-cards/{stem}.{_social_card.available_format()}"

    def _social_logo_path(self, config):
        """Resolve a local site logo file for card branding, or ``None``.

        Priority: ``extra.neoabs_logo_light``, then ``extra.neoabs_logo_dark``,
        then ``theme.logo``. Remote (http(s):// or data:) values are skipped —
        no network access at build time — and the resolved value is looked up
        relative to the site dir first (theme assets are copied there), then the
        docs dir. Returns ``None`` when nothing usable is found.
        """
        docs_dir = config.get("docs_dir") or ""
        site_dir = config.get("site_dir") or ""
        theme = config.get("theme") or {}
        extra = config.get("extra") or {}
        candidates = [
            extra.get("neoabs_logo_light"),
            extra.get("neoabs_logo_dark"),
            theme.get("logo"),
        ]
        for candidate in candidates:
            if not candidate:
                continue
            candidate = str(candidate)
            if re.match(r"^(https?://|data:)", candidate):
                continue
            for directory in (site_dir, docs_dir):
                path = os.path.join(directory, candidate)
                if os.path.isfile(path):
                    return path
        return None

    def _pwa_manifest(self, config, pwa):
        """Build the PWA manifest dict. `theme_color` / `start_url` fall back to
        `extra.neoabs_theme_color` / `site_url`; the icon list resolves from the
        site logo — a local one is used when available, otherwise the first
        remote logo/favicon is fetched at build time into the site dir."""
        extra = config.get("extra") or {}
        site_name = config.get("site_name") or "NeoAbs"
        site_url = (config.get("site_url") or "").rstrip("/")
        start_url = (pwa.get("start_url") or "").strip() or site_url or "/"
        theme_color = (
            str(pwa.get("theme_color") or "").strip()
            or str(extra.get("neoabs_theme_color") or "").strip()
            or str(pwa.get("background_color") or "").strip()
        )
        manifest = {
            "name": site_name,
            "short_name": site_name,
            "start_url": start_url,
            "display": pwa.get("display") or "standalone",
            "background_color": pwa.get("background_color") or "#111114",
        }
        if theme_color:
            manifest["theme_color"] = theme_color
        if pwa.get("icons"):
            icon = self._pwa_icon(config)
            if icon:
                manifest["icons"] = [icon]
        return manifest

    def _pwa_icon(self, config):
        """Resolve one manifest icon entry, or ``None``.

        Priority is the same logo chain as the social cards (``extra
        .neoabs_logo_light`` → ``extra.neoabs_logo_dark`` → ``theme.logo``) with
        ``theme.favicon`` as a final fallback. Local files are used as-is; a
        `http(s)://` logo is fetched dynamically at build time into the site dir
        (the remote value stays untouched — no round-trip rewrite of any URL).
        """
        docs_dir = config.get("docs_dir") or ""
        site_dir = config.get("site_dir") or ""
        theme = config.get("theme") or {}
        extra = config.get("extra") or {}
        candidates = [
            extra.get("neoabs_logo_light"),
            extra.get("neoabs_logo_dark"),
            theme.get("logo"),
            theme.get("favicon"),
        ]
        for candidate in candidates:
            if not candidate:
                continue
            candidate = str(candidate)
            if re.match(r"^(https?://|data:)", candidate):
                continue
            for directory in (site_dir, docs_dir):
                path = os.path.join(directory, candidate)
                if os.path.isfile(path):
                    rel = os.path.relpath(path, site_dir).replace("\\", "/")
                    return self._manifest_icon(rel, path)
        remote = [
            str(candidate)
            for candidate in candidates
            if candidate and str(candidate).startswith(("http://", "https://"))
        ]
        for index, url in enumerate(remote):
            rel, path = self._pwa_fetch_icon(url, site_dir, index)
            if rel and path:
                return self._manifest_icon(rel, path)
        return None

    def _manifest_icon(self, rel, path):
        """Build the manifest icon dict for a resolved local file, with the
        MIME type and pixel size read from the actual bytes (SVG → ``any``)."""
        mime, sizes = self._manifest_icon_info(path)
        icon = {"src": rel, "type": mime or "image/svg+xml", "purpose": "any"}
        if sizes:
            icon["sizes"] = sizes
        return icon

    def _manifest_icon_info(self, path):
        """Best-effort ``(mime, sizes)`` detection from the file header.

        ``sizes`` is ``"any"`` for SVG, a ``WxH`` string for PNG/JPEG/GIF, and
        an empty string when the dimensions cannot be read cheaply."""
        with open(path, "rb") as handle:
            head = handle.read(64)
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            width, height = struct.unpack(">II", head[16:24])
            return "image/png", f"{width}x{height}"
        if head[:2] == b"\xff\xd8":
            width, height = self._jpeg_size(path)
            if width and height:
                return "image/jpeg", f"{width}x{height}"
            return "image/jpeg", ""
        if head[:6] in (b"GIF87a", b"GIF89a"):
            width, height = struct.unpack("<HH", head[6:10])
            return "image/gif", f"{width}x{height}"
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            return "image/webp", ""
        if head[:4] == b"\x00\x00\x01\x00":
            return "image/x-icon", ""
        if head.lstrip().lower().startswith(b"<svg") or b"<svg" in head:
            return "image/svg+xml", "any"
        mime, _ = mimetypes.guess_type(path)
        return mime or "", ""

    def _jpeg_size(self, path):
        """Read width/height from the first SOF marker of a JPEG file."""
        width = height = None
        with open(path, "rb") as handle:
            handle.read(2)
            while True:
                chunk = handle.read(4)
                if len(chunk) < 4 or chunk[0] != 0xFF:
                    break
                code = chunk[1]
                if code in (0xC0, 0xC1, 0xC2, 0xC3):
                    data = handle.read(5)
                    if len(data) < 5:
                        break
                    height, width = struct.unpack(">HH", data[1:5])
                    break
                length = struct.unpack(">H", chunk[2:4])[0]
                if length < 2:
                    break
                handle.seek(length - 2, 1)
        return width or None, height or None

    def _pwa_fetch_icon(self, url, site_dir, index):
        """Download a remote logo into ``site_dir/assets/`` and return
        ``(rel, path)``. Never raises: a failure logs a warning and returns
        ``(None, None)`` so the manifest is emitted without icons."""
        ext = self._url_ext(url)
        rel = f"assets/manifest-icon{index}{ext}"
        dest = os.path.join(site_dir, *rel.split("/"))
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "mkdocs-neoabs/+pwa-icon"},
            )
            with urllib.request.urlopen(
                request, timeout=_PWA_ICON_FETCH_TIMEOUT
            ) as response:
                data = response.read()
            if not data:
                return None, None
        except (OSError, ValueError):
            # URLError/HTTPError/TimeoutError are OSError subclasses; a bad TLS
            # handshake or truncated body also lands here. Never fail the build.
            _AI_LOGGER.warning(
                "neoabs pwa: could not fetch the manifest icon from %s at build "
                "time — manifest.webmanifest emitted without icons.",
                url,
            )
            return None, None
        if not ext:
            # Extensionless URL: derive one from the actual bytes so the stored
            # artifact gets a honest suffix (SVG stays SVG, PNG stays PNG).
            ext = self._ext_from_mime(self._sniff_mime(data))
            rel = f"assets/manifest-icon{index}{ext}"
            dest = os.path.join(site_dir, *rel.split("/"))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as handle:
            handle.write(data)
        return rel, dest

    def _url_ext(self, url):
        """File extension (with dot) of a URL's path, else ``""``."""
        path = url.split("#", 1)[0].split("?", 1)[0]
        _, ext = posixpath.splitext(posixpath.basename(path))
        return ext.lower() if ext else ""

    @staticmethod
    def _ext_from_mime(mime):
        """Map a MIME type to a file extension for stored fetch artifacts."""
        return {
            "image/svg+xml": ".svg",
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/gif": ".gif",
            "image/webp": ".webp",
            "image/x-icon": ".ico",
        }.get(mime, ".png")

    @staticmethod
    def _sniff_mime(data):
        """MIME type guessed from the leading bytes of an image payload."""
        head = data[:64]
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return "image/png"
        if head[:2] == b"\xff\xd8":
            return "image/jpeg"
        if head[:6] in (b"GIF87a", b"GIF89a"):
            return "image/gif"
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            return "image/webp"
        if head[:4] == b"\x00\x00\x01\x00":
            return "image/x-icon"
        if head.lstrip().lower().startswith(b"<svg") or b"<svg" in head:
            return "image/svg+xml"
        return ""

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
        """Render the Phase 4 auto social-card images and emit llms.txt /
        llms-full.txt at the site root, plus extend sitemap.xml."""
        extra = config.get("extra") or {}
        social_cards = extra.get("neoabs_social_cards") or _NEOABS_DEFAULT_SOCIAL_CARDS
        og_image = (extra.get("neoabs_og_image") or "").strip()
        if (
            social_cards.get("enabled")
            and social_cards.get("cards")
            and og_image == "__auto__"
        ):
            site_dir = config["site_dir"]
            logo_path = self._social_logo_path(config)
            for entry in self._social_pages:
                dest = os.path.join(site_dir, *entry["rel"].split("/"))
                _social_card.render_card(
                    entry["title"],
                    config.get("site_name") or "",
                    os.path.splitext(dest)[0],
                    description=entry["description"],
                    logo_path=logo_path,
                )

        # Phase 7: auto-generate `manifest.webmanifest` (name, icons,
        # theme_color, display: standalone) so the docs build is installable
        # with the service worker the theme ships. Off only when
        # `pwa.manifest` is false.
        pwa = extra.get("neoabs_pwa") or _NEOABS_DEFAULT_PWA
        if pwa.get("manifest"):
            theme_site_dir = config["site_dir"]
            theme_manifest_dest = os.path.join(theme_site_dir, "manifest.webmanifest")
            os.makedirs(theme_site_dir, exist_ok=True)
            with open(theme_manifest_dest, "w", encoding="utf-8") as handle:
                json.dump(self._pwa_manifest(config, pwa), handle, indent=2)

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
