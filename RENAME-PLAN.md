# RENAME-PLAN: `mkdocs-neoabs` → `mkdocs-void`

Full rename + rebrand execution plan. Write the plan with code examples first
(this file), then execute it in ordered, independently-verifiable steps. Do
**not** start any step until the previous one is green.

---

## 1. Objective

Turn `mkdocs-neoabs` (Glass + NothingOS theme) into **`mkdocs-void`** end-to-end:

1. Rename the GitHub repo `rkriad585/mkdocs-neoabs` → `rkriad585/mkdocs-void`
   via the `gh` CLI.
2. Update the entry on `https://github.com/rkriad585/catalog` and open a PR
   (this is a best-of list driven by `projects.yaml`; `mkdocs-neoabs` is not in
   it yet, so the PR **adds** the renamed project as a new entry).
3. A single automated Python script renames every occurrence across the
   project. Test it on examples **before** applying it for real.
4. Replace all `Phase N:` comments with clean, phase-free py-docs that describe
   what the target function/line/variable actually does (comments only; no
   logic changes).
5. Clean up branding: rewrite the "Material\*-\*" watermark / comparison text
   and flip every "mkdocs-neoabs contributors" credit to "rkriad585
   contributors".
6. Swap in the new logos/icon/favicon from `./void-logos` and delete the old
   `logo/` folder.

**Scope guard (non-negotiable):** the local **root project folder name is never
touched** — the working directory keeps the name `mkdocs-neoabs` on disk. The
rename applies to (a) the GitHub repo name, (b) the contents of the checkout,
(c) the internal Python package `neoabs/` → `void/`, and (d) every string
inside the files. Renaming the top-level directory is **out of scope** at every
step, including the tool below.

Version bump: `NEOABS_VERSION` v23 → v24 is a core-ID change
(`neoabs` theme ID → `void`) that users opt into by editing their `mkdocs.yml`
anyway, so it stays a regular tag. Bump version files only if released.

---

## 2. The renames (canonical token table)

| Token | Replace with | Scope |
|---|---|---|
| `mkdocs-neoabs` | `mkdocs-void` | repo/package/project name, URLs |
| `mkdocs_neoabs` | `mkdocs_void` | import paths (`import mkdocs_void`) |
| `MkDocs-neoabs` / `Mkdocs-neoabs` / `NeoAbs` | `MkDocs-void` / `Mkdocs-void` / `Void` | human-readable brand |
| `neoabs` | `void` | package dir, Python module names, plugin class, constants, CSS classes, `data-md-neoabs-*` attrs, `#__config` keys, CLI, theme ID |
| `NEOABS` | `VOID` | uppercase constants (`_NEOABS_*` → `_VOID_*`, `NEOABS_VERSION`, `NEOABS DESIGN TOKENS`) |
| `ghcr.io/rkriad585/mkdocs-neoabs` | `ghcr.io/rkriad585/mkdocs-void` | container image |
| `rkriad585.github.io/mkdocs-neoabs` | `rkriad585.github.io/mkdocs-void` | docs site URL |

Because `neoabs` → `void` is a strict substring mapping, plain token
replacement handles all of the above. Ordered replacement is:

1. `mkdocs_neoabs` → `mkdocs_void`
2. `mkdocs-neoabs` → `mkdocs-void`
3. `NeoAbs` → `Void`
4. `NEOABS` → `VOID`
5. `neoabs` → `void` (last — also fixes leftover CSS/JS/attr spellings)

**Example (input → output):**

```
# input  neoabs/plugins/neoabs_plugin.py
_NEOABS_DEFAULT_COMPONENTS  ->  _VOID_DEFAULT_COMPONENTS
class NeoAbsPlugin          ->  class VoidPlugin

# input  mkdocs.yml
theme: { name: neoabs }     ->  theme: { name: void }
- neoabs:                   ->  - void:

# input  css
html[data-md-neoabs-reading="active"]  ->  html[data-md-void-reading="active"]
.neoabs-article                         ->  .void-article

# input  js
var NEOABS_VERSION = "23"  ->  var VOID_VERSION = "24"
console.info("[neoabs] ...") -> console.info("[void] ...")
```

