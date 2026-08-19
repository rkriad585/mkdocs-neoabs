# Contributing to NeoAbs

Thank you for your interest in contributing to mkdocs-neoabs.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mkdocs-neoabs.git
   cd mkdocs-neoabs
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
ruff check neoabs/
```

## Project Structure

```
mkdocs-neoabs/
├── neoabs/
│   ├── plugins/          # MkDocs plugin
│   ├── templates/        # Theme templates and assets
│   │   ├── partials/     # HTML partials
│   │   └── assets/       # CSS, JS, images
│   └── __init__.py
├── docs/                 # Documentation source
├── tools/
│   └── build.js          # SCSS build pipeline
├── mkdocs.yml            # MkDocs configuration
├── pyproject.toml        # Python package config
└── package.json          # Node.js dependencies
```

## Guidelines

- Follow the existing code style
- Use BEM naming with `neoabs-` prefix for CSS classes
- Keep JavaScript vanilla (no frameworks)
- Test changes across dark and light modes
- Verify responsive behavior on mobile viewports
- Ensure keyboard navigation works for all interactive elements

## Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Update documentation if adding new features
- Ensure `mkdocs build --clean` succeeds without warnings

## Reporting Issues

Use the [GitHub issue tracker](https://github.com/rkriad585/mkdocs-neoabs/issues) to report bugs or request features.
