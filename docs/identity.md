---
date: 2026-09-08
title: Identity & i18n
---

# Identity & i18n

Identity makes a Void site feel like *your* app, in *your* language: UI strings
are centralized and overridable, pages get an automatic breadcrumb trail and
optional nav icons, images can follow the dark/light scheme, and every build
ships an install-ready PWA manifest — all on by default.

- **Breadcrumbs** render automatically above the content whenever a page has ancestors.
- **Nav icons** come from a single `icon:` line in a page's front matter.
- **Dark-aware images** swap `src` when the palette changes.
- **i18n overrides** replace any chrome string without touching templates.
- **PWA manifest** is generated at build time from the plugin, no setup needed.

## Breadcrumbs

A `<nav class="void-breadcrumbs">` trail is injected at the top of `<article>` for
every page that has ancestors (the section the page lives in, plus the page
itself). A home link is prepended only when `site_url` is configured, so local
builds keep a clean trail.

```yaml
theme:
  void:
    breadcrumbs:
      show: true        # Auto trail above content when ancestors exist
```

The trail is marked up with proper `aria-label="Breadcrumb"` and links; the
current page is rendered as plain text. Disable it globally with `breadcrumbs:
{ show: false }`.

## Nav icons

Icons are per-page: add an `icon:` key to a page's front matter and the theme
renders it to the left of the page's link in the sidebar nav (section headers
and leaf pages alike).

```markdown
---
icon: "🚀"
title: Installation
---

# Installation
```

The value can be an emoji, a shortcode string, or inline SVG; it is wrapped in
`<span class="void-nav__icon" aria-hidden="true">` so screen readers skip it.
This page lives under Designer section headers with emoji icons as a living example.

## Dark-aware images

Give an image two `src` alternatives and the theme swaps between them whenever
the color scheme changes:

```markdown
![screenshot](img/light.png){ data-md-scheme-light="img/light.png" data-md-scheme-dark="img/dark.png" }
```

The scheme swap respects the saved palette, `prefers-color-scheme`, and the
server-rendered scheme attribute — an image never shows the wrong variant on
first paint, even when no preference exists.

## UI-string i18n

Every chrome string is centralized in `__config.translations` and defaulted to
English. Override any of them with a flat `i18n:` block under `theme.void`:

```yaml
theme:
  void:
    i18n:
      search_placeholder: "Partout dans la docs."
      toc_title: "Sur cette page"
      back_to_top: "Haut de page"
      copy_to_clipboard: "Copier dans le presse-papiers"
      copied_to_clipboard: "Copié !"
      skip_to_content: "Aller au contenu"
      breadcrumb_label: "Fil d'Ariane"
      previous_page: "Précédent"
      next_page: "Suivant"
      comments_title: "Commentaires"
```

Every alias maps to a nested surface the client actually reads — the search
overlay, the TOC title and back-to-top button, the copy buttons, the skip link,
the breadcrumb trail, the footer previous/next links, and the comments header.
An unknown key aborts the build with a clear message, so a typo never silently
ships an English string. Choose a site-wide `language`/`direction` the usual
MkDocs way (`theme.language`) — the overrides layer on top of that.

Full key list (group → key):

| Alias | Surface |
|-------|---------|
| `search_placeholder`, `search_results`, `search_no_results`, `search_start_typing`, `search_loading`, `search_load_error`, `search_suggestions` | Search overlay |
| `toc_title`, `back_to_top` | Table of contents + back-to-top button |
| `copy_to_clipboard`, `copied_to_clipboard`, `copy_link`, `link_copied` | Clipboard actions |
| `comments_title` | Comments header |
| `skip_to_content`, `breadcrumb_label` | Accessibility chrome |
| `previous_page`, `next_page` | Footer paging links |
| `footer_powered_by` | "Powered by Void" footer credit |

### Translating Void

Adding a language (or fixing a string) takes two edits in
`void/plugins/void_plugin.py`; no template touches a hardcoded English
string.

1. **Add the default** in `_VOID_DEFAULT_I18N` — every chrome string ships an
   English value there, grouped by surface (`search`, `toc`, `clipboard`,
   `comments`, `zoom`, `repo`, `notes`, `timer`, `footer`, `navigation`,
   `help`). Use the `footer.previous` / `footer.next` entries as the template
   for a new group key.
2. **Register a flat alias** in `_VOID_I18N_FLAT_ALIASES` so the documented
   one-level `theme.void.i18n.<key>` spelling keeps working — the alias maps
   a flat key to `(group, child)`, e.g. `previous_page` →
   `("footer", "previous")`.

A site then overrides any string without touching templates:

```yaml
theme:
  void:
    i18n:
      footer_powered_by: "Propulsé par Void"
      previous_page: "Précédent"
```

Because the alias has to exist for a string to be overridable, an unknown key
aborts the build instead of silently staying English. Verify a translation by
building the docs `mkdocs build --strict` (or `void new` + `mkdocs serve`)
and checking the chrome in both dark and light modes — see
[Contributing — Translations](https://github.com/rkriad585/mkdocs-void/blob/main/CONTRIBUTING.md#translations)
for the suggested workflow.

## Auto PWA manifest

The plugin emits `manifest.webmanifest` at the site root and `base.html` adds the
corresponding `<link rel="manifest">` plus the classic app meta
(`application-name`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`).
Combined with the service worker the theme already ships, a docs site becomes
installable out of the box — no extra files to maintain.

```yaml
theme:
  void:
    pwa:
      manifest: true            # Emit manifest.webmanifest (default true)
      display: standalone       # standalone | fullscreen | minimal-ui | browser
      icons: true               # Reuse the site logo as the manifest icon
      theme_color: ""           # extra.void_theme_color, then background_color
      background_color: "#111114"
      start_url: ""             # site_url, then "/"
```

`theme_color`/`start_url` resolve against `extra.void_theme_color` /
`site_url` when left empty. The icon list uses the site logo chain
(`extra.void_logo_light` → `extra.void_logo_dark` → `theme.logo`, with
`theme.favicon` as a last resort): a local logo is linked as-is, while a remote
`https://` logo is **fetched at build time** into `assets/` and served from the
site root — no CDN dependency in the browser and no manual icon file to
maintain. MIME type and pixel size are read from the actual bytes (SVG becomes
`sizes: "any"`). A site with no usable logo at all gets a manifest with no icon
list, and an unreachable icon host only logs a warning — it never fails the
build.