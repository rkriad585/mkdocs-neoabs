---
date: 2026-09-07
title: Deployment
---

# Deployment

How to build and deploy your NeoAbs-powered documentation site.

## Build for Production

```bash
mkdocs build --clean
```

This generates a static site in the `site/` directory.

## Local Preview

```bash
mkdocs serve
```

Preview at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Deploy to GitHub Pages

### Manual

```bash
mkdocs gh-deploy --force
```

This builds the site and pushes it to the `gh-pages` branch.

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
    paths:
      - "docs/**"
      - "neoabs/**"
      - "mkdocs.yml"

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: pip install mkdocs-neoabs
      - run: npm install && npm run build
      - run: mkdocs gh-deploy --force
```

## Deploy to Netlify

1. Connect your repository to Netlify
2. Set the build command:

   ```bash
   pip install mkdocs-neoabs && npm install && npm run build && mkdocs build
   ```

3. Set the publish directory to `site`

## Deploy to Vercel

Create `vercel.json`:

```json
{
  "buildCommand": "pip install mkdocs-neoabs && npm install && npm run build && mkdocs build",
  "outputDirectory": "site",
  "framework": null
}
```

## Deploy with Docker

```bash
docker build -t mkdocs-neoabs .
docker run -p 8000:8000 mkdocs-neoabs
```

## Static Hosting

After running `mkdocs build`, upload the contents of the `site/` directory to any static hosting provider:

- AWS S3 + CloudFront
- Cloudflare Pages
- Firebase Hosting
- GitLab Pages

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MKDOCS_HOST` | `127.0.0.1` | Dev server host |
| `MKDOCS_PORT` | `8000` | Dev server port |

## CI/CD Tips

- Always run `mkdocs build --clean` in CI to ensure a fresh build
- Cache `node_modules/` and pip packages for faster builds
- Pin the `mkdocs-neoabs` version in production to avoid unexpected changes

---

[Back to README](index.md)
