---
title: Development
---

# Development

How to set up, build, and contribute to mkdocs-neoabs.

## Prerequisites

- Python 3.8+
- Node.js 18+
- pip
- npm

## Setup

```bash
git clone https://github.com/rkriad585/mkdocs-neoabs.git
cd mkdocs-neoabs
pip install -e .
npm install
```

## Build CSS

```bash
npm run build
```

Compiles `neoabs.scss` + `components.scss` into `neoabs.css` via Sass and PostCSS.

## Development Mode

```bash
npm run dev
```

Builds with expanded CSS and inline source maps for easier debugging.

## Watch Mode

```bash
npm run start
```

Automatically rebuilds CSS when any `.scss` file changes.

## Serve Documentation

```bash
mkdocs serve
```

Opens a live-reloading dev server at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Lint

```bash
ruff check neoabs/
```

## Project Layout

| Path | Description |
|------|-------------|
| `neoabs/templates/` | Jinja2 templates and static assets |
| `neoabs/templates/assets/stylesheets/` | SCSS source files |
| `neoabs/templates/assets/javascripts/` | JavaScript source |
| `neoabs/plugins/` | MkDocs plugin |
| `docs/` | Documentation Markdown source |
| `tools/build.js` | SCSS build script |

## Making Changes

### CSS Changes

1. Edit files in `neoabs/templates/assets/stylesheets/`
2. Run `npm run build` or `npm run start` (watch mode)
3. Reload the browser

### Template Changes

1. Edit files in `neoabs/templates/` or `neoabs/templates/partials/`
2. Run `mkdocs serve` (auto-reloads on template changes)

### JavaScript Changes

1. Edit `neoabs/templates/assets/javascripts/neoabs.js`
2. Reload the browser (no build step required for dev)

### Plugin Changes

1. Edit `neoabs/plugins/neoabs_plugin.py`
2. Restart `mkdocs serve`

## Code Style

- **CSS**: BEM naming with `neoabs-` prefix. No utility frameworks.
- **JavaScript**: Vanilla ES6+, IIFE-wrapped, no dependencies. Uses `$()` and `$$()` helpers.
- **HTML**: Jinja2 templates. Follow MkDocs template conventions.
- **Python**: Standard MkDocs plugin pattern. Use `ruff` for linting.

## Testing

1. Run `mkdocs build --clean` to verify the site builds without errors
2. Run `mkdocs serve` and manually test:
   - Dark/light mode toggle
   - Search functionality
   - Responsive layout (mobile/desktop)
   - Keyboard shortcuts (`/`, `?`, `Esc`)
   - Navigation toggle
   - Code copy button
   - Back-to-top button
   - Reading progress bar

## Commit Guidelines

- Keep commits focused on a single change
- Use clear, descriptive commit messages
- Do not commit `site/`, `node_modules/`, or `__pycache__/`

---

[Back to README](index.md)
