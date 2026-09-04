# Task Lists

NeoAbs styles `pymdownx.tasklist` checklist items with the glass theme and
makes them interactive, persisting your checked state across page reloads in
the browser (localStorage, keyed per page).

## Usage

```markdown
- [ ] not started
- [x] completed
- [X] also completed
```

## Example

- [x] Design tokens defined
- [x] Admonitions expanded
- [ ] Tabs finalized
- [ ] Mermaid integration
- [ ] Notes & annotations

> Check a box, then reload the page — your selection is remembered.

## Notes

- Task lists only persist per-browser; there is no server-side storage.
- Clearing site data (or the `neoabs-task.*` keys) resets the state.
- The checked state is written back to localStorage as a `"1"`/`"0"` flag.