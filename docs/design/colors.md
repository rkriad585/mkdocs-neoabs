---
title: Colors
---

# Colors

NeoAbs uses a token-based color system. Every color is a CSS custom property on `:root`, making the palette easy to override or extend.

## Core tokens

### Ink

The page background. Pure black — NothingOS signature.

```css
--neoabs-ink: #000000;
```

### Text hierarchy

```css
--neoabs-text-primary: #ffffff;
--neoabs-text-secondary: rgba(255, 255, 255, 0.7);
--neoabs-text-muted: #555555;
--neoabs-text-accent: #ff3030;
```

### Ghost

Semi-transparent whites used for borders, dividers, and subtle surfaces.

```css
--neoabs-ghost: rgba(255, 255, 255, 0.06);
--neoabs-ghost-strong: rgba(255, 255, 255, 0.12);
```

### Accent

The primary interactive color — Nothing Red.

```css
--neoabs-accent: #ff3030;
--neoabs-accent-dim: rgba(255, 48, 48, 0.15);
--neoabs-accent-glow: rgba(255, 48, 48, 0.3);
```

### Glass

Background colors for glass panels:

```css
--neoabs-glass-bg: rgba(255, 255, 255, 0.08);
--neoabs-glass-bg-strong: rgba(255, 255, 255, 0.15);
--neoabs-glass-border: rgba(255, 255, 255, 0.18);
--neoabs-glass-border-strong: rgba(255, 255, 255, 0.35);
```

## Accent color

NeoAbs uses a single accent color — **Nothing Red** (`#ff3030`). It is used sparingly for interactive elements, focus states, and accent signals.

| Token | Hex | Usage |
|-------|-----|-------|
| `--neoabs-accent` | `#ff3030` | Primary accent |
| `--neoabs-accent-dim` | `rgba(255, 48, 48, 0.15)` | Faint accent backgrounds |
| `--neoabs-accent-glow` | `rgba(255, 48, 48, 0.3)` | Glow effects |

## Shadows

```css
--neoabs-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--neoabs-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--neoabs-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
--neoabs-shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

## Overriding colors

Override any token in your `custom.css`:

```css
:root {
  --neoabs-accent: #818cf8;
  --neoabs-ink: #050510;
}
```

Add it to `mkdocs.yml`:

```yaml
extra_css:
  - stylesheets/custom.css
```

!!! tip
    Use the browser DevTools to inspect `:root` and find the exact token name you want to override. All tokens are prefixed with `--neoabs-`.

## Light mode

When the palette scheme is set to `"default"`, the token values flip to their light-mode equivalents:

```css
[data-md-color-scheme="default"] {
  --neoabs-ink: #ffffff;
  --neoabs-text-primary: #000000;
  --neoabs-text-secondary: rgba(0, 0, 0, 0.7);
  --neoabs-text-muted: #aaaaaa;
  --neoabs-ghost: rgba(0, 0, 0, 0.04);
  --neoabs-ghost-strong: rgba(0, 0, 0, 0.08);
  --neoabs-glass-bg: rgba(0, 0, 0, 0.05);
  --neoabs-glass-bg-strong: rgba(0, 0, 0, 0.1);
  --neoabs-glass-border: rgba(0, 0, 0, 0.12);
  --neoabs-glass-border-strong: rgba(0, 0, 0, 0.25);
}
```

!!! warning
    Glass effects are less visible in light mode. Consider reducing blur intensity when using the light scheme.
