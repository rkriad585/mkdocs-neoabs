---
date: 2026-09-07
title: Glass Effects
---

# Glass Effects

Glass morphism is the defining visual layer in NeoAbs. Every panel, card, and navigation element uses `backdrop-filter` to create frosted surfaces that sit above the canvas.

## How it works

A glass surface combines three properties:

```css
.neoabs-glass {
  background: var(--neoabs-glass-bg);
  backdrop-filter: blur(var(--neoabs-glass-blur)) saturate(var(--neoabs-glass-saturation));
  -webkit-backdrop-filter: blur(var(--neoabs-glass-blur)) saturate(var(--neoabs-glass-saturation));
  border: var(--neoabs-border-width, 1px) solid var(--neoabs-glass-border);
}
```

- **Background** -- a semi-transparent fill that picks up the underlying canvas color
- **Backdrop filter** -- blurs and saturates whatever is behind the element
- **Border** -- a faint edge that separates the glass from its surroundings

## Intensity levels

NeoAbs provides three built-in intensity levels. Set globally with the `neoabs.glass` theme option, or override per component.

### Light

```css
.neoabs-glass--light {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px) saturate(1.0);
}
```

Minimal frosted effect. The background is barely visible. Use this for large surfaces where blur would be distracting -- footers, sidebars, full-width panels.

### Medium (default)

```css
.neoabs-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.2);
}
```

The default. Balanced blur and transparency. Cards, navigation bars, and content panels use this level.

### Heavy

```css
.neoabs-glass--heavy {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px) saturate(1.4);
}
```

Strong frosted effect with pronounced separation. Use for modals, floating panels, or any element that needs to "float" above the page.

!!! warning
    Heavy glass is more expensive to render. On low-end devices, consider using `medium` as a fallback.

## Comparison

| Level   | Blur    | Saturation | Background opacity | Render cost |
|---------|---------|------------|--------------------|-------------|
| Light   | 10px    | 1.0        | 5%                 | Low         |
| Medium  | 20px    | 1.2        | 8%                 | Medium      |
| Heavy   | 30px    | 1.4        | 12%                | High        |

## Hover state

Glass surfaces gain a slight brightness boost on hover:

```css
.neoabs-card:hover {
  background: var(--neoabs-glass-bg-strong);
  border-color: var(--neoabs-glass-border-strong);
}
```

This provides feedback without adding shadows or scale transforms.

## Scroll behavior

Glass panels are most effective when content scrolls behind them. The navigation bar uses this effect:

```
[fixed glass nav]
  ↓ scroll
[content moves underneath, blurred by backdrop-filter]
```

!!! tip
    Place `overflow: hidden` on the glass container if you want to clip child content to the rounded corners. Without it, content can bleed past the border-radius.

## Accessibility

- `backdrop-filter` does not affect screen readers
- Contrast ratios are maintained by pairing glass backgrounds with the `--neoabs-text-*` tokens
- Reduce-motion preferences are respected: animations tied to glass transitions are disabled when `prefers-reduced-motion: reduce` is active

!!! note
    Glass effects degrade gracefully in browsers without `backdrop-filter` support. The semi-transparent background is rendered as a solid fill, keeping the layout readable.
