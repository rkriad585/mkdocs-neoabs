---
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
| `features` | `[]` | Feature flags |
| `palette` | `[]` | Color schemes |
| `font.text` | `"Space Grotesk"` | Display/body font |
| `font.code` | `"Space Mono"` | Code font |
| `neoabs.glass` | `"medium"` | Glass intensity |
| `neoabs.dot_matrix` | `true` | Dot matrix pattern |
| `neoabs.animation` | `"normal"` | Animation mode |
| `neoabs.border` | `"thin"` | Border style |

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
