# Changelog

All notable changes to mkdocs-neoabs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Phase 6 — engagement & privacy:
  - "Was this page helpful?" feedback widget (`theme.neoabs.feedback`): GitHub-issue-backed, opens a prefilled positive/negative issue (`repo_url` + `github_labels`) in a new tab — no analytics, no tracking; rendered under the article only when `repo_url` is set
  - Dismissable announcement bar (`theme.neoabs.announcement_bar`): one-line banner fixed to the bottom of the viewport; dismissal persists in `localStorage` keyed by the announcement text (so updating the text re-shows it); falls back to the legacy `extra.neoabs_announce` string
  - Privacy-first cookie consent (`theme.neoabs.cookie_consent`): the banner renders **only** when a real integration is configured (`theme.analytics.gtag` or giscus comments with `repo` + `repo_id`), or always via `render: always` (demo sites); stores a single accept/decline flag; "Accept" unlocks delayed integrations
  - Opt-in giscus comments (`theme.neoabs.comments`): the only supported provider; nothing loads until `repo` + `repo_id` are configured; defers the loader script behind consent accept when an integration is present; giscus theme follows the active palette (`theme.light`/`theme.dark`) and re-syncs on scheme change (`syncCommentsTheme`)
- New `("feedback" | "announcement_bar" | "cookie_consent" | "comments", Type(dict))` config scheme entries with `_validate_feedback()`, `_validate_announcement_bar()`, `_validate_cookie_consent()`, `_validate_comments()` validators and `_NEOABS_DEFAULT_FEEDBACK`/`_NEOABS_DEFAULT_ANNOUNCEMENT_BAR`/`_NEOABS_DEFAULT_COOKIE_CONSENT`/`_NEOABS_DEFAULT_COMMENTS` defaults; computed `consent_needed` exported to `extra.neoabs_consent_needed`
- Footer metadata bar (`theme.neoabs.meta`): per-page "Last updated" timestamp (git-revision-date-localized plugin when installed, falling back to `date:` front-matter) and "Edit on GitHub" link (configurable `repo_url`, `branch`, `source_dir`, labels); gracefully hidden on 404 pages
- New `("meta", Type(dict))` schema for `theme.neoabs.meta` with `_validate_meta()` validation; default values in `_NEOABS_DEFAULT_META`; `_NEOABS_META_BOOLS` frozenset for safe key lookup
- Vanilla image lightbox (`initImageZoom`): click to zoom any typeset image (skips images inside links) in a full-screen overlay with prev/next navigation (buttons + ←/→ keys + swipe), zoom in/out (buttons + mouse wheel + pinch + double-click, 0.5x–6x), drag-to-pan while zoomed, copy image (native clipboard via `ClipboardItem`, falling back to the image URL), download, and caption with image counter — all in one reusable overlay; closes on backdrop tap, Esc, scroll/resize, with `prefers-reduced-motion` support — zero external dependencies
- Styled footnotes: `- footnotes` extension registered, `.footnote-ref` pill badges, `.footnotes` glass card, `.neoabs-backref` accent link
- Code annotations (pymdownx.highlight-style): line-end marker `# (1)!` syntax converted client-side to red inline badges; adjacent `<ol>` legend auto-detected and wired for hover highlighting; annotation markers re-applied after highlight.js re-highlight via `applyCodeAnnotations()`
- `tools/add_dates.py`: stamps every `docs/**/*.md` page with a `date:` front-matter key (`YYYY-MM-DD`, UTC-based); skips MkDocs `_`-prefixed generated files; idempotent, handles files with or without existing front matter, preserves line endings
- `site_url` link rebasing (`initLinkRebase`): the plugin captures the production `site_url` at `on_config` (before `mkdocs serve` swaps it for the dev server) and exposes it in `#__config` as `site_url`; during localhost:{port} previews the JS rewrites anchors baked/hardcoded with the main site URL onto `location.origin` (production base path stripped, query/hash preserved), leaving relative and external links untouched — clicks never leave the preview, and it is a no-op on the deployed origin

### Changed

- Image lightbox reworked into a **single reusable overlay**: navigating to the next/previous image swaps the image in place instead of stacking new overlays per navigation (stacked layers used to swallow clicks and orphan the close button after the first prev/next)
- `neoabs/templates/partials/footer.html` now renders `.neoabs-footer__meta` conditionally from `config.extra.neoabs_meta` and per-page `_pg` override; `_meta_cfg` variable guards Jinja against missing page context
- `neoabs.js` boot init order: `initContentMedia` → `initImageZoom` → `initHighlighting` (hljs callback now calls `applyCodeAnnotations()` after re-highlight)
- SCSS additions: `.neoabs-zoom` overlay (slide-up entrance), `.neoabs-annotation` badge, `.neoabs-annotations` legend with `attr(data-index)` counters, `.neoabs-footer__meta` / `.neoabs-edit` / `.neoabs-last-updated` layout
- `theme.neoabs.comments` and `theme.neoabs.announcement_bar` are now **off by default** (`enabled: false`): nothing renders unless a site opts in with `enabled: true` (the announcement bar additionally needs a non-empty `text`)
- Announcement bar and cookie consent are now **floating cards** (position pinning) instead of full-width bars: new `position` key (`top` | `right` | `bottom` | `left` | `center`, default `bottom`) on both widgets; `center` renders a centered **popup** with a dimmed `.neoabs-popup-backdrop` (click-to-dismiss for the announcement, inert for consent — only Accept/Decline settle it), validated at build time by `_NEOABS_FIXED_POSITIONS`