---

## 3. The automated rename tool

Save to **`tools/rename_to_void.py`**. Design goals:

- deterministic, idempotent (re-running is a no-op),
- **dry-run by default** (`--apply` turns it on),
- test-then-apply via `--root` pointing at a scratch copy,
- never touches binary files, `.git/`, `node_modules/`, `site/`, `void-logos/`,
  `.ruff_cache/`, `__pycache__/`, `Screenshots/`.

```python
"""tools/rename_to_void.py -- rename mkdocs-neoabs -> mkdocs-void.

Dry-run by default. Use --apply to write. Run against a scratch copy first:
    python tools/rename_to_void.py --root C:/tmp/void-test        # dry run
    python tools/rename_to_void.py --root C:/tmp/void-test --apply
Then run on the real checkout:
    python tools/rename_to_void.py --apply
"""

import argparse
import os
import re
import sys
from pathlib import Path

# Ordered: longest/most-specific first so partial matches never survive.
REPLACEMENTS = [
    ("mkdocs_neoabs", "mkdocs_void"),
    ("mkdocs-neoabs", "mkdocs-void"),
    ("NeoAbs", "Void"),
    ("NEOABS", "VOID"),
    ("neoabs", "void"),
]

SKIP_DIR = {
    ".git", "node_modules", "site", "void-logos", ".ruff_cache",
    "__pycache__", "Screenshots",
}
SKIP_EXT = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2",
            ".ttf", ".eot", ".pyc", ".gitkeep"}
BINARY_MARKERS = (b"\0",)


def should_skip(path: Path) -> bool:
    if path.suffix.lower() in SKIP_EXT:
        return True
    if any(part in SKIP_DIR for part in path.parts):
        return True
    return False


def file_needs_rename(path: Path) -> bool:
    return "neoabs" in path.name.lower()


def renamed_relative(root: Path, path: Path) -> Path:
    """Return where `path` should live relative to root."""
    rel = path.relative_to(root)
    new_parts = []
    for part in rel.parts:
        for old, new in REPLACEMENTS:
            if old in part:
                part = part.replace(old, new)
                break
        new_parts.append(part)
    out = Path(*new_parts) if new_parts else rel
    # keep the file basename (name handled separately by caller suffix logic
    # so extensions like .py/.html survive intact)
    return out


def transform_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text


def is_binary(path: Path) -> bool:
    try:
        with open(path, "rb") as fh:
            head = fh.read(4096)
    except OSError:
        return True
    return any(marker in head for marker in BINARY_MARKERS)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=os.getcwd(), help="tree to rename")
    ap.add_argument("--apply", action="store_true",
                    help="actually rename; default is a dry-run report")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        sys.exit(f"not a directory: {root}")

    # The root folder itself is never renamed, only its children. This keeps
    # the local working-dir name stable (e.g. ".../Projects/mkdocs-neoabs").
    root_name_is_off_limits = True

    changed_files: list[str] = []
    changed_paths: list[Path] = []

    for abs_path in sorted(root.rglob("*")):
        rel = abs_path.relative_to(root)
        if any(part in SKIP_DIR for part in rel.parts):
            continue
        if abs_path.is_file() and not should_skip(abs_path) \
                and not is_binary(abs_path):
            try:
                text = abs_path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            new_text = transform_text(text)
            if new_text != text:
                changed_files.append(str(rel))
                if args.apply:
                    abs_path.write_text(new_text, encoding="utf-8")

        if file_needs_rename(abs_path):
            target = renamed_relative(root, abs_path)
            if target != rel:
                changed_paths.append((rel, target))

    if args.apply:
        # renames go deepest-first so directories empty out bottom-up
        for src_rel, dst_rel in sorted(
                changed_paths, key=lambda t: len(t[0].parts), reverse=True):
            src = root / src_rel
            dst = root / dst_rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            src.rename(dst)
            print(f"moved {src_rel}  ->  {dst_rel}")

    print(f"\n{'APPLIED' if args.apply else 'DRY-RUN'} — "
          f"{len(changed_files)} file(s) text-changed, "
          f"{len(changed_paths)} path(s) renamed")

    # sanity: nothing named *neoabs* should remain
    leftovers = [str(p.relative_to(root)) for p in root.rglob("*")
                 if "neoabs" in p.name.lower()]
    if leftovers:
        print("leftover neoabs paths:")
        for lo in leftovers:
            print("  ", lo)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

**Testing protocol (run before real apply):**

```bash
# 1. build a scratch fixture with every token variant
mkdir -p "$TMP/void-test/neoabs/plugins"
printf 'mkdocs_neoabs / mkdocs-neoabs / NeoAbs / NEOABS / neoabs\n' > "$TMP/void-test/neoabs/file.txt"
printf 'import mkdocs_neoabs\n' > "$TMP/void-test/neoabs/plugins/imports.py"
cp docs/assets/config-builder.html "$TMP/void-test/builder.html"
cp neoabs.css "$TMP/void-test/neoabs.css"

