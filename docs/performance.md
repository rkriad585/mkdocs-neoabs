# Performance & offline

Void ships prefetch-on-hover by default so on-site pages feel instant after
the first load. A light-weight service worker (`sw.js`) caches static assets
and CDN resources for repeat visits and full offline coverage.

## Asset modes

`theme.void.assets.mode` controls how the three lazy-loaded libraries
(highlight.js, KaTeX, Mermaid) are referenced at runtime:

| Mode | Default | Behaviour |
|------|---------|-----------|
| `cdn` | **Yes** | Today's runtime CDN loading — deterministic, no build-time network. |
| `local` | opt-in | Vendors the libraries into `site/<vendor_dir>/` at build; the built site is fully self-hosted and offline-capable for code blocks and math. |
| `bundle` | opt-in | Like `local`, but all three JS bundles are concatenated into a single file (`void-offline.js`). CSS stays per-library because the dual hljs theme toggle cannot be combined. |

Every downloaded asset is validated — a failed download logs a warning and the
affected component falls back to its CDN URL instead of leaving a broken local
reference.

## Inline critical CSS

`theme.void.assets.inline_critical_css: true` (requires `mode: local` or
`bundle`) inlines the vendored highlight.js theme stylesheets as `<style>`
blocks so switching dark/light never waits for an extra network round-trip. The
KaTeX stylesheet is inlined only on pages that contain math, with its font URLs
automatically rewritten against the page's relative `base_url`.

## Prefetch on hover

Internal links are prefetched when the pointer hovers them (`components.prefetch`):

```yaml
theme:
  void:
    components:
      prefetch:
        show: true          # on by default
        external: false     # true also previews off-site links
        exclude: []         # URL substrings to skip
```

Prefetch respects `navigator.connection.saveData` and never fires on the
current page, the search entry point, or `javascript:`/`mailto:` links.

## Lighthouse budget

The CI workflow `.github/workflows/performance.yml` runs
[treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action)
against the deployed docs site on every push to `main`, enforcing a minimum
score of 0.95 in performance, accessibility, best practices, and SEO.
