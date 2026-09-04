---
title: Tables
---

# Tables

Tables are styled out of the box by the theme. Standard Markdown (PHP-Markdown style) tables, as well as raw `<table>` elements, get the glass treatment: a distinct header row, uppercase monospace header labels, row hover highlighting, and a responsive scroll wrapper.

!!! note
    This styling is built into the theme — no configuration is required. Markdown tables render automatically.

## Markdown Tables

The simplest way to create a table is with Markdown:

| Feature           | Status      | Notes                         |
|-------------------|-------------|-------------------------------|
| Admonitions       | Done        | Full Material family + icons  |
| Tabs              | Done        | Keyboard navigable, unlimited |
| Task Lists        | Done        | Persisted to localStorage     |
| Mermaid Diagrams  | Done        | Themed dark/light rendering   |

```markdown
| Feature           | Status      | Notes                         |
|-------------------|-------------|-------------------------------|
| Admonitions       | Done        | Full Material family + icons  |
| Tabs              | Done        | Keyboard navigable, unlimited |
| Task Lists        | Done        | Persisted to localStorage     |
| Mermaid Diagrams  | Done        | Themed dark/light rendering   |
```

## Aligned Columns

Markdown supports left, center, and right column alignment via the separator row:

| Left          | Center          | Right |
|:--------------|:---------------:|------:|
| Alpha         | Beta            |  100% |
| Gamma         | Delta           |   50% |

```markdown
| Left          | Center          | Right |
|:--------------|:---------------:|------:|
| Alpha         | Beta            |  100% |
| Gamma         | Delta           |   50% |
```

## Hover Interaction

Rows highlight on hover and the header is a distinct glass band:

| Package       | Version | Python |
|---------------|:-------:|:------:|
| mkdocs        |  1.6    |  >=3.8 |
| pymdownx      |  10.9   |  >=3.8 |
| highlight.js  |  11.9   |   n/a  |

## HTML Tables with Classes

For more control, use a raw HTML table and add the `neoabs-table` class (and optionally wrap it in a `neoabs-table__wrap` for responsive scrolling):

<div class="neoabs-table__wrap">
  <table class="neoabs-table">
    <thead>
      <tr>
        <th>Keyboard</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd></td>
        <td>Toggle the Notes panel</td>
      </tr>
      <tr>
        <td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd></td>
        <td>Toggle the navigation sidebar</td>
      </tr>
    </tbody>
  </table>
</div>

```html
<div class="neoabs-table__wrap">
  <table class="neoabs-table">
    <thead>
      <tr><th>Keyboard</th><th>Action</th></tr>
    </thead>
    <tbody>
      <tr><td>Ctrl+Shift+N</td><td>Toggle the Notes panel</td></tr>
      <tr><td>Ctrl+Shift+B</td><td>Toggle the navigation sidebar</td></tr>
    </tbody>
  </table>
</div>
```

## Styling Notes

- **`.neoabs-table__wrap`** — adds a scrollable container so wide tables scroll horizontally on small screens.
- Plain `<table>` (Markdown output) is styled identically without needing any class.
- Header cells use the theme's mono font and uppercase tracking for a consistent technical look.
