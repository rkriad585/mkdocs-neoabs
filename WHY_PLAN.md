# WHY PLAN — make developers *choose* mkdocs-neoabs

> This document answers the question nobody is asking yet:
> **"Why NeoAbs instead of Material, ReadTheDocs-builtin, or a hosted tool?"**
>
> It is the marketing + engineering plan. `PLAN.md` is the config-surface
> roadmap (what to build). This file is the strategy roadmap (why to build it,
> what the world looks like, and the exact steps — with code — to close the gap).
>
> **State (audited 2026-09):** this file is kept honest against the shipped
> source. Sections marked ✅ are already implemented and verified in the repo.
> The phases below list only the work that *remains*.

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
- [5. Phases (only the remaining work)](#5-phases-only-the-remaining-work)
  - [Phase 1 — Trust & correctness](#phase-1--trust--correctness-quick-wins)
  - [Phase 2 — Onboarding & documentation](#phase-2--onboarding--documentation)
  - [Phase 3 — Search deep-links & share](#phase-3--search-deep-links--share)
  - [Phase 4 — Social cards](#phase-4--social-cards)
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

Verified against the source (2026-09): plugin `neoabs/plugins/neoabs_plugin.py`
(1,570 lines), client `neoabs/templates/assets/javascripts/neoabs.js`
(4,359 lines), templates `neoabs/templates/base.html` (707 lines) + 9 partials,
styles `neoabs.scss` (630 lines) + `components.scss` (6,104 lines), CI under
`.github/workflows/`.

### Design system (implemented & verified)

| Capability | Where | Evidence |
|---|---|---|
| Glass morphism (light/medium/heavy/none) | `theme.neoabs.glass` | `neoabs.scss` L235–285 + plugin `_validate_visual_options` |
| NothingOS dot-matrix overlay | `theme.neoabs.dot_matrix` | `neoabs.scss` L376–393 |
| Dark/light palette toggle (multi-palette, FOUC-safe, persisted) | `partials/palette.html` + JS `initTheme`/`initColorScheme`/`toggleScheme` | `neoabs.js` L247–331 |
| Ctrl/Cmd+Shift+L scheme hotkey | keyboard `toggle_scheme` | `neoabs.js` L1952 |
| Dark/light favicon + logo swap | `base.html` favicon block | `base.html` L280–301 |
| Design-token overrides → CSS vars | plugin `_NEOABS_TOKEN_MAP` | colors, typography, spacing, radius, transitions, shadows |
| Space Grotesk / Space Mono typography | `base.html` fonts block (hardcoded today) | `base.html` L319–323 |
| Border + animation variants | `data-md-neoabs-border/animation` | `neoabs.scss` L329–370 |
| Scrollbar hide-by-default + style/color config | `theme.neoabs.scrollbar` | `neoabs.scss` L449–491; `base.html` L210 |

### Behaviors (implemented & verified)

| Capability | Where |
|---|---|
| SPA-style navigation, scroll restore + `lastPage` resume | JS `initSPANavigation` (L3988–4297) |
| Service worker: static + CDN cache-first, versioned `?v=` passthrough | `sw.js` |
| Full-screen search with rich config surface (placeholder, shortcut, min/max results, context, highlights, suggest, result icons/breadcrumbs), keyboard nav, focus trap | JS `initSearch` (L417–812) |
| TOC active-heading tracking (configurable levels/offset) | JS `initTocTracking` (L823–903) |
| Reading progress bar + back-to-top (threshold + label config) | `initScrollBehavior`/`initBackToTop` (L905–967) |
| highlight.js (dark + light), Mermaid, KaTeX — lazy CDN load with per-component `cdn_url` | JS init registry |
| Mermaid diagram controls: zoom/pan/fullscreen toolbar + mouse wheel, trackpad pinch, touch drag, double-click | JS `initMermaid` (L1126–1481) + `components.scss` L3456+ |
| Code copy buttons, line numbers, highlighted lines, code-fence a11y | JS + templates |
| Tabs & task lists with localStorage persistence | JS `initTabs`/`initTaskLists` |
| Notes & annotations (TTL, MD/JSON export, toast) | JS `initNotes` (L2231–2668) |
| Repo (GitHub) live popover — 18 fields, 1-hour cache | JS `initRepoPopover` (L3699–3952) |
| Keyboard shortcuts (search nav, sidebar/TOC/notes/reading/scheme/repo toggles, help) + dynamic help modal + user `custom` shortcuts | `initKeyboardNav` (L1824–1970) + `keyboardHelpRows` (L1976–2044) |
| Sidebar/TOC collapse + persistence | `initSidebarToggle` (L2133–2202) |
| Reading mode (measure, section hiding, persisted, auto-start timer) | `initReadingMode` (L1739–1793) |
| Action cluster (configurable FAB menu: position, actions, tools, focus trap) | `initActionCluster` (L2833–2861) |
| Focus timer (Pomodoro, ring/bar/digits widget, settings popup, notifications) | `initFocusTimer` (L3439–3457) |
| Custom head/body/JS injection: theme-level + page front-matter `custom_css`/`custom_js` | `base.html` L16–30, L329+, L515+, L703+ |
| AI-reader: `llms.txt` + `llms-full.txt` + per-page watermarked markdown mirrors + sitemap extension | plugin hooks (L1359–1542) |
| OG / Twitter / theme-color meta, optional manifest link, `dir`/`language` handling | `base.html` L245–278 |
| Responsive video wrapper + lazy images (config `image_behavior`) | `initContentMedia` (L1608–1627) + `components.scss` L3737 |

### What is currently *broken or dead* (verified 2026-09)

- `theme.font.text / font.code` are **ignored** — fonts hardcoded in `base.html`.
- `theme.features` is **still dead** — emitted into `__config` (base.html L606)
  but no consumer in JS.
- No JSON-LD structured data (OG/Twitter/theme-color are present; JSON-LD is not).
- No auto-generated social-card image (`tools/social_card.py` does not exist).
- No `?q=` search deep-link (search share/resume not implemented).
- Screenshot gallery ❌→✅ fixed: all 17 `Screenshots/*.png` exist as real
  Playwright captures (macOS/phone frames), including `light-mode.png`,
  `code-blocks.png`, `mobile.png`; `tools/screenshots_gen.py` emits all of them.
- No page breadcrumbs, no nav icons, no dark-aware images.
- No feedback widget, no announcement bar, no cookie consent, no comments.
- No auto-generated PWA manifest (only an optional `<link>` via
  `extra.neoabs_manifest`); no iOS PWA meta tags.
- No asset bundling mode (`cdn | local | bundle`) — CDN URLs are configurable per
  component but nothing is vendored into `site/`.
- No prefetch-on-hover; no Lighthouse/perf-budget CI.
- No CLI (`neoabs new` / `neoabs doctor`); no integrations guide; no MkDocs
  1.5/1.6/2.0.dev compat matrix.
- CI has GitHub Release automation but **no PyPI publish**; no benchmarks page;
  no `FUNDING.yml`; no showcase page.

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

Legend: ✅ have (shipped & verified) · 🟡 partial (partly done / needs hardening) · ❌ open

| # | Capability (what Material/base themes have) | NeoAbs today | Phase |
|---|---|---|---|
| 1 | Working `theme.font`, `theme.features` config | ❌ fonts hardcoded; `features` dead | P1 |
| 2 | Complete screenshot gallery | ✅ 17 real captures (macOS/phone frames, Playwright) | done |
| 3 | OG / Twitter / theme-color / structured data | 🟡 OG/Twitter/theme-color shipped; JSON-LD missing | P4 |
| 4 | Social-card image per page (auto-generated) | ❌ | P4 |
| 5 | AI/LLM-readiness (`llms.txt`, mirrors, FAQ/Article schema) | 🟡 `llms.txt`+`llms-full.txt`+mirrors shipped; schema pending | P4 |
| 6 | Search config surface | ✅ fully wired (placeholder/shortcut/min/max/context/highlight/suggest) | done |
| 7 | Search `?q=` deep link + share | ❌ | P3 |
| 8 | "Last updated" date + "Edit on GitHub" link | ❌ | P5 |
| 9 | Image lightbox, footnotes, code annotations | ❌ (responsive images/video ✅) | P5 |
| 10 | Cookie consent, announcement bar, feedback ("was this helpful"?) | ❌ | P6 |
| 11 | Comments (giscus) | ❌ | P6 |
| 12 | i18n of UI strings, translations of chrome | 🟡 `language` + partial `translations`; no override merge | P7 |
| 13 | Dark-aware images, breadcrumbs, nav icons | ❌ | P7 |
| 14 | Auto PWA manifest + app meta | 🟡 optional `<link>`; no auto-gen, no iOS meta | P7 |
| 15 | Prefetch on hover, lazy images, perf budget CI | 🟡 lazy images ✅; no prefetch/Lighthouse | P8 |
| 16 | Asset bundling (cdn \| local \| bundle) / offline self-host | 🟡 per-component `cdn_url`; no vendoring recipe | P8 |
| 17 | Plugin compat guide + recipes | ❌ | P9 |
| 18 | `neoabs new` scaffolding + `doctor` | ❌ | P9 |
| 19 | MkDocs 2.0 compat matrix + release automation | 🟡 GitHub Release ✅; no PyPI, no version matrix | P9 |
| 20 | Showcase, benchmarks, funding, contributor path | 🟡 CONTRIBUTING+CHANGELOG ✅; no benchmarks/FUNDING/showcase | P10 |

---

## 5. Phases (only the remaining work)

Each phase is independently shippable and ordered by "biggest trust +
value gain per hour." ✅ rows mark what already shipped (verified in source) so a
phase's scope is exactly the delta. Each phase states **Goal**, **Why it wins
developers**, **Already shipped (verified)**, **Remaining work** with Config +
code examples, **Files touched**, and **Acceptance criteria**.

---

### Phase 1 — Trust & correctness (quick wins)

**Goal.** Delete every broken promise: dead config keys, missing gallery images,
and docs that contradict the code.

**Why it wins.** A developer's first move is `theme.font: {...}` and `features:`.
If nothing changes, they bounce.

**Already shipped (verified).** All three items below are done.

#### 1a. Wire `theme.font` ✅ (done)

`base.html` no longer hardcodes the Google Fonts `<link>`: it resolves
`config.theme.font.text` / `.code` (defaults `Space Grotesk` / `Space Mono`)
for both the `<link>` and, via `neoabs_plugin.py`, the `--neoabs-font-body` /
`--neoabs-font-mono` tokens. Font tokens are appended after the token loop so
`theme.font` wins over matching `neoabs.typography` values.

**Files touched.** `neoabs/templates/base.html`, `neoabs/plugins/neoabs_plugin.py`,
`docs/getting-started/configuration.md`, `docs/plugins/neoabs.md`.

**Acceptance (verified).** Throwaway project with `font: {text: Inter, code:
JetBrains Mono}` renders `family=Inter:wght@300` + `family=JetBrains+Mono` in
the `<link>` and emits `Inter, sans-serif` / `JetBrains Mono, monospace`
tokens; the default build stays strict-clean with the existing typefaces.

#### 1b. Make `features` real (or remove it) ✅ (done)

`theme.features` is a Material-compatible **passthrough**: every documented flag
ships enabled by default (section nav, back-to-top + progress, prev/next footer,
code copy, search suggest, search-result highlights), so the list is accepted but
does not gate behavior. The dead `"features"` key was removed from `#__config`,
and docs (`mkdocs.yml`, `configuration.md`, `README.md`, `plugins/neoabs.md`)
now state the passthrough contract instead of promising gating.

**Files touched.** `neoabs/templates/base.html`, `mkdocs.yml`, `README.md`,
`docs/getting-started/configuration.md`, `docs/plugins/neoabs.md`.

**Acceptance (verified).** Built `site/*.html` contains no `"features"` key in
`#__config`; `mkdocs build --strict` passes; a temp project listing
`features:` renders identically.

#### 1c. Fix the screenshot contract ✅ (done)

`tools/screenshots_gen.py` was rebuilt as a premium capture tool:
Playwright + system Chrome/Edge, retina output (`deviceScaleFactor=2`),
no placeholders. Desktop pages get a macOS-style window frame (traffic
lights, title bar, soft drop shadow); the mobile shot is wrapped in a
phone bezel with a dynamic island. `light-mode.png` uses
`prefers-color-scheme` emulation + a seeded preference, `search.png`
opens the real modal and types a query (10 results), `mobile.png` opens
the drawer at 390px. PAGES now covers all 7 documented shots plus the
previous 12; all 17 `Screenshots/*.png` exist on disk and are real
captures. `docs/screenshots.md` "Generating Screenshots" updated
(`pip install playwright pillow` + `--real`).

**Files touched (done).** `tools/screenshots_gen.py`, `docs/screenshots.md`.

**Acceptance (verified).** `screenshots.md` ↔ disk diff empty; all files
framed (16× 2960×1960 mac, mobile 836×1836); light-mode renders light,
search shows the modal, mobile shows the drawer; no placeholder
rectangles remain.

---

### Phase 2 — Onboarding & documentation

**Goal.** A developer understands *why NeoAbs* and can go live in < 2 minutes.

**Why it wins.** "Install → see it beat my expectations" is the acquisition
channel.

**Already shipped (verified).** Docs folders exist and are deep
(`docs/getting-started/`, `docs/design/`, `docs/components/` ×16,
`docs/plugins/`), plus CONTRIBUTING/CHANGELOG. **Not shipped:** the Why/Showcase
narrative, the generated config reference, the CLI scaffolder.

#### 2a. `Why NeoAbs` page + Showcase

Add `docs/why-neoabs.md` (Three Pillars, honest dated compare table, "Made by the
anti-default" one-liner) and `docs/showcase.md` (embeds + the Screenshots gallery).

#### 2b. Config reference generated from the plugin

`docs/getting-started/configuration.md` exists but is hand-maintained. Pin it to
the plugin's canonical tables with a generator + `pymdownx.snippets` include so
doc/config can't drift:

```python
# tools/emit_config_reference.py (new)
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

#### 2c. `neoabs new` project scaffolder

```python
# neoabs/cli.py (new entry point in pyproject.toml: neoabs = "neoabs.cli:main")
import pathlib, sys

TEMPLATE = {
    "mkdocs.yml": 'site_name: New Docs\nsite_url: ""\ntheme:\n  name: neoabs\n\nplugins:\n  - search\n  - neoabs\n',
    "docs/index.md": "# Welcome\n\nBuilt with NeoAbs.\n",
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

### Phase 3 — Search deep-links & share

**Goal.** Make results shareable and restorable.

**Why it wins.** "Search works out of the box" is already our strength; the
missing 10% (share/restore) turns an empty-win into a demo-able, linkable one.

**Already shipped (verified).** Full search config surface (placeholder,
shortcut key, `min_chars`, `max_results`, `show_context`, `context_length`,
`highlight_results`, `suggest`, result icon/breadcrumb/highlight toggles) is
wired end-to-end: base.html `__config.neoabs_search` → JS `initSearch`.

#### 3a. Deep link + share

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

**Files.** `partials/search.html`, `neoabs.js` (`initSearch`).

**Acceptance.** `?q=foo` re-opens search with the query; "copy link" on results
copies a working deep-link; search harness passes.

---

### Phase 4 — Social cards

**Goal.** Shared links look stunning and bots can index the site correctly.

**Why it wins.** Material's auto-generated social cards are its most-copied
feature; cards + `README`-quality OG make any shared link work *for* us.

**Already shipped (verified).**
- **4a (OG/Twitter/theme-color):** `og:type/site_name/title/description/url/image`,
  `twitter:card/site/creator`, `theme-color` — all in `base.html` L245–278.
- **4c (AI-readiness):** `llms.txt`, `llms-full.txt`, per-page watermarked
  markdown mirrors, and sitemap extension — plugin hooks L1359–1542. Only
  **FAQ/Article JSON-LD schema** remains.

#### 4a. JSON-LD structured data

```jinja
{# base.html — inside {% block branding_meta %} add: #}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": {{ page.title | default(config.site_name) | tojson }},
  "description": {{ page.meta.description | default(config.site_description) | tojson }},
  "url": {{ page.canonical_url | tojson }},
  "publisher": { "@type": "Organization", "name": {{ config.site_name | tojson }} }
}
</script>
```

#### 4b. Automatic social-card image

`tools/social_card.py` — optional `pillow`, renders the theme's signature card
(black canvas, dot-matrix, Nothing-Red headline) per page at build time; falls
back to a crisp SVG `og:image`:

```python
# tools/social_card.py (new, optional dependency)
def render(title, site_name, out=".cache/cards"):
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

Hook via `on_post_build` when `config.extra.neoabs_og_image == "__auto__"`.

**Files.** `base.html`, `neoabs_plugin.py`, `tools/social_card.py`, `pyproject.toml` (optional extra), `mkdocs.yml`.

**Acceptance.** Every page emits unique JSON-LD; `site/llms.txt` still generated;
`theme-color` follows palette; `__auto__` card ends up as `og:image`; harness for
meta-block passes.

---

### Phase 5 — Content superpowers

**Goal.** First-class support for the content features dev-docs rely on:
annotations, footnotes, lightbox, freshness metadata.

**Why it wins.** Parity on the *content* surface is cheap and removes the
"NeoAbs can't do X" objection in evaluations.

**Already shipped (verified).** Responsive video/iframe wrapper
(`components.scss` L3737 + `initContentMedia`); lazy images (`image_behavior`);
code line numbers / highlight lines.

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

#### 5b. Image lightbox + footnotes + code annotations

- Lightbox: document + theme-stylize `mkdocs-glightbox` OR ship a tiny vanilla
  zoom (preferred — priv-first, no extra pip):

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

- Footnotes: add `footnotes` to the recommended extensions and style the callout;
  add an "annotate" CSS-comment syntax guide for `pymdownx.highlight`
  (`content.code.annotate` equivalent).

**Files.** `footer.html`, `neoabs.js`, `components.scss`, `mkdocs.yml` (extensions), `docs/components/*`.

**Acceptance.** git-revision-date renders when plugin present, no-op otherwise;
image zoom works w/o deps; footnotes styled; `npm test` + build green.

---

### Phase 6 — Engagement & privacy

**Goal.** Turn readers into participants while keeping the privacy-first promise.

**Why it wins.** Feedback / announcement / comments are well-trodden adoption
drivers; GDPR-first cookie flow differentiates.

**Already shipped (verified).** Nothing in this phase is done yet.

#### 6a. "Was this page helpful?" — GitHub-issue-backed (no tracking)

```yaml
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
  third-party integration (analytics/comments) is actually configured.

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
only when an integration is on; giscus injects only when configured; build +
tests green.

---

### Phase 7 — Identity & i18n

**Goal.** A brand-true, locale-aware product that feels app-like everywhere.

**Why it wins.** 60+ languages is Material's edge; even 5 solid locales plus a
clean extension point beats "English only."

**Already shipped (verified).** `language`/`direction` + `translations` in
`__config` (clipboard/search/toc). **Not shipped:** override merge, locale
bundles, breadcrumbs, nav icons, dark-aware images, auto PWA manifest.

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

```jinja
{#
  base.html — merge author overrides into the existing translations block
#}
{% set _i18n = config.extra.neoabs_i18n | default({}) %}
<script id="__config" type="application/json">
  { "translations": {{ config.extra.translations | merge(_i18n) | tojson }} }
</script>
```

Follow with an `i18n/` folder + `theme.language` mapping for en, fr, de, es, ja.

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

Dark-aware images (emits `_dark` variant when available) + optional inline nav
icons via `attr_list` are CSS-first additions.

#### 7c. Auto PWA manifest + app meta

```jinja
{# base.html #}
<link rel="manifest" href="{{ 'manifest.webmanifest' | url }}">
<meta name="application-name" content="{{ config.site_name }}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
```

`manifest.webmanifest` generated by the plugin (name, icons, `theme_color`,
`display: standalone`) — instant "install this docs app" win with the SW we
already ship.

**Files.** `base.html`, `neoabs_plugin.py`, `neoabs.js` (string lookups), new docs pages (breadcrumbs.html etc.).

**Acceptance.** `language` + `i18n` overrides swap chrome strings; manifest is
auto-generated at build; breadcrumbs render when ancestors exist.

---

### Phase 8 — Performance & PWA

**Goal.** Out-Lighthouse the incumbents and *prove* it.

**Why it wins.** Refs like "LCP < 1.5s, 100/100 Lighthouse, offline-capable",
and "vendored assets — no CDN required" are credibility shortcuts devs read.

**Already shipped (verified).** SW static+CDN caching (`sw.js`); lazy images
(`image_behavior: lazy`); responsive media; per-component `cdn_url` config.

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

#### 8b. Asset modes: `cdn` | `local` | `bundle`

```yaml
theme:
  neoabs:
    assets:
      mode: local            # copy hljs/KaTeX/Mermaid into site/ at build (privacy mode)
      inline_critical_css: true
```

Plugin `on_post_build` downloads the three CDN libs into `site/assets/vendor/`
when `mode: local` — GDPR self-host + offline `site.zip` capability. (Per-component
`cdn_url` already exists; add the vendoring mode on top.)

#### 8c. Perf budget in CI

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
cached page works; `mode: local` builds offline with no external requests.

---

### Phase 9 — Ecosystem & tooling

**Goal.** Patterns, compat, and DX tools that make NeoAbs the *safe* bet in any
MkDocs stack, today and for MkDocs 2.0.

**Why it wins.** Evaluators ask "will my plugins work?" and "is this
future-proof?" We answer both on one page.

**Already shipped (verified).** GitHub Actions exist for docs build+deploy,
container image, and tag-based GitHub Releases (with `dist/` artifacts).

#### 9a. Integrations guide

New `docs/plugins/integrations.md` with drop-in recipes + config:
`git-revision-date-localized`, `glightbox`, `print-site`, `section-index`,
`table-reader`, `git-authors`, `awesome-pages`. Add a CI job that builds the docs
with these plugins installed to **prove the recipes**.

#### 9b. `neoabs doctor` + version/health CLI

```python
# neoabs/cli.py — extend Phase 2 CLI
@click.command()
def doctor() -> int:
    import mkdocs, mkdocs_neoabs
    print(f"mkdocs {mkdocs.__version__}  neoabs {mkdocs_neoabs.__version__}")
    # checks: node available, site_url set, sw cache version current, fonts
```

#### 9c. MkDocs 2.0 readiness + release automation

- **Compat matrix** (MkDocs 1.5 / 1.6 / 2.0.dev) as a CI matrix in
  `.github/workflows`, all green → the "future-proof" claim is machine-checked.
- **PyPI publish**: extend `release.yml` with `twine upload` /
  `pypa/gh-action-pypi-publish` (today it only cuts a GitHub Release).

**Files.** `docs/plugins/integrations.md`, `neoabs/cli.py`, `.github/workflows/*`, `pyproject.toml`.

**Acceptance.** Matrix job green 1.5·1.6·2.0.dev; `neoabs doctor` exits 0 on a
healthy project; integrations page renders with showcased recipe builds; tags
publish to PyPI.

---

### Phase 10 — Community flywheel

**Goal.** Discovery, trust, and contributions — the compounding layer.

**Why it wins.** Nobody picks a theme with no heartbeat.

**Already shipped (verified).** `CONTRIBUTING.md`, `CHANGELOG.md`,
`docs/screenshots.md` + 14 real `Screenshots/*.png`, and tag-driven release
workflow.

- **Benchmarks page** (`docs/benchmarks.md`): Lighthouse + page-weight table
  (neoabs vs material vs readthedocs) regenerated by CI — a permanent "we're
  fast" receipt.
- **"Powered by NeoAbs"** one-line snippet in the footer + a badge (opt-in via
  `extra.neoabs_showcase: true`).
- **Fund/community**: add `FUNDING.yml` + Discussions link.
- **Contributor path**: "first issue" labels + translation onboarding (ties to P7).
- **Release + changelog automation**: auto-generated `CHANGELOG.md` from commits
  (history is already conventional-commit-ish — formalize and wire to releases).

**Acceptance.** Footer credit opt-in works; benchmarks page has real numbers CI
regenerates; FUNDING/community links live; an auto changelog ships with each tag.

---

## 6. Definition of done

`WHY_PLAN.md` succeeds when all of the following hold:

1. **Zero dead config** — every documented key has a real consumer (greppable).
2. **2-minute onboarding** — `neoabs new` → `mkdocs serve` for a clean, branded site.
3. **Parity on content surface** — search deep-links, last-updated, edit-link,
   lightbox, footnotes, social cards, JSON-LD (llms.txt + OG/theme-color already ✅).
4. **Differentiators provable** — benchmarks page, Lighthouse CI ≥ 95, offline
   `local` mode, cookie-privacy story.
5. **Compatible & future-ready** — integrations page, 1.5/1.6/2.0.dev CI matrix,
   PyPI publish, `neoabs doctor`.
6. **Community signals** — showcase, funding, badges, first-issue labels,
   release-automated changelog.
7. **Nothing ships broken** — `npm test`, harnesses, `ruff`, `mkdocs build
   --strict`, and a11y audit all stay green on every merged phase.

Suggested budget: P1–P2 first (trust + narrative), P4-P5 next (share + content),
then P6–P8 before the 1.0 announcement (privacy + performance proof), P9/P10
continuously.

---

## 7. Risks & constraints

| Risk | Mitigation |
|---|---|
| **MkDocs 2.0 breaking changes** (ground-up rewrite announced 2026) | P9 compat matrix + pin stable MkDocs; mirror template/plugin API to both; announce readiness explicitly |
| **Maintenance-mode Material picks up new features via Zensical** | Differentiate on design language + privacy + speed, not on feature-soup parity |
| **CDN dependences hurt offline/GDPR story** | P8 `assets.mode: local` bundles hljs/KaTeX/Mermaid; SW already caches CDN |
| **Scope creep (20 config phases + 10 strategy betas)** | Phases are incrementally shippable; each has acceptance criteria + red/green harness |
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
day a phase lands; move its row to "Current state audit" and keep the plan honest.
Audit dates: 2026-09 (subagent sweep of plugin, JS, templates, SCSS, docs, tools,
tests, CI).*