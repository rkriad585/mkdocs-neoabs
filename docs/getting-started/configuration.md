---
date: 2026-09-07
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

### `neoabs.social_cards`

Phase 4 share + indexing surface. When on (default), every page emits an
`Article` JSON-LD block in `<head>`, and — when `extra.neoabs_og_image` is set
to the literal value `"__auto__"` — a per-page OG card image is generated at
build time and published as the page's `og:image`.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Master switch for the whole social-cards/JSON-LD surface |
| `jsonld` | `true` | Emit per-page `Article` JSON-LD structured data |
| `cards` | `true` | Auto-generate per-page OG card images (`__auto__` mode) |

```yaml
neoabs:
  social_cards:
    enabled: true   # master on/off
    jsonld: true    # Article JSON-LD in <head>
    cards: true     # auto og:image cards when extra.neoabs_og_image = __auto__
```

Set `enabled: false` to strip the whole surface; keep `enabled` but flip
`jsonld` or `cards` to disable one half independently. Card rendering needs
Pillow for PNG files — install it with `pip install mkdocs-neoabs[social-cards]`
— and falls back to a crisp standalone SVG when Pillow is absent.

```yaml
extra:
  neoabs_og_image: __auto__   # generate per-page social cards at build time
```

!!! tip
    A `page.meta.image` in a page's front matter overrides the auto-generated
    card for that page. If no card exists for a page (e.g. 404 pages), the OG
    block falls back to a summary Twitter card.

### `neoabs.meta`

Phase 5 freshness + "edit the source" bar. A small metadata row under the
content: a "Last updated" date and an "Edit this page" link. The date is picked
from `page.meta.git_revision_date_localized` (set by the
[`mkdocs-git-revision-date-localized`](https://github.com/timvink/mkdocs-git-revision-date-localized)
plugin) and falls back to the page's `date:` front matter when the plugin is not
installed — or is omitted entirely when neither exists (never breaks).

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Master switch for the metadata bar |
| `show_last_updated` | `true` | Show the "Last updated" date row |
| `show_edit_on_github` | `true` | Show the "Edit this page" link |
| `last_updated_label` | `"Last updated"` | Label before the date |
| `edit_label` | `"Edit this page"` | Link text |
| `date_source` | `"auto"` | `auto` (git first, then front matter), `git`, or `front_matter` |
| `branch` | `"main"` | Repository branch used for the edit link |
| `source_dir` | `"docs"` | Source folder used for the edit link |

```yaml
theme:
  name: neoabs
  neoabs:
    meta:
      enabled: true                # master on/off
      show_last_updated: true
      show_edit_on_github: true
      date_source: auto            # auto | git | front_matter
      branch: main
      source_dir: docs
```

The edit link is built as
`{repo_url}/blob/{branch}/{source_dir}/{page.file.src_uri}` and only renders when
`config.repo_url` is set. A page can override either row per-page via front
matter:

```yaml
---
neoabs:
  meta:
    show_last_updated: false      # hide the date on this page
---
```

## Generated reference

The canonical reference below is emitted from the plugin's own source tables
(`_NEOABS_TOKEN_MAP`, `_neoabs_defaults`, and the `_NEOABS_DEFAULT_*` dicts) by
`tools/emit_config_reference.py`. Regenerate it any time the plugin changes so
docs and config can never drift:

```bash
python tools/emit_config_reference.py
```

--8<-- "_config_ref.generated.md"

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
