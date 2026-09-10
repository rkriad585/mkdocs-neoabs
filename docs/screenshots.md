---
date: 2026-09-07
title: Screenshots
---

# Void — Screenshots

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/docs/assets/images/logo.svg" alt="Void Logo" height="100">
</p>

Visual gallery of the Void theme — real browser captures framed like macOS
windows (and a phone bezel for mobile), all live from the repository.

## Home

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/home.png" alt="Void home page" width="80%">
</p>

<p align="center"><em>The home page with glass navigation, dot-matrix background, and Nothing Red accents.</em></p>

## Dark Mode

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/dark-mode.png" alt="Dark mode" width="80%">
</p>

<p align="center"><em>Default dark mode with pure black canvas and translucent glass panels.</em></p>

## Light Mode

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/light-mode.png" alt="Light mode" width="80%">
</p>

<p align="center"><em>Light mode with white canvas and subtle glass effects.</em></p>

## Search

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/search.png" alt="Search modal" width="80%">
</p>

<p align="center"><em>Full-screen search modal with instant results and keyboard navigation.</em></p>

## Sidebar Navigation

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/sidebar.png" alt="Sidebar navigation" width="80%">
</p>

<p align="center"><em>Collapsible sidebar with section grouping and active page tracking.</em></p>

## Code Blocks

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/code-blocks.png" alt="Code blocks" width="80%">
</p>

<p align="center"><em>Syntax-highlighted code blocks with one-click copy button.</em></p>

## Mobile

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/mobile.png" alt="Mobile view" width="40%">
</p>

<p align="center"><em>Responsive mobile layout with drawer navigation.</em></p>

## Installation

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/getting-started.png" alt="Installation" width="80%">
</p>

<p align="center"><em>Getting started — quick install guide.</em></p>

## Configuration

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/configuration.png" alt="Configuration" width="80%">
</p>

<p align="center"><em>Full configuration reference for the theme and plugin.</em></p>

## Design Overview

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/design-overview.png" alt="Design overview" width="80%">
</p>

<p align="center"><em>Design language overview — glass depth and NothingOS minimalism.</em></p>

## Color Tokens

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/colors.png" alt="Color tokens" width="80%">
</p>

<p align="center"><em>Color token system with semantic roles.</em></p>

## Typography

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/typography.png" alt="Typography" width="80%">
</p>

<p align="center"><em>Dot-matrix inspired typographic scale.</em></p>

## Glass Effects

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/glass.png" alt="Glass effects" width="80%">
</p>

<p align="center"><em>Frosted glass panels and dynamic transparency.</em></p>

## Buttons

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/buttons.png" alt="Buttons" width="80%">
</p>

<p align="center"><em>Button styles and states.</em></p>

## Cards

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/cards.png" alt="Cards" width="80%">
</p>

<p align="center"><em>Card components for content layouts.</em></p>

## Forms

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/forms.png" alt="Forms" width="80%">
</p>

<p align="center"><em>Form inputs, selects, and validation states.</em></p>

## Plugin

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-void/raw/main/Screenshots/plugin.png" alt="Void plugin" width="80%">
</p>

<p align="center"><em>The Void MkDocs plugin — full configuration reference.</em></p>

## Generating Screenshots

Screenshots are captured from a real headless browser (Playwright + system
Chrome/Edge) and framed for a premium, product-shot look — desktop pages get
macOS-style window chrome with traffic lights and a soft drop shadow, while the
mobile shot is wrapped in a phone bezel with a dynamic island.

```bash
pip install playwright pillow
mkdocs serve
python tools/screenshots_gen.py --real
```

The tool renders every page in a real browser (JS, WebFonts, highlight.js),
captures at 2× device scale for sharp high-DPI output, and never falls back to
dummy placeholders:

- Light Mode is captured via `prefers-color-scheme` emulation plus a seeded preference.
- The Search shot opens the search modal and types a query so real results are visible.
- The Mobile shot narrows the viewport and opens the drawer navigation.

See `tools/screenshots_gen.py` for options: `--real --wait MS`, `--url <server>`, `--scale <n>`.

---

[Back to README](index.md)
