---
title: Trees
---

# Trees (Project Structure)

Display a directory tree / project structure in a clean "file explorer" card. NeoAbs gives `tree` code blocks a glassy, monospace treatment with subtly dimmed comments.

## Basic usage

Wrap the tree in a `tree` fenced code block:

```tree
mkdocs-neoabs/
├── neoabs/                          # Python package
│   ├── __init__.py                  # Version (0.1.2)
│   ├── templates/
│   │   ├── base.html
│   │   ├── main.html
│   │   └── partials/
│   │       ├── header.html
│   │       └── toc.html
│   └── plugins/
│       └── neoabs_plugin.py         # MkDocs plugin
├── docs/
│   ├── index.md
│   └── components/
├── mkdocs.yml
└── requirements.txt
```

````markdown
```tree
mkdocs-neoabs/
├── neoabs/                          # Python package
│   ├── __init__.py                  # Version (0.1.2)
...
```
````

## Features

- **Box-drawing support** — `├──`, `└──`, `│   ` glyphs render crisply in a monospace font.
- **Dimmed comments** — trailing `# comments` are shown in muted italic so they don't fight the tree lines.
- **File-explorer card** — each tree is wrapped in a subtle glass panel with rounded corners.
- **Scrollable** — long trees scroll horizontally instead of wrapping.

## Aligning comments

Pipe characters and spaces keep columns aligned. Use a monospace source editor; NeoAbs renders 1:1 with `white-space: pre`.

```tree
src/
├── core/
│   ├── engine.py        # entry point
│   └── parser.py        # tokenizer
└── ui/
    ├── app.js           # main view
    └── styles.js        # tokens
```

## Customizing

Override the card background/border by targeting the tree block in a custom stylesheet:

```css
/* extra.css */
.highlight.language-tree {
  background: rgba(255, 255, 0, 0.04);
  border-color: var(--neoabs-accent);
}
```

Trees pair well with the **Code Highlighting** and **Admonitions** components. See [CSS Classes in Markdown](classes.md) to attach your own classes.
