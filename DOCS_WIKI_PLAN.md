# DOCS_WIKI_PLAN.md — the definitive documentation & GitHub Wiki plan for mkdocs-neoabs

> The single place that plans, end-to-end, **everything a developer needs to
> know** about NeoAbs: *why use it, how to use it, how to configure it, how it
> works inside, how to extend it, and how the community documents it* — so a
> reader can go from "what is this?" to "deployed, branded, customized" without
> ever leaving the docs.
>
> Companion files: `PLAN.md` (feature config-surface roadmap, Phases 1–14 +
> D1–D8), `WHY_PLAN.md` (strategy: why developers choose NeoAbs). The
> **Mandatory Working Rules below bind every phase in this file** — they are the
> same rules as in `PLAN.md` and `WHY_PLAN.md`.

---

## ⚠️ Mandatory Working Rules (READ BEFORE STARTING ANY WORK)

> These rules apply to **every** phase in this plan. Breaking any of them is a
> defect and must be treated as one. Re-read them before finishing each phase.

1. **Don't remove any element.** Never delete existing HTML elements, Jinja
   blocks, CSS rules/classes, IDs, or markup that the theme already renders.
   Extend them or hide them via config — never strip them out.
2. **Don't remove any feature.** Every feature documented in the README, the
   `docs/` folder, or present in the theme today must keep working after any
   phase. Enabling/disabling goes through the existing config defaults; nothing
   may silently disappear.
3. **Don't remove any function.** Never delete or rename an existing JavaScript
   function, Python method, plugin hook, or init entry point. New code may wrap
   or extend; existing call sites stay intact and callable.
4. **Don't make any typo.** Verify every identifier — config keys, CSS custom
   property names, function names, class names, file paths, and every doc page
   name/link — against the actual source before and after every edit. A typo in
   a config key, class, asset URL, or doc link is a bug.
5. **Don't touch any code outside the phase's topic.** Each phase lists the
   files it may modify (mostly `docs/`, `README.md`, `mkdocs.yml` nav, `tools/`
   doc utilities, and the wiki). You must not edit any file outside that list.
   If a change appears to require an out-of-scope file, stop and add that file
   to the phase's list first.
6. **Don't miss any feature in a phase.** Each phase defines a **complete** set
   of pages, config keys, and behaviors. Implement them **all**. A phase is not
   done until every listed item has a working, accurate doc and every task in
   that phase is checked off.
7. **One truth, generated.** Hand-written pages never duplicate the config
   reference — always include (or generate from) the plugin's canonical tables
   (`_NEOABS_TOKEN_MAP`, `_neoabs_defaults`). Never document a key that has no
   working consumer.
8. **Everything stays enabled/active by default.** All new features default to
   ON (or keep their previous default value). Never ship a config default of
   `false` unless the phase explicitly says otherwise.
9. **Verification is part of the phase.** After each phase: `npm run build`,
   `mkdocs build --quiet`, `npm test`, `tools/check_docs.py`, and the relevant
   harnesses must all pass before moving on. No phase is complete without a
   green build, green tests, and green doc checks.
10. **Never "fix" a symptom by deleting the feature.** If a feature or doc
   misbehaves, fix the bug. Do not disable, hide, remove, or silently rewrite a
   feature to make checks pass.

---

## Table of contents

