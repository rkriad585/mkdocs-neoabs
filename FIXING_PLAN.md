# NeoAbs — Fixing Plan (Consolidated Audit)

**Project:** `mkdocs-neoabs` — MkDocs theme ("Glass + NothingOS" design)
**Version:** 0.1.0 (alpha) · Python ≥3.8 · MkDocs ≥1.5 · Node ≥18
**Audit date:** 2026-09-04
**Method:** 5-round audit (full source read → research → code audit → bug-finding → UI/UX), with independent verification of every high-impact claim against the actual source and live builds. False positives were explicitly rejected (see §7).

---

## 1. Executive Summary

NeoAbs is a promising, feature-rich theme, but it is an alpha with **several build-breaking and config-ignoring defects** that will surface the moment a user steps outside the exact setup of the bundled `mkdocs.yml`. The most severe issues are structural (theme config nesting, an unguarded Jinja `now()` call, a broken `base` fallback), followed by a set of **themed configuration options that are documented but never implemented** (glass intensity, dot matrix, animation, border), and a cluster of **accessibility and UX** issues that contradict the project's own `ACCESSIBILITY.md` claims.

Nothing here requires a redesign — every issue has a concrete, localized fix. Priority ordering and dependencies are in §5.

### Top 3 must-fix first
1. **`mkdocs_theme.yml` nests everything under a `theme:` key** → `404.html` is never built and theme `favicon`/`language` are never registered as theme variables.
2. **`footer.html` calls `now()`**, a Jinja global MkDocs does not provide → the **entire build crashes** on any site that does not set `copyright`.
3. **Most `neoabs.*` config options are no-ops** — `glass`, `dot_matrix`, `animation`, and `border` are documented, defaulted by the plugin, but never consumed anywhere in templates or CSS.

---

## 2. Issues by Category (with severity)

### 2.1 Build / Structural (Highest impact)

| ID | Severity | Issue | Affected file:line |
|----|----------|-------|--------------------|
| B1 | **Critical** | `mkdocs_theme.yml` nests everything under `theme:`. MkDocs expects a **flat** mapping; the nested key means `static_templates` is never read → **404.html is not built** (verified: build output shows `Theme.static_templates == {'sitemap.xml'}` only, and `theme` var holds the whole nested dict so theme `favicon`/`language` are not registered either). | `neoabs/templates/mkdocs_theme.yml:2-7` |
| B2 | **Critical** | `footer.html:37` `{{ now().strftime("%Y") }}` runs when `config.copyright` is unset. MkDocs does not register a `now` Jinja global or `strftime` filter. **Verified:** a site without `copyright` fails the whole build with `jinja2.exceptions.UndefinedError: 'now' is undefined`. The repo masks this only because its own `mkdocs.yml` sets `copyright`. | `neoabs/templates/partials/footer.html:37` |
| B3 | **High** | Search `base` uses `config.site_url | default(config.docs_dir, true) | url`. When `site_url` is unset (common for `mkdocs build`/`serve`), the fallback is an **absolute filesystem path** whose drive letter parses as a URL scheme; search resolves result URLs against a bogus base. When `site_url` IS set it hard-codes the published domain. Should use MkDocs' `base_url` context variable. | `neoabs/templates/base.html:137,141` |
| B4 | **Medium** | Nav renders only **2 levels**; a section with grandchildren flattens them and drops deeper pages, and a pure section (no page) renders a dead `href="."`. Latent because the repo nav is only 2 levels; any 3-level nav silently loses pages. | `neoabs/templates/partials/nav.html:1-31` |

### 2.2 Theme Config is a no-op (documented but never implemented)

`neoabs_plugin.py` supplies defaults for these but the **plugin never reads them** to emit template attributes/data attributes, and no CSS keys off them. All four are dead (verified via grep: no template writes `data-md-neoabs-glass`, no `.neoabs-dot-matrix` element exists, no CSS uses `animation`/`border` config).

