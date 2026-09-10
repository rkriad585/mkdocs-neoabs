---
date: 2026-09-07
title: Footnotes
---

# Footnotes

Void fully styles [Python-Markdown footnotes](https://python-markdown.github.io/extensions/footnotes/).
Reference footnote markers appear as numbered pills and the definitions render
as a tidy glass card at the end of the article.

## Adding a footnote

Use the `[^label]` reference in your text and define it with `[^label]: ...`
anywhere below (usually at the end of the document):

```markdown
Void ships with glass morphism[^glass] and a privacy-first[^privacy] promise.

[^glass]: Glass *morphism* uses backdrop blur and translucency.
[^privacy]: No third-party tracking is loaded unless you opt in.
```

Void ships with glass morphism[^glass] and a privacy-first[^privacy] promise.

[^glass]: Glass *morphism* uses backdrop blur and translucency.
[^privacy]: No third-party tracking is loaded unless you opt in.

The `footnotes` markdown extension is enabled by default in this theme, so
footnote markers become `sup` links and the definitions render as a styled list
with a "back to text" link on each entry.

## Multiple references

You can cite the same footnote several times; each marker links to the same
definition[^multi].

```markdown
Repeated reference[^multi] — and again[^multi].

[^multi]: A footnote cited more than once.
```

Repeated reference[^multi] — and again[^multi].

[^multi]: A footnote cited more than once.

## Disabling

Footnotes are provided by the `footnotes` markdown extension. Remove `- footnotes`
from `markdown_extensions` in `mkdocs.yml` to disable them site-wide. Styling is
always safe to keep — it only applies when footnote markup is present.