- [1. Purpose & targets](#1-purpose--targets)
- [2. Documentation philosophy & quality bar](#2-documentation-philosophy--quality-bar)
- [3. Content inventory — every single thing the docs must explain](#3-content-inventory)
- [4. Target documentation map (nav of the finished site)](#4-target-documentation-map)
- [5. GitHub Wiki plan](#5-github-wiki-plan)
- [6. Phases](#6-phases)
  - [Phase 1 — Audit & fix the foundation](#phase-1--audit--fix-the-foundation)
  - [Phase 2 — Why & onboarding](#phase-2--why--onboarding)
  - [Phase 3 — Configuration Bible](#phase-3--configuration-bible)
  - [Phase 4 — Design system & components deep-dive](#phase-4--design-system--components-deep-dive)
  - [Phase 5 — Theme behavior & features](#phase-5--theme-behavior--features)
  - [Phase 6 — Developer docs & learning curve](#phase-6--developer-docs--learning-curve)
  - [Phase 7 — GitHub Wiki](#phase-7--github-wiki)
  - [Phase 8 — Quality, CI & maintenance](#phase-8--quality-ci--maintenance)
- [7. Definition of done](#7-definition-of-done)
- [8. Risks & constraints](#8-risks--constraints)

---

## 1. Purpose & targets

**Goal:** make NeoAbs documentation so complete and pleasant that "I read the
docs" is the fastest path from zero to a live, customized site — and so
well-structured that contributors and maintainers never fight stale content.

**Two surfaces, one truth:**

| Surface | Where | Role |
|---|---|---|
| **Docs site** | `docs/` + `mkdocs.yml` (built by the theme itself) | Canonical, version-pinned, always-current reference & tutorials |
| **GitHub Wiki** | `rkriad585/mkdocs-neoabs.wiki` | Community space: recipes, translated guides, informal notes, release notes, screenshots gallery |

**Audience tiers** (every page is written to exactly one tier):

1. **User** — the developer adopting NeoAbs for their own docs.
2. **Contributor** — someone patching the theme (Python/JS/SCSS/docs).
3. **Maintainer** — the person shipping releases, screenshots, and CI.

**Depth guarantee:** for every config key there is (a) a definition, (b) a
default, (c) a worked example, and (d) a screenshot or live demo where possible.
No key is documented from memory — it is generated from the plugin where we can,
cross-checked against the source where we can't.

---

## 2. Documentation philosophy & quality bar

1. **Generated > hand-written.** The config reference mirrors
   `neoabs_plugin.py` (`_NEOABS_TOKEN_MAP`, `_neoabs_defaults`) and is emitted by
   `tools/emit_config_reference.py` (see `WHY_PLAN.md` Phase 2b). Humans never
   retype truth.
2. **Every example is tested.** `tests/docs-examples/` is a scratch MkDocs
   project in CI that enables each documented snippet and fails the build if a
   snippet breaks.
3. **No dead config.** A documented key without a working consumer is a bug
   (`WHY_PLAN.md` Phase 1 target).
4. **Screenshots for everything visual.** `tools/screenshots_gen.py` regenerates
   the gallery; the doc build fails if `docs/screenshots.md` references a missing
   file (currently missing: `light-mode.png`, `code-blocks.png`, `mobile.png` —
   fixed in Phase 1).
5. **One level deeper than competitors.** Where Material shows *that* something
   exists, NeoAbs docs show *why it exists, when to use it, what happens under
   the hood, and how it degrades* (offline, no-JS, reduced-motion).
6. **Searchable and AI/LLM-friendly.** Robust page titles, one H1 per page,
   JSON-LD + `llms.txt` (see `WHY_PLAN.md` Phase 4).

---

## 3. Content inventory

The complete list of topics the documentation must explain, end-to-end. Each is
mapped to a phase and to the pages that ship it.

### 3.1 Why use NeoAbs
- Positioning vs Material for MkDocs (maintenance mode → we are the active,
  distinctive alternative), built-in `mkdocs`/`readthedocs`, JS-native docs.
- The three pillars: **distinctive by default, fast + app-like, private by
  default** (see `WHY_PLAN.md` §1).
- Design language: Glass morphism + NothingOS black canvas + dot-matrix +
  Nothing Red — what it is, where it came from, why it is unique.
- Real working examples (showcase) and honest limitations.

### 3.2 How to use (the journey)
1. **Install** — `pip install mkdocs-neoabs`, requirements, Python/MkDocs versions.
2. **Quick start** — minimal `mkdocs.yml`, `mkdocs serve`, first look.
3. **Model project** — `neoabs new my-docs` scaffolder (CLI from `WHY_PLAN.md` P2).
4. **Everyday workflow** — write markdown, run `mkdocs serve --dirtyreload`,
   preview, deploy.
5. **Deploy** — GitHub Pages (Actions + `mkdocs gh-deploy`), Docker, any static host.

### 3.3 How to configure (the Bible)
- Every `theme.*` key: `name`, `logo`, `favicon`, `language`, `direction`,
  `palette`, `font` (must work — see Audit), `features` (must work — see Audit).
- Every `theme.neoabs.*` key: the full Phase 1 token groups (colors,
  typography, spacing, border_radius, transitions, shadows) + Phase 2 component
  toggles + plugin options (`glass`, `dot_matrix`, `animation`, `border`,
  `highlight`, `notes`, `notes_ttl`).
- Every `extra.*` key: `neoabs_logo_dark/light`, `neoabs_favicon_dark/light`,
  `neoabs_version`, `neoabs_og_image`, `neoabs_theme_color`, custom head/body.
- Plugin block: `plugins: [search, neoabs]`.
- Markdown extensions: the recommended set and what each unlocks
  (admonitions, tabs, superfences/mermaid, highlight, tasklist, arithmatex…).
- Full "kitchen-sink" reference config (mirrors `PLAN.md` "Full Default Config").

### 3.4 Design system
- Colors: tokens, light/dark palettes, Nothing Red accent, contrast rules.
- Typography: Space Grotesk / Space Mono, scale, usage rules, override path.
- Glass: light/medium/heavy, blur/saturation/opacity table (offline caveat:
  `backdrop-filter` browser support).
- Dot-matrix, borders, animations (incl. `prefers-reduced-motion`), shadows,
  radius, spacing.

### 3.5 Components (each page: what → when → markdown → config → screenshot)
admonitions, buttons, cards, classes, code-highlighting, diagrams (mermaid),
forms, images & SVG, math (KaTeX), notes (annotations), shortcuts, tables,
tabs, task-lists, toast, trees.

### 3.6 Features & behavior
- Search (modal, `/`, suggestions, highlighting, deep-link `?q=` when P3 lands).
- SPA navigation & scroll restore; last-page resume; back/forward.
- Service worker caching model (`sw.js`): static, CDN, versioned passthrough.
- TOC tracking, reading progress, back-to-top.
- Repo popover (GitHub info, caching, rate-limit caveats + token option when
  implemented).
- Persistence: tabs active state, task-list state, palette, notes TTL + export.
- Keyboard reference table, keyboard-help modal.
- Accessibility posture + `ACCESSIBILITY.md`.

### 3.7 Plugins & integrations (recipes, proven in CI)
- First-party: `search`, `neoabs`.
- Recommended third-party ("full house" build in CI): `git-revision-date-localized`,
  `glightbox` (or the built-in zoom), `section-index`, `print-site`,
  `table-reader`, `awesome-pages`.

### 3.8 Architecture & internals
- File map (theme vs plugin vs tools), data flow diagram, build pipeline
  (Sass→PostCSS→cssnano), asset versioning (`?v=`), template blocks, init
  registry in `neoabs.js`, config injection (`__config`).

### 3.9 Development & contribution
- Environment setup, `npm run build/dev/start/test`, `ruff`, harnesses
  (popover/toc/search/gate), screenshot generation, clean, release workflow.

### 3.10 Troubleshooting, FAQ, compatibility
- Common issues (fonts, backdrop-filter, GitHub rate limits, service worker
  stale cache, `file://` behavior), each with cause → fix.
- Compatibility matrix: MkDocs 1.5 / 1.6 / 2.0.dev; node version; browsers.
- FAQ; migration guides (from `mkdocs`/`readthedocs`/Material).

### 3.11 Learning curve ("Learn" track)
- **Level 1 — Explorer (30 min):** why + install + quick start + tour.
- **Level 2 — Maker (1–2 h):** write docs, styling, components, deploy.
- **Level 3 — Customizer (half day):** design tokens, component toggles,
  header/footer, custom CSS/JS, pages-level control.
- **Level 4 — Contributor (ongoing):** architecture, dev loop, tests, recipes.

### 3.12 Community
- Showcase, "Powered by NeoAbs" badge, contributing, funding, GitHub Wiki guide.

---

## 4. Target documentation map

Target `nav` for the finished docs site (new/changed pages marked ✚):

```yaml
nav:
  - Home: index.md
  - Why NeoAbs: why-neoabs.md                    ✚
  - Showcase: showcase.md                        ✚
  - Learn: (learning curve track)                ✚
    - Explorer: learn/explorer.md                ✚
    - Maker: learn/maker.md                      ✚
    - Customizer: learn/customizer.md            ✚
    - Contributor: learn/contributor.md          ✚
  - Getting Started:
    - Installation: getting-started/installation.md
    - Quick Start: getting-started.md
    - Configuration: getting-started/configuration.md (generated reference) ✚❄
    - Model Project: getting-started/model-project.md  ✚
  - Design System:
    - Overview: design/overview.md
    - Colors: design/colors.md
    - Typography: design/typography.md
    - Glass Effects: design/glass.md
  - Components: (full inventory §3.5, each with examples)           ❄
  - Features & Behavior: features/index.md                          ✚
    - Search / SPA / Service worker / Repo popover / Persistence ... ✚
  - Plugins & Integrations:
    - NeoAbs Plugin: plugins/neoabs.md
    - Recipes: plugins/integrations.md               ✚
  - Learn & Contribute:
    - Architecture: architecture.md                  ❄
    - Development: development.md                    ❄
    - Contributing: contributing.md                  ✚
    - Testing & Harnesses: testing.md                ✚
  - Reference:
    - Troubleshooting: troubleshooting.md
    - FAQ: faq.md
    - Compatibility: compatibility.md                ✚
    - Migration: migration.md                        ✚
  - Screenshots: screenshots.md
  - Benchmarks: benchmarks.md                        ✚
  - About: about.md
```

❄ = existing page that gets expanded/regenerated; ✚ = new page.

---

## 5. GitHub Wiki plan

**Goal:** a living, community-editable companion that stays in sync with the
canonical docs without duplicating them.

1. **Create/enable the wiki** for `rkriad585/mkdocs-neoabs` (GitHub → Settings →
   Wiki → Enable). Wiki is a separate git repo: `https://github.com/rkriad585/mkdocs-neoabs.wiki.git`.
2. **Seed structure** (mirrors the docs map so navigation is predictable):
   - `Home.md` — entry point, links back to the docs site, "how to use this wiki".
   - `Why-NeoAbs.md` — concise pitch (subset of `docs/why-neoabs.md`).
   - `Quick-Start.md` — copy of the quick start (kept deliberately short).
   - `Configuration-Bible.md` — link-out to the generated site reference + top 20
     keys inline for offline/quick glance.
   - `Recipes.md` — community recipes hub (freshness tracking, lightbox, PDF…).
   - `Release-Notes.md` — curated release highlights (links full `CHANGELOG.md`).
   - `Screenshots.md` — gallery embeds.
   - `Contributing-to-the-Wiki.md` — editing guide (clone, branch, PR).
3. **Sidebar** (`_Sidebar.md`): the 8 wiki pages + prominent "full docs →" link.
4. **Sync automation ("wiki never rots")**: a GitHub Action that pushes the docs
   site's stable pages (e.g. `Quick-Start`, `Why-NeoAbs`) into the wiki repo on
   release; community edits live one-way *beneath* those seeded pages.
5. **Cross-link contract:** every wiki page that duplicates content links to the
   canonical `https://rkriad585.github.io/mkdocs-neoabs/...` page; every docs
   page that has a wiki counterpart mentions it.

---

## 6. Phases

Each phase: **Goal · Why it matters · What ships · Example · Files · Acceptance.**
Phases are ordered so each one leaves the docs *usable* and *self-consistent*.

---

### Phase 1 — Audit & fix the foundation

**Goal.** Make the existing 32 doc pages honest: no broken links, no dead config
talk, no missing screenshots, searchable titles.

**Why it matters.** Everything else builds on a trustworthy base. Broken promises
here are why a first-time reader bounces.

**What ships.**
- `docs/screenshots.md` ↔ disk reconciliation (regenerate or drop the 3 missing).
- Fix `theme.font`/`theme.features` documentation **after** they are wired
  (they currently don't act — see `WHY_PLAN.md` P1); until then, remove them
  from the "Full configuration" example so no one copies a no-op.
- Doc-consistency lint script (`tools/check_docs.py`):
  - every `docs/` link resolves; every referenced screenshot exists;
  - every config key used in the docs exists in the plugin/templates;
  - one H1 per page; no `TODO`/`FIXME`.

```python
# tools/check_docs.py (new, run in CI)
import pathlib, re, sys
ROOT = pathlib.Path(__file__).parent.parent
docs = ROOT / "docs"
md_links = re.compile(r"\]\(([^)]+\.md[^)]*)\)")
missing = []
for page in docs.rglob("*.md"):
    for target in md_links.findall(page.read_text(encoding="utf-8")):
        t = target.split("#")[0].split("?")[0]
        if t and t.endswith(".md") and not (docs / t).exists():
            missing.append(f"{page} -> {t}")
if missing:
    print("\n".join(missing)); sys.exit(1)
print(f"doc link check OK across {len(list(docs.rglob('*.md')))} pages")
```

**Files.** `docs/**`, `tools/check_docs.py`, `.github/workflows/docs.yml`,
`mkdocs.yml` (nav corrections only).

**Acceptance.** All intra-doc links resolve; screenshot contract clean; no doc
talks about a config key the theme ignores; `tools/check_docs.py` passes → wired
into CI.

---

### Phase 2 — Why & onboarding

**Goal.** Within 5 minutes a reader understands *what NeoAbs is, why it exists,
and how to go live*.

**What ships.**
- `docs/why-neoabs.md` (from `WHY_PLAN.md`): three pillars, honest comparison
  table, "maintenance-mode Material → the active alternative" narrative.
- `docs/showcase.md`: gallery of real sites + the Screenshots gallery.
- `docs/getting-started.md` rewrite: minimal config → `mkdocs serve` → tour of
  what each region of the page does.
- `docs/getting-started/model-project.md`: annotated full project layout
  (folder tree, where assets live, how to package).

**Example — quickest possible start:**

```yaml
# mkdocs.yml — the entire config a new site needs
site_name: My Docs
theme:
  name: neoabs
```

```bash
pip install mkdocs-neoabs
mkdocs new my-docs && cd my-docs
# paste the two-line config above
mkdocs serve
```

**Files.** `docs/why-neoabs.md`, `docs/showcase.md`, `docs/getting-started.md`,
`docs/getting-started/model-project.md`.

**Acceptance.** Following the quick start from clean machine → visible site in
under 5 minutes; showcase links resolve; `why-neoabs.md` satisfies an evaluator
with a comparison table and sources (link to `WHY_PLAN.md` §8).

---

### Phase 3 — Configuration Bible

**Goal.** Every configuration key a developer could ever set is documented with
default, purpose, example, and effect — generated, not hand-typed.

**What ships.**
- `tools/emit_config_reference.py` → `docs/getting-started/configuration.md`
  (from `_NEOABS_TOKEN_MAP`, `_neoabs_defaults`, `extra.*`, plugin options).
- Per-key pages (`docs/reference/`) or one generated mega-page with anchor links
  (choose the mega-page + sidebar markers first; split later only if it grows
  past ~600 lines).
- "Kitchen-sink" config example: every option set, commented, that a user can
  copy and bisect.
- Component toggles section (Phase 2 of PLAN.md): each toggle's effect on the
  rendered page, with before/after screenshots.

**Example — the generated table contract:**

```markdown
<!-- auto-generated, do not edit: tools/emit_config_reference.py -->
### `theme.neoabs.colors.primary`

| | |
|---|---|
| Default | `"#ff3030"` |
| CSS variable | `--neoabs-accent` |
| Purpose | Accent color for active states, links, progress |
| Example | `primary: "#00ff88"` |

> Drives `--neoabs-accent`. Generate more at `make docs-config`.
```

**Files.** `tools/emit_config_reference.py`, `docs/getting-started/configuration.md`,
`docs/reference/*` (if split), `mkdocs.yml` nav.

**Acceptance.** Every key in the plugin/templates appears in the reference with a
default; the kitchen-sink config builds clean; reference regenerates
deterministically (CI diff check).

---

### Phase 4 — Design system & components deep-dive

**Goal.** Every design token and every component has a page that shows what it
is, when to use it, how to write it in Markdown, and how it looks.

**What ships.**
- Expand `docs/design/*`: color token table + contrast, the glass table (light/
  medium/heavy: blur, saturation, opacity, browser support), dot-matrix config,
  borders, animations + `prefers-reduced-motion`, shadows, spacing, radius.
- Expand every `docs/components/*` page to a fixed template:

```markdown
# {Component}

## What it is
{1–2 sentences}

## When to use it
{when this element earns its keep, when to avoid it}

## In Markdown
```markdown{...copied so it works out of the box...}
## Configuration
| Key | Default | Effect |
## Live preview / screenshot
![{component}](...)
## Under the hood
{file, class names, data-attributes}
## Accessibility notes
```
- Add missing component pages if any (from §3.5 inventory), each with a
  `screenshots_gen.py` entry so the gallery covers it.

**Files.** `docs/design/*`, `docs/components/*`, `tools/screenshots_gen.py`,
`Screenshots/*`.

**Acceptance.** Every §3.5 component exists with the 7-section template filled;
component screenshots exist and are referenced; design table contents match SCSS
source (spot-checked in CI).

---

### Phase 5 — Theme behavior & features

**Goal.** Document the interactive behavior that makes NeoAbs feel like an app,
including what happens offline and without JS.

**What ships.**
- `docs/features/index.md` + sub-pages: search, SPA navigation & scroll restore,
  service worker & caching (diagram of `sw.js` strategy), repo popover (fields,
  caching, rate limits; token option when shipped), persistence (tabs, task
  lists, palette, notes export), keyboard reference, reading progress, TOC
  tracking, a11y summary linking `ACCESSIBILITY.md`.
- Graceful-degradation table: for each feature — *no-JS*, *offline*, *reduced
  motion*, *no `backdrop-filter`* — what the user still gets.

**Example — service worker page skeleton:**

```markdown
# Service worker & offline

- **File:** `neoabs/templates/sw.js`
- **Caches:** `neoabs-static-v3` (same-origin assets, stale-while-revalidate),
  `neoabs-cdn-v3` (fonts/CDN, cache-first).
- **Versioned URLs** (`?v=N`) pass through to the browser HTTP cache — that is
  how new releases bypass stale SW copies (see asset versioning).
- **Offline behavior:** a cached page still opens; search index is *not* cached
  by the SW by design (MkDocs worker owns it).

| Scenario | What works |
|---|---|
| Online | everything |
| Offline, previously visited | page renders from cache; CDN assets hit `neoabs-cdn-v3` |
| Offline, never visited | fallback? currently no — document and decide (P8) |
```

**Files.** `docs/features/**`, `mkdocs.yml` nav.

**Acceptance.** Every feature has a page; behavior matches the code (verified by
the existing harnesses referenced from the docs); degradation table is filled.

---

### Phase 6 — Developer docs & learning curve

**Goal.** Someone can go from reader to contributor with a guided path, and every
"learning level" has a concrete tutorial.

**What ships.**
- `docs/architecture.md` expansion: file map, data flow, build pipeline, asset
  versioning, `__config` injection, init registry, theme vs plugin boundaries.
- `docs/development.md` expansion: env setup, commands, lint/format, testing
  (`npm test`), the scratch harnesses (popover/toc/search/gate), screenshot
  generation, clean, release.
- NEW `docs/contributing.md`: issue labels, first-issue path, PR checklist,
  testing expectations, docs-pr etiquette (screenshots required).
- NEW `docs/testing.md`: what each test covers + how to add one.
- NEW `docs/learn/*` — the four-level learning curve (§3.11), each level ending
  in a "verify you got it" checklist tied to the model project.

**Example — Level checkpoints:**

```markdown
### Level 2 — Maker ✅ you have:
- [ ] a live site at `mkdocs serve`
- [ ] a component page using admonitions, tabs, and task lists
- [ ] changed one design token and seen it apply
- [ ] deployed to GitHub Pages once
```

**Files.** `docs/architecture.md`, `docs/development.md`, `docs/contributing.md`,
`docs/testing.md`, `docs/learn/**`, `CONTRIBUTING.md` (cross-link only).

**Acceptance.** A first-time contributor completes the Contributor level with
only these docs open; every command cited runs on a fresh clone.

---

### Phase 7 — GitHub Wiki

**Goal.** Legacy-visible, community-editable companion that stays truthful.

**What ships.**
- Enable + seed the wiki per §5; `_Sidebar.md`, `Home.md`, `Why-NeoAbs.md`,
  `Quick-Start.md`, `Configuration-Bible.md`, `Recipes.md`, `Release-Notes.md`,
  `Screenshots.md`, `Contributing-to-the-Wiki.md`.
- GitHub Action (`tools/wiki_sync/`) pushing the seed pages on release.
- `docs/contributing.md` section "Contributing to the Wiki".

**Example — wiki Home.md:**

```markdown
# mkdocs-neoabs wiki

Everything quick about NeoAbs. Full canonical docs live at
**[https://rkriad585.github.io/mkdocs-neoabs/](https://rkriad585.github.io/mkdocs-neoabs/)**.

- [Why NeoAbs](Why-NeoAbs)
- [Quick Start](Quick-Start)
- [Configuration Bible](Configuration-Bible)
- [Recipes](Recipes)
- [Release Notes](Release-Notes)
- [Screenshots](Screenshots)
- [Contribute to this wiki](Contributing-to-the-Wiki)
```

**Files.** wiki repo, `.github/workflows/wiki-sync.yml`, `tools/wiki_sync/`, `docs/contributing.md`.

**Acceptance.** Wiki accessible at `github.com/rkriad585/mkdocs-neoabs/wiki`;
every page links back to canonical docs; sync Action runs green on tag.

---

### Phase 8 — Quality, CI & maintenance

**Goal.** The docs stay correct forever with zero manual effort.

**What ships.**
- CI jobs: `tools/check_docs.py` (links/screenshots/H1), config-reference diff,
  docs-examples build (each snippet), screenshot regeneration on demand.
- Search-index freshness: search plugin runs in the docs build (already active);
  newly added pages indexed automatically.
- Release notes ↔ `CHANGELOG.md` alignment: every tagged release updates
  `docs/` "Release notes" fragment and wiki `Release-Notes.md`.
- i18n/translation readiness: structure the string inventory
  (`docs/translating.md`) so future locales reuse one mechanism (`WHY_PLAN.md`).
- RSS/sitemap/llms.txt wiring to match `WHY_PLAN.md` P4.

**Files.** `.github/workflows/*`, `tools/check_docs.py`, `docs/translating.md`,
`docs/` release fragments.

**Acceptance.** `git push` → CI green proves docs health; a release automatically
syncs wiki + changelog; search covers new pages without manual steps.

---

## 7. Definition of done

`DOCS_WIKI_PLAN.md` is complete when:

1. **Nothing in §3 is undocumented** — every inventory item maps to a page.
2. **Generated reference is canonical** — no hand-maintained config duplication.
3. **Every example is tested** in a CI project; no snippet rots.
4. **Screenshots exist for every visual claim** (incl. the 3 missing files).
5. **Learning curve is real** — four levels with checkpoints, each completable
   using only the docs.
6. **Wiki is alive** — seeded, linked, auto-synced, and invites contribution.
7. **CI owns the quality** — link checks, reference diff, example builds, and
   screenshot checks all fail the build on drift.
8. **Mandatory Working Rules (PLAN.md)** respected in every phase — no deletions,
   no typos, no out-of-scope edits, nothing half-shipped.

---

## 8. Risks & constraints

| Risk | Mitigation |
|---|---|
| Docs drift from code | Generated reference + CI diff; expand only via `tools/emit_config_reference.py` |
| Wiki goes stale | Release-sync Action; seed pages are the only duplicated content and are one-way pushed |
| Screenshots rot | Regenerate via `screenshots_gen.py`; `check_docs.py` fails on missing files |
| Snippets rot | `tests/docs-examples/` builds every snippet in CI |
| Maintenance-mode Material comparisons age | Date + source every comparison (see `WHY_PLAN.md` §8); keep table small and updatable |
| MkDocs 2.0 changes page/plugin APIs | Compatibility page + CI matrix (1.5/1.6/2.0.dev) dedicated to docs accuracy |

---

*DOCS_WIKI_PLAN.md — documentation + wiki roadmap. Update §4 (map) and §3
(inventory) the day a page ships; keep the plan honest like the docs it plans.*