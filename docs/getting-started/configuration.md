---
date: 2026-09-07
title: Configuration
icon: "⚙️"
---

# Configuration

Void is configured through the `theme` key in your `mkdocs.yml`.

## Basic setup

```yaml
site_name: My Docs
theme:
  name: void
```

## Full configuration

```yaml
site_name: My Docs
theme:
  name: void
  favicon: assets/images/favicon.svg
  language: en
  direction: ltr
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
  features:
    - navigation.sections
    - navigation.top
    - navigation.footer
    - content.code.copy
    - search.suggest
    - search.highlight
  void:
    glass: medium
    dot_matrix: true
    animation: normal
    border: thin
    content:
      typography:
        image_lightbox: true  # click-to-zoom image preview in the article (default true; set false to disable)

plugins:
  - search
  - void
```

## Options reference

### `palette`

Controls the color scheme and toggle behavior. Uses MkDocs' standard palette system.

```yaml
palette:
  - scheme: slate       # dark mode
    primary: black
    accent: red
    toggle:
      name: Switch to light mode
  - scheme: default     # light mode
    primary: white
    accent: red
    toggle:
      name: Switch to dark mode
```

| Option | Values | Description |
|--------|--------|-------------|
| `scheme` | `"slate"`, `"default"` | Color scheme (slate = dark, default = light) |
| `primary` | `"black"`, `"white"` | Primary background tone |
| `accent` | `"red"` | Accent color (Nothing Red) |
| `toggle.name` | string | Label for the toggle button |

### `void.glass`

Sets the global glass intensity. This controls `backdrop-filter` blur and transparency on panels, cards, and navigation.

| Value | Blur | Saturation | Background opacity | Effect |
|-------|------|------------|-------------------|--------|
| `"light"` | 10px | 1.0 | 5% | Subtle blur, high transparency |
| `"medium"` | 20px | 1.2 | 8% | Balanced blur and opacity (default) |
| `"heavy"` | 30px | 1.4 | 12% | Strong blur, lower transparency |

```yaml
void:
  glass: heavy
```

### `void.dot_matrix`

Enables or disables the dot matrix background pattern behind content.

```yaml
void:
  dot_matrix: true
```

!!! warning
    Disabling `dot_matrix` removes the background texture. The theme still works, but loses a signature visual element.

### `void.border`

Controls the border style on glass panels.

| Value | Description |
|-------|-------------|
| `"thin"` | 1px semi-transparent borders (default) |
| `"thick"` | 2px borders |
| `"none"` | No borders on glass panels |

```yaml
void:
  border: thin
```

### `void.animation`

Controls entrance and hover animations.

| Value | Description |
|-------|-------------|
| `"normal"` | Enable animations (default) |
| `"none"` | Disable all animations |

```yaml
void:
  animation: normal
```

!!! note
    Animations are automatically disabled when the user has `prefers-reduced-motion: reduce` set in their OS.

### `font`

Override the default typefaces. The resolved families drive the Google Fonts
`<link>` **and** the `--void-font-body` / `--void-font-mono` tokens, so the
font stack updates automatically.

```yaml
font:
  text: Space Grotesk
  code: Space Mono
```

If you also set `theme.void.typography.font_family` / `font_family_mono`, the
`theme.font` values take precedence.

!!! tip
    The fonts are loaded from Google Fonts automatically. You can self-host by overriding the CSS and providing your own `@font-face` rules.

### `features`

Recognized as a Material-compatible passthrough: Void ships every feature
below **enabled by default**, so the list does not gate any behavior. Omit it
or list these flags freely — the rendered site is identical:

- `navigation.sections` — Section-grouped sidebar navigation
- `navigation.top` — Back-to-top button and reading progress bar
- `navigation.footer` — Previous/next navigation in the footer
- `content.code.copy` — Copy button on code blocks
- `search.suggest` — As-you-type search suggestions
- `search.highlight` — Highlight matched terms in search results

```yaml
features:
  - navigation.sections
  - navigation.top
  - content.code.copy
```

To change any single behavior, use the corresponding `theme.void.*` switch
instead.

### `void.social_cards`

Share + indexing surface. When on (default), every page emits an
`Article` JSON-LD block in `<head>`, and — when `extra.void_og_image` is set
to the literal value `"__auto__"` — a per-page OG card image is generated at
build time and published as the page's `og:image`.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Master switch for the whole social-cards/JSON-LD surface |
| `jsonld` | `true` | Emit per-page `Article` JSON-LD structured data |
| `cards` | `true` | Auto-generate per-page OG card images (`__auto__` mode) |

```yaml
void:
  social_cards:
    enabled: true   # master on/off
    jsonld: true    # Article JSON-LD in <head>
    cards: true     # auto og:image cards when extra.void_og_image = __auto__
```

