# Changelog

All notable changes to mkdocs-void will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Phase 6 — engagement & privacy:
  - "Was this page helpful?" feedback widget (`theme.void.feedback`): GitHub-issue-backed, opens a prefilled positive/negative issue (`repo_url` + `github_labels`) in a new tab — no analytics, no tracking; rendered under the article only when `repo_url` is set
  - Dismissable announcement bar (`theme.void.announcement_bar`): one-line banner fixed to the bottom of the viewport; dismissal persists in `localStorage` keyed by the announcement text (so updating the text re-shows it); falls back to the legacy `extra.void_announce` string
  - Privacy-first cookie consent (`theme.void.cookie_consent`): the banner renders **only** when a real integration is configured (`theme.analytics.gtag` or giscus comments with `repo` + `repo_id`), or always via `render: always` (demo sites); stores a single accept/decline flag; "Accept" unlocks delayed integrations
  - Opt-in giscus comments (`theme.void.comments`): the only supported provider; nothing loads until `repo` + `repo_id` are configured; defers the loader script behind consent accept when an integration is present; giscus theme follows the active palette (`theme.light`/`theme.dark`) and re-syncs on scheme change (`syncCommentsTheme`)
- New `("feedback" | "announcement_bar" | "cookie_consent" | "comments", Type(dict))` config scheme entries with `_validate_feedback()`, `_validate_announcement_bar()`, `_validate_cookie_consent()`, `_validate_comments()` validators and `_VOID_DEFAULT_FEEDBACK`/`_VOID_DEFAULT_ANNOUNCEMENT_BAR`/`_VOID_DEFAULT_COOKIE_CONSENT`/`_VOID_DEFAULT_COMMENTS` defaults; computed `consent_needed` exported to `extra.void_consent_needed`
- Footer metadata bar (`theme.void.meta`): per-page "Last updated" timestamp (git-revision-date-localized plugin when installed, falling back to `date:` front-matter) and "Edit on GitHub" link (configurable `repo_url`, `branch`, `source_dir`, labels); gracefully hidden on 404 pages
- New `("meta", Type(dict))` schema for `theme.void.meta` with `_validate_meta()` validation; default values in `_VOID_DEFAULT_META`; `_VOID_META_BOOLS` frozenset for safe key lookup
- Vanilla image lightbox (`initImageZoom`): click to zoom any typeset image (skips images inside links) in a full-screen overlay with prev/next navigation (buttons + ←/→ keys + swipe), zoom in/out (buttons + mouse wheel + pinch + double-click, 0.5x–6x), drag-to-pan while zoomed, copy image (native clipboard via `ClipboardItem`, falling back to the image URL), download, and caption with image counter — all in one reusable overlay; closes on backdrop tap, Esc, scroll/resize, with `prefers-reduced-motion` support — zero external dependencies
- Styled footnotes: `- footnotes` extension registered, `.footnote-ref` pill badges, `.footnotes` glass card, `.void-backref` accent link
- Code annotations (pymdownx.highlight-style): line-end marker `# (1)!` syntax converted client-side to red inline badges; adjacent `<ol>` legend auto-detected and wired for hover highlighting; annotation markers re-applied after highlight.js re-highlight via `applyCodeAnnotations()`
- `tools/add_dates.py`: stamps every `docs/**/*.md` page with a `date:` front-matter key (`YYYY-MM-DD`, UTC-based); skips MkDocs `_`-prefixed generated files; idempotent, handles files with or without existing front matter, preserves line endings
- `site_url` link rebasing (`initLinkRebase`): the plugin captures the production `site_url` at `on_config` (before `mkdocs serve` swaps it for the dev server) and exposes it in `#__config` as `site_url`; during localhost:{port} previews the JS rewrites anchors baked/hardcoded with the main site URL onto `location.origin` (production base path stripped, query/hash preserved), leaving relative and external links untouched — clicks never leave the preview, and it is a no-op on the deployed origin
- Repo popover info-field control (`theme.void.components.repo_popover.fields`): pick which sections the GitHub popover shows — `author`, `followers`, `public_repos`, `location`, `stars`, `watchers`, `forks`, `open_issues`, `language`, `license`, `default_branch`, `commits`, `tags`, `latest_commit`, `commit_msg`, `created`, `updated`, `pushed`, `description`, `owner_bio` — **defaults to every section**, validated at build time by `_validate_repo_popover()`
- Phase 10 — community flywheel:
  - Opt-in "Powered by Void" footer credit + dot-matrix badge (`extra.void_showcase: true`): a self-contained inline SVG badge (no CDN request) linking back to the project; target overridable via `extra.void_showcase_url`; the label is i18n-able via `theme.void.i18n.footer_powered_by`
  - Benchmarks page (`docs/benchmarks.md`): CI-regenerated page-weight table (`tools/emit_benchmarks.py` builds the same content with `void` / `material` / `readthedocs` and reports raw + gzip shipped bytes) — the permanent "we're fast" receipt; Lighthouse ≥95 per category is enforced separately by `performance.yml`
  - `.github/FUNDING.yml` (GitHub Sponsors) + Discussions community links in the README
  - Contributor path: `good first issue` / `help wanted` labels and translation onboarding in `CONTRIBUTING.md`, "Translating Void" in `docs/identity.md`, conventional-commit guidelines in `docs/development.md`
  - Auto-changelog automation: `tools/emit_changelog.py` keeps a machine-generated `[Unreleased]` block from conventional-commit history (via a CI PR), and `release.yml` promotes `[Unreleased]` into a dated release section on every tag push