# 2. dry-run (must report, change nothing)
python tools/rename_to_void.py --root "$TMP/void-test"

# 3. apply + verify every variant is gone and files actually moved
python tools/rename_to_void.py --root "$TMP/void-test" --apply
pushd "$TMP/void-test"; test -z "$(rg -i 'neoabs' -l .)"; test -d void/plugins; popd

# 4. run a copy of the repo-tree fixture against the real file list to
#    confirm no binary/edge case (e.g. docs/assets/config-builder.html must
#    keep working; js must still parse: node --check)
python tools/rename_to_void.py --apply          # real apply, then:
npm test                                          #  56 checks still green after rename
node --check void/templates/assets/javascripts/void.js
```

---

## 4. Execution order

### Step 1 — Scaffold + test the tool

1. Save `tools/rename_to_void.py` (section 3).
2. Create the scratch fixture and run the test protocol above. Only proceed
   when dry-run output == expected and the post-apply fixture has zero
   `neoabs` matches.

### Step 2 — Real apply in the project

```bash
python tools/rename_to_void.py --apply
```

Expected path renames (repo becomes):

```
neoabs/                       ->  void/
neoabs/plugins/neoabs_plugin.py -> void/plugins/void_plugin.py
neoabs/templates/assets/javascripts/neoabs.js -> void/templates/assets/javascripts/void.js
neoabs/templates/assets/neoabs.css            -> void/templates/assets/neoabs.css → void.css
neoabs/templates/assets/stylesheets/neoabs.scss -> .../neoscss.scss → void.scss
tests/neoabs.test.js                          -> tests/void.test.js
```

### Step 3 — Package + plugin entry points (`pyproject.toml`)

```toml
# before
name = "mkdocs-neoabs"
[project.entry-points."mkdocs.themes"]
neoabs = "neoabs.templates"
[project.entry-points."mkdocs.plugins"]
neoabs = "neoabs.plugins.neoabs_plugin:NeoAbsPlugin"
[project.scripts]
neoabs = "neoabs.cli:main"

# after
name = "mkdocs-void"
[project.entry-points."mkdocs.themes"]
void = "void.templates"
[project.entry-points."mkdocs.plugins"]
void = "void.plugins.void_plugin:VoidPlugin"
[project.scripts]
void = "void.cli:main"
```

Update description → `"Void - Glass + NothingOS design language for MkDocs"`,
keywords (drop `neoabs`, `neostore`, add `void`, `mkdocs-void`), and all
`https://github.com/rkriad585/mkdocs-void*` URLs. `.gitignore`:
`neoabs.egg-info/` → `void.egg-info/`.

### Step 4 — `mkdocs.yml`

- `site_url: https://rkriad585.github.io/mkdocs-void`
- `repo_url` / `repo_name: rkriad585/mkdocs-void`
- `theme: { name: void }`
- `- void:` plugin key + all `neoabs:` → `void:` in `extra`
- `neoabs_logo_*`/`neoabs_favicon_*`/`neoabs_showcase*`/`neoabs_og_image*` keys
  → `void_*` (run script handles; then review)
- raw logo URLs `raw.githubusercontent.com/rkriad585/mkdocs-neoabs/main/logo/...`
  → new `void/assets/...` paths after Step 8.

### Step 5 — `neoabs_plugin.py` internals

