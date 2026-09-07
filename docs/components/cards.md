---
date: 2026-09-07
title: Cards
---

# Cards

Cards are the primary content container in NeoAbs. Every card uses the glass
system to sit above the canvas with blur, border, and padding baked in.

## Default card

```html
<div class="neoabs-card">
  <h3>Card title</h3>
  <p>Card body text goes here.</p>
</div>
```

<div class="neoabs-card">
  <h3>Card title</h3>
  <p>Card body text goes here.</p>
</div>

## Glass intensity

Cards respect the global glass setting but can be overridden per card.

```html
<div class="neoabs-card neoabs-card--light">Light glass</div>
<div class="neoabs-card neoabs-card--medium">Medium glass</div>
<div class="neoabs-card neoabs-card--heavy">Heavy glass</div>
```

<div class="neoabs-card neoabs-card--light">
  <strong>Light</strong> &mdash; 6 px blur, good for sidebars and large panels.
</div>

<div class="neoabs-card neoabs-card--medium">
  <strong>Medium</strong> &mdash; default blur, suitable for most content.
</div>

<div class="neoabs-card neoabs-card--heavy">
  <strong>Heavy</strong> &mdash; 40 px blur, ideal for modals and floating panels.
</div>

## Accent border

Add a 2 px solid accent top border to draw attention.

```html
<div class="neoabs-card neoabs-card--accent">
  <h3>Highlighted card</h3>
  <p>This card has an accent top border.</p>
</div>
```

<div class="neoabs-card neoabs-card--accent">
  <h3>Highlighted card</h3>
  <p>This card has an accent top border.</p>
</div>

## Card grid

The grid utility arranges cards in responsive columns with a 16 px gap.

```html
<div class="neoabs-card-grid">
  <div class="neoabs-card">One</div>
  <div class="neoabs-card">Two</div>
  <div class="neoabs-card">Three</div>
</div>
```

<div class="neoabs-card-grid">
  <div class="neoabs-card">
    <h4>First card</h4>
    <p>Auto-fill with minmax(260px, 1fr) handles reflow without media queries.</p>
  </div>
  <div class="neoabs-card">
    <h4>Second card</h4>
    <p>Each card grows to fill available space inside its column.</p>
  </div>
  <div class="neoabs-card">
    <h4>Third card</h4>
    <p>The 16 px gap keeps everything breathable.</p>
  </div>
</div>

## Hover effect

Cards gain a subtle background and border-color change on hover. No
`transform: translateY()` is used, so there is no layout shift.

## Notes

- Cards have 20 px padding, a 12 px border radius, and 1 px border by default.
- Avoid nesting heavy glass cards inside other glass cards; layered blur can
  cause visual artifacts on some browsers.
