# Code Highlighting

NeoAbs enhances syntax highlighting with [highlight.js](https://highlightjs.org)
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
  "name": "mkdocs-neoabs",
  "version": "0.1.0"
}
```

## Theme aware

Toggle the palette (light/dark) and the code colors update live to match —
the dark theme is used for the slate scheme and the light theme for light mode.

## Disabling

Highlighting is controlled by the `neoabs.highlight` theme option:

```yaml
theme:
  neoabs:
    highlight: false
```

## Notes

- Code already processed (marked with `data-highlighted` or `data-no-highlight`)
  is left untouched.
- The `__codelineno` line anchors are preserved, so "copy link to line" keeps
  working.
- The copy button is inserted after highlighting so the `<pre>` wrapper stays
  intact.