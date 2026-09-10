---
date: 2026-09-07
title: Typography
---

# Typography

Void uses two typefaces from the Space family. Both are loaded from Google Fonts and served as variable fonts.

## Font pairs

| Role     | Font            | Weight range | Use case                       |
|----------|-----------------|--------------|--------------------------------|
| Display  | Space Grotesk   | 300 -- 700   | Headings, body, UI labels      |
| Mono     | Space Mono       | 400 -- 700   | Code, inline code, metadata    |

## Type scale

The type scale is defined as CSS custom properties:

```css
--void-text-xs: 0.75rem;     /* 12px */
--void-text-sm: 0.875rem;    /* 14px */
--void-text-base: 1rem;      /* 16px */
--void-text-lg: 1.125rem;    /* 18px */
--void-text-xl: 1.25rem;     /* 20px */
--void-text-2xl: 1.5rem;     /* 24px */
--void-text-3xl: 1.875rem;   /* 30px */
--void-text-4xl: 2.25rem;    /* 36px */
```

## Letter spacing

Different contexts use different tracking:

```css
--void-tracking-tight: -0.025em;   /* large headings */
--void-tracking-normal: 0em;        /* body text */
--void-tracking-wide: 0.05em;       /* small caps, labels */
--void-tracking-widest: 0.1em;      /* uppercase mono labels */
```

## Labels and metadata

Small labels and metadata use Space Mono in uppercase with wide letter spacing:

```css
.label {
  font-family: var(--void-font-mono);
  font-size: var(--void-text-xs);
  text-transform: uppercase;
  letter-spacing: var(--void-tracking-widest);
  color: var(--void-ink-muted);
}
```

This convention is used for:

- Section headings above cards
- Badge text
- Table headers
- Breadcrumb separators

!!! note
    The uppercase mono style is reserved for short labels. Never use it for paragraphs or extended reading.

## Code blocks

Code uses Space Mono at `0.875rem` with a line height of 1.7:

```css
.code-block {
  font-family: var(--void-font-mono);
  font-size: var(--void-text-sm);
  line-height: 1.7;
  tab-size: 2;
}
```

Inline code inherits the mono font but adds a subtle background:

```css
code {
  font-family: var(--void-font-mono);
  background: var(--void-ghost);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}
```

## Heading hierarchy

Headings use Space Grotesk with decreasing weight at larger sizes:

| Element | Size  | Weight | Tracking |
|---------|-------|--------|----------|
| `h1`    | 2.25rem | 700  | tight    |
| `h2`    | 1.5rem  | 600  | tight    |
| `h3`    | 1.25rem | 600  | normal   |
| `h4`    | 1.125rem| 500  | normal   |

!!! tip
    Keep headings short. The type system is designed for clarity at a glance, not for long titling strings.