| ID | Severity | Issue | Affected |
|----|----------|-------|----------|
| C1 | **High** | `neoabs.glass` (`light`/`medium`/`heavy`) has **no effect**. CSS variants fire only on `[data-md-neoabs-glass=…]`, which no template sets; the attribute is only *read* in JS from localStorage (`applyGlassIntensity`) or an existing attribute — neither exists on first load, so `.glass` always uses the `:root` medium tokens. | `neoabs_plugin.py:18-23,30-35`; `neoabs.scss:129-167`; `neoabs.js:56-62` |
| C2 | **High** | `neoabs.dot_matrix` is a no-op. `.neoabs-dot-matrix` CSS (and its `neoabs-dot-pulse` keyframe) exists but **no template renders the element**. | `neoabs.scss:204-216,398-405`; no template |
| C3 | **High** | `neoabs.animation` and `neoabs.border` are no-ops. `animation: none` should disable animations (only `prefers-reduced-motion` disables them) and `border: thick/none` changes nothing. | `mkdocs.yml:39-40`; `neoabs_plugin.py:21-22,37,40` |
| C4 | **Low** | `.neoabs-task-list` CSS is dead; the real class MkDocs+`pymdownx.tasklist` outputs is `task-list` (styling also exists at `components.scss:2621`). | `components.scss:676-714` |

### 2.3 JavaScript (FOUC, search, focus)

| ID | Severity | Issue | Affected file:line |
|----|----------|-------|--------------------|
| J1 | **High** | Anti-FOUC script `JSON.parse`s a **plain string** from localStorage. `storageSet` (`neoabs.js:18-20`) writes `"default"`/`"slate"` un-escaped; `partials/javascripts/palette.html:5` does `JSON.parse(…)` → `SyntaxError`, silently swallowed → FOUC prevention **never works**. A saved light-mode user still gets a dark flash (base.html hard-codes `data-md-color-scheme="slate"`) until JS runs. | `partials/javascripts/palette.html:5`; `neoabs.js:18-20,47,85` |
| J2 | **Medium** | Homepage search result renders `href="#"` — `doc.location` is `""` for the homepage in the index, which is falsy in the `location ? … : "#"` ternary, so the most-relevant result is a dead link. | `neoabs.js:299` |
| J3 | **Medium** | No focus restore on search close; no focus trap while open. `aria-modal=true` promises inert background but Tab escapes into it; on close focus is lost to `body`. | `neoabs.js:184-207`; `partials/search.html:1` |
| J4 | **Medium** | Search index fetch / copy failures are silently swallowed (no user feedback). | `neoabs.js:235`, `neoabs.js:531-532` |
| J5 | **Medium** | Anchor/TOC smooth scroll uses `block:"start"` with **no offset** for the fixed header (~56px) → target heading lands behind the header. | `neoabs.js:566` |
| J6 | **Medium** | Anchor links use `history.pushState` but there is **no `popstate` listener**, so the browser Back button does not restore the previous in-page scroll/TOC highlight. | `neoabs.js:557-568` |
| J7 | **Low** | "Start typing to search..." and the no-results reset string are hard-coded English, not translatable. | `neoabs.js:204-205,244` |
| J8 | **Low** | Keyboard shortcuts modal (`?`) is undiscoverable — no visible hint/tooltip. | `neoabs.js:640-685` |
| J9 | **Low** | TOC `scrollIntoView({behavior:"smooth"})` on intersection can stutter when several headings enter in quick succession. | `neoabs.js:392` |
| — | (checked) | `searchDebounce` TDZ, escape-key handling, copy-button duplication guard, palette toggle, and `initAnchorLinks` on page links were all **verified correct / no bug**. | — |

### 2.4 Accessibility (contradicts `ACCESSIBILITY.md`)

| ID | Severity | Issue | Affected file:line |
|----|----------|-------|--------------------|
| A1 | **High** | `--neoabs-text-muted` fails WCAG AA in both modes: dark `#555` on black ≈ 3.3:1, light `#aaa` on white ≈ 2.3:1. Used by real text: TOC links, nav section titles, captions, footer labels, search meta, breadcrumbs. **Highest-impact a11y issue.** | `neoabs.scss:25,107`; consumers in `components.scss` |
| A2 | **High** | Primary button text: white on `--neoabs-accent` (`#ff3030`) ≈ 3.6:1 — fails AA for its 12px buttons; same for `.neoabs-error__action`. | `components.scss:272-281,2864` |
| A3 | **High** | Header drawer/search toggles are `<label role="button" tabindex="0">` — focusable but **Enter/Space do nothing** (not keyboard-activatable). | `partials/header.html:20,31` |
| A4 | **High** | Skip link targets `main#neoabs-content` which is **not focusable** (no `tabindex="-1"`), so the skip link scrolls but keyboard focus stays put — a no-op for AT users. | `base.html:88,104` |
| A5 | **Medium** | Search dialog `aria-hidden="true"` is hard-coded; the CSS-only `#neoabs-search:checked ~ .neoabs-search` path reveals it without JS, so a *visible* open dialog is announced as hidden to screen readers. | `partials/search.html:1`; `components.scss:3065` |
| A6 | **Medium** | `autofocus` on the search input inside a hidden dialog can steal focus at load and break the skip-link flow. | `partials/search.html:10` |
| A7 | **Medium** | Header search toggle has no visible focus indicator (hamburger does; search toggle only sets `cursor:pointer`). | `components.scss:284-286` |
| A8 | **Medium** | Page `<title>` uses `config.site_name` alone when no `page.meta.title` → non-unique titles. Should fall back to `page.title`. | `base.html:36-44` |
| A9 | **Low** | TOC "On this page" title is a `<p>`, not a heading — not reachable via heading navigation. | `partials/toc.html:20` |
| A10 | **Low** | `prefers-reduced-motion` uses `0.01ms` (acceptable pragmatic choice — not a required fix; keep). | `neoabs.scss:193-198` |

