---
date: 2026-09-07
title: Troubleshooting
---

# Troubleshooting

Common issues and their solutions.

## Theme Not Loading

**Symptom:** Page renders with no styling.

**Causes:**

1. `void` is not set as the theme name
2. CSS file path is incorrect
3. Browser cache is stale

**Fix:**

```yaml
# mkdocs.yml
theme:
  name: void
```

Then:

```bash
mkdocs build --clean
mkdocs serve
```

Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`).

## Both Theme Icons Visible

**Symptom:** The dark/light mode toggle shows both sun and moon icons simultaneously.

**Fix:** This is caused by a stale cache. Hard-refresh the browser. The theme includes an inline early-apply script in `<head>` that prevents this by reading localStorage before CSS loads.

## Glass Effects Not Working

**Symptom:** Panels appear solid instead of translucent.

**Causes:**

1. Browser does not support `backdrop-filter`
2. Another CSS rule overrides the glass background

**Fix:**

1. Check browser support (Chrome 76+, Edge 79+, Safari 9+, Firefox 103+)
2. Inspect the element in DevTools and verify `.void-glass` or `.void-card` classes are applied
3. Check for conflicting `background` rules in custom CSS

## Search Returns No Results

**Symptom:** Typing in search shows "No results found" for valid content.

**Causes:**

1. `search` plugin is not in the plugins list
2. Search index not regenerated

**Fix:**

```yaml
plugins:
  - search
  - void
```

```bash
mkdocs build --clean
mkdocs serve
```

## Search Results Link to 404

**Symptom:** Clicking a search result opens a 404 page.

**Cause:** Search result URLs are relative and resolve incorrectly on subpages.

**Fix:** Ensure you are using the latest version of the theme. This was fixed in the search result URL resolution to use absolute paths.

## Navigation Not Collapsing

**Symptom:** Sidebar sections don't expand/collapse.

**Fix:** Ensure the JavaScript file is loaded:

```html
<script src="assets/javascripts/void.js"></script>
```

Check the browser console for errors.

## CSS Build Fails

**Symptom:** `npm run build` errors.

**Fix:**

```bash
rm -rf node_modules
npm install
npm run build
```

## Python Import Errors

**Symptom:** `ModuleNotFoundError: No module named 'void'`

**Fix:**

```bash
pip install -e .
```

## Fonts Not Loading

**Symptom:** Text appears in system fonts instead of Space Grotesk / Space Mono.

**Causes:**

1. No internet connection (fonts are loaded from Google Fonts)
2. CSP blocking external stylesheets

**Fix:**

1. Check internet connectivity
2. If self-hosting fonts, override the `@font-face` rules in a custom CSS file and add it via `extra_css`

## Reduced Motion Not Working

**Symptom:** Animations play despite `prefers-reduced-motion: reduce` being set.

**Fix:** The theme respects this preference automatically. If animations still play, another CSS rule may be overriding the `!important` declarations. Check for conflicting animation rules.

---

[Back to README](index.md)
