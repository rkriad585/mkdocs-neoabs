---
date: 2026-09-07
title: Images & SVG
---

# Images & SVG

NeoAbs provides styled image handling and a flexible way to embed SVG content, all driven by the standard `attr_list` extension so you can attach component classes directly to Markdown images.

## Standard images

Images get the glass treatment automatically: rounded corners, subtle border, and maximum width constraint.

![NeoAbs logo](https://raw.githubusercontent.com/rkriad585/mkdocs-neoabs/main/logo/logo.svg){ width="120" }

```markdown
![NeoAbs logo](https://raw.githubusercontent.com/rkriad585/mkdocs-neoabs/main/logo/logo.svg){ width="120" }
```

## Image lightbox

Click any content image (not wrapped in a link) to open a full-viewport preview
overlay. Close with the × button, clicking the backdrop, the `Esc` key, or
scrolling; navigate multiple openable images with the ← / → arrow keys. The
overlay works with zero dependencies — no extra pip packages.

```yaml
theme:
  neoabs:
    content:
      typography:
        image_lightbox: true   # default true
```

- Images inside a `<a>` (e.g. linked thumbnails) are deliberately left alone.
- The overlay respects `prefers-reduced-motion` and locks body scroll while open.

## Image classes via `attr_list`

Attach any class directly to an image with the `{.class}` suffix — no HTML needed:

| Class | Effect |
|-------|--------|
| `neoabs-img-round` | Circular crop |
| `neoabs-img-ghost` | Dimmed/desaturated |
| `neoabs-image--banner` | Full-width banner (max-height 380px, cover) |
| `neoabs-image--thumbnail` | Small 220px thumbnail |

```markdown
![Round](img.png){ .neoabs-img-round width="140" }
![Ghost](img.png){ .neoabs-img-ghost }
![Banner](img.png){ .neoabs-image--banner }
```

## Figure with caption

Use a small HTML `<figure>` for images with captions:

<figure class="neoabs-figure">
  <img src="https://raw.githubusercontent.com/rkriad585/mkdocs-neoabs/main/logo/logo.svg" alt="NeoAbs logo" width="96">
  <figcaption>Figure 1 — The NeoAbs logo</figcaption>
</figure>

```html
<figure class="neoabs-figure">
  <img src="https://raw.githubusercontent.com/rkriad585/mkdocs-neoabs/main/logo/logo.svg" alt="NeoAbs logo" width="96">
  <figcaption>Figure 1 — The NeoAbs logo</figcaption>
</figure>
```

## Inline SVG component

Wrap raw SVG in a `.neoabs-svg` container to get a bordered glass panel that centers and scrolls the artwork:

<div class="neoabs-svg">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="100%" height="100%">
  <rect x="10" y="10" width="100" height="40" rx="8" fill="currentColor" opacity="0.2"/>
  <circle cx="30" cy="30" r="8" fill="#ff3030"/>
  <rect x="45" y="22" width="50" height="4" rx="2" fill="currentColor" opacity="0.6"/>
  <rect x="45" y="30" width="34" height="4" rx="2" fill="currentColor" opacity="0.4"/>
</svg>
</div>

```html
<div class="neoabs-svg">
  <svg viewBox="0 0 120 60">
    <!-- your SVG markup -->
  </svg>
</div>
```

Use `neoabs-svg--bare` for a borderless, transparent container when you don't want the glass panel look.

## Dividers & badges

A decorative divider component:

<div class="neoabs-divider">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.6h7.6L12 2z"/></svg>
</div>

```html
<div class="neoabs-divider">
  <svg ...>...</svg>
</div>
```

Status badges:

<div>
  <span class="neoabs-badge neoabs-badge--accent">Accent</span>
  <span class="neoabs-badge neoabs-badge--success">Success</span>
  <span class="neoabs-badge neoabs-badge--warning">Warning</span>
  <span class="neoabs-badge neoabs-badge--error">Error</span>
</div>

```html
<span class="neoabs-badge neoabs-badge--success">Success</span>
```
