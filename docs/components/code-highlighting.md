---
date: 2026-09-07
---

# Code Highlighting

Void enhances syntax highlighting with [highlight.js](https://highlightjs.org)
loaded from a CDN. It colorizes code that the base Pygments pipeline leaves
monochrome, respects your light/dark scheme, and keeps the copy button and
per-line anchors working.

## Supported languages

highlight.js ships a large set of common languages in its core bundle:

```python
def greet(name):
    print(f"hello {name}")
```

```javascript
function greet(name) {
  console.log(`hello ${name}`);
}
```

```bash
greet() {
  echo "hello $1"
}
```

```rust
fn greet(name: &str) {
    println!("hello {}", name);
}
```

```json
{
  "name": "mkdocs-void",
  "version": "0.1.0"
}
```

## Theme aware

Toggle the palette (light/dark) and the code colors update live to match —
the dark theme is used for the slate scheme and the light theme for light mode.

## Disabling

Highlighting is controlled by the `void.highlight` theme option:

```yaml
theme:
  void:
    highlight: false
```

## Notes

- Code already processed (marked with `data-highlighted` or `data-no-highlight`)
  is left untouched.
- The `__codelineno` line anchors are preserved, so "copy link to line" keeps
  working.
- The copy button is inserted after highlighting so the `<pre>` wrapper stays
  intact.

## Code annotations

Annotate specific lines of a code block with a numbered marker using the
`pymdownx.highlight` guide: end a source line with `# (1)!` (or `// (1)!`,
`-- (1)!`, etc.) and add the numbered legend directly below the block:

```python
import os
cwd = os.getcwd()        # (1)!
```

<ol>
<li>Prints the current working directory.</li>
</ol>

The marker becomes a red pill on that line, and the following `<ol>` becomes a
styled legend — hovering an entry highlights its matching marker. A plain
Markdown ordered list (`1.  ...`) works too when the toolchain emits an `<ol>`
directly after the highlighted block; the raw `<ol>` above is the form that
always renders as a sibling of the code block.

Annotations are applied client-side, so they need no extra Markdown
extensions. Toggle them off with `theme.void.content.code.annotate: false`.