### Fixed

- Phase 5 annotation legend rendering: live docs example uses raw `<ol>` after `div.highlight` (reliable sibling regardless of Python-Markdown extension-set), fixing the ordered-list-not-parsed issue when `pymdownx.highlight` anchor_linenums are active
- The announcement block commented out in `mkdocs.yml` no longer leaves a stray serialized config: when absent, the plugin default (`enabled: false`) merges cleanly into `#__config`

## [0.1.2] - 2026-09-04

### Added

- Math (KaTeX) support via `pymdownx.arithmatex`, lazy-loaded from CDN (`katex@0.16.9`) only when a page contains math; toggle with `extra.neoabs_math`
- New media components: `.neoabs-figure`, `.neoabs-image` (banner/thumbnail), `.neoabs-svg`, `.neoabs-divider`, `.neoabs-badge`
- Toast notification system — `neoabsToast(message, type)` global API with `info`/`success`/`error` variants, auto-dismiss, reduced-motion support; fired automatically by buttons, forms, and inputs
- Inline interactivity for `.neoabs-btn` (pressed feedback) and `.neoabs-form` (submit validation with `--error`/`--success` states) via `initUIExamples`
- TOC toggle — `Ctrl/Cmd+Shift+T` hides/shows the "On this page" sidebar, persisted per user
- Git platform logos in the header: GitHub, GitLab, Bitbucket, Gitea, Codeberg auto-detected from `repo_url`
- Header controls (theme, search, repo) are now square and reveal a hover label; all icon glyphs standardized to 20px
- GitHub repo popover on icon hover/focus — live fetch of author, stars, watchers, forks, open issues, language, license, default branch, total commits, latest tag, latest commit (sha/message/date), created/updated/pushed dates
- Header now centers the project logo + site name and wraps the repo icon in a glass badge with theme-matched coloring
- Trees component — ```` ```tree ```` project-structure code blocks rendered as a glass file-explorer card with dimmed comments (new `docs/components/trees.md`)
- Styles for ```` ```tree ```` project-structure code blocks
- Tables component documentation with live examples
- `.neoabs-field` grouping helper and `.neoabs-form__submit` valid-state styling
- Component docs for Math, Images & SVG, Toast, CSS Classes in Markdown, Trees, and Keyboard Shortcuts with live examples

### Changed

- `Ctrl/Cmd+Shift+B` sidebar toggle now persists its collapsed state to localStorage
- Notes panel open/closed state is now persisted across page loads

## [0.1.0] - 2026-09-04

### Added

- Full admonition family (note, abstract, info, tip, success, question, warning, failure, danger, bug, example, quote, important) with themed SVG icons and color mapping
- Collapsible details/summary with styled markers
- Tabbed content with unlimited tabs, keyboard navigation (Arrow keys), and glass-themed active state
- Task list checkboxes with custom styling and localStorage persistence
- Code highlighting via highlight.js (CDN) with dark/light theme swap on scheme toggle
- Mermaid.js diagram support (CDN, mermaid@10.9.8) with themed rendering, dark/light re-render, and graceful fallback
- Notes & annotations system: inline composer, per-note colors, edit/delete, global localStorage persistence with 3-day TTL, export to Markdown/JSON
- Notes panel with glass morphism, mobile bottom-sheet responsive layout
- UI primitive classes: `.neoabs-btn`, `.neoabs-card`, `.neoabs-form`/`.neoabs-input`/`.neoabs-textarea`/`.neoabs-select`/`.neoabs-hint` with validation states
- Keyboard shortcuts: `Ctrl/Cmd+Shift+N` (notes panel), `Ctrl/Cmd+Shift+B` (sidebar toggle)
- Boot guard wrapping all init functions in try/catch for resilience

### Changed

- Tabbed content uses `alternate_style: true` with scalable CSS (no 4-tab limit)
- Sidebar toggle now targets `.neoabs-nav` (theme-native class)
- Notes are global (not URL-scoped) — export files renamed to `neoabs-notes.md`/`neoabs-notes.json`

### Fixed

- Mermaid.js CDN pinned to mermaid@10.9.8 (v11 ESM-only broke classic script loading)
- Removed duplicate DOM manipulation that broke entire JS file

## [0.0.1-beta] - 2026-09-04

### Changed

- Search now drives the official MkDocs `search` plugin worker (lunr) with a themed UI, keyboard navigation, and proper status messages
- Light-mode fixes: restored `--neoabs-ink` page background so the default scheme applies to main content and TOC
- Various accessibility, layout, and documentation fixes