### Changed

- Image lightbox reworked into a **single reusable overlay**: navigating to the next/previous image swaps the image in place instead of stacking new overlays per navigation (stacked layers used to swallow clicks and orphan the close button after the first prev/next)
- `void/templates/partials/footer.html` now renders `.void-footer__meta` conditionally from `config.extra.void_meta` and per-page `_pg` override; `_meta_cfg` variable guards Jinja against missing page context
- `void.js` boot init order: `initContentMedia` → `initImageZoom` → `initHighlighting` (hljs callback now calls `applyCodeAnnotations()` after re-highlight)
- SCSS additions: `.void-zoom` overlay (slide-up entrance), `.void-annotation` badge, `.void-annotations` legend with `attr(data-index)` counters, `.void-footer__meta` / `.void-edit` / `.void-last-updated` layout
- `theme.void.comments` and `theme.void.announcement_bar` are now **off by default** (`enabled: false`): nothing renders unless a site opts in with `enabled: true` (the announcement bar additionally needs a non-empty `text`)
- Announcement bar and cookie consent are now **floating cards** (position pinning) instead of full-width bars: new `position` key (`top` | `right` | `bottom` | `left` | `center`, default `bottom`) on both widgets; `center` renders a centered **popup** with a dimmed `.void-popup-backdrop` (click-to-dismiss for the announcement, inert for consent — only Accept/Decline settle it), validated at build time by `_VOID_FIXED_POSITIONS`
- Repo popover open/close reworked into an animated **dismissible popover** (no auto-close timer): opens on hover/focus/click, closes when the pointer leaves the icon + card, focus leaves the wrapper, Escape is pressed, or a click lands outside; reveal/hide animates via the CSS opacity + transform transition and is disabled under `prefers-reduced-motion`
- Repo popover is now **scrollable and responsive**: the card caps at `min(70vh, 480px)` with an independent scrollable body (`min(60vh, 420px)`, `overscroll-behavior: contain`), and narrows to `min(86vw, 320px)` on small screens so it never clips against the viewport edge

### Fixed

- Phase 5 annotation legend rendering: live docs example uses raw `<ol>` after `div.highlight` (reliable sibling regardless of Python-Markdown extension-set), fixing the ordered-list-not-parsed issue when `pymdownx.highlight` anchor_linenums are active
- The announcement block commented out in `mkdocs.yml` no longer leaves a stray serialized config: when absent, the plugin default (`enabled: false`) merges cleanly into `#__config`