Script covers `_NEOABS_*` → `_VOID_*`, `class NeoAbsPlugin` → `class VoidPlugin`,
all `"neoabs"` string keys (i18n, `#__config`, `data-md-neoabs-*`). Manual
follow-ups to review: every `_VOID_*` name referenced by `void.js`/templates,
the showcase `poweredBy` default string, and the CLI `Built with NeoAbs.`
scaffold text (brand-only, keep "Void").

### Step 6 — Tests + build (rename must stay green)

```bash
npm test                      # tests/void.test.js — 56 checks
npm run build                 # regenerates void.css from void.scss
"…\neoabs-recipe-venv\Scripts\mkdocs.exe" build --strict
node --check void/templates/assets/javascripts/void.js
py_compile void/plugins/void_plugin.py void/cli.py
```

Site URL in tests (`tests/void.test.js` PROD_ORIGIN) → `https://rkriad585.github.io`.

### Step 7 — Phase-comment → real-docs cleanup

Do **after** the rename so grep targets are the new names. Replace every
`# Phase N: …` header with a line describing the *actual* subject — no phase
numbers, no product-stage references. Comments only; do not restructure code.

**Pattern (plugin defaults):**

```python
# before:  # Phase 16 - Action cluster (plus menu)
_NEOABS_DEFAULT_ACTION_CLUSTER = {...}

# after:
# Default action-cluster (plus menu) settings: position, main button,
# behavior, and the four built-in actions injected into the cluster.
_VOID_DEFAULT_ACTION_CLUSTER = {...}
```

**Pattern (on_config resolution):**

```python
# before:  # Phase 21: wire the standalone config builder
# after:
# Merge the config-builder group, validate it, and auto-inject its cluster
# gear action when it is enabled.
```

**Pattern (SCSS):**

```scss
// before:  // Phase 5: sidebar glass off
// after:
// [data-md-void-sidebar-glass="false"]: opaque sidebar surface.
```

**Pattern (mkdocs.yml reference dividers)** — rewrite the `# --- Phase N: … ---`
headers by topic, e.g.:

```yaml
# before:  # --- Phase 4: Footer customization (optional) ---
# after:   # Footer: position, glass, border, layout, prev/next, copyright,
#          # social icons and extended columns (all commented examples below).
```

**Pattern (tests):**

```js
// before:  // Phase 6: feedback widget
// after:   // Feedback widget opens a prefilled GitHub issue, not a tracker.
```

**Pattern (plan docs)** — `WHY_PLAN.md` / `PLAN.md` / `DOCS_WIKI_PLAN.md` /
`CHANGELOG.md`: leave historical phase references as-is (they are release
history / roadmaps, not code). **Scope of this cleanup = code + templates + SCSS
+ JS + tests + mkdocs.yml only.** (Ask the user before touching plan docs.)

Priority files (in order): `void/plugins/void_plugin.py`,
`void/templates/base.html`, `void/templates/partials/*.html`,
`void/templates/assets/stylesheets/*.scss`,
`void/templates/assets/javascripts/void.js`, `tests/void.test.js`,
`mkdocs.yml`, `tools/*.py`.

### Step 8 — Logos: swap `void-logos/` → `logo/` + bundled assets

**Scheme contract (non-negotiable):** every `*-on-dark-mode.*` file is for
**dark scheme only** and every `*-on-light-mode.*` file is for **light scheme
only**. Never mix modes — a dark file must not render on a light surface (and
vice-versa). The theme already ships this split (dark/light `<img>` variants in
`header.html`, dark/light favicon swap in `base.html`), so the copy below maps
dark→dark and light→light one-for-one.

