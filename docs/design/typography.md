---
title: Typography
---

# Typography

NeoAbs uses two typefaces from the Space family. Both are loaded from Google Fonts and served as variable fonts.

## Font pairs

| Role     | Font            | Weight range | Use case                       |
|----------|-----------------|--------------|--------------------------------|
| Display  | Space Grotesk   | 300 -- 700   | Headings, body, UI labels      |
| Mono     | Space Mono       | 400 -- 700   | Code, inline code, metadata    |

## Type scale

The type scale is defined as CSS custom properties:

```css
--neoabs-text-xs: 0.75rem;     /* 12px */
--neoabs-text-sm: 0.875rem;    /* 14px */
--neoabs-text-base: 1rem;      /* 16px */
--neoabs-text-lg: 1.125rem;    /* 18px */
--neoabs-text-xl: 1.25rem;     /* 20px */
--neoabs-text-2xl: 1.5rem;     /* 24px */
--neoabs-text-3xl: 1.875rem;   /* 30px */
--neoabs-text-4xl: 2.25rem;    /* 36px */
```

## Letter spacing

Different contexts use different tracking:

```css
--neoabs-tracking-tight: -0.025em;   /* large headings */
--neoabs-tracking-normal: 0em;        /* body text */
--neoabs-tracking-wide: 0.05em;       /* small caps, labels */
--neoabs-tracking-widest: 0.1em;      /* uppercase mono labels */
```

## Labels and metadata

Small labels and metadata use Space Mono in uppercase with wide letter spacing:

```css
.label {
  font-family: var(--neoabs-font-mono);
  font-size: var(--neoabs-text-xs);
  text-transform: uppercase;
  letter-spacing: var(--neoabs-tracking-widest);
  color: var(--neoabs-ink-muted);
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
  font-family: var(--neoabs-font-mono);
  font-size: var(--neoabs-text-sm);
  line-height: 1.7;
  tab-size: 2;
}
```

Inline code inherits the mono font but adds a subtle background:

```css
code {
  font-family: var(--neoabs-font-mono);
  background: var(--neoabs-ghost);
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
