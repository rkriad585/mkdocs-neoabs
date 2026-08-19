---
title: Cards
---

# Cards

Cards are the primary content container in NeoAbs. Every card uses the glass system to sit above the canvas.

!!! note
    The base `.neoabs-card` class is implemented in the theme. The modifier classes shown below (`--light`, `--medium`, `--heavy`, `--accent`) are part of the design system specification. Add them to your custom CSS if needed.

## Default card

```html
<div class="neoabs-card">
  <h3>Card title</h3>
  <p>Card body text goes here.</p>
</div>
```

```css
.neoabs-card {
  background: var(--neoabs-glass-medium);
  backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid var(--neoabs-ghost-strong);
  border-radius: 12px;
  padding: 1.5rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}
```

## Hover effect

Cards gain a subtle lift on hover through background and border changes:

```css
.neoabs-card:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.15);
}
```

!!! note
    NeoAbs intentionally avoids `transform: translateY()` for hover effects. The glass background change provides enough feedback without causing layout shift.

## Glass intensity

Cards respect the global `glass` setting, but can be overridden:

```html
<div class="neoabs-card neoabs-card--light">Light glass</div>
<div class="neoabs-card neoabs-card--medium">Medium glass</div>
<div class="neoabs-card neoabs-card--heavy">Heavy glass</div>
```

| Class                      | Blur    | Use case                        |
|----------------------------|---------|---------------------------------|
| `neoabs-card--light`       | 6px     | Sidebars, large panels          |
| `neoabs-card--medium`      | 12px    | Default content cards           |
| `neoabs-card--heavy`       | 20px    | Modals, floating panels         |

## Card with accent border

Add an accent-colored top border to draw attention:

```html
<div class="neoabs-card neoabs-card--accent">Highlighted card</div>
```

```css
.neoabs-card--accent {
  border-top: 2px solid var(--neoabs-accent);
}
```

## Card grid

Cards work in CSS Grid layouts:

```css
.neoabs-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
```

```html
<div class="neoabs-card-grid">
  <div class="neoabs-card">One</div>
  <div class="neoabs-card">Two</div>
  <div class="neoabs-card">Three</div>
</div>
```

!!! tip
    Use `auto-fill` with `minmax` instead of fixed column counts. This lets cards reflow naturally on smaller screens without media queries.

## Code example cards

For documentation, cards often contain code blocks. The glass background provides a clean container:

```html
<div class="neoabs-card">
  <span class="label">Example</span>
  <h4>Installing a package</h4>
  <pre><code>pip install mkdocs-neoabs</code></pre>
</div>
```

!!! warning
    Avoid nesting heavy glass cards inside other glass cards. The layered blur can cause visual artifacts on some browsers.
