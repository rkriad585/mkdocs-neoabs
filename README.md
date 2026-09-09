<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-neoabs/raw/main/logo/logo.svg" alt="NeoAbs Logo" height="150">
</p>

<h1 align="center">mkdocs-neoabs</h1>

<p align="center">
  <strong>Glass + NothingOS Design Language for MkDocs</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.8+-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/mkdocs-1.5+-green?logo=markdown" alt="MkDocs">
  <img src="https://img.shields.io/badge/version-0.1.2-orange" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/made%20by-rkriad585-white" alt="Made by rkriad585">
</p>

---

## Overview

NeoAbs is a custom MkDocs theme that blends the translucent, layered aesthetics of Glass design system with the minimal, industrial clarity of NothingOS. It combines pure black canvas, glass morphism panels, dot-matrix typography, and Nothing Red accents into a cohesive documentation experience.

## Screenshot

<p align="center">
  <img src="https://github.com/rkriad585/mkdocs-neoabs/raw/main/Screenshots/home.png" alt="NeoAbs home screen" width="80%">
</p>

<p align="center">
  <em>More screenshots: <a href="https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/screenshots.md">View all screenshots</a></em>
</p>

---

## Table of Contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Documentation](#documentation)
- [Interface](#interface)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Prerequisites](#prerequisites)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Key Features

- **Glass Morphism** — Translucent glass panels with `backdrop-filter` blur and configurable intensity (light / medium / heavy)
- **NothingOS Canvas** — Pure black (#000000) background with monochrome palette and Nothing Red (#ff3030) accents
- **Dot-Matrix Overlay** — Subtle dot pattern texture inspired by NothingOS
- **Dark & Light Modes** — Toggle between slate (dark) and default (light) color schemes
- **Typography** — Space Grotesk for display/body, Space Mono for code/labels via Google Fonts
- **Responsive Layout** — Sidebar navigation, sticky header, and mobile-friendly drawer
- **Table of Contents** — Auto-generated TOC with active section tracking
- **Full-Screen Search** — Instant search with keyboard shortcut (`/`) and result highlighting
- **Code Blocks** — Syntax highlighting with one-click copy button
- **Admonitions** — Styled note, warning, tip, and danger callouts
- **Tabbed Content** — Alternating-style tabs for grouped content
- **Task Lists** — Interactive checkbox lists
- **Reading Progress Bar** — Visual indicator of scroll position
- **Back-to-Top Button** — Appears on scroll for quick navigation
- **Page Feedback** — "Was this page helpful?" widget that opens a prefilled GitHub issue (no analytics, no tracking)
- **Announcement Bar** — Dismissable one-line banner above the header, remembered per site
- **Privacy-First Cookie Consent** — Banner appears only when a real integration is configured; a single accept/decline flag, nothing tracked
- **Opt-in Comments (giscus)** — Consent-gated comments with palette-synced theme
- **Keyboard Navigation** — Shortcuts for search (`/`), help (`?`), and close (`Esc`)
- **Reduced Motion Support** — Animations disabled when `prefers-reduced-motion` is active
- **SCSS Build Pipeline** — Sass compilation with PostCSS autoprefixer and cssnano minification

---

## Installation

```bash
pip install mkdocs-neoabs
```

This installs both the NeoAbs theme and the companion MkDocs plugin automatically.

---

## Quick Start

1. Install the package:

   ```bash
   pip install mkdocs-neoabs
   ```

2. Create a new MkDocs project:

   ```bash
   mkdocs new my-docs
   cd my-docs
   ```

3. Set the theme in `mkdocs.yml`:

   ```yaml
   site_name: My Docs
   theme:
     name: neoabs
   ```

4. Start the dev server:

   ```bash
   mkdocs serve
   ```

5. Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## Configuration

### Minimal

```yaml
theme:
  name: neoabs
```

### Full

```yaml
theme:
  name: neoabs
  favicon: assets/images/favicon.svg
  language: en
  palette:
    - scheme: slate
      primary: black
      accent: red
      toggle:
        name: Switch to light mode
    - scheme: default
      primary: white
      accent: red
      toggle:
        name: Switch to dark mode
  font:
    text: Space Grotesk
    code: Space Mono
  features:            # Material-compatible passthrough (always-on, no gating)
    - navigation.sections
    - navigation.top
    - navigation.footer
    - content.code.copy
    - search.suggest
    - search.highlight
  neoabs:
    glass: medium
    dot_matrix: true
    animation: normal
    border: thin

plugins:
  - search
  - neoabs
```

### Theme Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `neoabs.glass` | `"light"`, `"medium"`, `"heavy"` | `"medium"` | Glass panel blur intensity |
| `neoabs.dot_matrix` | `true`, `false` | `true` | Dot-matrix background pattern |
| `neoabs.animation` | `"normal"`, `"none"` | `"normal"` | Entrance and hover animations |
| `neoabs.border` | `"thin"`, `"thick"`, `"none"` | `"thin"` | Glass panel border style |

---

## Usage Examples

### Admonitions

```markdown
!!! note "Glass Note"
    This is a styled admonition with the NeoAbs design.

!!! warning "Accent Warning"
    This uses the Nothing Red accent color.

!!! tip "Pro Tip"
    Glass effects adapt to your color scheme choice.
```

### Code Blocks

````markdown
```python
def hello():
    print("Hello from NeoAbs")
```
````

### Tabs

```markdown
=== "Python"

    ```python
    pip install mkdocs-neoabs
    ```

=== "Node.js"

    Not applicable — NeoAbs is a Python package.
```

### Task Lists

```markdown
- [x] Install NeoAbs
- [x] Configure mkdocs.yml
- [ ] Deploy documentation
```

---

## Documentation

| Page | Description |
|------|-------------|
| [Getting Started](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/getting-started/installation.md) | Installation and setup guide |
| [Configuration](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/getting-started/configuration.md) | Full theme configuration reference |
| [Design System Overview](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/design/overview.md) | How the design language works |
| [Colors](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/design/colors.md) | Color tokens and palette reference |
| [Typography](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/design/typography.md) | Font system and type scale |
| [Glass Effects](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/design/glass.md) | Glass morphism implementation details |
| [Buttons](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/components/buttons.md) | Button component variants |
| [Cards](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/components/cards.md) | Card component with glass effects |
| [Forms](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/components/forms.md) | Form elements and validation |
| [NeoAbs Plugin](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/plugins/neoabs.md) | Plugin configuration and options |
| [Architecture](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/architecture.md) | Project structure and internals |
| [Development](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/development.md) | Contributing and dev workflow |
| [Deployment](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/deployment.md) | Build and deployment guide |
| [Troubleshooting](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/troubleshooting.md) | Common issues and fixes |
| [FAQ](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/faq.md) | Frequently asked questions |
| [Screenshots](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/screenshots.md) | Visual gallery of the theme |
| [About](https://github.com/rkriad585/mkdocs-neoabs/blob/main/docs/about.md) | Credits and license |

---

## Interface

NeoAbs is a **MkDocs theme** — it provides HTML templates, CSS, and JavaScript that render your Markdown documentation as a styled website.

### Header

- Logo and site name (left)
- Hamburger menu toggle (mobile)
- Dark/light mode toggle
- Search button
- Repository link

### Sidebar

- Collapsible navigation tree with section grouping
- Active page highlighting
- Toggle buttons for expanding/collapsing sections

### Content

- Markdown content with typeset typography
- Code blocks with syntax highlighting and copy button
- Admonitions, tabs, tables, task lists
- Table of contents (right side on wide screens)

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Open search |
| `?` | Show keyboard shortcuts |
| `Esc` | Close overlay |

---

## Architecture

```tree
mkdocs-neoabs/
├── neoabs/                          # Python package
│   ├── __init__.py                  # Version (0.1.2)
│   ├── plugins/
│   │   └── neoabs_plugin.py         # MkDocs plugin (theme defaults)
│   ├── templates/
│   │   ├── base.html                # Root HTML template
│   │   ├── main.html                # Content wrapper
│   │   ├── 404.html                 # Error page
│   │   ├── mkdocs_theme.yml         # Theme registration
│   │   ├── partials/
│   │   │   ├── header.html          # Sticky header
│   │   │   ├── nav.html             # Sidebar navigation
│   │   │   ├── content.html         # Content renderer
│   │   │   ├── toc.html             # Table of contents
│   │   │   ├── footer.html          # Prev/next + copyright
│   │   │   ├── palette.html         # Dark/light toggle
│   │   │   ├── search.html          # Search modal
│   │   │   ├── progress.html        # Reading progress bar
│   │   │   └── javascripts/
│   │   │       └── palette.html     # FOUC prevention script
│   │   └── assets/
│   │       ├── neoabs.css           # Compiled CSS
│   │       ├── stylesheets/
│   │       │   ├── neoabs.scss      # Design tokens + base
│   │       │   └── components.scss  # Component styles
│   │       ├── javascripts/
│   │       │   └── neoabs.js        # Theme JS (vanilla ES6+)
│   │       └── images/
│   │           ├── logo.svg         # Theme logo
│   │           └── favicon.svg      # Browser favicon
│   ├── extensions/                  # Reserved for future use
│   └── utilities/                   # Reserved for future use
├── docs/                            # Documentation source
├── logo/
│   └── logo.svg                     # Project logo (512x512)
├── tools/
│   ├── build.js                     # SCSS build pipeline
│   └── screenshots_gen.py           # Screenshot generator
├── Screenshots/                     # Generated screenshots
├── mkdocs.yml                       # MkDocs configuration
├── pyproject.toml                   # Python package config
├── package.json                     # Node.js dependencies
└── requirements.txt                 # Python dependencies
```

### Data Flow

```mermaid
graph TD
    A[Markdown Files] --> B[MkDocs]
    B --> C[neoabs_plugin.py]
    C --> D[HTML Templates]
    D --> E[base.html]
    E --> F[partials/header.html]
    E --> G[partials/nav.html]
    E --> H[partials/content.html]
    E --> I[partials/toc.html]
    E --> J[partials/footer.html]
    E --> K[partials/search.html]
    E --> L[assets/neoabs.css]
    E --> M[assets/javascripts/neoabs.js]
    N[neoabs.scss] --> O[tools/build.js]
    O --> P[neoabs.css]
```

### CSS Architecture

The stylesheet is organized in layers:

1. **Design Tokens** (`neoabs.scss` `:root`) — CSS custom properties for colors, spacing, typography, glass, shadows, z-index, animations
2. **Light Mode Overrides** (`[data-md-color-scheme="default"]`) — Token overrides for light theme
3. **Glass Intensity Variants** — Light/medium/heavy glass via `data-md-neoabs-glass` attribute
4. **Base Resets** — Box-sizing, font smoothing, reduced motion
5. **Dot Matrix Overlay** — Radial gradient pattern
6. **Glass Components** — `.neoabs-glass`, `.neoabs-card`
7. **Typography** — Display, labels, body, code
8. **Components** (`components.scss`) — Layout, header, nav, content, TOC, footer, search, tabs, admonitions, code blocks, tables, and more

---

## Requirements

- **Python** 3.8 or higher
- **MkDocs** 1.5 or higher
- **Node.js** 18 or higher (for building CSS)
- A modern browser with support for `backdrop-filter`

---

## Prerequisites

- `pip` (Python package manager)
- `npm` (Node.js package manager)
- A text editor or IDE

---

## Development

### Clone and Install

```bash
git clone https://github.com/rkriad585/mkdocs-neoabs.git
cd mkdocs-neoabs
pip install -e .
npm install
```

### Build CSS

```bash
npm run build
```

### Watch Mode

```bash
npm run start
```

### Dev Mode

```bash
npm run dev
```

### Serve Documentation

```bash
mkdocs serve
```

### Lint

```bash
ruff check neoabs/
```

### Clean

```bash
rm -rf site/ dist/ build/ *.egg-info .ruff_cache/
find . -type d -name __pycache__ -exec rm -rf {} +
```

Or use Make:

```bash
make install    # Install dependencies
make build      # Build CSS
make dev        # Dev mode
make serve      # Serve docs
make lint       # Run linter
make clean      # Remove build artifacts
make help       # Show all commands
```

---

## Acknowledgments

- [MkDocs](https://www.mkdocs.org/) — the static site generator this theme is built for
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) and [Space Mono](https://fonts.google.com/specimen/Space+Mono) — the typefaces used throughout the theme
- Nothing Technology — for the NothingOS design identity

---

<div align="center">

**Developed with ♥ by [rkriad585](https://github.com/rkriad585)**

*Make documentation feel app-like — fast, private, distinctive.*

[GitHub](https://github.com/rkriad585/mkdocs-neoabs) · [Docs](https://rkriad585.github.io/mkdocs-neoabs) · [Changelog](https://github.com/rkriad585/mkdocs-neoabs/blob/main/CHANGELOG.md)

</div>
