---
date: 2026-09-07
title: FAQ
---

# Frequently Asked Questions

## General

### What is NeoAbs?

NeoAbs is a custom MkDocs theme that combines Glass design (translucent glass panels with backdrop blur) with NothingOS aesthetics (pure black canvas, dot-matrix patterns, monochrome palette, Nothing Red accents).

### Is NeoAbs free?

Yes. NeoAbs is open-source under the MIT License.

### Does NeoAbs work with MkDocs plugins?

NeoAbs is compatible with standard MkDocs plugins (search, etc.).

## Installation

### What Python version do I need?

Python 3.8 or higher.

### What MkDocs version do I need?

MkDocs 1.5 or higher.

### Do I need Node.js?

Node.js 18+ is required only for building the CSS from source. If you install via `pip install mkdocs-neoabs`, the pre-compiled `neoabs.css` is included.

### Can I use NeoAbs without the plugin?

Yes. The `neoabs` plugin sets theme defaults. You can configure all options directly in `mkdocs.yml` and remove the plugin from the `plugins` list.

## Theming

### How do I change the accent color?

The accent color is `#ff3030` (Nothing Red) by default. Override it in a custom CSS file:

```css
:root {
  --neoabs-accent: #818cf8;
  --neoabs-accent-dim: rgba(129, 140, 248, 0.15);
  --neoabs-accent-glow: rgba(129, 140, 248, 0.3);
}
```

Add the CSS file via `extra_css` in `mkdocs.yml`:

```yaml
extra_css:
  - stylesheets/custom.css
```

### How do I change the glass intensity?

Set `neoabs.glass` in `mkdocs.yml`:

```yaml
theme:
  neoabs:
    glass: light   # light, medium, or heavy
```

### How do I disable the dot matrix?

```yaml
theme:
  neoabs:
    dot_matrix: false
```

### How do I add my own logo?

```yaml
theme:
  logo: assets/images/my-logo.svg
```

Place the logo file in `docs/assets/images/`.

### Does the theme support RTL?

The theme supports `ltr` and `rtl` via the `direction` option:

```yaml
theme:
  direction: rtl
```

## Browser Support

### Which browsers support glass effects?

`backdrop-filter` is supported in:

- Chrome 76+
- Edge 79+
- Safari 9+
- Firefox 103+

In unsupported browsers, glass panels render as solid semi-transparent backgrounds.

### Does the theme work on mobile?

Yes. The theme is fully responsive with a collapsible sidebar, mobile drawer navigation, and adapted layouts for small screens.

## Troubleshooting

### The theme looks broken

1. Hard-refresh your browser (`Ctrl+Shift+R` / `Cmd+Shift+R`)
2. Clear the `site/` directory: `mkdocs build --clean`
3. Reinstall: `pip install -e .` (for development) or `pip install --force-reinstall mkdocs-neoabs`

### Search doesn't work

1. Ensure the `search` plugin is in your `plugins` list
2. Run `mkdocs build --clean` to regenerate the search index
3. Check the browser console for errors

### CSS changes aren't showing

1. Rebuild CSS: `npm run build`
2. Clear browser cache
3. Restart `mkdocs serve`

---

[Back to README](index.md)
