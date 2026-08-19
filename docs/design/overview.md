---
title: Design System Overview
---

# Design System Overview

NeoAbs blends two design languages into one coherent system: the translucency and depth of **Apple Liquid Glass** with the minimalism and grid-driven identity of **NothingOS**.

## Design Principles

1. **Depth through transparency** — Layers communicate hierarchy. Content sits behind glass; glass sits behind the canvas.
2. **Restraint over decoration** — Every visual element earns its place. The dot matrix, the borders, the blur — they all serve readability.
3. **Functional color** — Color is never decorative alone. Nothing Red signals interactivity. Monochrome tones carry structure.
4. **Typographic clarity** — One geometric sans for display, one monospace for code and labels. The pairing is intentional and consistent.

!!! note
    The theme avoids shadows as a primary depth cue. Translucency and blur replace drop shadows for most elevation work.

## Color System

NeoAbs defines a small, tightly controlled palette centered on Nothing Red (`#ff3030`) against a pure black canvas. Tokens are mapped to CSS custom properties on `:root` so they can be overridden without touching component styles.

See [Colors](colors.md) for the full token reference.

## Typography

The type system is built on two variable fonts from the Space family:

- **Space Grotesk** — headings, body text, UI labels
- **Space Mono** — code blocks, inline code, uppercase metadata labels

See [Typography](typography.md) for the type scale and usage rules.

## Glass Effects

Glass morphism is the core visual mechanic. Panels use `backdrop-filter: blur()` combined with semi-transparent backgrounds to create frosted surfaces.

Three intensity levels give you control over how much the glass "reads":

- **Light** — background barely visible, content stays flat
- **Medium** — balanced depth, the default
- **Heavy** — strong frosted effect, pronounced separation

See [Glass Effects](glass.md) for implementation details and CSS examples.

## Components

The theme provides styled versions of common MkDocs components:

- [Buttons](../components/buttons.md)
- [Cards](../components/cards.md)
- [Forms](../components/forms.md)

All components inherit from the design tokens. Changing the accent color or glass intensity updates every component automatically.

!!! warning
    Custom components should use the CSS custom properties defined in `:root` rather than hardcoding values. This keeps your site consistent with theme updates.

## Architecture

```
neoabs/
├── templates/
│   ├── assets/
│   │   ├── neoabs.css              # Compiled output
│   │   ├── stylesheets/
│   │   │   ├── neoabs.scss         # Design tokens, resets, glass, typography
│   │   │   └── components.scss     # All component styles
│   │   ├── javascripts/
│   │   │   └── neoabs.js           # Theme JavaScript
│   │   └── images/
│   │       ├── logo.svg
│   │       └── favicon.svg
│   ├── partials/                   # HTML partials (header, nav, footer, etc.)
│   ├── base.html                   # Root template
│   └── mkdocs_theme.yml            # Theme registration
├── plugins/
│   └── neoabs_plugin.py            # MkDocs plugin
└── __init__.py                     # Version
```

Everything is layered: tokens sit at the bottom, glass utilities in the middle, components on top. This keeps overrides predictable and conflict-free.
