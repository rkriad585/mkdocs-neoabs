---
date: 2026-09-09
title: Third-Party Integrations
---

# Third-Party Integrations

NeoAbs works with the normal MkDocs plugin ecosystem. The recipes below are
drop-in: add the plugin to `plugins:` in `mkdocs.yml`, keep `- neoabs`, and
the theme handles the rest. Every recipe on this page is built continuously by
the repository's Integrations CI job — if a recipe stops working, the check
fails.

## Plugin ordering

MkDocs runs plugins in the order they appear in `plugins:`. A few rules of
thumb:

1. Put `awesome-pages` **first** — it builds the navigation from folders and
   other plugins (and `section-index`) consume that nav.
2. Keep `search` early so later plugins can reference its output.
3. `git-revision-date-localized` and `git-authors` read your Git history, so
   they need a Git checkout (CI clones are fine).
4. `print-site` usually sits near the end — it renders every page into one
   combined document.
5. `neoabs` last is always safe: the theme reads the `page.meta` that earlier
   plugins have written.

## mkdocs-git-revision-date-localized

Adds a real "Last updated" date from your Git history. NeoAbs renders it
natively — the footer's `theme.neoabs.meta` block reads
`page.meta.git_revision_date_localized` and shows it with your configured
label.

```yaml
# mkdocs.yml
theme:
  name: neoabs
  neoabs:
    meta:
      enabled: true
      show_last_updated: true
      last_updated_label: "Last updated"
      date_source: auto   # auto | git | front_matter

plugins:
  - search
  - git-revision-date-localized:
      enabled: true
      fallback_to_build_date: true
      type: date
      enable_creation_date: false
  - neoabs
```

- `auto` (default) prefers the Git date and falls back to the page's `date:`
  front matter; `git` uses only Git, `front_matter` ignores Git entirely.
- Without the plugin nothing breaks — the footer simply falls back to
  front matter or hides the row.

## mkdocs-glightbox

Adds a lightbox to your images. NeoAbs already ships a built-in vanilla
lightbox (`theme.neoabs.content.typography.image_lightbox`, on by default), so
use `glightbox` instead only if you want its feature set — and turn the built-in
one off to avoid double handling:

```yaml
# mkdocs.yml
theme:
  name: neoabs
  neoabs:
    content:
      typography:
        image_lightbox: false

plugins:
  - search
  - glightbox:
      compact: false
      auto_caption: true
  - neoabs
```

The built-in lightbox needs no JavaScript library and no extra pip install —
consider keeping it if you only need click-to-zoom.

## mkdocs-print-site

Renders a combined "print site" (single-page HTML you can save as PDF). It
can reuse the NeoAbs theme for the generated print pages:

```yaml
# mkdocs.yml
plugins:
  - search
  - print-site:
      add_to_navigation: true
      print_page_path: print_page
      theme: neoabs
      numbered_headings: true
  - neoabs
```

The generated page lands at `print_page/index.html` and ships with the rest of
the site, so it works offline like every other NeoAbs page.

## mkdocs-section-index

Makes navigation *sections* clickable when the folder contains an index page
(`README.md` or `index.md`):

```yaml
# mkdocs.yml
nav:
  - Guide: guide/
  - Home: index.md

plugins:
  - search
  - section-index
  - neoabs
```

```text
docs/
├── index.md
└── guide/
    ├── README.md   # section index page
    └── usage.md
```

> **Note:** section-index only *adapts* themes on its internal allowlist and
> logs a one-line warning for any other theme. NeoAbs' nav renders section
> pages natively (the section title becomes a clickable link that still nests
> its children), so the feature works — the warning is informational.

## mkdocs-table-reader

Reads table files straight into your pages from CSV or Markdown — handy for
keeping data in a single source file:

```yaml
# mkdocs.yml
plugins:
  - search
  - table-reader
  - neoabs
```

```text
docs/
└── table_data.md   # a Markdown table
```

```markdown
<!-- in any page -->
{! docs/table_data.md !}
```

The rendered table picks up NeoAbs table styling automatically
(`theme.neoabs.content.tables`).

## mkdocs-git-authors

Adds author information from your Git history to `page.meta.git_authors`:

```yaml
# mkdocs.yml
plugins:
  - search
  - git-authors:
      show_email_address: false
      enable_creation_date: false
  - neoabs
```

NeoAbs passes `page.meta.git_authors` through untouched (it is the same
`page.meta` the theme reads elsewhere), so you can render it with your own
[custom head/footer injection](../getting-started/configuration.md). The
meta footer itself only shows the *date* — it does not show authors by design.

## mkdocs-awesome-pages

Builds the navigation automatically from your folder structure (no explicit
`nav:`), with per-folder ordering and hiding through a `.pages` file:

```yaml
# mkdocs.yml
plugins:
  - awesome-pages:
      collapse_single_pages: true
      strict: false
  - search
  - section-index
  - neoabs
```

```text
docs/
└── guide/
    ├── .pages        # order, title, and hidden entries
    ├── README.md
    └── usage.md
```

```yaml
# docs/guide/.pages
title: Guide
order: first
```

## Verified in CI

`.github/workflows/integrations.yml` builds a project that uses **all seven**
recipes at once and asserts the results (rendered "Last updated" date, print
page, clean strict build, `neoabs doctor` exit 0). See the
[Development page](../development.md) for how to run the same checks
locally.