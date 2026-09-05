# WHY PLAN — make developers *choose* mkdocs-neoabs

> This document answers the question nobody is asking yet:
> **"Why NeoAbs instead of Material, ReadTheDocs-builtin, or a hosted tool?"**
>
> It is the marketing + engineering plan. `PLAN.md` is the config-surface
> roadmap (what to build). This file is the strategy roadmap (why to build it,
> what the world looks like, and the exact steps — with code — to close the gap).

---

## ⚠️ Working rules (same as PLAN.md — binding here too)

1. **Don't remove any element / feature / function.** Every phase below may only
   *add* or *extend*. Existing elements, features, functions, and config surface
   stay intact — toggles come from config, never from deletion.
2. **Don't make any typo.** Every identifier in every code example must match the
   real source before and after an edit.
3. **Don't touch code outside the phase's topic.** Only the files listed in each
   phase may be edited. Anything else requires adding it to that phase's file
   list first.
4. **Don't miss any feature in a phase.** Each phase defines a complete feature
   set; implement all of it. A phase ships only when its full config block is
   wired to working consumers.
5. **Everything on by default.** New features default to ON unless the phase says
   otherwise.
6. **Verification is part of the phase.** `npm run build`, `mkdocs build
   --quiet`, `npm test`, and the relevant harnesses must stay green every phase.

---

## Table of contents

