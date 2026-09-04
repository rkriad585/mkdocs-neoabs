# Changelog

All notable changes to mkdocs-neoabs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.0.1-beta] - 2026-09-04

### Changed

- Version bumped to `0.0.1-beta` (pre-release)
- Search now drives the official MkDocs `search` plugin worker (lunr) with a themed UI, keyboard navigation (↑/↓/↵), and proper status messages ("Start typing…", "No results found")
- Light-mode fixes: restored `--neoabs-ink` page background so the default scheme applies to main content and TOC
- Various accessibility, layout, and documentation fixes

## [0.1.0] - 2025

### Added

- Initial release of NeoAbs theme
- Glass design system with `backdrop-filter` blur
- NothingOS-inspired pure black canvas and monochrome palette
- Dot-matrix texture overlay
- Dark and light mode toggle
- Configurable glass intensity (light / medium / heavy)
- Space Grotesk + Space Mono typography
- Nothing Red (#ff3030) accent color
- Responsive sidebar navigation with toggle
- Table of contents with active tracking
- Full-screen search modal with keyboard shortcut (`/`)
- Code blocks with copy button
- Admonitions, tabbed content, task lists
- Reading progress bar
- Back-to-top button
- 404 error page with glass card
- SCSS build pipeline (sass + postcss + autoprefixer + cssnano)
- NeoAbs MkDocs plugin for theme defaults