<!-- AUTO-CHANGELOG:start -->
### Commits since the last release (auto)
- [Added] feat: rename mkdocs-neoabs to mkdocs-void - rebrand package/theme/plugin to Void (mkdocs_neoabs->mkdocs_void, NeoAbs->Void, neoabs->void across code, templates, tests, docs, workflows, URLs, metadata, README, CONTRIBUTORS), strip Phase N comments for real function docs in plugin/JS/SCSS/templates/tests/mkdocs.yml + 14 docs refs, swap logos from void-logos/ per dark/light contract (drop old logo/, repoint raw URLs to docs/assets/images), contributor credits to rkriad585 contributors, watermark 'Generated by Void for AI agents.'; moves rename tool to tools/rename_to_void.py + plan to RENAME-PLAN.md; tests 56/56 + strict build green
- [Added] feat: Phase 21 standalone config builder (single-file HTML dev tool) - docs/assets/config-builder.html renders a grouped mkdocs.yml form with live syntax-highlighted YAML preview, presets, local persistence, copy (clipboard + execCommand fallback) and Blob download; entry points wired via the config_builder group (cluster gear action auto-injected + pinned TOC-bottom trigger, OFF by default, demo ON) with plugin validation/resolution, base.html html-flag + #__config emission, SCSS, harness style-stub fix; tests 56/56 + strict build green
- [Added] feat: Phase 21 interactive config builder (mkdocs.yml wizard) - left-pane highlighted YAML preview, presets, download/copy, always-on cluster icon
- [Added] feat: Phase 10 community flywheel (benchmarks page + CI regen, opt-in 'Powered by NeoAbs' footer credit, FUNDING + Discussions, contributor path + translation onboarding, auto-changelog wired to releases) + PyPI metadata (funding credits, extras, tags)
- [Added] feat: Phase 9 ecosystem & tooling (neoabs doctor, integrations guide + recipe CI, MkDocs 1.5/1.6/2.0.dev compat matrix, PyPI publish) + README footer
- [Added] feat: Phase 8 performance & PWA (prefetch on hover, cdn/local/bundle asset modes, inline critical CSS, sw v4, Lighthouse CI)
- [Added] feat: Phase 7 identity & i18n (i18n overrides, breadcrumbs, nav icons, dark-aware images, auto PWA manifest with dynamic icon fetch)
- [Added] feat: dismissible animated repo popover + scrollable/responsive card + repo_popover.fields config
- [Added] feat: image lightbox controls (nav/zoom/copy/download) + real download + open/close fixes + image_lightbox config reference
- [Added] feat: floating position config for announcement + cookie consent (top/right/bottom/left/center popup)
- [Added] feat: site_url link rebase with localhost fallback + opt-in comments/announcement + giscus loader fix
- [Added] feat: Phase 6 engagement & privacy (feedback, announcement bar, cookie consent, opt-in giscus)
- [Added] feat: per-page social cards and Article JSON-LD (Phase 4)
- [Added] feat: add search result.show_share config to toggle per-result copy link
- [Added] feat: phase 3 search deep-links & share (?q= restore, per-result copy link with toast)
- [Added] feat: phase 2 onboarding & documentation
- [Added] feat: phase 20 mermaid controls & gestures, keyboard actions, screenshot tooling, themed logo
- [Added] feat: phase 19 ai-readable content mode (markdown mirrors, llms.txt)
- [Added] feat: phase 18 action shortcuts and cluster customization
- [Added] feat: phase 17 focus timer (TOC widget controls, settings popup)
- [Added] feat: phase 16 action cluster (plus menu, right-side tooltips)
- [Added] feat: phase 15 reading mode (full-width measure, dark scheme inherit)
- [Added] feat: phase 14 plugin config passthrough + phase 13/14 config reference
- [Added] feat: phase 13 page-level front matter overrides
- [Added] feat: phase 11 content area customization
- [Added] feat: phase 12 global branding & meta
- [Added] feat: phase 10 search customization
- [Added] feat: phase 9 advanced visual customization
- [Added] feat: phase 8 custom css/js & head injection
- [Added] feat: phase 7 keyboard shortcuts customization
- [Added] feat: phase 6 table of contents customization
- [Added] feat: phase 5 sidebar and navigation customization
- [Added] feat: phase 3 header customization + phase 4 footer customization
- [Added] feat: phase 2 component visibility toggles + sass @use migration + ruff fixes
- [Added] feat: remember last page + nav state, repo popover owner avatar
- [Added] feat(phase-1): design token overrides via mkdocs.yml
- [Added] feat: SPA navigation, scroll restore, favicon fix, SW caching, plan
- [Added] feat: add dark/light logo + favicon support
- [Fixed] fix: phase 1 trust & correctness (1a theme.font, 1b features passthrough)
- [Fixed] fix: phase 2/5/6 dead config keys and toc h5/h6 defaults
- [Fixed] fix: resolve a11y audit findings + ship under ?v=9
- [Fixed] fix: show only owner name (drop @username span) in repo popover Author row
- [Fixed] fix: render @login span markup (not escaped text) in repo popover Author row
- [Fixed] fix: always-visible repo popover via pure CSS hover + ship under ?v=6
- [Fixed] fix: ship popover/page-memory fixes under ?v=5 so no stale v4 copy is served
- [Fixed] fix: never resume file:// lastPage (Security Error), opaque popover bg, pointerenter + popover open/ready logs
- [Fixed] fix: deliver under v4, SW passes versioned (?v=) URLs through to HTTP cache
- [Fixed] fix: popover opens on hover+click+keyboard, search arrows scroll active item into view
- [Fixed] fix: bust v2 cache (assets v3 + SW v3), robust search Enter/auto-run, TOC always-active indicator
- [Fixed] fix: reliable repo-popover avatar (github .png), instant skeleton, TOC active scroll tracking
- [Fixed] fix: cache-busted assets, hardened SPA base-guard, SW cache v2, build signature
- [Fixed] fix: resume to stale/404 pages stays on landing page; fetch directory URLs
- [Fixed] fix: close search overlay on SPA nav, auto-run restored query
- [Changed] revert: remove Phase 21 interactive config builder (mkdocs.yml wizard) entirely - restore all touched files to the pre-Phase-21 baseline, delete the partial, drop i18n/validator/JS/SCSS/harness surface; tests 45/45 + strict build green
- [Changed] docs: mark WHY_PLAN gap rows 12/19 done + regenerate config reference (Phase 10 footer.poweredBy i18n key)
- [Changed] ﻿feat: Phase 5 content superpowers + docs date front matter
- [Changed] docs: add phase 10 search customization config reference to mkdocs.yml
- [Changed] docs: add phase 9 advanced visual customization config reference to mkdocs.yml
- [Changed] docs: expand phase 8 custom css/js & head injection config reference
- [Changed] docs: add phase 5 sidebar customization config reference to mkdocs.yml
- [Changed] docs: add phase 4 footer customization config reference to mkdocs.yml
- [Changed] docs: add phase 3 header customization config reference to mkdocs.yml
<!-- AUTO-CHANGELOG:end -->