| Source (`void-logos/`) | Scope | Destination |
|---|---|---|
| `logo-on-dark-mode.svg` | dark only | `void/templates/assets/images/logo.svg` |
| `logo-on-light-mode.svg` | light only | `void/templates/assets/images/logo-light.svg` |
| `favicon-on-dark-mode.svg` | dark only | `void/templates/assets/images/favicon.svg` |
| `favicon-on-light-mode.svg` | light only | `void/templates/assets/images/favicon-light.svg` |
| `logo-on-dark-mode.svg` | dark only | `docs/assets/images/logo.svg` |
| `logo-on-light-mode.svg` | light only | `docs/assets/images/logo-light.svg` |
| `favicon-on-dark-mode.svg` | dark only | `docs/assets/images/favicon.svg` |
| `favicon-on-light-mode.svg` | light only | `docs/assets/images/favicon-light.svg` |
| `logo-on-light-mode-1280x640.png` | light only (wide raster) | `docs/assets/images/og-card-banner.png` |
| `logo-on-dark-mode-1280x640.svg` | dark only (wide vector) | `void/templates/assets/images/logo-widescreen.svg` |

**Delete `logo/` entirely**, then adopt `void-logos/` as the new source:

```bash
git rm -r logo/                     # removes logo/logo.svg, logo/logo-light.svg
mkdir -p void/templates/assets/images docs/assets/images
# theme-bundled images (dark/light split preserved — see table above)
cp void-logos/logo-on-dark-mode.svg   void/templates/assets/images/logo.svg
cp void-logos/logo-on-light-mode.svg  void/templates/assets/images/logo-light.svg
cp void-logos/favicon-on-dark-mode.svg void/templates/assets/images/favicon.svg
cp void-logos/favicon-on-light-mode.svg void/templates/assets/images/favicon-light.svg
# docs-site assets (mkdocs.yml logo/favicon keys)
cp void-logos/logo-on-dark-mode.svg   docs/assets/images/logo.svg
cp void-logos/logo-on-light-mode.svg  docs/assets/images/logo-light.svg
cp void-logos/favicon-on-dark-mode.svg docs/assets/images/favicon.svg
cp void-logos/favicon-on-light-mode.svg docs/assets/images/favicon-light.svg
# wide raster used by social/og cards
cp void-logos/logo-on-light-mode-1280x640.png docs/assets/images/og-card-banner.png
cp void-logos/logo-on-dark-mode-1280x640.svg  void/templates/assets/images/logo-widescreen.svg
```

Remove the mode suffix when landing in the theme/docs dirs — the destination
name (`logo.svg` vs `logo-light.svg`) *is* the mode marker the existing swap JS
already understands. Do **not** rename a mode file to the other mode's name.

```yaml
# before:  # --- raw.githubusercontent.com/rkriad585/mkdocs-neoabs/main/logo/logo.svg
# after:
neoabs_logo_dark:  assets/images/logo.svg          # relative — theme-bundled
neoabs_logo_light: assets/images/logo-light.svg
neoabs_favicon_dark: assets/images/favicon.svg
neoabs_favicon_light: assets/images/favicon-light.svg
```

Also update `.github/workflows/integrations.yml:50` which curls the old
`logo/logo.svg` raw URL → new repo path. `mkdocs_theme.yml` favicon/logo
defaults (if any) → new bundled paths.

**Verify the scheme contract after copying:** build the site and confirm the
dark render references only `*-dark`/`logo.svg` assets and the light render only
`*-light`/`logo-light.svg` /`favicon-light.svg` ones — grep the generated HTML
for the four asset classes and assert the mode pairing matches Step 8's table.
Root SVG contents may themselves carry the mode background; keep them asset-for-
asset identical (no in-place redraw) so the shipped look is exactly the design's.

### Step 9 — Contributor credits

Replace `# Copyright (c) 2025 mkdocs-neoabs contributors` in the four
`__init__.py` / `cli.py` headers with `# Copyright (c) 2025 rkriad585
contributors` (or `Void contributors` — confirm with user). Update
`CONTRIBUTORS` file text: *"Thanks to everyone who has contributed to
mkdocs-void."*

### Step 10 — Watermark / "Material" text cleanup

Search every remaining `Material` / `watermark` reference and rewrite
project-facing copy to Void (competitor-comparison prose in docs is fine, but
strip "Material\*-\*" watermarks and `Material-style` comments):

```python
# void_plugin.py — AI mirror watermark default
# before:  "Generated by NeoAbs for AI agents."
# after:   "Generated by Void for AI agents."
```

```scss
// before:  // Admonition type color map (Material-style family)
// after:   // Admonition type color map (Void design system).
```

