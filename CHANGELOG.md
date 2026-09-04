# Changelog

All notable changes to mkdocs-neoabs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.2] - 2026-09-04

### Added

- Math (KaTeX) support via `pymdownx.arithmatex`, lazy-loaded from CDN (`katex@0.16.9`) only when a page contains math; toggle with `extra.neoabs_math`
- New media components: `.neoabs-figure`, `.neoabs-image` (banner/thumbnail), `.neoabs-svg`, `.neoabs-divider`, `.neoabs-badge`
- Toast notification system — `neoabsToast(message, type)` global API with `info`/`success`/`error` variants, auto-dismiss, reduced-motion support; fired automatically by buttons, forms, and inputs
- Inline interactivity for `.neoabs-btn` (pressed feedback) and `.neoabs-form` (submit validation with `--error`/`--success` states) via `initUIExamples`
- TOC toggle — `Ctrl/Cmd+Shift+T` hides/shows the "On this page" sidebar, persisted per user
- Git platform logos in the header: GitHub, GitLab, Bitbucket, Gitea, Codeberg auto-detected from `repo_url`
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
