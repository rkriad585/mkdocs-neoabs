---
date: 2026-09-07
title: CSS Classes in Markdown
---

# Adding CSS Classes in Markdown

Void enables the `attr_list` extension, which lets you **attach component classes (and other attributes) directly to Markdown elements** using a `{.class .another}` suffix. This is the recommended way to style content without writing raw HTML.

!!! note "Enabled by default"
    `attr_list` and `md_in_html` are both enabled in the theme. No configuration required.

## On code blocks

Append `{ .lang .class }` to the opening fence to add classes to the resulting `<pre><code>` — useful for sizing or styling a block:

```py { .void-card .void-p-4 }
print("Hello Void")
```

````markdown
```py { .void-card .void-p-4 }
print("Hello Void")
```
````

The classes land on the `<code>` element, so you can target them in custom CSS.

## On images

```markdown
![alt](img.png){ .void-img-round width="140" }
```

Both classes and other attributes (`width`, `height`, `loading`) are applied.

```
![Round](img.png){ .void-img-round width="140" }
![Ghost](img.png){ .void-img-ghost }
![Banner](img.png){ .void-image--banner }
```

## On headings

```markdown
## Installation { .void-accent }
```

```html
<h2 class="void-accent">Installation</h2>
```

## On any block element

Attach classes to paragraphs, lists, blockquotes, and more:

```markdown
> A highlighted quote { .void-card }
```

```
| Head | Head |
|------|------|
| A    | B    | { .void-table }
```

## Combining with your own classes

You can attach your own classes alongside the theme's. Any CSS you add via `extra_css` will apply:

```markdown
```yaml { .my-custom-block .language-yaml }
key: value
```
```

## Under the hood

`attr_list` is an official Python-Markdown extension. The syntax is `{...}` immediately after the element (no blank line before it). Available attributes include `class`, `id`, `width`, `height`, `title`, and more. Because both `attr_list` and `md_in_html` are active, you can mix raw HTML and Markdown attributes freely.

For full details, see the [Python-Markdown attr_list docs](https://python-markdown.github.io/extensions/attr_list/).