### 2.5 CSS / Layout / Visual

| ID | Severity | Issue | Affected file:line |
|----|----------|-------|--------------------|
| S1 | **Medium** | Footer misaligns on ≥1400px: nav widens to 320px (`components.scss:42-46`, main margin 320px) but footer keeps hardcoded 280px `margin-left` → 40px shift. | `components.scss:984` |
| S2 | **Medium** | Light-mode header reflection `::after` is white-on-white → invisible. Dark-mode equivalent works. | `components.scss:103-111` |
| S3 | **Low** | `.codehilite` background uses `!important`, silently blocking user overrides via `extra_css` (docs invite overriding tokens). | `components.scss:2405,2411,2422` |
| S4 | **Low** | Font loading (`display=swap`) causes CLS because fallbacks are metrically incompatible — inherent to swap; optional `@font-face` metric overrides. | `base.html:59`; `neoabs.scss:51-53` |
| S5 | **Low** | `--neoabs-canvas` token defined (dark `#fff`, light `#000`) but **never referenced** — dead. Note also its value is semantically inverted (canvas should be the background, `ink` the text; here `ink` is the background). | `neoabs.scss:17-18,100-107` |
| S6 | **Low** | `--neoabs-accent-strong` referenced for button hover (`components.scss:278-279`) but never defined — fallback makes hover identical to resting state (no visual feedback). | `components.scss:277-280` |

### 2.6 Documentation ↔ Implementation mismatch

| ID | Severity | Issue | Affected |
|----|----------|-------|----------|
| D1 | **Medium** | README says Python 3.8+, `docs/getting-started/installation.md` says 3.9+; `pyproject.toml` `requires-python >=3.8`. Contradiction. | `README.md`; `docs/getting-started/installation.md` |
| D2 | **Medium** | `docs/design/glass.md` glass values (light 6px/1.2, medium 12px/1.4, heavy 20px/1.6) contradict actual SCSS (light 10px/1.0, medium 20px/1.2, heavy 30px/1.4) and contradict `configuration.md:89-93` (which matches SCSS). | `docs/design/glass.md` |
| D3 | **Medium** | Docs reference classes that don't exist: `.glass`, `.glass-light/medium/heavy`, `.label`, `.code-block`, `--neoabs-tracking-*`, `--neoabs-text-*`, `--neoabs-ink-muted`. Actual theme uses `.neoabs-glass`, `.neoabs-label`. | various `docs/**` |
| D4 | **Low** | Naming inconsistency: docs examples use `.neoabs-btn`, theme uses `.neoabs-button`. | docs buttons examples |
| D5 | **Low** | `mkdocs.yml` nav has duplicate "Getting Started" (a section header and a child page with the same title). | `mkdocs.yml:67,70` |

### 2.7 Packaging / Dead code / Dependencies

