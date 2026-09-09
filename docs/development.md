---
date: 2026-09-07
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
| `tools/emit_benchmarks.py` | Regenerates `docs/benchmarks.md` (page-weight table) |
| `tools/emit_changelog.py` | Regenerates the `[Unreleased]` changelog block |
| `tools/emit_config_reference.py` | Regenerates the generated config reference |

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

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) so
the changelog can be machine-checked:

- `feat:` — a new user-facing feature or config surface
- `fix:` — a bug fix
- `docs:` — documentation-only changes
- `chore:` / `refactor:` / `perf:` / `ci:` — non-user-facing changes

`tools/emit_changelog.py` turns the commit list into the `[Unreleased]` block
of `CHANGELOG.md` (a CI workflow opens a PR whenever it changes), so the
prefix is part of the feature — keep it accurate and use focused commits.
Other rules:

- Keep commits focused on a single change
- Use clear, descriptive commit messages
- Do not commit `site/`, `node_modules/`, or `__pycache__/`

## Translating NeoAbs

UI strings are centralized in `_NEOABS_DEFAULT_I18N`
(`neoabs/plugins/neoabs_plugin.py`) and overridable per site via
`theme.neoabs.i18n`. See [Translating NeoAbs](identity.md#translating-neoabs)
for onboarding: which keys exist, how flat aliases map to nested groups, and
how to verify a translated build.

---

[Back to README](index.md)
