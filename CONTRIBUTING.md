# Contributing to Void

Thank you for your interest in contributing to mkdocs-void.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mkdocs-void.git
   cd mkdocs-void
   ```
3. Install dependencies:
   ```bash
   pip install -e .
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature
   ```

## Development Workflow

### Build CSS

```bash
npm run build
```

### Watch mode

```bash
npm run start
```

### Dev mode (expanded CSS + source maps)

```bash
npm run dev
```

### Serve docs

```bash
mkdocs serve
```

### Lint Python

```bash
ruff check void/
```

## Project Structure

```
mkdocs-void/
├── void/
│   ├── plugins/          # MkDocs plugin
│   ├── templates/        # Theme templates and assets
│   │   ├── partials/     # HTML partials
│   │   └── assets/       # CSS, JS, images
│   └── __init__.py
├── docs/                 # Documentation source
├── tools/
│   ├── build.js          # SCSS build pipeline
│   ├── emit_benchmarks.py# Regenerates docs/benchmarks.md (page-weight table)
│   ├── emit_changelog.py # Regenerates the [Unreleased] changelog block
│   └── emit_config_reference.py  # Regenerates the generated config reference
├── .github/
│   ├── FUNDING.yml       # GitHub Sponsors funding button
│   └── workflows/        # CI (docs, compat, integrations, benchmarks, changelog, …)
├── mkdocs.yml            # MkDocs configuration
├── pyproject.toml        # Python package config
└── package.json          # Node.js dependencies
```

## Guidelines

- Follow the existing code style
- Use BEM naming with `void-` prefix for CSS classes
- Keep JavaScript vanilla (no frameworks)
- Test changes across dark and light modes
- Verify responsive behavior on mobile viewports
- Ensure keyboard navigation works for all interactive elements

## Commit Guidelines

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `perf:`. The `feat:`/`fix:`/…`
prefix drives the [auto-generated changelog](CHANGELOG.md) (`tools/emit_changelog.py`),
so it is part of the feature, not a nicety.

## Pull Requests

- Keep PRs focused on a single change
- Use Conventional Commits titles (`feat: …`, `fix: …`, `docs: …`)
- Include a clear description of what changed and why
- Update documentation if adding new features
- Ensure `tools/emit_config_reference.py` is run after plugin config changes
- Ensure `mkdocs build --clean` succeeds without warnings

## Reporting Issues

Use the [GitHub issue tracker](https://github.com/rkriad585/mkdocs-void/issues) to report bugs or request features.

## Good First Issues

New to the project? Start with a

[`good first issue`](https://github.com/rkriad585/mkdocs-void/labels/good%20first%20issue)
— issues we tag as small, well-scoped, and friendly to a first contributor.
[`help wanted`](https://github.com/rkriad585/mkdocs-void/labels/help%20wanted)
issues need a maintainer assist and are fair game too. Say “I'll take this” in
the issue thread before opening a PR so nobody collides.

## Translations

Void chrome strings live in `_VOID_DEFAULT_I18N` (`void/plugins/void_plugin.py`)
and are overridable per site with `theme.void.i18n` — see
[Translating Void](docs/identity.md#translating-void) for the full
onboarding (which keys exist, how flat aliases map, how to verify a build).

## Community

- [Discussions](https://github.com/rkriad585/mkdocs-void/discussions) — questions, showsites, ideas
- [GitHub Sponsors](https://github.com/sponsors/rkriad585) — fund development