| ID | Severity | Issue | Affected |
|----|----------|-------|----------|
| P1 | **High** | Packaging verified: **`.scss` source files are shipped in the wheel/site** (`assets/stylesheets/neoabs.scss`, `components.scss` are copied verbatim into the built site). These are build artifacts that should not be published. (See §6.) | `pyproject.toml` `[tool.hatch.build.targets.wheel] include = ["/neoabs"]` |
| P2 | **Medium** | Empty placeholder packages `neoabs/extensions/` and `neoabs/utilities/` ship in the wheel (dead code); orphaned root `.gitkeep`; `.gitmodules` contains only a TODO comment. | repo root, `neoabs/` |
| P3 | **Medium** | `neoabs/templates/__init__.py:25-31` `is_mkdocs()` is pointless/misleading dead code; `mkdocs.version_tuple` does **not exist** so the warning block at `:36-38` is dead, and the warning logic is effectively inverted/unconditional. | `neoabs/templates/__init__.py` |
| P4 | **Low** | `cssnano` pinned to `5.1.0` (~3 yrs old; 6.x/7.x available); mixed pinning policy (caret vs exact). | `package.json` |
| P5 | **Low** | `neoabs_plugin.py:10` `config.get("theme", {})` + mutation of the returned dict assumes `config["theme"]` is a plain dict (it is a `Theme` object); the copy-back at `:36` is fragile. | `neoabs/plugins/neoabs_plugin.py` |

---

## 3. Root-Cause Analysis (shared themes across findings)

1. **Theme config shape.** The single most damaging defect is `mkdocs_theme.yml` being non-flat (B1). It silently breaks static templates and theme-var registration, and its symptom (no 404 page) is easy to miss because builds succeed.
2. **Config options declared but never wired.** The plugin defaulting `neoabs.*` without any consumer (C1-C3) gives a false impression the options work. This is a pervasive design gap rather than a one-off typo.
3. **Under-provisioned Jinja environment.** The theme assumes globals/filters (`now`, `strftime`) that MkDocs does not provide (B2) and assumes `config.site_url` is always set (B3) — it isn't under `serve`/bare `build`.
4. **A11y implemented by convention, not enforcement.** `ACCESSIBILITY.md` documents strong standards, but key controls (A3/A4) and color tokens (A1/A2) fall short; several issues are classic label/role/aria traps.
5. **Storage format mismatch (FOUC).** The inline FOUC script and the main JS disagree on whether the scheme value is JSON; the inline one is wrong (J1).

---

## 4. Recommended Solutions & Code Examples

### B1 — Flatten `mkdocs_theme.yml`
Replace the nested structure with a flat mapping (the way MkDocs/mkdocs-material structure it):
```yaml
# MkDocs theme configuration (flat, as MkDocs expects)
static_templates:
  - 404.html
favicon: assets/images/favicon.svg
language: en
```
Then confirm: `Theme.static_templates` includes `404.html`, `favicon`/`language` appear as theme vars, and a build emits `site/404.html`. (Move the earlier `name: neoabs` handling out — the package entry point already declares `neoabs = "neoabs.templates"`.)

### B2 — Remove `now()` from the footer
Use the year from Python via the plugin/`config`, or eliminate the fallback:
`partials/footer.html`:
```html
<div class="neoabs-footer__copyright">
  {{ config.copyright | default("© " ~ config.site_name) }}
</div>
```
(To show a dynamic year, compute `datetime.now().year` in `on_config` and inject it as `config.extra["neoabs_copyright_year"]`.)

### B3 — Use MkDocs' `base_url` for search base
`base.html:137,141` — replace the `docs_dir` fallback:
```html
var base_url = "{{ base_url }}";
"base": "{{ base_url }}",
```
`base_url` is the normalized site root MkDocs already computes, correct for both `serve` and GitHub Pages subpaths.

### C1–C3 — Wire `neoabs.*` config to the output
Two options; the simplest is to have the plugin emit the HTML attribute so CSS already handles the rest:
```python
# neoabs_plugin.py on_config
glass = config["theme"]["neoabs"]["glass"]          # 'light'|'medium'|'heavy'
config.setdefault("extra", {})["neoabs_glass"] = glass
config["extra"]["neoabs_dot_matrix"] = config["theme"]["neoabs"]["dot_matrix"]
config["extra"]["neoabs_border"] = config["theme"]["neoabs"]["border"]
config["extra"]["neoabs_animation"] = config["theme"]["neoabs"]["animation"]
```
Then in `base.html` set them on `<html>`/`<body>` and add the dot-matrix element:
```html
<html ... data-md-neoabs-glass="{{ config.extra.neoabs_glass }}">
<body class="{% if config.extra.neoabs_border == 'thick' %}neoabs-border--thick{% endif %}">
  {% if config.extra.neoabs_dot_matrix %}<div class="neoabs-dot-matrix" aria-hidden="true"></div>{% endif %}
```
And add `[data-neoabs-animation="none"] * { animation: none !important; transition: none !important; }` plus matching `--neoabs-border-width` variants. (Whichever mechanism is chosen must be applied consistently so the documented options actually take effect.)

