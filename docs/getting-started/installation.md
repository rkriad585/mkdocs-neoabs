---
date: 2026-09-07
title: Installation
icon: "🚀"
---

# Installation

Get Void up and running in a few steps.

## Requirements

- **Python** 3.8 or higher
- **MkDocs** 1.5 or higher
- A modern browser with support for `backdrop-filter`

## Install

```bash
pip install mkdocs-void
```

!!! note
    Void depends on MkDocs. If you don't have it installed yet, it will be pulled in automatically.

## Create a project

```bash
mkdocs new my-docs
cd my-docs
```

## Enable the theme

Replace the contents of `mkdocs.yml`:

```yaml
site_name: My Docs
theme:
  name: void
```

## Serve

```bash
mkdocs serve
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser. You should see the Void theme with glass panels, dot matrix background, and the default palette.

## Verify installation

Run the following to confirm everything is in place:

```bash
mkdocs --version
pip show mkdocs-void
```

!!! tip
    If you see CSS or rendering issues, make sure your browser supports `backdrop-filter`. Chrome, Edge, Safari, and Firefox all have support as of 2024.

## Next steps

- [Configuration](configuration.md) -- customize the theme to your liking
- [Design System](../design/overview.md) -- learn how the design works under the hood
