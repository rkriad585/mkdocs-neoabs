---
title: Configuration
---

# Configuration

NeoAbs is configured through the `theme` key in your `mkdocs.yml`.

## Basic setup

```yaml
site_name: My Docs
theme:
  name: neoabs
```

## Full configuration

```yaml
site_name: My Docs
theme:
  name: neoabs
  favicon: assets/images/favicon.svg
  language: en
  direction: ltr
  palette:
    - scheme: slate
      primary: black
      accent: red
      toggle:
        name: Switch to light mode
    - scheme: default
      primary: white
      accent: red
      toggle:
        name: Switch to dark mode
  font:
    text: Space Grotesk
    code: Space Mono
  features:
    - navigation.sections
    - navigation.top
    - navigation.footer
    - content.code.copy
    - search.suggest
    - search.highlight
  neoabs:
    glass: medium
    dot_matrix: true
    animation: normal
    border: thin

plugins:
  - search
  - neoabs
```

## Options reference

### `palette`

Controls the color scheme and toggle behavior. Uses MkDocs' standard palette system.

```yaml
palette:
  - scheme: slate       # dark mode
    primary: black
    accent: red
    toggle:
      name: Switch to light mode
  - scheme: default     # light mode
    primary: white
    accent: red
    toggle:
      name: Switch to dark mode
```

| Option | Values | Description |
|--------|--------|-------------|
| `scheme` | `"slate"`, `"default"` | Color scheme (slate = dark, default = light) |
| `primary` | `"black"`, `"white"` | Primary background tone |
| `accent` | `"red"` | Accent color (Nothing Red) |
| `toggle.name` | string | Label for the toggle button |

### `neoabs.glass`

Sets the global glass intensity. This controls `backdrop-filter` blur and transparency on panels, cards, and navigation.

| Value | Blur | Saturation | Background opacity | Effect |
|-------|------|------------|-------------------|--------|
| `"light"` | 10px | 1.0 | 5% | Subtle blur, high transparency |
| `"medium"` | 20px | 1.2 | 8% | Balanced blur and opacity (default) |
| `"heavy"` | 30px | 1.4 | 12% | Strong blur, lower transparency |

```yaml
neoabs:
  glass: heavy
```

### `neoabs.dot_matrix`

Enables or disables the dot matrix background pattern behind content.

```yaml
neoabs:
  dot_matrix: true
```

!!! warning
    Disabling `dot_matrix` removes the background texture. The theme still works, but loses a signature visual element.

### `neoabs.border`

Controls the border style on glass panels.

| Value | Description |
|-------|-------------|
| `"thin"` | 1px semi-transparent borders (default) |
| `"thick"` | 2px borders |
| `"none"` | No borders on glass panels |

```yaml
neoabs:
  border: thin
```

### `neoabs.animation`

Controls entrance and hover animations.

| Value | Description |
|-------|-------------|
| `"normal"` | Enable animations (default) |
| `"none"` | Disable all animations |

```yaml
neoabs:
  animation: normal
```

!!! note
    Animations are automatically disabled when the user has `prefers-reduced-motion: reduce` set in their OS.

### `font`

Override the default typefaces. The resolved families drive the Google Fonts
`<link>` **and** the `--neoabs-font-body` / `--neoabs-font-mono` tokens, so the
font stack updates automatically.

```yaml
font:
  text: Space Grotesk
  code: Space Mono
```

If you also set `theme.neoabs.typography.font_family` / `font_family_mono`, the
`theme.font` values take precedence.

!!! tip
    The fonts are loaded from Google Fonts automatically. You can self-host by overriding the CSS and providing your own `@font-face` rules.

### `features`

Recognized as a Material-compatible passthrough: NeoAbs ships every feature
below **enabled by default**, so the list does not gate any behavior. Omit it
or list these flags freely — the rendered site is identical:

- `navigation.sections` — Section-grouped sidebar navigation
- `navigation.top` — Back-to-top button and reading progress bar
- `navigation.footer` — Previous/next navigation in the footer
- `content.code.copy` — Copy button on code blocks
- `search.suggest` — As-you-type search suggestions
- `search.highlight` — Highlight matched terms in search results

```yaml
features:
  - navigation.sections
  - navigation.top
  - content.code.copy
```

To change any single behavior, use the corresponding `theme.neoabs.*` switch
instead.

## Plugin configuration

NeoAbs ships with an optional MkDocs plugin that sets theme defaults. See the [Plugin documentation](../plugins/neoabs.md) for details.

## Adding custom CSS

Add custom stylesheets via `extra_css`:

```yaml
extra_css:
  - stylesheets/custom.css
```

Place the file at `docs/stylesheets/custom.css`.

Override any design token:

```css
:root {
  --neoabs-accent: #818cf8;
  --neoabs-canvas: #050510;
}
```

## Adding custom JavaScript

Add custom scripts via `extra_javascript`:

```yaml
extra_javascript:
  - javascripts/custom.js
```