### J1 — Fix the FOUC read/write mismatch
Make the inline script read the plain string (no JSON), OR store JSON. Simplest is to align on a plain string:
```html
<script>
(function () {
  try {
    var u = localStorage.getItem("neoabs-color-scheme");
    if (u) document.documentElement.setAttribute("data-md-color-scheme", u);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches)
      document.documentElement.setAttribute("data-md-color-scheme", "default");
  } catch (e) {}
})();
</script>
```

### A1 — Fix muted-text contrast
`neoabs.scss`: dark `--neoabs-text-muted: #888` (≈5.3:1 on black); light `#767676` (exactly 4.5:1 on white → passes AA).

### A2 — Fix primary button contrast
Darken accent for button background, or add a token: `background: #d42020` (≈4.6:1) pass AA. Also fix `.neoabs-error__action:2864`.

### A3 — Keyboard-activatable toggles
Replace `<label role="button">` with real `<button type="button">` styled identically, wired to the checkbox via the existing `_neoabsToggle()`/`_neoabsOpen/_neoabsClose` hooks (`neoabs.js:154,362-363`).

### A4 — Focusable skip target
Add `tabindex="-1"` to `main#neoabs-content` (`base.html:104`).

### J3/A5 — Modal focus + aria consistency
- Remove hard-coded `aria-hidden` from `search.html:1`; drive it (plus `inert`) from JS on open/close, and from the CSS-only `:checked` path consistently.
- Save `document.activeElement` on open; restore on close.
- Trap Tab/Shift+Tab within the dialog while open.

### S1 — Footer 1400px alignment
```scss
@media (min-width: 1400px) {
  .neoabs-footer { margin-left: 320px; }
}
```
(match `$neoabs-sidebar-width` change under the same breakpoint).

### S2 — Visible light-mode header reflection
In `[data-md-color-scheme="default"] .neoabs-header::after`, use a dark low-alpha gradient (`rgba(0,0,0,.06→.1)`) instead of white-on-white.

### B4 — Native 3-level nav recusion
Make `render_nav_item` recurse into children (with an expandable toggle) for any depth, mirroring how MkDocs exposes `nav_item.children`; for a pure section (no page) render a non-link group header instead of `<a href=".">`.

### D1/D2/D3/D4 — Align docs with implementation
- Unify the Python requirement (pick `>=3.8` to match `pyproject.toml`).
- Fix `docs/design/glass.md` values to match the actual `neoabs.scss` tokens (light 10px/1.0, medium 20px/1.2, heavy 30px/1.4) and `configuration.md`.
- Replace non-existent classes/tokens in docs with the real ones (`.neoabs-glass`, `.neoabs-label`) or mark them spec-vs-implemented.

### P1 — Don't ship SCSS sources
Adjust the wheel/site include to publish only compiled CSS (`assets/neoabs.css`) plus the JS/images, or add the `stylesheets/` `.scss` to the exclusion list. Verify with a `pip show -f`/unzip listing and a `site/` build that no `.scss` appears.

### P2/P3 — Remove dead code
Remove `neoabs/extensions/` and `neoabs/utilities/` placeholder packages, the orphaned root `.gitkeep`, the TODO-only `.gitmodules`, the pointless `is_mkdocs()`, and the dead `mkdocs.version_tuple` warning block.

### P4 — Dependency hygiene
Bump `cssnano` to current (6.x/7.x), normalize pinning policy, add `main`/`bin` to `package.json` if it is intended to be an npm-consumable package.

---

## 5. Fix Dependencies & Implementation Order

### Dependencies
- **B1 must precede any 404-page work** (404 cannot render until `static_templates` is read).
- **A4 depends on B1/B2** only in that the 404 template shares `base.html`; fixing the skip target benefits both.
- **C1–C3 share one mechanism** (plugin emits attributes + template injection) — do as one unit.
- **J1 and J2 are self-contained** JS fixes; **J3/A5 are related** (modal focus + aria) — do together.
- **A1/A2/S2 are all token/CSS edits** in the same files — batch them.
- **B3 and P1 are packaging/build-level** — verify together with a fresh build.

### Recommended order
1. **Phase 1 — Build integrity (critical, unblocks everything):** B1, B2, B3 → verify with a bare `mkdocs build` (no `copyright`, no `site_url`) succeeds.
2. **Phase 2 — Theme config correctness:** C1–C3 (one mechanism), C4, B4.
3. **Phase 3 — JS behavior + FOUC:** J1, J2, J3/A5, J4, J5, J6, J7–J9.
4. **Phase 4 — Accessibility:** A1, A2, A3, A4, A6, A7, A8, A9.
5. **Phase 5 — CSS/layout/visual:** S1, S2, S5, S6, S3.
6. **Phase 6 — Docs & packaging hygiene:** D1–D5, P1, P2–P3, P4. (P1/P2/P3 are independent and can run in parallel with other phases.)