`cli.py` scaffold `Built with NeoAbs.` → `Built with Void.`; docs "Material
clone" prose may reference Void (review wording, user sign-off).

### Step 11 — `gh` repo rename

```bash
gh repo rename mkdocs-void --repo rkriad585/mkdocs-neoabs --yes
# confirm new URL answers:
gh repo view rkriad585/mkdocs-void --json name,url
```

GitHub auto-redirects old URL → new. Then, on the local remote:

```bash
git remote -v      # ensure origin still works (it redirects); else
git remote set-url origin https://github.com/rkriad585/mkdocs-void.git
```

### Step 12 — catalog update + PR

In a fresh clone of `rkriad585/catalog` (branch
`feat/add-mkdocs-void`), add a project entry to `projects.yaml` under the
`theming` category:

```yaml
- name: mkdocs-void
  github_id: rkriad585/mkdocs-void
  pypi_id: mkdocs-void
  mkdocs_theme: void
  mkdocs_plugin: [void]
  license: MIT
  description: Glass + NothingOS design language for MkDocs (dark-mode aware
    logo, PWA, config builder, AI-readable content mode).
```

Run the repo's checker `python check_projects.py` (fails the PR otherwise),
optionally regenerate the best-of `README.md` via its workflow, then:

```bash
git checkout -b feat/add-mkdocs-void
git add projects.yaml README.md
git commit -m "feat: add mkdocs-void (rkriad585) under theming"
gh pr create --fill --base main
gh pr view --web
```

### Step 13 — Docs + CI sweep (final pass)

- `.github/workflows/`: `performance.yml` Lighthouse URL, `container.yml`
  image `ghcr.io/rkriad585/mkdocs-void`, path triggers `void/**`.
- `SECURITY.md` / `CODE_OF_CONDUCT.md` (repo URLs) — script handles.
- `tools/emit_benchmarks.py` `PROJECT_URL`.
- `docs/` prose still mentioning `mkdocs-neoabs` late-wired values → fix.
- `_config_ref.generated.md`: regenerate (renamed config keys changed).
- Rebuild site; verify `site/` uses `void.js`/`void.css`/`config-builder.html`.

### Step 14 — Final verification gate

```bash
rg -i 'neoabs' --glob '!node_modules/**' --glob '!site/**' --glob '!.git/**' .
npm test
npm run build
"…\neoabs-recipe-venv\Scripts\mkdocs.exe" build --strict
git status --short          # ONLY: renamed files, RENAME-PLAN.md, logos, etc.
```

Zero `neoabs` hits → done.

---

## 5. Risks / decisions

| # | Decision | Default |
|---|---|---|
| D1 | Keep plan docs (`PLAN.md`, `WHY_PLAN.md`, `DOCS_WIKI_PLAN.md`) phase history? | Keep as-is, ask user |
| D2 | PyPI package swap to `mkdocs-void` + new release? | Yes, but only on user command |
| D3 | Keep `void-logos/` as source-of-truth playground or move files only? | Keep folder (it's the design source), delete only `logo/` |
| D4 | `mkdocs_theme.yml` asset references | Migrate to bundled dark/light images |
| D5 | Screenshots regenerate (old theme IDs in PNGs) | Optional, user decides |
| D6 | `site/` checkout from old build | Drop; rebuild post-rename |
| D7 | Rename the **local root folder** `mkdocs-neoabs/` on disk? | **Never** — only repo name + contents change |

Verified context:

- Watermark default today: `"Generated by NeoAbs for AI agents."`
  (`neoabs_plugin.py:3129`); config live in `mkdocs.yml` `ai_reader.watermark`.
- "Material" today = only competitor prose + `Material-style family`
  comment (`components.scss:3295`) + `Material-compatible passthrough`.
- "contributors" today = 5 files (`neoabs/__init__.py`,
  `neoabs/templates/__init__.py`, `neoabs/plugins/__init__.py`,
  `neoabs/cli.py`, `CONTRIBUTORS`).
- Catalog = best-of list; **no `neoabs` entry exists** → PR adds `mkdocs-void`.
- Repo rename via `gh repo rename` auto-redirects; no manual repo edits needed.