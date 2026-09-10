---
date: 2026-09-07
title: Toast
---

# Toast Messages

Void ships a lightweight toast notification system. It's used internally by buttons, forms, and inputs, and is exposed as a **global function** so you can call it from your own inline JavaScript or on-click attributes.

## Quick start

The simplest way is a button with an inline `onclick`:

<div>
  <button class="void-btn" onclick="voidToast('Hello from Void')">Show toast</button>
  <button class="void-btn void-btn--accent" onclick="voidToast('Saved successfully', 'success')">Success</button>
  <button class="void-btn void-btn--ghost" onclick="voidToast('Something went wrong', 'error')">Error</button>
</div>

```html
<button class="void-btn" onclick="voidToast('Hello from Void')">Show toast</button>
<button class="void-btn void-btn--accent"
        onclick="voidToast('Saved successfully', 'success')">Success</button>
<button class="void-btn void-btn--ghost"
        onclick="voidToast('Something went wrong', 'error')">Error</button>
```

## API

```js
voidToast(message, type)
```

- `message` — `string` — the text to display. **Required.**
- `type` — `string` — one of `"info"` (default), `"success"`, or `"error"`. Controls the icon and accent color.

| Type      | Icon / color                  |
|-----------|-------------------------------|
| `info`    | Blue informational icon       |
| `success` | Green check icon              |
| `error`   | Red close/cross icon          |

## From a script

```html
<button class="void-btn void-btn--pill" id="save-btn">Save changes</button>
<script>
  document.getElementById("save-btn").addEventListener("click", function () {
    voidToast("Changes saved", "success")
  })
</script>
```

## Timing

Toasts auto-dismiss after ~2.6 seconds. Only one toast is shown at a time — a new call replaces the current one. A `prefers-reduced-motion: reduce` preference disables the animation.

## Automatic usage

The theme already fires toasts for you:

- Clicking any `.void-btn` → `"Clicked: <label>"` (info)
- Submitting a valid `.void-form` → `"Form submitted"` (success)
- Submitting an invalid `.void-form` → error toast
- Pressing <kbd>Enter</kbd> / changing an input, select, or textarea → confirmation toast