---

## 6. Verification Checklist

Run each check after the associated phase:

- [ ] `python -c "from mkdocs.theme import Theme; print(sorted(Theme(name='neoabs').static_templates))"` → includes `404.html` (B1).
- [ ] Build with **no** `copyright` and **no** `site_url` in `mkdocs.yml` → succeeds, no `'now' is undefined`, search `base` is a sane relative path (B2, B3).
- [ ] `site/404.html` exists after build (B1).
- [ ] Page with a 3-level nav renders all levels; pure sections render as non-link group headers, no `href="."` (B4).
- [ ] Set `neoabs.glass: heavy`, `neoabs.dot_matrix: false` (and `true`), `neoabs.animation: none`, `neoabs.border: thick` → each visibly changes output (C1–C3).
- [ ] Save light scheme, reload → **no** dark flash (J1).
- [ ] Search: homepage result navigates (not `#`); index-load failure shows an error message; focus returns to trigger after close; Tab stays trapped while open (J2, J3, J4).
- [ ] `document.activeElement` after closing search/drawer returns to the trigger (J3, M2).
- [ ] Skip link: after activating, focus is on `#neoabs-content`; next Tab continues from content, not the top (A4).
- [ ] Header hamburger and search toggles activate via Enter **and** Space (A3).
- [ ] Contrast: `--neoabs-text-muted` ≥ 4.5:1 in both modes; primary button text ≥ 4.5:1 (A1, A2).
- [ ] Open the search dialog without JS and confirm it is not announced `aria-hidden` while visible (A5); confirm no `autofocus` steal (A6).
- [ ] At ≥1400px the footer prev/next aligns with the content column (S1).
- [ ] Light-mode header reflection is visible (S2).
- [ ] `pip wheel`/unzip listing contains **no** `.scss`; the built `site/assets` has only compiled CSS (P1).
- [ ] `npm run build` (SCSS→CSS) passes with updated cssnano (P4).
- [ ] Docs match implementation (D1–D4); no duplicate nav labels (D5).

---

## 7. Audit Rigor — Rejected/False-Positive Findings

These came up during the audit but were **verified as NOT bugs** and intentionally excluded:

- **"Search/Progress/TOC permanently hidden by `display:none!important`"**: the grouped `display:none !important` (`components.scss:2215-2225`) sits inside `@media print` — it only hides these controls when printing. The `neoabs-toc` `display:none` at `components.scss:877` is the intended responsive behavior (hide TOC on narrow screens). Not a bug.
- **`searchDebounce` temporal-dead-zone**: the `let` declaration and all invocations live inside `initSearch`; `closeSearch` is only ever invoked after `initSearch` completes synchronously, so no TDZ exception occurs.
- **Palette toggle / copy-button guard / Escape-key handling / directive that `initAnchorLinks` breaks footer prev-next links**: all verified working (footer links are page URLs, not `^#`).
- **`.scss shipped` claim detail**: verified independently by listing `site/assets` (the `.scss` files are copied into the site); this is a real packaging issue (P1), but the earlier framing as a wheel-only problem was corrected to "both wheel and site".
- **Minimal-build "no index.html"**: reproduced failure traced to a test-harness path error (missing `docs/index.md`), **not** a theme defect — the repo's own build produces all pages correctly.

---

## 8. Risks & Notes

- **B1 fix** changes built output (adds `404.html`, registers favicon/language). Low risk, high reward — but verify the 404 template renders cleanly with `page=None` (the `page.*` refs resolve to empty Jinja Undefined, not a crash).
- **C1–C3 implementation** is the largest code change; keep the mechanism central (plugin + template) so it is testable and consistent.
- Replacing the `<label role="button">` toggles (A3) is a DOM change; confirm the CSS checkbox-state selectors (`#neoabs-drawer:checked ~ …`) still apply with a button-backed toggle.
- **A1/A2 token changes** are user-visible but strictly improve readability; no layout risk.
- Bumping **cssnano** (P4) may alter minified output whitespace only; re-run the screenshot/visual check (`tools/screenshots_gen.py`) to confirm no regressions.
