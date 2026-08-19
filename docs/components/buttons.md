---
title: Buttons
---

# Buttons

NeoAbs provides button variants built on the design tokens. All buttons use Space Grotesk and inherit accent colors from the palette.

!!! note
    The base `.neoabs-button`, `.neoabs-button--icon`, and `.neoabs-button--primary` classes are implemented in the theme. The additional variants shown below (`--accent`, `--ghost`, `--pill`, `--sm`, `--lg`) are part of the design system specification. Add them to your custom CSS if needed.

## Variants

### Default

The standard button. Uses the accent color for its background.

```html
<button class="neoabs-btn">Default</button>
```

```css
.neoabs-button {
  font-family: var(--neoabs-font-display);
  font-size: var(--neoabs-text-sm);
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  background: var(--neoabs-accent);
  color: var(--neoabs-canvas);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.neoabs-button:hover {
  background: var(--neoabs-accent-hover);
}
```

### Accent (outline)

A bordered variant that uses the accent color for its border and text, with a transparent background.

```html
<button class="neoabs-btn neoabs-btn--accent">Accent</button>
```

```css
.neoabs-button--accent {
  background: transparent;
  color: var(--neoabs-accent);
  border: 1px solid var(--neoabs-accent);
}

.neoabs-button--accent:hover {
  background: var(--neoabs-accent-faint);
}
```

### Ghost

No background, no border. Pure text that inherits the accent color on hover.

```html
<button class="neoabs-btn neoabs-btn--ghost">Ghost</button>
```

```css
.neoabs-button--ghost {
  background: transparent;
  color: var(--neoabs-ink-muted);
  border: none;
}

.neoabs-button--ghost:hover {
  color: var(--neoabs-accent);
}
```

### Pill

A rounded, filled variant for prominent calls to action.

```html
<button class="neoabs-btn neoabs-btn--pill">Pill</button>
```

```css
.neoabs-button--pill {
  border-radius: 9999px;
  padding: 0.5rem 1.5rem;
  background: var(--neoabs-accent);
  color: var(--neoabs-canvas);
  font-weight: 600;
}
```

## Sizes

| Size    | Padding          | Font size         |
|---------|------------------|--------------------|
| Small   | `0.35rem 0.75rem`| `0.75rem`          |
| Default | `0.5rem 1.25rem` | `0.875rem`         |
| Large   | `0.65rem 1.75rem`| `1rem`             |

```html
<button class="neoabs-btn neoabs-btn--sm">Small</button>
<button class="neoabs-btn">Default</button>
<button class="neoabs-btn neoabs-btn--lg">Large</button>
```

## Disabled state

```css
.neoabs-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```

!!! note
    Disabled buttons use opacity rather than color changes. This keeps the visual language consistent across light and dark modes.

## Usage guidelines

- Use **default** for primary actions (submit, save, confirm)
- Use **accent** for secondary actions (cancel, learn more)
- Use **ghost** for tertiary actions (dismiss, close, skip)
- Use **pill** sparingly for hero sections and key CTAs

!!! tip
    Limit buttons to one primary action per view. Too many filled buttons compete for attention and reduce clarity.
