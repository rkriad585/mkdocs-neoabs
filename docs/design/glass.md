---
title: Glass Effects
---

# Glass Effects

Glass morphism is the defining visual layer in NeoAbs. Every panel, card, and navigation element uses `backdrop-filter` to create frosted surfaces that sit above the canvas.

## How it works

A glass surface combines three properties:

```css
.glass {
  background: var(--neoabs-glass-medium);
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid var(--neoabs-ghost-strong);
}
```

- **Background** -- a semi-transparent fill that picks up the underlying canvas color
- **Backdrop filter** -- blurs and saturates whatever is behind the element
- **Border** -- a faint edge that separates the glass from its surroundings

## Intensity levels

NeoAbs provides three built-in intensity levels. Set globally with the `glass` theme option, or override per component.

### Light

```css
.glass-light {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(6px) saturate(1.2);
}
```

Minimal frosted effect. The background is barely visible. Use this for large surfaces where blur would be distracting -- footers, sidebars, full-width panels.

### Medium

```css
.glass-medium {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px) saturate(1.4);
}
```

The default. Balanced blur and transparency. Cards, navigation bars, and content panels use this level.

### Heavy

```css
.glass-heavy {
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(20px) saturate(1.6);
}
```

Strong frosted effect with pronounced separation. Use for modals, floating panels, or any element that needs to "float" above the page.

!!! warning
    Heavy glass is more expensive to render. On low-end devices, consider using `medium` as a fallback.

## Comparison

| Level   | Blur    | Saturation | Background opacity | Render cost |
|---------|---------|------------|--------------------|-------------|
| Light   | 6px     | 1.2        | 4%                 | Low         |
| Medium  | 12px    | 1.4        | 7%                 | Medium      |
| Heavy   | 20px    | 1.6        | 10%                | High        |

## Hover state

Glass surfaces gain a slight brightness boost on hover:

```css
.glass:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.15);
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
- Contrast ratios are maintained by pairing glass backgrounds with the `--neoabs-ink` token
- Reduce-motion preferences are respected: animations tied to glass transitions are disabled when `prefers-reduced-motion: reduce` is active

!!! note
    Glass effects degrade gracefully in browsers without `backdrop-filter` support. The semi-transparent background is rendered as a solid fill, keeping the layout readable.
