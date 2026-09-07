---
date: 2026-09-07
title: Math
---

# Math (KaTeX)

NeoAbs renders mathematical notation with **KaTeX**, loaded lazily from a CDN only when a page contains math. It integrates with `pymdownx.arithmatex`, which is enabled in the theme's `mkdocs.yml`.

!!! note
    Math is enabled by default (`theme.neoabs.math: true`). To disable it, set `math: false` in `mkdocs.yml` under `extra`.

## Inline math

Use single dollar signs for inline math:

The quadratic formula **$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$** solves $ax^2 + bx + c = 0$.

```markdown
The quadratic formula **$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$** solves $ax^2 + bx + c = 0$.
```

## Block math

Use double dollar signs (or a `$$ ... $$` block) for display math:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$
```

## Aligned equations

$$
\begin{aligned}
E &= mc^2 \\
F &= ma
\end{aligned}
$$

## Matrices

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\cdot
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

## Configuration

Math is loaded only when a `.arithmatex` element exists on the page, so pages without math never fetch KaTeX.

```yaml
# mkdocs.yml — disable math globally
extra:
  neoabs_math: false
```

The KaTeX resources are pinned to `katex@0.16.9` (CSS + JS) from `jsdelivr`.