## [0.1.2] - 2026-09-04

### Added

- Math (KaTeX) support via `pymdownx.arithmatex`, lazy-loaded from CDN (`katex@0.16.9`) only when a page contains math; toggle with `extra.void_math`
- New media components: `.void-figure`, `.void-image` (banner/thumbnail), `.void-svg`, `.void-divider`, `.void-badge`
- Toast notification system — `voidToast(message, type)` global API with `info`/`success`/`error` variants, auto-dismiss, reduced-motion support; fired automatically by buttons, forms, and inputs
- Inline interactivity for `.void-btn` (pressed feedback) and `.void-form` (submit validation with `--error`/`--success` states) via `initUIExamples`
- TOC toggle — `Ctrl/Cmd+Shift+T` hides/shows the "On this page" sidebar, persisted per user
- Git platform logos in the header: GitHub, GitLab, Bitbucket, Gitea, Codeberg auto-detected from `repo_url`
- Header controls (theme, search, repo) are now square and reveal a hover label; all icon glyphs standardized to 20px
- GitHub repo popover on icon hover/focus — live fetch of author, stars, watchers, forks, open issues, language, license, default branch, total commits, latest tag, latest commit (sha/message/date), created/updated/pushed dates
- Header now centers the project logo + site name and wraps the repo icon in a glass badge with theme-matched coloring
- Trees component — ```` ```tree ```` project-structure code blocks rendered as a glass file-explorer card with dimmed comments (new `docs/components/trees.md`)
- Styles for ```` ```tree ```` project-structure code blocks
- Tables component documentation with live examples
- `.void-field` grouping helper and `.void-form__submit` valid-state styling
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
- UI primitive classes: `.void-btn`, `.void-card`, `.void-form`/`.void-input`/`.void-textarea`/`.void-select`/`.void-hint` with validation states
- Keyboard shortcuts: `Ctrl/Cmd+Shift+N` (notes panel), `Ctrl/Cmd+Shift+B` (sidebar toggle)
- Boot guard wrapping all init functions in try/catch for resilience

### Changed

- Tabbed content uses `alternate_style: true` with scalable CSS (no 4-tab limit)
- Sidebar toggle now targets `.void-nav` (theme-native class)
- Notes are global (not URL-scoped) — export files renamed to `void-notes.md`/`void-notes.json`

### Fixed

- Mermaid.js CDN pinned to mermaid@10.9.8 (v11 ESM-only broke classic script loading)
- Removed duplicate DOM manipulation that broke entire JS file

## [0.0.1-beta] - 2026-09-04

### Changed

- Search now drives the official MkDocs `search` plugin worker (lunr) with a themed UI, keyboard navigation, and proper status messages
- Light-mode fixes: restored `--void-ink` page background so the default scheme applies to main content and TOC
- Various accessibility, layout, and documentation fixes
