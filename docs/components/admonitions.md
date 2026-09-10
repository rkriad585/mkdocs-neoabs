---
date: 2026-09-07
---

# Admonitions

Void styles the standard MkDocs `admonition` extension, plus collapsible
`???` (details) blocks and inline variants. Every type maps to a themed accent
color and a small icon in the title.

## Usage

```markdown
!!! note
    A note uses the accent blue color.
```

## Types

### Note / Info / Example

```markdown
!!! note
    A generic note.
```

!!! note
    A generic note.

```markdown
!!! info
    Additional information.
```

!!! info "Custom title"
    Custom titles are supported.

```markdown
!!! example
    An example block.
```

!!! example
    An example block.

### Abstract / Summary / TLDR

```markdown
!!! abstract "Summary"
    A condensed takeaway.
```

!!! abstract "Summary"
    A condensed takeaway.

### Tip / Hint / Question / FAQ

```markdown
!!! tip
    A helpful tip.
```

!!! tip
    A helpful tip.

```markdown
!!! question
    A question worth asking.
```

!!! question
    A question worth asking.

### Success / Done / Check

```markdown
!!! success
    Everything worked.
```

!!! success
    Everything worked.

### Warning / Caution / Attention

```markdown
!!! warning
    Watch out.
```

!!! warning
    Watch out.

### Danger / Error / Failure / Bug / Important

```markdown
!!! danger
    This is destructive.
```

!!! danger
    This is destructive.

```markdown
!!! bug
    Known defect.
```

!!! bug
    Known defect.

```markdown
!!! important
    Really important requirement.
```

!!! important
    Really important requirement.

### Quote

```markdown
!!! quote
    "Less, but better." — Dieter Rams
```

!!! quote
    "Less, but better." — Dieter Rams

## Collapsible (details)

Use `???` for an initially-closed block and `???+` for an open-by-default block.

```markdown
??? note "Expand me"
    Hidden until expanded.
```

??? note "Expand me"
    Hidden until expanded.

```markdown
???+ danger
    Open by default and collapsible.
```

???+ danger
    Open by default and collapsible.

## Inline

The `inline` class floats an admonition beside content.

```markdown
!!! note inline
    Floats to the left in this layout.
```

!!! note inline
    Floats to the left in this layout.

Paragraph text that wraps around the inline admonition demonstrates the
floating behavior. Copy continues to flow around the floated box, letting you
place short callouts against prose without breaking the reading flow.

## Custom types

Any unknown type still renders as a default-styled admonition. You can add your
own by defining a color for the class in your CSS:

```css
.admonition.mytype::before {
    background: #7a5cff;
}
.admonition.mytype .admonition-title {
    color: #7a5cff;
}
```
