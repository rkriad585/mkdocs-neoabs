---
date: 2026-09-07
title: Buttons
---

# Buttons

Void provides button classes built on the design tokens. All buttons use
Space Grotesk and inherit accent colors from the palette.

!!! note
    The following classes are built into the theme — no custom CSS required.

!!! tip
    Clicking any `.void-btn` shows a brief toast notification (e.g. "Clicked: Default") and a pressed-scale feedback effect. This is wired up automatically by `initUIExamples()` — no extra JavaScript needed.

## Default

The standard filled button.

<div class="void-container" markdown>

<button class="void-btn">Default</button>

</div>

```html
<button class="void-btn">Default</button>
```

## Accent (outline)

A bordered variant with transparent background.

<div class="void-container" markdown>

<button class="void-btn void-btn--accent">Accent</button>

</div>

```html
<button class="void-btn void-btn--accent">Accent</button>
```

## Ghost

No background, no border. Muted text that highlights on hover.

<div class="void-container" markdown>

<button class="void-btn void-btn--ghost">Ghost</button>

</div>

```html
<button class="void-btn void-btn--ghost">Ghost</button>
```

## Pill

Rounded, filled, and prominent — best for key calls to action.

<div class="void-container" markdown>

<button class="void-btn void-btn--pill">Pill</button>

</div>

```html
<button class="void-btn void-btn--pill">Pill</button>
```

## Sizes

Add `--sm` or `--lg` to any variant to adjust size.

<div class="void-container" markdown>

<button class="void-btn void-btn--sm">Small</button>
<button class="void-btn">Default</button>
<button class="void-btn void-btn--lg">Large</button>

</div>

```html
<button class="void-btn void-btn--sm">Small</button>
<button class="void-btn">Default</button>
<button class="void-btn void-btn--lg">Large</button>
```

## Disabled

Add the native `disabled` attribute to dim and deactivate any button.

<div class="void-container" markdown>

<button class="void-btn" disabled>Disabled</button>
<button class="void-btn void-btn--accent" disabled>Disabled</button>
<button class="void-btn void-btn--ghost" disabled>Disabled</button>

</div>

```html
<button class="void-btn" disabled>Disabled</button>
<button class="void-btn void-btn--accent" disabled>Disabled</button>
<button class="void-btn void-btn--ghost" disabled>Disabled</button>
```

## Combining variants

Modifiers can be mixed freely.

<div class="void-container" markdown>

<button class="void-btn void-btn--accent void-btn--pill">Accent Pill</button>
<button class="void-btn void-btn--ghost void-btn--lg">Large Ghost</button>

</div>

```html
<button class="void-btn void-btn--accent void-btn--pill">Accent Pill</button>
<button class="void-btn void-btn--ghost void-btn--lg">Large Ghost</button>
```
