---
date: 2026-09-07
title: Feedback & Announcements
---

# Feedback & Privacy Features

Three engagement surfaces and one privacy rule round out a Void site — all of them opt-in, none of them ship tracking:

- The **feedback widget** asks "Was this page helpful?" and opens a prefilled GitHub issue (positive or negative) in a new tab.
- The **announcement bar** is a single line pinned to the bottom of the viewport; dismissal is remembered in `localStorage` and re-shows when the text changes.
- The **cookie consent banner** renders by default (**`render: auto`**) only
  when an actual integration that could collect personal data is configured
  (`theme.analytics.gtag` or giscus comments), never otherwise — but you can
  force it on with `render: always` (as this docs site does).

## Feedback widget

The widget renders under the article once the page has a `repo_url` (real GitHub repos only — the click is a plain issue link, no analytics anywhere).

<div>
  <div class="void-feedback">
    <div class="void-feedback__title">Was this page helpful?</div>
    <div class="void-feedback__actions">
      <button type="button" class="void-btn void-feedback__btn void-feedback__btn--yes">Yes — thanks!</button>
      <button type="button" class="void-btn void-btn--accent void-feedback__btn void-feedback__btn--no">No — open an issue</button>
    </div>
  </div>
</div>

```yaml
theme:
  void:
    feedback:
      enabled: true        # Master on/off (default true)
      show: true           # Render the widget (default true)
      title: Was this page helpful?
      positive: Yes — thanks!
      negative: No — open an issue
      github_labels:
        - feedback         # Issue labels applied to every opened issue
```

Clicking **Yes** opens `repo/issues/new` with a `Positive feedback` body; clicking **No** opens the same with a `Negative feedback` body. The page title and URL are pre-filled so readers never have to type anything. On "Yes" a success toast is shown.

## Announcement bar

The bar is fixed to the bottom of the viewport. Set the text either on `announcement_bar.text` or with the legacy `extra.void_announce` string (the dict wins).

```yaml
extra:
  void_announce: New in v0.2 — glass components!   # Legacy string fallback

theme:
  void:
    announcement_bar:
      enabled: true        # Master on/off (default true)
      show: true           # Render the bar (default true)
      text: ""             # Dict text wins; empty falls back to void_announce
      dismissable: true    # Show the × button
```

Dismissal is stored per site under a key derived from the announcement text, so updating the announcement re-shows it. The bar is fixed to the bottom of the viewport, above the consent banner, and never covers content.

## Cookie consent banner

Void stores **nothing** about readers beyond explicit opt-in flags (`consent`, `announcement-dismissed-*`, notes). The banner is purely a courtesy: it renders only when the build detects a configured integration, and clicking **Accept** unlocks delayed integrations (e.g. giscus) that are otherwise never loaded.

```yaml
theme:
  void:
    cookie_consent:
      enabled: true
      show: true
      render: always           # auto (only with an integration) | always | never
      message: This site stores nothing about you unless you enable integrations.
      accept_label: Accept
      decline_label: Decline
      privacy_policy: ""        # Optional link label; e.g. "/privacy/"
```

A browser's choice is remembered; changing it requires clearing site data. The banner is fixed at the bottom center and styled with the theme's glass tokens.

## Opt-in comments (giscus)

Comments are a separate, fully opt-in integration. See [Plugins → Void Plugin](../plugins/void.md) for the full giscus setup. Highlights:

- Only the `giscus` provider is supported today.
- Nothing is loaded until both `repo` and `repo_id` are configured.
- When a cookie-consent-serving integration is present, the giscus script is deferred until the reader clicks **Accept**. No third-party request happens before that.
- The giscus theme follows the active palette (`theme.light` / `theme.dark` in `comments.theme`) and re-syncs when the scheme changes.

```yaml
theme:
  void:
    comments:
      enabled: true
      provider: giscus
      repo: "user/mkdocs-docs"
      repo_id: "R_kgxxxx"           # From the giscus app setup page
      category: "Announcements"     # Must be an "Announcements"-type category
      category_id: "DIC_xxxx"
      mapping: pathname             # pathname | url | title | og:title | specific
      theme:
        light: light
        dark: dark
```

## Privacy summary

| Surface | Stores | Loads third parties |
|---------|--------|---------------------|
| Feedback | Nothing — the click navigates to `issues/new` | No |
| Announcement bar | One dismissal key in `localStorage` | No |
| Cookie consent | One accept/decline flag in `localStorage` | Only the configured integration, after Accept |
| Comments (giscus) | giscus's own session cookies under its provider | Yes — only when configured, and gated by consent |