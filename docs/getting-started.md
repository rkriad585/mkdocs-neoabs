---
title: Getting Started
---

# Getting Started

This section covers installation, setup, and configuration of the NeoAbs theme.

## Installation

Install the theme from PyPI:

```bash
pip install mkdocs-neoabs
```

This installs both the theme and the companion MkDocs plugin.

## Quick Setup

1. Create a new MkDocs project:

   ```bash
   mkdocs new my-docs
   cd my-docs
   ```

2. Set the theme in `mkdocs.yml`:

   ```yaml
   site_name: My Docs
   theme:
     name: neoabs
   ```

3. Start the dev server:

   ```bash
   mkdocs serve
   ```

4. Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Next Steps

- [Configuration](getting-started/configuration.md) — Customize the theme to your liking
- [Design System](design/overview.md) — Learn how the design works under the hood
- [Components](components/buttons.md) — Explore available UI components

---

[Back to README](index.md)
