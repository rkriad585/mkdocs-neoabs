---
date: 2026-09-07
title: Why Void
---

# Why Void

> Made by the anti-default.

Void is the MkDocs theme you pick when your documentation should look like
*your brand* — not the same indigo sidebar everyone else ships. It blends the
translucent depth of **Glass** with the industrial minimalism of **NothingOS**:
a pure black canvas, dot-matrix texture, and Nothing Red accents, all driven
from a single `mkdocs.yml`.

The whole pitch fits in one sentence:

> Give a developer a distinctive, fast, privacy-first docs site in under two
> minutes — purely from `mkdocs.yml` — without a single line of custom CSS.

## The three pillars

Every decision in Void serves these three commitments:

1. **Distinctive by default** — a zero-config build looks intentional and
   unique. Glass morphism, the NothingOS black canvas, dot-matrix, and Nothing
   Red are the visual language that flat, indigo Material clones cannot copy
   without forking.
2. **Fast + app-like** — SPA-style navigation, a service-worker cache, and a
   tiny footprint. Pages feel like a native app, not a document dump.
3. **Private by default** — no tracking pixels, no mandatory CDN, no analytics
   injected without your say-so. Configuration-first, self-host-friendly.

!!! note
    These are not aspirational. Each pillar maps to shipped, verified code in
    this repository — the design system, the SPA + service worker, and the
    config-driven asset loading.

## Why not Material?

Material for MkDocs is the 800-pound gorilla — and it has **stopped evolving**.
As of late 2025 / early 2026 the project explicitly entered **maintenance
mode**: all paid "Insiders" features were folded into MIT, the feature list
froze, and new work moved to a separate successor. That means no new features
will ever ship upstream.

Void is the actively-maintained alternative. It is not a Material clone — it
is a different design language that prioritizes three things Material was never
built around: a distinctive visual identity, speed, and privacy.

The honest comparison (dated 2026-09):

| Capability | Void | Material for MkDocs |
|-----------|--------|---------------------|
| Design language | Glass + NothingOS (distinctive) | Material Design (universal, bland) |
| Actively maintained | Yes — this repo | Maintenance mode; frozen |
| Zero-config distinctive look | ✅ | ❌ (all look alike) |
| SPA navigation | ✅ | ✅ |
| Service-worker caching | ✅ | ✅ |
| Privacy-first defaults | ✅ no trackers, self-hostable | 🟡 CDN-dependent |
| Config-first custom CSS | ✅ token overrides | ✅ |
| Full config from one YAML | ✅ | ✅ |

Void wins on the two axes developers actually feel: **identity** and
**maintenance pace**.

## The anti-default

Every "default" docs theme pushes you toward the same indigo header, the same
sidebar, the same flat surfaces. Void inverts that assumption: the defaults
are the showpiece. Turn on the theme and you already have glass panels, a
dot-matrix canvas, Nothing Red accents, dark/light schemes, full-screen search,
and reading mode — no custom CSS, no theming homework.

If you want your docs to be remembered, start from the theme that forgot to be
boring.

---

[Back to README](index.md)