- [1. North Star](#1-north-star)
- [2. Current state audit (the moat we already own)](#2-current-state-audit)
- [3. Competitive landscape (research, 2026)](#3-competitive-landscape)
- [4. Gap analysis — what others have that we miss](#4-gap-analysis)
- [5. Phases](#5-phases)
  - [Phase 1 — Trust & correctness](#phase-1--trust--correctness-quick-wins)
  - [Phase 2 — Onboarding & documentation](#phase-2--onboarding--documentation)
  - [Phase 3 — Search excellence](#phase-3--search-excellence)
  - [Phase 4 — Social cards & AI-readiness](#phase-4--social-cards--ai-readiness)
  - [Phase 5 — Content superpowers](#phase-5--content-superpowers)
  - [Phase 6 — Engagement & privacy](#phase-6--engagement--privacy)
  - [Phase 7 — Identity & i18n](#phase-7--identity--i18n)
  - [Phase 8 — Performance & PWA](#phase-8--performance--pwa)
  - [Phase 9 — Ecosystem & tooling](#phase-9--ecosystem--tooling)
  - [Phase 10 — Community flywheel](#phase-10--community-flywheel)
- [6. Definition of done / success metrics](#6-definition-of-done)
- [7. Risks & constraints](#7-risks--constraints)
- [8. Research sources](#8-research-sources)

---

## 1. North Star

> **Give a developer a distinctive, fast, privacy-first docs site in under
> two minutes — purely from `mkdocs.yml` — without a single line of custom CSS.**

NeoAbs should be the **anti-default**: not another Material clone, precisely the
theme teams pick when they want their documentation to look like *their brand*
instead of the same indigo sidebar everyone else ships. The design language
(Glass morphism + NothingOS black canvas + dot-matrix + Nothing Red) is the
differentiator that Material, ReadTheDocs, and every flat/Bootstrap theme
cannot copy without forking.

Three pillars every decision must serve:

1. **Distinctive by default** — zero-config build looks intentional and unique.
2. **Fast + app-like** — SPA navigation, service-worker cache, tiny footprint.
3. **Private by default** — no tracking pixels, no mandatory CDN, config-first.

---

## 2. Current state audit

This is what NeoAbs already ships today (verified against the source during this
analysis). Everything in this list is a selling point — the plan below only adds.

### Design system (already implemented)

| Capability | Where | Evidence |
|---|---|---|
| Glass morphism (light/medium/heavy) | `base.html` `data-md-neoabs-glass` + SCSS | intensity, blur, saturation, opacity documented |
| NothingOS dot-matrix overlay | `base.html` `.neoabs-dot-matrix` | configurable on/off |
| Dark/light palette toggle | `partials/palette.html` + JS `initColorScheme` | localStorage persisted, FOUC-safe |
| Dark/light favicon + logo swap | `base.html` favicon block | dark/light variants from config |
| Design-token overrides → CSS vars | `neoabs_plugin.py` `_NEOABS_TOKEN_MAP` | colors, typography, spacing, radius, transitions, shadows |
| Space Grotesk / Space Mono typography | `base.html` fonts block | display + mono pairing |
| Border + animation variants | `data-md-neoabs-border/animation` | thin/thick/none, normal/none |

### Behaviors (already implemented)

| Capability | Where |
|---|---|
| SPA-style client-side navigation with scroll restore + `lastPage` resume | JS `initSPANavigation` |
| Service worker: static cache + CDN/font cache-first, versioned `?v=` passthrough | `sw.js` |
| Full-screen search with `/` shortcut, suggestions, result highlighting | JS `initSearch` |
| TOC active-heading tracking (IntersectionObserver) | JS `initTocTracking` |
| Reading progress bar + back-to-top | JS `initScrollBehavior` / `initBackToTop` |
| highlight.js (dark + light themes), Mermaid, KaTeX math | JS init registry |
| Code copy buttons, tabs & task lists with localStorage persistence | JS |
| Notes & annotations (localStorage, TTL + export) | JS `initNotes` |
| Repo (GitHub) live popover — 18 fields, cached | JS `initRepoPopover` |
| Keyboard shortcuts, nav/sidebar collapse, a11y skip-link, code-fence anchors | JS + templates |
| Custom head/body/meta extension points (Jinja blocks) | `base.html` |

### What is currently *broken or dead* (checked in the audit)

- `theme.features` is **collected but unused** — `__config.features` exists, JS never reads it. Wrong signal to developers who configure it.
- `theme.font.text / font.code` are **ignored** — fonts are hardcoded in `base.html`.
- No OpenGraph/Twitter card tags (only `meta description`).
- No structured data (JSON-LD), no `theme-color`, no PWA manifest.
- Screenshots referenced in `docs/screenshots.md` but missing on disk: `light-mode.png`, `code-blocks.png`, `mobile.png`. README gallery implies they exist.
- Search options (placeholder, min chars, result count, `?q=` deep-link) are not configurable.
- `docs/screenshots_gen.py` does not emit the three missing names → docs/README mismatch.

> **Rule:** a dead config key is a broken promise. Phase 1 removes them all.

---

## 3. Competitive landscape

### Material for MkDocs — the 800-pound gorilla just went on pause

- **27k+ stars**, ~50k+ adopters (FastAPI, Pydantic, Ruff, OpenAI Agents, AWS, Google…).
- **Nov 2025 / Mar 2026:** project explicitly in **maintenance mode**; the 9.7.0 release folded every paid "Insiders" feature into MIT, then all new feature work moved to a successor, **Zensical**.
- Meaning: Material's feature list is frozen while MkDocs 2.0 (a ground-up rewrite, announced Aug 2026) looms. **No new features will ever ship.** This is the single biggest opening for a modern, actively-developed theme.
- Material's canvas: Material Design — aesthetically universal, individually bland. Exactly the "every docs site looks alike" complaint.

### Everyone else

- **Built-in `mkdocs` theme:** color_mode (light/dark/auto), shortcut keys, `navigation_depth`, GA4 via `analytics.gtag`. Minimal.
- **Built-in `readthedocs` theme:** highlightjs toggle, prev/next placement, GA + `anonymize_ip`, 18 locales.
- **JS-native docs (Docusaurus, VitePress, Starlight):** bigger surface but a Node/React toolchain and no Python/Markdown-via-MkDocs DX.

### The plugin ecosystem (theme-adjacent, we must be compatible & documented)

Popular MkDocs plugins developers expect to "just work" with any good theme:
`git-revision-date-localized` (page "last updated"), `mkdocs-glightbox` (image
lightbox), `mkdocs-print-site` (PDF/standalone export), `mkdocs-section-index`
(clickable section pages), `mkdocs-git-authors`, `mkdocs-table-reader`,
`mkdocs-encryptcontent`, `mkdocs-multirepo`. Compat + recipes for these = free adoption wins.

### What research says developers weigh

1. **Looks professional with zero design work** ("strong defaults").
2. **Fast builds and fast pages** (Core Web Vitals, LCP < 2.5s).
3. **Search that works out of the box**, with highlighting and snippets.
4. **Free + MIT + fully configurable from one YAML file.**
5. **Privacy/GDPR posture** (no hidden beacons; self-hostable assets).
6. **Not maintenance-mode / not sponsorware gating.**

NeoAbs already scores 1–5 structurally. The plan below turns those into
*provable* claims (benchmarks page, Lighthouse CI, no-phone-home guarantee).

---

## 4. Gap analysis

Legend: ✅ have · ❌ need · 🟡 partial (config exists but unwired / needs hardening)

| # | Capability (what Material/base themes have) | NeoAbs today | Phase |
|---|---|---|---|
| 1 | Working `theme.font`, `theme.features` config | ❌ dead config | P1 |
| 2 | Complete screenshot gallery | ❌ 3 files missing | P1 |
| 3 | OG / Twitter / theme-color / structured data | ❌ | P4 |
| 4 | Social-card image per page (auto-generated) | ❌ | P4 |
| 5 | AI/LLM-readiness (`llms.txt`, FAQ/Article schema, crawlable headings) | ❌ | P4 |
| 6 | Search config surface + `?q=` deep link + share | 🟡 modal only | P3 |
| 7 | "Last updated" date + "Edit on GitHub" link | ❌ | P5 |
| 8 | Image lightbox, footnotes, code annotations, video wrapper | ❌ | P5 |
| 9 | Cookie consent, announcement bar, feedback ("was this helpful"?) | ❌ | P6 |
| 10 | Comments (giscus) | ❌ | P6 |
| 11 | i18n of UI strings, translations of chrome | 🟡 `language: en` only | P7 |
| 12 | Dark-aware images, breadcrumbs, nav icons | ❌ | P7 |
| 13 | PWA manifest installability | ❌ (SW exists) | P7 |
| 14 | Prefetch on hover, lazy images, perf budget CI | 🟡 SW yes, prefetch no | P8 |
| 15 | Offline bundling / privacy self-host recipe | 🟡 SW + CDN; no bake-in | P8 |
| 16 | Plugin compat guide + recipes | ❌ | P9 |
| 17 | `neoabs new` scaffolding + `doctor` | ❌ | P9 |
| 18 | Showcase, benchmarks, funding, release automation | ❌ | P10 |

---

## 5. Phases

Each phase below is independently shippable and ordered by "biggest trust +
value gain per hour." Every phase states **Goal**, **Why it wins developers**,
**Config + code examples**, **Files touched**, and **Acceptance criteria**.

---

### Phase 1 — Trust & correctness (quick wins)

**Goal.** Delete every broken promise so the theme can be evaluated honestly:
dead config keys, missing gallery images, and docs that contradict the code.

**Why it wins.** A developer's first move is `theme.font: {...}` and `features:`.
If nothing changes, they bounce. First impressions are built on *working*
configuration, not roadmaps.

#### 1a. Wire `theme.font`

`base.html` currently hardcodes the Google Fonts `<link>`:

```jinja
{# base.html — replace the hardcoded fonts block #}
{% set _ftext = config.theme.font.text | default('Space Grotesk') %}
{% set _fcode = config.theme.font.code | default('Space Mono') %}
{% set _ftext_uri = _ftext | replace(' ', '+') %}
{% set _fcode_uri = _fcode | replace(' ', '+') %}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family={{ _ftext_uri }}:wght@300;400;500;600;700&family={{ _fcode_uri }}:wght@400;700&display=swap" rel="stylesheet">
```

Then in `neoabs_plugin.py`, mirror the resolved families into tokens:

```python
from _NEOABS_TOKEN_MAP import ...  # existing
```

```python
# neoabs_plugin.py — add after token collection (Phase 1)
theme_config = theme.get("font") or {}
if isinstance(theme_config, dict):
    if theme_config.get("text"):
        extra["neoabs_tokens"].append({
            "var": "--neoabs-font-body",
            "value": theme_config["text"] + ", sans-serif",
        })
    if theme_config.get("code"):
        extra["neoabs_tokens"].append({
            "var": "--neoabs-font-mono",
            "value": theme_config["code"] + ", monospace",
        })
```

#### 1b. Make `features` real (or remove it)

Either implement + JS-read `config.features`, or (recommended) stop advertizing
it. Cleanest: expose it to templates for `data-*` attributes and keep the list
out of `__config` until a consumer exists.

```jinja
{# base.html — surface supported flags as data attributes #}
{% set _feats = config.theme.features | default([]) %}
<html lang="..." class="no-js" data-md-extra-features='{{ _feats | tojson }}'>
```

#### 1c. Fix the screenshot contract

Align `docs/screenshots_gen.py` PAGES with `docs/screenshots.md` (add
`light-mode`, `code-blocks`, `mobile`) — or drop the three references. Regenerate
and re-verify locally (`node && python tools/screenshots_gen.py`).

**Files.** `base.html`, `neoabs_plugin.py`, `neoabs.scss` (if font vars), `tools/screenshots_gen.py`, `docs/screenshots.md`.

**Acceptance.** `theme.font` visibly changes output; `grep -r features` finds a
consumer; `screenshots.md` ↔ disk diff is empty; `node --check` + `npm run build`
+ `mkdocs build` clean; existing harness tests still pass (4/4).

---

### Phase 2 — Onboarding & documentation

**Goal.** A developer understands *why NeoAbs* and can go live in < 2 minutes.

**Why it wins.** "Install → see it beat my expectations" is the acquisition
channel. Material's docs are its moat; our docs must be our magnet.

#### 2a. `Why NeoAbs` page + Showcase

Add `docs/why-neoabs.md` with:

- The Three Pillars (§1)
- A **compare table vs Material vs built-in** (honest, dated, updatable)
- "Made by the anti-default" one-liner
- `docs/showcase.md`: embeds of real sites + the Screenshots gallery

#### 2b. Config reference generated from the plugin

Keep one source of truth. Mirror `_NEOABS_TOKEN_MAP` + `_neoabs_defaults` into a
machine-readable YAML that `tools/build.js` (or a small Python script) renders
into `docs/getting-started/configuration.md`. No more doc/config drift:

```python
# tools/emit_config_reference.py (new)
"""Render config.fragment.md from the plugin's canonical tables."""
import yaml
from neoabs.plugins.neoabs_plugin import _NEOABS_TOKEN_MAP, NeoAbsPlugin

DOC = {
    "tokens": {g: sorted(k) for g, k in _NEOABS_TOKEN_MAP.items()},
    "defaults": NeoAbsPlugin._neoabs_defaults,
}
with open("docs/_config_ref.generated.md", "w") as f:
    f.write("<!-- generated: do not edit -->\n```yaml\n")
    f.write(yaml.safe_dump(DOC, sort_keys=True))
    f.write("```\n")
```

Wire it into the MkDocs `!include`-style block via `pymdownx.snippets` in
`mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.snippets
```

```markdown
<!-- docs/getting-started/configuration.md -->
--8<-- "_config_ref.generated.md"
```

#### 2c. `neoabs new` project scaffolder

```python
# neoabs/cli.py (new entry point in pyproject.toml: neoabs = "neoabs.cli:main")
"""Generate a working mkdocs-project with NeoAbs pre-configured."""
import pathlib, shutil, sys

TEMPLATE = {
    "mkdocs.yml": """site_name: New Docs\nsite_url: ""\ntheme:\n  name: neoabs\n\nplugins:\n  - search\n  - neoabs\n""",
    "docs/index.md": "# Welcome\n\nBuilt with NeoAbs.\n\n<!-- Everything below is a live demo of the design system. -->\n",
}

def main(argv=None):
    target = pathlib.Path((argv or sys.argv)[1] if len(argv or sys.argv) > 1 else ".")
    if (target / "mkdocs.yml").exists():
        sys.exit(f"refusing to overwrite existing project at {target}")
    for name, body in TEMPLATE.items():
        p = target / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body)
    print(f"NeoAbs project scaffolded at {target}. Run: mkdocs serve")
```

**Files.** `docs/why-neoabs.md`, `docs/showcase.md`, `tools/emit_config_reference.py`, `mkdocs.yml`, `neoabs/cli.py`, `pyproject.toml`.

**Acceptance.** `pip install -e .` exposes `neoabs new my-docs`; `mkdocs serve`
renders the scaffold with zero custom CSS; config page matches plugin tables;
showcase links resolve.

---

### Phase 3 — Search excellence

**Goal.** Make internal search a headline feature, not an afterthought — with a
real config surface and shareable results.

**Why it wins.** "Search works out of the box, with highlighting" is the
#1 cited Material strength. We already render the modal; we now make it
configurable and linkable.

#### 3a. Search config surface (plugin → `__config`)

```yaml
# mkdocs.yml
theme:
  neoabs:
    search:
      shortcut_key: "/"
      placeholder: "Search documentation…"
      min_chars: 2
      max_results: 10
      show_suggestions: true
      show_highlights: true
      deep_link: true        # ?q=restores the query on load
```

Plugin reads + validates it, `base.html` injects into `__config.search`, and JS
`initSearch` consumes it. JS skeleton:

```js
// initSearch(config) — after config load
const s = (config.search || {})
document.querySelector("#neoabs-search-input").placeholder = s.placeholder || "Search"
const MAX = s.max_results || 10   // cap results rendered
function resultsFor(q) { /* existing lunr/worker path */ }
```

#### 3b. Deep link + share

```js
// On modal open: honor ?q=
const params = new URLSearchParams(location.search)
if (params.has("q")) openSearch(params.get("q"))

// Add a "copy link" action to a result row:
resultLink.addEventListener("click", () => {
  const url = location.origin + location.pathname + "?q=" + encodeURIComponent(activeQuery)
  navigator.clipboard?.writeText(url)
})
```

**Files.** `neoabs_plugin.py`, `base.html`, `partials/search.html`, `neoabs.js` (`initSearch`).

**Acceptance.** Placeholder/min/max/`?q=` all config-driven; search harness
passes; result count capped; `?q=foo` re-opens search with the query.

---

### Phase 4 — Social cards & AI-readiness

**Goal.** Shared links look stunning *and* bots/AI-answer engines can index the
site correctly.

**Why it wins.** Material's auto-generated social cards are the most-copied
feature; JSON-LD + `llms.txt` make docs **AI-crawlable by default** — a
differentiator in the GEO/AEO era.

#### 4a. OG/Twitter/theme-color/JSON-LD

```jinja
{# base.html — inside {% block site_meta %} add: #}
<meta property="og:type" content="article">
<meta property="og:site_name" content="{{ config.site_name }}">
<meta property="og:title" content="{{ page.title | default(config.site_name) }}">
<meta property="og:description" content="{{ page.meta.description | default(config.site_description) }}">
<meta property="og:url" content="{{ page.canonical_url }}">
{% if page.meta and page.meta.image %}
<meta property="og:image" content="{{ page.meta.image }}">
{% elif config.extra.neoabs_og_image %}
<meta property="og:image" content="{{ config.extra.neoabs_og_image }}">
{% endif %}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page.title | default(config.site_name) }}">
<meta name="theme-color" content="{{ config.extra.neoabs_theme_color | default('#000000') }}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": {{ page.title | tojson }},
  "description": {{ page.meta.description | default(config.site_description) | tojson }},
  "url": {{ page.canonical_url | tojson }},
  "publisher": { "@type": "Organization", "name": {{ config.site_name | tojson }} }
}
</script>
```

#### 4b. Automatic social-card image

`tools/social_card.py` — optional `pillow`, renders the theme's signature card
(black canvas, dot-matrix, Nothing-Red headline) per page at build time; falls
back to a crisp SVG `og:image` (SVG lacks universal support but beats nothing):

```python
# tools/social_card.py (new, optional dependency)
def render(title, site_name, out=".cache/cards"):
    """Draw a 1200x630 PNM via pillow if installed; else emit SVG."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return emit_svg(title, site_name, out + ".svg")
    img = Image.new("RGB", (1200, 630), "#000000")
    d = ImageDraw.Draw(img)
    d.rectangle([24, 24, 1176, 606], outline="#ff3030", width=4)
    d.text((64, 300), title or site_name, fill="#ffffff")
    img.save(out)
```

Hook via `on_post_build` event in `neoabs_plugin.py` when
`config.extra.neoabs_og_image == "__auto__"`.

#### 4c. AI/LLM-readiness

```python
# neoabs_plugin.py — on_post_build generates build-time files
def on_post_build(self, config, **kwargs):
    import pathlib
    site = pathlib.Path(config["site_dir"])
    lines = ["# " + config.get("site_name", ""), ""]
    for nav_item in (config.get("nav") or []) and []:  # walk pages
        for title, url in walk_pages(config, nav_item):
            lines.append(f"- [{title}]({url})")
    site.joinpath("llms.txt").write_text("\n".join(lines) + "\n")
```

**Files.** `base.html`, `neoabs_plugin.py`, `tools/social_card.py`, `pyproject.toml` (optional extra), `mkdocs.yml`.

**Acceptance.** Every page emits unique OG/Twitter/JSON-LD; `site/llms.txt` is
generated; `theme-color` follows palette; harness for meta-block passes.

---

### Phase 5 — Content superpowers

**Goal.** First-class support for the content features Material made famous and
dev-docs rely on: annotations, footnotes, lightbox, freshness metadata.

**Why it wins.** Parity on the *content* surface is cheap and it removes the
"NeoAbs can't do X" objection in evaluations.

#### 5a. "Last updated" + "Edit on GitHub"

Integrate cleanly with `mkdocs-git-revision-date-localized` *and* provide a
theme-fallback (no plugin installed → omit the line, never break):

```jinja
{# footer.html — inside the copyright region #}
{% if page and page.meta and page.git_revision_date_localized %}
<small class="neoabs-last-updated">Last updated: {{ page.meta.git_revision_date_localized }}</small>
{% endif %}
<a class="neoabs-edit" href="{{ config.repo_url }}/blob/main/docs/{{ page.file.src_uri }}">
  Edit this page
</a>
```

Document in `docs/components/meta.md`: enable with
`plugins: [..., - git-revision-date-localized]` plus the checkout depth note.

#### 5b. Image lightbox + footnotes + code annotations

- Lightbox: document + theme-stylize `mkdocs-glightbox` OR ship a tiny vanilla
  zoom in `neoabs.js` (preferred — priv-first, no extra pip):

```js
// neoabs.js — initImageZoom()
document.querySelectorAll(".neoabs-typeset img").forEach((img) => {
  if (img.closest("a")) return
  img.addEventListener("click", () => {
    const ov = document.createElement("div")
    ov.className = "neoabs-zoom"; ov.innerHTML = `<img src="${img.src}" alt="">`
    document.body.appendChild(ov)
    ov.addEventListener("click", () => ov.remove())
  })
})
```

- Footnotes/annotations: add `footnotes` to the recommended extensions list and
  style the callout. Add an "annotate" CSS-comment syntax guide for
  `pymdownx.highlight` (`content.code.annotate` equivalent).

#### 5c. Video wrapper + responsive media

```css
/* components.scss */
.neoabs-typeset video, .neoabs-typeset iframe {
  max-width: 100%; aspect-ratio: 16/9; border-radius: var(--neoabs-radius-md);
}
```

**Files.** `footer.html`, `neoabs.js`, `components.scss`, `mkdocs.yml` (extensions), `docs/components/*`.

**Acceptance.** git-revision-date renders when plugin present, no-op otherwise;
image zoom works w/o deps; footnotes styled; `npm test` + build green.

---

### Phase 6 — Engagement & privacy

**Goal.** Turn readers into participants while keeping the privacy-first promise.

**Why it wins.** Material's announcement bar / feedback / comments are
well-trodden adoption drivers; GDPR-first cookie flow differentiates.

#### 6a. "Was this page helpful?" — GitHub-issue-backed (no tracking)

```yaml
# mkdocs.yml
theme:
  neoabs:
    feedback:
      show: true
      title: "Was this page helpful?"
      positive: "Yes — thanks!"
      negative: "No — open an issue"
      github_labels: ["feedback"]
```

```js
// neoabs.js — initFeedback()
document.querySelectorAll("[data-feedback]").forEach((b) => {
  b.addEventListener("click", () => {
    const label = b.dataset.feedback
    const body = encodeURIComponent(
      `## ${label === "yes" ? "Positive" : "Negative"} feedback\n\nPage: ${location.href}\n`)
    window.open(
      `{{ config.repo_url }}/issues/new?labels=feedback&title=Feedback: ${encodeURIComponent(document.title)}&body=${body}`,
      "_blank")
  })
})
```

#### 6b. Dismissable announcement bar + cookie consent

- Announcement: `extra.neoabs_announce: "Version 0.2 is live"` → one-line bar
  stored as dismissed in localStorage.
- Cookie consent: since NeoAbs ships no trackers, render consent **only** when a
  third-party integration (analytics/comments) is actually configured; default
  state = "nothing to consent to" (that's the marketable line).

```yaml
theme:
  neoabs:
    cookie_consent:
      show: true          # auto-suggested when analytics configured
      message: "This site stores nothing about you unless you enable integrations."
```

#### 6c. Comments via giscus (opt-in)

```yaml
theme:
  neoabs:
    comments:
      provider: giscus
      repo: "user/repo"
      repo_id: "R_…"
      category: "Announcements"
```

`base.html` injects the giscus script only when configured.

**Files.** `neoabs_plugin.py`, `base.html`, `footer/header.html`, `neoabs.js`.

**Acceptance.** Feedback links exist only when enabled; consent banner appears
only when an integration is on; giscus injects only when configured; doc build +
tests green.

---

### Phase 7 — Identity & i18n

**Goal.** A brand-true, locale-aware product that feels app-like everywhere.

**Why it wins.** 60+ languages is Material's edge; even 5 solid locales plus a
clean extension point beats "English only."

#### 7a. UI-string i18n

Centralize strings already in `__config.translations` and merge user overrides:

```yaml
theme:
  neoabs:
    i18n:
      search_placeholder: "Partout dans la docs…"
      toc_title: "Sur cette page"
      back_to_top: "Haut de page"
```

`base.html`:

```jinja
{% set _i18n = config.extra.neoabs_i18n | default({}) %}
<script id="__config" type="application/json">
  { "translations": {{ config.extra.translations | merge(_i18n) | tojson }} }
</script>
```

Follow with a `i18n/` folder + `theme.language` mapping for en, fr, de, es,
ja after P1 stabilizes the string inventory.

#### 7b. Breadcrumbs, nav icons, dark-aware images

```jinja
{# breadcrumbs in content top #}
{% if page.ancestors %}
<nav class="neoabs-breadcrumbs" aria-label="Breadcrumb">
  <a href="{{ config.site_url }}">{{ config.site_name }}</a>
  {% for a in page.ancestors %}
    <span>/</span><a href="{{ a.url | url }}">{{ a.title }}</a>
  {% endfor %}
</nav>
{% endif %}
```

Dark-aware images (`loading="lazy"` + emits `_dark` variant when available) and
optional inline nav icons via `attr_list` are CSS-first additions.

#### 7c. PWA manifest

```jinja
{# base.html #}
<link rel="manifest" href="{{ 'manifest.webmanifest' | url }}">
<meta name="application-name" content="{{ config.site_name }}">
```

`manifest.webmanifest` generated by the plugin (name, icons, `theme_color`,
`display: standalone`) — instant "install this docs app" win with the SW we
already ship.

**Files.** `base.html`, `neoabs_plugin.py`, `neoabs.js` (string lookups), new docs pages (breadcrumbs.html etc.).

**Acceptance.** `language` + `i18n` overrides swap chrome strings; manifest
exists at build; breadcrumbs render when ancestors exist.

---

### Phase 8 — Performance & PWA

**Goal.** Out-Lighthouse the incumbents and *prove* it.

**Why it wins.** Refs like "LCP < 1.5s, 100/100 Lighthouse, partial-Hydration,
offline-capable" are the credibility shortcuts busy devs actually read.

#### 8a. Prefetch on hover (InstantLoading-style)

```js
// neoabs.js — initPrefetch()
document.addEventListener("pointerover", (e) => {
  const a = e.target.closest('a[href^="' + base_url + '"]')
  if (a && a.href !== location.href) {
    const cache = localStorage["neoabs-prefetch-" + a.href] && Date.now()
    if (!cache) { /* <link rel="prefetch"> or fetch() */ }
  }
}, { passive: true })
```

#### 8b. Lazy images + `decoding=async`

```js
document.querySelectorAll("img[data-src]").forEach((img) => { img.loading = "lazy"; img.decoding = "async" })
```

plus `picture`/`srcset` support documented for authors.

#### 8c. Asset modes: `cdn` | `local` | `bundle`

```yaml
theme:
  neoabs:
    assets:
      mode: local            # copy hljs/KaTeX/Mermaid into site/ at build (privacy mode)
      inline_critical_css: true
```

Plugin `on_post_build` downloads the three CDN libs into `site/assets/vendor/`
when `mode: local` — GDPR self-host + offline `site.zip` capability (Material's
privacy+offline pair, ours is theme-bundled).

#### 8d. Perf budget in CI

```yaml
# .github/workflows/performance.yml
- name: Lighthouse
  uses: treosh/lighthouse-ci-action@v12
  with:
    urls: https://rkriad585.github.io/mkdocs-neoabs/
    budgetPath: .lighthouseci.json   # 0 category below 95 fails the build
```

**Files.** `neoabs.js`, `neoabs_plugin.py`, `sw.js`, `.github/workflows/*`, `mkdocs.yml`.

**Acceptance.** Lighthouse ≥95 all categories on the docs site; offline mode via
`immutable` static cache works for a cached page; `mode: local` builds offline.

---

### Phase 9 — Ecosystem & tooling

**Goal.** Patterns, compat, and DX tools that make NeoAbs the *safe* bet in any
MkDocs stack, today and for MkDocs 2.0.

**Why it wins.** Evaluators ask "will my plugins work?" and "is this future-proof?"
We answer both on one page.

#### 9a. Integrations guide

New `docs/plugins/integrations.md` with drop-in recipes + config:
`git-revision-date-localized`, `glightbox`, `print-site`, `section-index`,
`table-reader`, `git-authors`, `awesome-pages`. Add a CI job in our own repo
that builds the docs with these plugins installed to **prove the recipes**  — a
"dogfood full house" build that fails the release if a recipe breaks.

#### 9b. `neoabs doctor` + version/health CLI

```python
# neoabs/cli.py — extend Phase 2 CLI
@click.command()
def doctor() -> int:
    import mkdocs, mkdocs_neoabs
    print(f"mkdocs {mkdocs.__version__}  neoabs {mkdocs_neoabs.__version__}")
    # checks: node available, site_url set, sw cache version current, fonts fonts
```

#### 9c. MkDocs 2.0 readiness + release automation

- Rendered **compat matrix** (MkDocs 1.5 / 1.6 / 2.0.dev) as a CI matrix in
  `.github/workflows`, pinning `mkdocs` versions, all green → the "future-proof"
  claim is machine-checked.
- Release automation: semantic-release-style tags → PyPI + GitHub release +
  auto `?v=` bump proposal (currently manual `neoabs_version`).

**Files.** `docs/plugins/integrations.md`, `neoabs/cli.py`, `.github/workflows/*`, `pyproject.toml`.

**Acceptance.** Matrix job green 1.5·1.6·2.0.dev; `neoabs doctor` exits 0 on a
healthy project; integrations page renders with showcased recipe builds.

---

### Phase 10 — Community flywheel

**Goal.** Discovery, trust, and contributions — the compounding layer.

**Why it wins.** Nobody picks a theme with no heartbeat. Benchmarks, badges,
showcase, and a clear contribution path signal *alive*.

- **Benchmarks page** (`docs/benchmarks.md`): Lighthouse + page-weight table
  (neoabs vs material vs readthedocs) regenerated by CI — a permanent "we're
  fast" receipt.
- **"Powered by NeoAbs"** one-line snippet in the footer template + a badge
  (link back → organic discovery).
- **Fund/community**: `FUNDING.yml` + Discussions + a `showcase` mechanism
  (`mkdocs.yml` `extra.neoabs_showcase: true` adds a subtle footer credit).
- **Contributor path**: `CONTRIBUTING.md` "first issue" labels, translation
  onboarding (ties to P7), docs screenshots instructions (ties to P1).
- **Release + changelog automation**: auto-generated `CHANGELOG.md` from commits
  (repo already has a conventional-commit-ish history — formalize it).

**Acceptance.** Footer credit opt-in works; benchmarks page has real numbers CI
regenerates; FUNDING/community links live; release workflow cuts a tag → PyPI.

---

## 6. Definition of done

`WHY_PLAN.md` succeeds when all of the following hold:

1. **Zero dead config** — every documented key has a real consumer (greppable).
2. **2-minute onboarding** — `neoabs new` → `mkdocs serve` for a clean, branded site.
3. **Parity on content surface** — dark/light, search-deep-links, last-updated,
   edit-link, lightbox, footnotes, social cards, JSON-LD, llms.txt.
4. **Differentiators provable** — benchmarks page, Lighthouse CI ≥ 95, offline
   `local` mode, cookie-privacy story.
5. **Compatible & future-ready** — integrations page, 1.5/1.6/2.0.dev CI matrix,
   `neoabs doctor`.
6. **Community signals** — showcase, funding, badges, first-issue labels,
   release automation.
7. **Nothing ships broken** — `npm test`, harnesses, `ruff`, `mkdocs build`, and
   a11y audit all stay green on every merged phase.

Suggested budget: P1–P2 first (trust + narrative), P3–P4 next (search + share),
then P6–P8 before the 1.0 announcement (privacy + performance proof), P5/P9/P10
continuously.

---

## 7. Risks & constraints

| Risk | Mitigation |
|---|---|
| **MkDocs 2.0 breaking changes** (ground-up rewrite announced 2026) | P9 compat matrix + pin stable MkDocs; template/plugin API mirrored to both; announce readiness explicitly |
| **Maintenance-mode Material picks up new features via Zensical** | Differentiate on design language + privacy + speed, not on feature-soup parity |
| **CDN dependences hurt offline/GDPR story** | P8 `assets.mode: local` bundles hljs/KaTeX/Mermaid; SW already caches CDN |
| **Scope creep (14 phases in PLAN.md + 10 here)** | Keep phases incrementally shippable; each has acceptance criteria + red/green harness |
| **Single maintainer bandwidth** | Community phase (P10) lowers contribution friction; docs-first culture reduces bug reports |
| **OG/SVG social cards unreliable in some crawlers** | Pillow PNG preferred path; SVG only as graceful fallback (P4) |

---

## 8. Research sources

- Material for MkDocs — **maintenance mode** Nov 2025 / Mar 2026; all Insiders
  features folded into MIT 9.7.0; successor **Zensical**:
  - squidfunk.github.io changelog + release notes (9.7.x)
  - docsio.co/blog/mkdocs-material (Honest 2026 Review — maintenance-mode timeline)
  - pydevtools.com handbook reference (mkdocs-material) — features & Cons
  - squidfunk.github.io/mkdocs-material/ (setup: navigation, search, social, blog,
    offline, privacy, optimize)
- Material README/alternatives page (27.4k stars; adopters incl. FastAPI,
  Pydantic, Ruff, OpenAI Agents, AWS, Google).
- **MkDocs 2.0 announcement** — squidfunk.github.io blog (2026-02-18).
- Third-party plugin ecosystem (Xomo of what "any good theme" is expected to
  support): `mkdocs-git-revision-date-localized`, `mkdocs-glightbox`,
  `mkdocs-print-site`, `mkdocs-section-index`, `mkdocs-git-authors`,
  `mkdocs-table-reader` (github topics: mkdocs-plugin).
- Built-in themes reference — mkdocs.org/user-guide/choosing-your-theme
  (`mkdocs` color_mode/shortcuts/navigation_depth/locale; `readthedocs`
  highlightjs, prev/next, analytics+anonymize_ip).

---

*WHY_PLAN.md — strategy companion to PLAN.md. Update the "Gap analysis" table the
day a phase lands; move its row to "Current state audit" and keep the plan honest.*