Set `enabled: false` to strip the whole surface; keep `enabled` but flip
`jsonld` or `cards` to disable one half independently. Card rendering needs
Pillow for PNG files — install it with `pip install mkdocs-void[social-cards]`
— and falls back to a crisp standalone SVG when Pillow is absent.

```yaml
extra:
  void_og_image: __auto__   # generate per-page social cards at build time
```

!!! tip
    A `page.meta.image` in a page's front matter overrides the auto-generated
    card for that page. If no card exists for a page (e.g. 404 pages), the OG
    block falls back to a summary Twitter card.

### `void.meta`

Freshness + "edit the source" bar. A small metadata row under the
content: a "Last updated" date and an "Edit this page" link. The date is picked
from `page.meta.git_revision_date_localized` (set by the
[`mkdocs-git-revision-date-localized`](https://github.com/timvink/mkdocs-git-revision-date-localized)
plugin) and falls back to the page's `date:` front matter when the plugin is not
installed — or is omitted entirely when neither exists (never breaks).

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Master switch for the metadata bar |
| `show_last_updated` | `true` | Show the "Last updated" date row |
| `show_edit_on_github` | `true` | Show the "Edit this page" link |
| `last_updated_label` | `"Last updated"` | Label before the date |
| `edit_label` | `"Edit this page"` | Link text |
| `date_source` | `"auto"` | `auto` (git first, then front matter), `git`, or `front_matter` |
| `branch` | `"main"` | Repository branch used for the edit link |
| `source_dir` | `"docs"` | Source folder used for the edit link |

```yaml
theme:
  name: void
  void:
    meta:
      enabled: true                # master on/off
      show_last_updated: true
      show_edit_on_github: true
      date_source: auto            # auto | git | front_matter
      branch: main
      source_dir: docs
```

The edit link is built as
`{repo_url}/blob/{branch}/{source_dir}/{page.file.src_uri}` and only renders when
`config.repo_url` is set. A page can override either row per-page via front
matter:

```yaml
---
void:
  meta:
    show_last_updated: false      # hide the date on this page
---
```

### `void.feedback`

"Was this page helpful?" widget. Renders under the article and opens a
prefilled GitHub issue (positive/negative) in a new tab — a plain issue link, no
analytics. Only appears when `config.repo_url` is set.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Master switch for the feedback widget |
| `show` | `true` | Render the widget under the article |
| `title` | `"Was this page helpful?"` | Widget heading |
| `positive` | `"Yes — thanks!"` | "Yes" button label |
| `negative` | `"No — open an issue"` | "No" button label |
| `github_labels` | `["feedback"]` | GitHub issue labels applied to each opened issue |

```yaml
theme:
  void:
    feedback:
      enabled: true
      github_labels: [feedback]
```

### `void.announcement_bar`

Announcement bar: a floating card pinned near an edge. **Off
by default** — it renders only when `enabled: true` and a non-empty `text` are
set. The text comes from `announcement_bar.text` (wins) or the legacy
`extra.void_announce` string. Dismissal persists in `localStorage` keyed by
the text, so changing the announcement re-shows it. `position` picks where the
card floats (`top`/`right`/`bottom`/`left`); `center` opens it as a popup with
a dimmed backdrop that also dismisses on click.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | Master switch — hidden by default; set `true` to opt in |
| `show` | `true` | Render the bar |
| `text` | `""` | Announcement text; empty falls back to `extra.void_announce` |
| `dismissable` | `true` | Show the × dismiss button (false pins the card) |
| `position` | `"bottom"` | Floating placement: `top`, `right`, `bottom`, `left`, or `center` (popup + backdrop) |

```yaml
theme:
  void:
    announcement_bar:
      enabled: true    # opt-in — hidden by default
      text: New in v0.2 — glass components are here!
      position: top    # top | right | bottom | left | center
```

### `void.cookie_consent`

Consent banner. Privacy-first: Void never tracks readers, so the
banner is rendered **only** when the build detects a configured integration
(`theme.analytics.gtag` or giscus comments enabled with `repo` + `repo_id`) — unless you
opt in to always showing it with `render: always` (for demo sites). The banner
itself stores just an accept/decline flag in `localStorage`; "Accept" unlocks
delayed integrations like giscus.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Master switch for the banner |
| `show` | `true` | Render the banner |
| `render` | `"auto"` | When to show: `auto` (only with a configured integration), `always`, or `never` |
| `position` | `"bottom"` | Floating placement: `top`, `right`, `bottom`, `left`, or `center` (popup + backdrop) |
| `message` | `"This site stores nothing about you unless you enable integrations."` | Banner text |
| `accept_label` | `"Accept"` | Accept button label |
| `decline_label` | `"Decline"` | Decline button label |
| `privacy_policy` | `""` | Optional privacy policy path; rendered when set |

```yaml
theme:
  void:
    cookie_consent:
      message: We only store your explicit choices.
      privacy_policy: /privacy/
      render: always          # demo sites: force-show without an integration
      position: bottom        # top | right | bottom | left | center
```

### `void.comments`

Opt-in comments via [giscus](https://giscus.app) (the only supported
provider). Comments are **hidden by default** — nothing renders unless you set
`enabled: true`. Even then, nothing loads until both `repo` and `repo_id` are
configured; when a consent-serving integration is present, the giscus script is
deferred until the reader clicks "Accept". The giscus theme follows the active
palette.

Use an **Announcements**-type category: in it only maintainers and the giscus
bot can start discussions, so visitors can comment but never create threads.
With `mapping: pathname` (default), each page maps to a discussion whose title
equals that page's pathname without the leading slash — e.g. this repo's home
page (`/mkdocs-void/`) maps to a discussion titled `mkdocs-void/`. Grab the
exact `repo_id` / `category_id` on the [giscus setup page](https://giscus.app).

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | Master switch — comments are hidden by default; set `true` to opt in |
| `provider` | `"giscus"` | Provider (only `giscus` today) |
| `repo` | `""` | GitHub `owner/repo`; required to enable |
| `repo_id` | `""` | giscus repo ID from the setup page |
| `category` | `""` | Discussion category (must be an "Announcements"-type) |
| `category_id` | `""` | giscus category ID |
| `mapping` | `"pathname"` | `pathname`, `url`, `title`, `og:title`, or `specific` |
| `term` | `""` | Term used with the `specific` mapping |
| `language` | `""` | giscus language code (falls back to giscus default) |
| `theme.light` / `theme.dark` | `"light"` / `"dark"` | giscus themes for each palette |

```yaml
theme:
  void:
    comments:
      enabled: true          # opt-in — comments are hidden by default
      repo: "user/mkdocs-docs"
      repo_id: "R_kgxxxx"
      category: "Announcements"    # Announcements-type so only you/giscus post
      category_id: "DIC_xxxx"
      mapping: pathname            # each page maps to a discussion named by pathname
```

## `site_url` & link rebasing

Set `site_url` to your deployed address (e.g. `https://user.github.io/project`).
Navigation, TOC, and content links are always emitted **relative**, so they work
unchanged on any origin. Absolute URLs are only produced where they are required
(canonical, `og:url`, share) and MkDocs itself rewrites them to the live server
URL during `mkdocs serve`.

On top of that, the plugin captures the *production* `site_url` before the dev
server overrides it and hands it to the theme as `config.site_url`. When you
preview on `localhost:{port}` and the page contains a link that was baked or
hardcoded with the main site URL (e.g. `[x](https://user.github.io/project/guide/)`),
the theme re-targets that link to `localhost:{port}/guide/` at runtime, so a
click never leaves the preview. External links, relative links, and the deployed
origin itself are never touched.

## Generated reference

The canonical reference below is emitted from the plugin's own source tables
(`_VOID_TOKEN_MAP`, `_void_defaults`, and the `_VOID_DEFAULT_*` dicts) by
`tools/emit_config_reference.py`. Regenerate it any time the plugin changes so
docs and config can never drift:

```bash
python tools/emit_config_reference.py
```

--8<-- "_config_ref.generated.md"

### `extra.void_showcase`

Footer credit: an **opt-in** one-line "Powered by Void" badge in the
site footer. **Off by default** — set `extra.void_showcase: true` to show it.
The badge is a self-contained inline SVG (a dot-matrix mark echoing the
NothingOS canvas) that links back to the project, so enabling it adds no
third-party image or CDN request. `extra.void_showcase_url` overrides the
default link target; the label text follows `theme.void.i18n.footer_powered_by`.

```yaml
extra:
  void_showcase: true                 # Opt-in footer credit + badge
  void_showcase_url: "https://github.com/rkriad585/mkdocs-void"   # Optional
```

## Plugin configuration

Void ships with an optional MkDocs plugin that sets theme defaults. See the [Plugin documentation](../plugins/void.md) for details.

## Adding custom CSS

Add custom stylesheets via `extra_css`:

```yaml
extra_css:
  - stylesheets/custom.css
```

Place the file at `docs/stylesheets/custom.css`.

Override any design token:

```css
:root {
  --void-accent: #818cf8;
  --void-canvas: #050510;
}
```

## Adding custom JavaScript

Add custom scripts via `extra_javascript`:

```yaml
extra_javascript:
  - javascripts/custom.js
```
