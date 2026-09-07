---
date: 2026-09-07
title: NeoAbs Plugin
---

# NeoAbs Plugin

The `neoabs` MkDocs plugin sets theme defaults so you don't have to configure everything manually.

## Installation

The plugin is bundled with `mkdocs-neoabs`. No separate install needed.

## Enable

Add `neoabs` to the `plugins` list in `mkdocs.yml`:

```yaml
site_name: My Docs
theme:
  name: neoabs

plugins:
  - search
  - neoabs
```

## What It Does

The plugin hooks into MkDocs' `on_config` event to set default values for theme options that are not explicitly configured:

| Option | Default | Description |
|--------|---------|-------------|
| `language` | `"en"` | Site language |
| `direction` | `"ltr"` | Text direction |
| `features` | `[]` | Always-on passthrough list (does not gate behavior) |
| `palette` | `[]` | Color schemes |
| `font.text` | `"Space Grotesk"` | Display/body font |
| `font.code` | `"Space Mono"` | Code font |
| `neoabs.glass` | `"medium"` | Glass intensity |
| `neoabs.dot_matrix` | `true` | Dot matrix pattern |
| `neoabs.animation` | `"normal"` | Animation mode |
| `neoabs.border` | `"thin"` | Border style |
| `neoabs.social_cards` | `{"enabled": true, "jsonld": true, "cards": true}` | Social preview cards + JSON-LD |
| `neoabs.meta` | `{"enabled": true, "show_last_updated": true, "show_edit_on_github": true, ...}` | Last-updated + edit-on-GitHub bar |

If you set these values in `mkdocs.yml`, the plugin will not override them.

## Configuration

The plugin reads its configuration from the `neoabs` key under `theme`:

```yaml
theme:
  name: neoabs
  neoabs:
    glass: medium
    dot_matrix: true
    animation: normal
    border: thin
```

### `glass`

| Value | Description |
|-------|-------------|
| `"light"` | Subtle blur, high transparency |
| `"medium"` | Balanced blur and opacity (default) |
| `"heavy"` | Strong blur, lower transparency |

### `dot_matrix`

| Value | Description |
|-------|-------------|
| `true` | Render dot matrix pattern (default) |
| `false` | Disable dot matrix |

### `animation`

| Value | Description |
|-------|-------------|
| `"normal"` | Enable animations (default) |
| `"none"` | Disable all animations |

### `border`

| Value | Description |
|-------|-------------|
| `"thin"` | 1px semi-transparent borders (default) |
| `"thick"` | 2px borders |
| `"none"` | No borders |

### `social_cards`

Automatic per-page social preview cards and Article structured data. When enabled alongside `extra.neoabs_og_image: __auto__`, the build generates a 1200×630 Open Graph image for every page (drawn in the theme palette with the site logo) and injects matching `og:image` meta plus JSON-LD Article data into each page's `<head>`.

```yaml
theme:
  name: neoabs
  neoabs:
    social_cards:
      enabled: true   # Master switch for social previews
      jsonld: true    # Inject Article JSON-LD structured data
      cards: true     # Generate + publish per-page og:image cards

extra:
  neoabs_og_image: __auto__  # Auto-generate one card per page
```

> To embed the site's own logo on the cards, set `theme.logo` to a local file (e.g. `assets/images/logo.svg`); it is used when the `neoabs_logo_light`/`neoabs_logo_dark` extras point at remote URLs, which are skipped at build time.
>
> Cards are rendered as PNG when [Pillow](https://python-pillow.org) is installed, otherwise as standalone SVG. Install the extra with `pip install mkdocs-neoabs[social-cards]`. An author can override the auto image for a single page with a `image:` entry in that page's front matter.

### `meta`

Phase 5 freshness bar: a "Last updated" date and an "Edit this page" link under
the content. The date reads `page.meta.git_revision_date_localized` when the
`mkdocs-git-revision-date-localized` plugin is installed, falls back to the
page's `date:` front matter, and is omitted when neither is present (so nothing
breaks without the git plugin). The edit link points at the page source in the
repository configured by `repo_url`.

```yaml
theme:
  name: neoabs
  neoabs:
    meta:
      enabled: true                # master on/off
      show_last_updated: true      # "Last updated: <date>"
      show_edit_on_github: true    # "Edit this page"
      date_source: auto            # auto | git | front_matter
      branch: main
      source_dir: docs
```

## Full Example

```yaml
site_name: My Docs
theme:
  name: neoabs
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
  neoabs:
    glass: medium
    dot_matrix: true
    animation: normal
    border: thin

plugins:
  - search
  - neoabs
```

## Optional

The plugin is optional. If you remove it from the plugins list, you must set all theme options manually in `mkdocs.yml`. The theme will still work, but without automatic defaults.

## Troubleshooting

### Plugin not found

Ensure the package is installed:

```bash
pip show mkdocs-neoabs
```

If not installed:

```bash
pip install mkdocs-neoabs
```

### Defaults not applied

Check that `neoabs` is in the `plugins` list and that there are no YAML syntax errors in `mkdocs.yml`.

!!! warning
    The plugin reads its configuration at build time. It does not support runtime configuration or per-page overrides.
