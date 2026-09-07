---
date: 2026-09-07
---

# Notes & Annotations

NeoAbs ships a **browser-local** note layer. Open the notes panel and save
lightweight sticky notes; they persist in your browser across reloads and are
**global** — they appear on every page. Notes are never sent to a server.

## Adding a note

1. Open the **Notes** panel (bottom-left button, or `Ctrl/Cmd` + `Shift` + `N`).
2. Press **+ Add note**.
3. Pick a color, type your note, press **Save**.

## The Notes panel

The sidebar lists all your notes, each showing a color bar, the note text,
and its date:

- **+ Add note** — compose a new note inline.
- **Edit** — reopen the note in a prefilled editor and save changes.
- **Delete** — removes a note.
- **Export .md** — downloads all notes as Markdown.
- **Export .json** — downloads them as JSON (good for backup/migration).

Notes are **global**: they are not scoped to any single page, so you see the
same set from anywhere on the site.

## Keyboard shortcuts

- `Ctrl/Cmd` + `Shift` + `N` — toggle the notes panel.
- `Ctrl/Cmd` + `Shift` + `B` — toggle the navigation sidebar (state is remembered).
- `Ctrl/Cmd` + `Shift` + `T` — toggle the "On this page" table of contents (state is remembered).
- `Esc` — close the panel (or cancel the composer).

## Storage & retention

Notes are stored in `localStorage` (`neoabs-notes`). Each note has a timestamp
and is **automatically purged after 3 days** (default). Because storage is
per-browser, your notes don't travel between devices.

## Configuration

Control the feature from `mkdocs.yml`:

```yaml
theme:
  neoabs:
    notes: true        # disable to turn off the whole feature
    notes_ttl: 259200000   # retention window in milliseconds (3 days)
```

## Privacy

All data stays in your browser — no network requests are made by the notes
feature.
