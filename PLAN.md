# NeoAbs Full Customization Plan

> Make every aspect of the NeoAbs theme configurable via `mkdocs.yml`.
> Everything enabled/active by default. Current config = defaults.

---

## ⚠️ Mandatory Working Rules (READ BEFORE STARTING ANY WORK)

> These rules apply to **every** phase in this plan. Breaking any of them is a
> defect and must be treated as one. Re-read them before finishing each phase.

1. **Don't remove any element.** Never delete existing HTML elements, Jinja
   blocks, CSS rules/classes, IDs, or markup that the theme already renders.
   Extend them or hide them via config — never strip them out.
2. **Don't remove any feature.** Every feature documented in the README, the
   `docs/` folder, or present in the theme today must keep working after any
   phase. Enabling/disabling goes through the existing config defaults; nothing
   may silently disappear.
3. **Don't remove any function.** Never delete or rename an existing JavaScript
   function, Python method, plugin hook, or init entry point. New code may wrap
   or extend; existing call sites stay intact and callable.
4. **Don't make any typo.** Verify every identifier — config keys, CSS custom
   property names, function names, class names, and file paths — against the
   actual source before and after every edit. A typo in a config key, class, or
   asset URL is a runtime bug.
5. **Don't touch any code outside the phase's topic.** Each phase lists the
   files it may modify. You must not edit any file outside that list. If a
   change appears to require an out-of-scope file, stop and add that file to the
   phase's list first.
6. **Don't miss any feature in a phase.** Each phase defines a **complete** set
   of config keys, templates, and behaviors. Implement them **all**. A phase is
   not done until every listed config key has a working consumer and every task
   in that phase is checked off.
7. **Everything stays enabled/active by default.** All new features default to
   ON (or keep their previous default value). Never ship a config default of
   `false` unless the phase explicitly says otherwise.
8. **Verification is part of the phase.** After each phase:
   `npm run build`, `mkdocs build --quiet`, `npm test`, and the relevant
   harnesses must all pass before moving on. No phase is complete without a
   green build and green tests.
9. **Never "fix" a symptom by deleting the feature.** If a feature misbehaves,
   fix the bug. Do not disable, hide, or remove the feature to make tests pass.

---

## Current Config (Defaults)

```yaml
theme:
  name: neoabs
  logo: assets/images/logo.svg
  favicon: assets/images/favicon.svg
  language: en
  direction: ltr
  palette:
    - scheme: slate
      primary: black
      accent: red
      toggle:
        name: Switch to light mode
    - scheme: default
      primary: white
      accent: red
      toggle:
        name: Switch to dark mode
  font:
    text: Space Grotesk
    code: Space Mono
  features:
    - navigation.sections
    - navigation.top
    - navigation.footer
    - content.code.copy
    - search.suggest
    - search.highlight
  neoabs:
    glass: medium
    dot_matrix: true
    animation: normal
    border: thin

extra:
  neoabs_logo_dark: <url>
  neoabs_logo_light: <url>
  neoabs_favicon_dark: assets/images/favicon.svg
  neoabs_favicon_light: assets/images/favicon-light.svg
```

---

## Phase 1: Design Token Overrides (Colors, Typography, Spacing)

**Goal:** Let developers override any CSS custom property from `mkdocs.yml` without writing custom CSS.

### Config additions under `theme.neoabs:`

```yaml
theme:
  neoabs:
    # Colors
    colors:
      primary: "#ff3030"           # Accent color (buttons, active states, links)
      primary_light: "#ff6b6b"     # Lighter shade (hover states)
      primary_dark: "#cc0000"      # Darker shade (active states)
      background: "#000000"        # Page background
      surface: "#111111"           # Card/panel backgrounds
      surface_light: "#1a1a1a"     # Lighter surface variant
      text: "#ffffff"              # Primary text color
      text_secondary: "#888888"    # Secondary/muted text
      border: "#333333"            # Default border color
      overlay: "rgba(0,0,0,0.5)"   # Backdrop overlay color

    # Typography
    typography:
      font_family: "Space Grotesk, sans-serif"
      font_family_mono: "Space Mono, monospace"
      font_size_base: "16px"       # Base font size
      font_size_sm: "14px"         # Small text
      font_size_lg: "18px"         # Large text
      line_height: "1.6"           # Base line height
      heading_weight: "700"        # Heading font weight
      heading_letter_spacing: "-0.02em"

    # Spacing
    spacing:
      sidebar_width: "280px"
      toc_width: "240px"
      header_height: "56px"
      content_max_width: "800px"
      content_padding: "2rem"
      section_gap: "2rem"

    # Borders
    border_radius:
      small: "6px"                 # Buttons, inputs
      medium: "12px"               # Cards, panels
      large: "16px"                # Modals, major containers

    # Transitions
    transitions:
      duration: "200ms"
      easing: "cubic-bezier(0.4, 0, 0.2, 1)"

    # Shadows
    shadows:
      small: "0 1px 3px rgba(0,0,0,0.3)"
      medium: "0 4px 12px rgba(0,0,0,0.4)"
      large: "0 8px 24px rgba(0,0,0,0.5)"
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/base.html` — read `theme.neoabs.colors`, `typography`, `spacing`, etc. from config, render as CSS custom properties in a `<style>` block inside `<head>` (before loading `neoabs.css`)
- `neoabs/plugins/neoabs_plugin.py` — validate and merge token overrides into `config.extra` so templates can access them
- No SCSS changes needed — CSS custom properties cascade naturally

### Example usage

```yaml
theme:
  neoabs:
    colors:
      primary: "#00ff88"
    typography:
      font_family: "Inter, sans-serif"
    spacing:
      sidebar_width: "320px"
```

---

## Phase 2: Component Visibility Toggles

**Goal:** Enable/disable any individual component or UI section from `mkdocs.yml`.

### Config additions under `theme.neoabs:`

```yaml
theme:
  neoabs:
    components:
      # Header
      header:
        show: true                 # Show/hide entire header
        show_logo: true            # Show site logo
        show_site_name: true       # Show site name text
        show_search: true          # Show search button
        show_repo_link: true       # Show repository link
        show_palette_toggle: true  # Show dark/light toggle
        show_page_title: true      # Show current page title (left side)

      # Sidebar (left navigation)
      sidebar:
        show: true                 # Show/hide entire sidebar

      # Table of Contents (right sidebar)
      toc:
        show: true                 # Show/hide entire TOC
        title: "On this page"      # Custom TOC title
        show_level_h2: true        # Show h2 headings
        show_level_h3: true        # Show h3 headings
        show_level_h4: true        # Show h4 headings

      # Footer
      footer:
        show: true                 # Show/hide entire footer
        show_prev_next: true       # Show prev/next navigation
        show_copyright: true       # Show copyright text
        copyright_text: ""         # Custom copyright (overrides config.copyright)

      # Content area
      content:
        show: true                 # Show/hide content area
        show_progress_bar: true    # Reading progress bar at top
        show_back_to_top: true     # Back-to-top floating button

      # Search
      search:
        show: true                 # Show/hide search functionality
        shortcut_key: "/"          # Keyboard shortcut to open search
        placeholder: "Search..."  # Search input placeholder

      # Notes / Annotations
      notes:
        show: true                 # Show/hide notes system

      # Code blocks
      code:
        show_copy_button: true     # Copy-to-clipboard button

      # Admonitions
      admonitions:
        show: true                 # Enable admonition styling

      # Mermaid diagrams
      mermaid:
        show: true                 # Enable mermaid rendering
        cdn_url: ""                # Custom mermaid CDN URL

      # Math / KaTeX
      math:
        show: true                 # Enable math rendering
        cdn_url: ""                # Custom KaTeX CDN URL

      # Highlight.js
      highlighting:
        show: true                 # Enable code highlighting
        cdn_url: ""                # Custom highlight.js CDN URL
        theme_dark: "github-dark"  # hljs theme for dark mode
        theme_light: "github"      # hljs theme for light mode

      # Repo popover (GitHub info on hover)
      repo_popover:
        show: true                 # Show repo info popover on hover

      # Tags / Pills
      tags:
        show: true                 # Enable tag styling

      # Toast notifications
      toast:
        show: true                 # Enable toast notification system

      # Keyboard help modal
      keyboard_help:
        show: true                 # Enable keyboard shortcuts help (? key)
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py` — merge component config with defaults, inject into `config.extra`
- `neoabs/templates/base.html` — conditionally render dot matrix, search dialog, progress bar, TOC, sidebar based on component toggles
- `neoabs/templates/partials/header.html` — conditionally render each header element
- `neoabs/templates/partials/footer.html` — conditionally render footer sections
- `neoabs/templates/partials/toc.html` — conditionally render TOC heading levels
- `neoabs/templates/partials/search.html` — apply custom placeholder
- `neoabs/templates/assets/javascripts/neoabs.js` — respect toggles: skip `initNotes()`, `initCopyButtons()`, `initMermaid()`, `initMath()`, `initHighlighting()`, `initKeyboardNav()` when disabled; pass toggles via `__config`

---

## Phase 3: Header & Navbar Full Customization

**Goal:** Full control over header layout, items, and behavior.

### Config additions

```yaml
theme:
  neoabs:
    header:
      position: "fixed"            # "fixed" | "sticky" | "static"
      glass: true                  # Glass morphism on header
      blur: true                   # Backdrop blur
      border_bottom: true          # Bottom border line
      height: "56px"               # Header height
      z_index: 100                 # Z-index layer

      # Center brand section
      brand:
        show: true
        logo_height: 26            # Logo height in px
        show_site_name: true
        site_name_suffix: ""       # e.g. "Documentation" or ""

      # Left section
      left:
        show_page_title: true
        show_hamburger: true       # Mobile hamburger menu

      # Right section (order matters for rendering)
      right:
        - type: palette_toggle     # Dark/light mode switcher
        - type: search             # Search button
        - type: repo_link          # Repository link
        # Future: custom items (see Phase 6)
```

### Custom header items

```yaml
      right:
        - type: link
          label: "Changelog"
          url: "https://github.com/user/repo/releases"
          icon: "external"         # "external" | "github" | "gitlab" | custom SVG path
          new_tab: true
        - type: link
          label: "API Reference"
          url: "/api/"
          icon: "code"
        - type: button
          label: "Star on GitHub"
          url: "https://github.com/user/repo"
          style: "primary"         # "primary" | "glass" | "outline"
          icon: "star"
          new_tab: true
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/partials/header.html` — refactor to read `header.left`, `header.center.brand`, `header.right` arrays from config, loop through items and render conditionally
- `neoabs/templates/assets/stylesheets/components.scss` — add CSS for custom header item types (link, button styles)
- `neoabs/templates/assets/stylesheets/neoabs.scss` — update CSS custom properties for header height, glass, etc.

---

## Phase 4: Footer Full Customization

**Goal:** Full control over footer layout and content.

### Config additions

```yaml
theme:
  neoabs:
    footer:
      position: "relative"         # "relative" (default, at page end)
      glass: true
      border_top: true
      layout: "default"            # "default" | "minimal" | "extended"

      prev_next:
        show: true
        show_arrow: true           # Show < > arrows
        show_title: true           # Show page title

      copyright:
        show: true
        text: ""                   # Custom text (overrides config.copyright)
        show_year: true            # Auto-insert current year

      # Social / links section
      social:
        - icon: "github"
          url: "https://github.com/user"
          label: "GitHub"
        - icon: "twitter"
          url: "https://twitter.com/user"
          label: "Twitter"
        - icon: "discord"
          url: "https://discord.gg/invite"
          label: "Discord"
        - icon: "custom"           # Custom SVG
          svg: "<svg>...</svg>"
          url: "https://example.com"
          label: "Custom"

      # Footer columns (extended layout)
      columns:
        - title: "Product"
          links:
            - label: "Features"
              url: "/features/"
            - label: "Pricing"
              url: "/pricing/"
        - title: "Resources"
          links:
            - label: "Documentation"
              url: "/docs/"
            - label: "Blog"
              url: "/blog/"
        - title: "Community"
          links:
            - label: "GitHub"
              url: "https://github.com/user"
            - label: "Discord"
              url: "https://discord.gg/invite"
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/partials/footer.html` — render social links, footer columns, custom copyright
- `neoabs/templates/assets/stylesheets/components.scss` — add social icon grid, footer column layout, extended footer styles
- `neoabs/templates/assets/stylesheets/neoabs.scss` — update footer CSS variables

---

## Phase 5: Sidebar & Navigation Customization

**Goal:** Full control over sidebar appearance and behavior.

### Config additions

```yaml
theme:
  neoabs:
    sidebar:
      position: "left"             # "left" | "right" (swap sidebar and TOC)
      width: "280px"
      collapsible: true            # Can be collapsed with Ctrl+Shift+B
      default_collapsed: false     # Start collapsed
      glass: true
      blur: true

      nav:
        show_toggle_buttons: true  # Expand/collapse chevrons
        show_active_border: true   # Red left border on active item
        active_border_color: ""    # Override active border color (uses primary)
        indent_nested: true        # Indent nested items
        indent_size: "16px"        # Nesting indent per level
        max_depth: 4               # Maximum nesting depth

      # Section headings (from nav YAML)
      sections:
        show: true                 # Show section headings
        style: "uppercase"         # "uppercase" | "bold" | "default"
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/base.html` — apply sidebar position, width, collapsed state via data attributes
- `neoabs/templates/partials/nav.html` — respect indent, max depth, toggle button visibility
- `neoabs/templates/assets/stylesheets/components.scss` — update sidebar CSS variables
- `neoabs/templates/assets/javascripts/neoabs.js` — respect `default_collapsed`, `collapsible`

---

## Phase 6: TOC Customization

**Goal:** Full control over the right sidebar table of contents.

### Config additions

```yaml
theme:
  neoabs:
    toc:
      show: true
      position: "right"            # "right" | "left" (swap with sidebar)
      width: "240px"
      title: "On this page"
      title_style: "uppercase"     # "uppercase" | "bold" | "default"
      collapsible: true            # Can be collapsed with Ctrl+Shift+T
      default_collapsed: false
      glass: true

      # Heading levels to show
      levels:
        h2: true
        h3: true
        h4: true
        h5: false
        h6: false

      # Active heading tracking
      tracking:
        enabled: true              # IntersectionObserver-based highlighting
        offset: 100px              # Scroll offset for activation

      # Permalink
      permalink: true              # Show # anchor link on headings
      permalink_symbol: "#"        # Custom permalink symbol
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/partials/toc.html` — render based on `levels` config, custom title
- `neoabs/templates/base.html` — apply TOC position, width, collapsed state
- `neoabs/templates/assets/stylesheets/components.scss` — update TOC CSS variables
- `neoabs/templates/assets/javascripts/neoabs.js` — respect tracking offset, permalink config

---

## Phase 7: Keyboard Shortcuts Customization

**Goal:** Full control over keyboard shortcuts and the help modal.

### Config additions

```yaml
theme:
  neoabs:
    keyboard:
      enabled: true                # Enable all keyboard shortcuts

      shortcuts:
        search:
          key: "/"                 # Open search
          label: "Open search"
          enabled: true
        close:
          key: "Escape"           # Close overlays
          label: "Close active overlay"
          enabled: true
        search_up:
          key: "ArrowUp"
          label: "Navigate search results up"
          enabled: true
        search_down:
          key: "ArrowDown"
          label: "Navigate search results down"
          enabled: true
        search_open:
          key: "Enter"
          label: "Open selected result"
          enabled: true
        tab_left:
          key: "ArrowLeft"
          label: "Switch to previous tab"
          enabled: true
        tab_right:
          key: "ArrowRight"
          label: "Switch to next tab"
          enabled: true
        toggle_sidebar:
          key: "Ctrl+Shift+B"
          label: "Toggle sidebar"
          enabled: true
          persisted: true          # Remember collapsed state
        toggle_toc:
          key: "Ctrl+Shift+T"
          label: "Toggle table of contents"
          enabled: true
          persisted: true
        toggle_notes:
          key: "Ctrl+Shift+N"
          label: "Toggle notes panel"
          enabled: true
        help:
          key: "?"
          label: "Show keyboard shortcuts"
          enabled: true

      # Custom shortcuts (user-defined)
      custom:
        - key: "g"
          label: "Go to top"
          action: "scroll_to_top"  # Built-in action names
        - key: "r"
          label: "Toggle reading mode"
          action: "toggle_reading_mode"
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/assets/javascripts/neoabs.js` — `initKeyboardNav()` reads shortcut config from `__config.neoabs.keyboard`, binds only enabled shortcuts; custom shortcuts trigger via a registry pattern
- `neoabs/templates/assets/javascripts/neoabs.js` — `toggleKeyboardHelp()` renders only enabled shortcuts in the modal
- `neoabs/plugins/neoabs_plugin.py` — validate shortcut keys, inject into config

---

## Phase 8: Custom CSS, Custom JS & Head Injection

**Goal:** Let developers inject custom styles, scripts, and meta tags without forking the theme.

### Config additions

```yaml
theme:
  extra_css:
    - assets/stylesheets/custom.css    # Local CSS files
    - "https://cdn.example.com/theme.css"  # External CSS

  extra_javascript:
    - assets/javascripts/custom.js     # Local JS files
    - "https://cdn.example.com/widget.js"  # External JS

  extra:
    neoabs_custom_head: |
      <meta name="theme-color" content="#000000">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <style>.my-class { color: red; }</style>

    neoabs_custom_body_start: |
      <!-- Custom banner -->
      <div id="announcement">New release!</div>

    neoabs_custom_body_end: |
      <!-- Analytics -->
      <script>console.log("custom")</script>

    neoabs_custom_html_attrs: 'data-custom="true" lang="en"'
```

### Config additions under `theme.neoabs:`

```yaml
theme:
  neoabs:
    custom_css: []                  # Additional CSS file paths (merged with theme.extra_css)
    custom_js: []                   # Additional JS file paths (merged with theme.extra_javascript)
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/base.html`:
  - Add `{% block custom_head %}` that renders `neoabs_custom_head` raw HTML
  - Add `{% block custom_body_start %}` at top of `<body>`
  - Add `{% block custom_body_end %}` before `</body>`
  - Loop over `extra_css` and `extra_javascript` lists to inject additional files
  - Apply `neoabs_custom_html_attrs` to `<html>` tag
- No plugin changes needed — these are pure template blocks

---

## Phase 9: Advanced Visual Customization

**Goal:** Fine-grained visual control beyond design tokens.

### Config additions

```yaml
theme:
  neoabs:
    # Glass morphism (enhanced)
    glass:
      intensity: "medium"          # "light" | "medium" | "heavy" | "none"
      blur: true                   # Backdrop filter blur
      blur_amount: "12px"          # Custom blur radius
      opacity: 0.8                 # Background opacity
      saturation: true             # Backdrop saturate filter

    # Dot matrix (NothingOS style)
    dot_matrix:
      enabled: true
      color: ""                    # Dot color (default: theme border color)
      size: "2px"                  # Dot size
      gap: "24px"                  # Dot spacing
      opacity: 0.3                 # Dot opacity
      position: "fixed"            # "fixed" | "absolute"

    # Animations (enhanced)
    animation:
      mode: "normal"               # "normal" | "reduced" | "none"
      page_transition: true        # Page load fade-in
      hover_effects: true          # Hover scale/transform effects
      scroll_animations: true      # Animate elements on scroll
      toast_animation: true        # Toast slide-in/out

    # Borders (enhanced)
    border:
      width: "thin"                # "none" | "thin" | "thick"
      style: "solid"               # "solid" | "dashed" | "dotted"
      color: ""                    # Override border color (default: CSS var)

    # Shadows (enhanced)
    shadows:
      enabled: true
      style: "default"             # "default" | "subtle" | "none"

    # Scrollbar
    scrollbar:
      show: true
      style: "thin"                # "thin" | "default" | "none"
      color: ""                    # Custom scrollbar color

    # Selection
    selection:
      background: ""               # Text selection background color
      color: ""                    # Text selection text color
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/base.html` — render enhanced visual config as additional CSS custom properties in the `<style>` block (extending Phase 1)
- `neoabs/templates/assets/stylesheets/neoabs.scss` — update default values for all these variables (they already exist as CSS custom properties; the template override simply sets them before the stylesheet loads)
- `neoabs/templates/assets/stylesheets/components.scss` — ensure all components reference the CSS custom properties consistently

---

## Phase 10: Search Customization

**Goal:** Full control over search behavior and appearance.

### Config additions

```yaml
theme:
  neoabs:
    search:
      enabled: true
      shortcut_key: "/"
      placeholder: "Search documentation..."
      min_chars: 2                  # Minimum characters before searching
      max_results: 10              # Maximum results to display
      show_context: true           # Show context snippet
      context_length: 120          # Characters of context
      highlight_results: true      # Highlight search terms in results
      suggest: true                # Show search suggestions
      style: "modal"               # "modal" | "dropdown" (future)

      # Search UI customization
      ui:
        glass: true                # Glass morphism on search dialog
        overlay_opacity: 0.5       # Backdrop overlay opacity
        show_shortcuts: true       # Show keyboard shortcut hints in footer

      # Search result customization
      result:
        show_icon: true            # Show page icon
        show_breadcrumb: true      # Show page path
        show_highlights: true      # Show highlighted terms
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/partials/search.html` — apply custom placeholder, shortcut hints
- `neoabs/templates/assets/stylesheets/components.scss` — update search dialog styles based on config
- `neoabs/templates/assets/javascripts/neoabs.js` — `initSearch()` reads search config from `__config`, applies min_chars, max_results, highlight settings
- `neoabs/templates/base.html` — conditionally render search dialog based on `search.enabled`

---

## Phase 11: Content Area Customization

**Goal:** Full control over content rendering, also add more build-in icon, and features.

### Config additions

```yaml
theme:
  neoabs:
    content:
      max_width: "800px"
      padding: "2rem"
      glass: false                 # Glass morphism on content area
      show_progress_bar: true
      progress_bar_color: ""       # Override progress bar color (uses primary)
      show_back_to_top: true
      back_to_top_threshold: 500   # Scroll px before showing button
      back_to_top_label: "Back to top"

      # Typography overrides per content
      typography:
        heading_anchor: true       # Show # permalink on headings
        anchor_symbol: "#"         # Custom anchor symbol
        link_behavior: "smooth"    # "smooth" | "instant"
        image_behavior: "normal"   # "normal" | "lazy" (lazy loading)
        video_behavior: "responsive" # "responsive" | "normal"

      # Code blocks
      code:
        show_copy_button: true
        copy_label: "Copy"
        copied_label: "Copied!"
        show_line_numbers: false
        line_number_start: 1
        highlight_lines: true
        line_number_color: ""      # Override line number color

      # Admonitions
      admonitions:
        enabled: true
        types:
          note: { color: "", icon: "" }
          tip: { color: "", icon: "" }
          warning: { color: "", icon: "" }
          danger: { color: "", icon: "" }
          info: { color: "", icon: "" }
          success: { color: "", icon: "" }

      # Tables
      tables:
        responsive: true           # Horizontal scroll on small screens
        striped: false             # Zebra striping
        bordered: false            # Cell borders

      # Task lists
      task_lists:
        enabled: true
        custom_checkbox: true
        persist_state: true        # Remember checked state in localStorage
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py` — resolve the new `theme.neoabs.content` surface into `extra.neoabs_content` (deep-merged defaults) and propagate explicitly-set keys onto the legacy `components` toggles so existing template/JS reads keep working
- `neoabs/templates/base.html` — emit content data attributes, serialize the `content` config into `#__config`, and render the inline content-token override block
- `neoabs/templates/partials/progress.html` — apply custom color
- `neoabs/templates/assets/stylesheets/components.scss` — update content max-width, padding, progress bar color, admonition colors, line-number color, tables, task lists, content glass
- `neoabs/templates/assets/stylesheets/neoabs.scss` — update content CSS variables
- `neoabs/templates/assets/javascripts/neoabs.js` — respect code.copy_label, back_to_top config, task list persistence, typography behaviors, code line numbers
- `mkdocs.yml` — Phase 11 reference block + `neoabs_version` bump

---

## Phase 12: Global Branding & Meta

**Goal:** Full control over site branding, meta tags, and OpenGraph.

### Config additions

```yaml
theme:
  # Already supported by MkDocs:
  logo: assets/images/logo.svg
  favicon: assets/images/favicon.svg

  extra:
    # Already supported:
    neoabs_logo_dark: <url>
    neoabs_logo_light: <url>
    neoabs_favicon_dark: <path>
    neoabs_favicon_light: <path>

    # New:
    neoabs_og_image: "https://example.com/og-image.png"   # OpenGraph image
    neoabs_theme_color: "#000000"                          # Browser theme-color meta
    neoabs_manifest: "/manifest.json"                      # PWA manifest link
    neoabs_twitter_handle: "@username"                     # Twitter card @handle

    # Site identity
    neoabs_site_tagline: "Glass + NothingOS Design"        # Subtitle below site name
    neoabs_site_badge: ""                                  # Version badge text (e.g. "v0.1.2")
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/base.html`:
  - Add OpenGraph meta tags from `neoabs_og_image`
  - Add `<meta name="theme-color">` from `neoabs_theme_color`
  - Add PWA manifest `<link>` from `neoabs_manifest`
  - Add Twitter card meta tags from `neoabs_twitter_handle`
- `neoabs/templates/partials/header.html` — render site tagline and badge
- `neoabs/templates/assets/stylesheets/components.scss` — styles for the header tagline and version badge (matching the existing brand/site-name styling; defaults fit the current header)

---

## Phase 13: Page-Level Overrides (Front Matter)

**Goal:** Let individual pages override theme settings via front matter.

### Supported front matter keys

```yaml
---
title: "My Page"
neoabs:
  # Override any Phase 1-12 setting for this page only
  header:
    show: false                    # Hide header on this page
  sidebar:
    show: false                    # Hide sidebar on this page
  toc:
    show: false                    # Hide TOC on this page
    levels:
      h3: false                    # Hide h3 from TOC
  footer:
    show: false                    # Hide footer on this page
  content:
    show_progress_bar: false       # Hide progress bar
    glass: true                    # Enable glass on content area
  glass: "heavy"                   # Override glass intensity
  dot_matrix: false                # Override dot matrix
  custom_css: "page-specific.css"  # Additional CSS for this page only
  layout: "wide"                   # "default" | "wide" | "full" (content width)
---
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/templates/base.html` — read `page.meta.neoabs` and apply overrides before default config
- `neoabs/templates/partials/header.html`, `footer.html`, `toc.html`, `nav.html` — check page-level overrides
- `neoabs/templates/assets/javascripts/neoabs.js` — receive page-level overrides via `__config`
- `neoabs/templates/base.html` — inject per-page CSS file if `custom_css` is set

---

## Phase 14: Plugin Configuration Passthrough

**Goal:** All plugin settings configurable from `mkdocs.yml` without touching code.

### Config additions

```yaml
plugins:
  - neoabs:
      glass: medium
      dot_matrix: true
      animation: normal
      border: thin
      highlight: true
      notes: true
      notes_ttl: 259200000
      # All Phase 1-12 settings also accessible here as a convenience:
      # (merged with theme.neoabs, plugin takes precedence)
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — new features default to
>   ON (or keep their previous default value).
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py` — accept all config keys from the plugin config dict, merge with `theme.neoabs` (plugin overrides theme), validate types

---

## Phase 15: Reading Mode

**Goal:** One keypress (default `Alt+Shift+R`) enters a distraction-free
reading view: hide the header, left sidebar, right sidebar (TOC), footer, and
progress chrome; keep only the article and the notes panel on screen; switch
the colour theme to a built-in **Ink** palette; and make every aspect of the
view configurable from `mkdocs.yml` exactly like the other phases.

### Config additions

```yaml
theme:
  neoabs:
    # Built-in keyboard shortcut (Phase 7 layer; listed in the help modal)
    keyboard:
      shortcuts:
        toggle_reading_mode:
          key: "Alt+Shift+R"          # Enter/exit reading mode
          label: "Toggle reading mode"
          enabled: true
          persisted: true             # Remember the state across reloads

    reading_mode:
      enabled: true                   # Master switch; OFF disables the whole feature
      shortcut_key: "Alt+Shift+R"     # Default key (keyboard.shortcuts above wins if set)

      sections:                       # What is hidden while reading (default: all)
        header: true                  #   top header / navbar
        sidebar: true                 #   left navigation sidebar (.neoabs-nav)
        toc: true                     #   right table of contents (.neoabs-toc)
        footer: true                  #   footer + prev/next nav (.neoabs-footer)
        progress: true                #   reading progress bar + back-to-top button

      notes:
        show: true                    # Keep the notes button/panel usable while reading
        open_on_enter: false          # Auto-open the notes panel when entering

      persisted: true                 # Restore reading mode on the next visit

      scheme:
        enabled: true                 # Allow reading-mode colour overrides
        name: "ink"                   # Optional label; unused by the engine
        colors:                       # Phase 1 token overrides (empty = inherit active scheme)
          background: "#000000"       #   (--neoabs-ink)
          surface: ""                 #   glass panels (--neoabs-glass-bg)
          text: "#ffffff"             #   (--neoabs-text-primary)
          text_secondary: ""          #   (--neoabs-text-secondary)
          border: ""                  #   (--neoabs-glass-border)
          accent: "#ff3030"           #   links / highlights (--neoabs-accent)

      typography:                     # Reading measure + type scale
        font_size: "1.125rem"         #   --neoabs-reading-font-size
        line_height: "1.75"           #   --neoabs-reading-line-height
        measure: "100%"               #   max content width (--neoabs-reading-measure)
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; extend it or hide it via config only.
> - **Don't remove any feature** — everything the theme does today keeps
>   working; disabling happens through config defaults, never by removal.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed. The existing
>   `toggleReadingMode()` / `resolveKeyboardAction()` entry points stay; this
>   phase **extends** them and adds `initReadingMode()`.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — the feature is ON by
>   default (`enabled: true`, shortcut bound). Hiding/recolouring only applies
>   *while reading mode is active*; outside of it nothing changes.
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Notes on the mechanism (no element is ever deleted):**
- Reading mode is a *view state*. JS toggles the existing body class
  `neoabs-reading-mode` (kept, per the rules above) and an `active` marker on
  `<html>`: `data-md-neoabs-reading="active"` (removed → `off` when exiting).
- Sections disappear through CSS `display: none` driven by that attribute —
  the DOM, templates, and features are untouched, mirroring how
  `.neoabs-nav-hidden` / `.neoabs-toc-hidden` already work.
- The reading view keeps the **active colour scheme** — the theme's dark
  NothingOS look by default, or the user's own light/dark palette if they
  toggled one. No tokens are forced; `reading_mode.scheme.colors` (when the
  author opts in) emits Phase 1 token overrides scoped to
  `html[data-md-neoabs-reading="active"]`, so colors apply only while the
  `active` attribute is present and revert on exit. Phase 9
  `prefers-reduced-motion` and the existing transition tokens apply.

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py`:
  - Add `_NEOABS_DEFAULT_READING_MODE` with the all-ON defaults above. No
    palette is baked in by default — the view inherits the active colour
    scheme (dark); `scheme.colors` is an optional author override.
  - Deep-merge user `theme.neoabs.reading_mode`, then validate with clear
    `ConfigurationError` messages (same style as `_validate_keyboard`):
    booleans for `enabled` / `sections.*` / `notes.*` / `persisted` /
    `scheme.enabled`; non-empty strings for `shortcut_key`, `scheme.name`,
    and `typography.*`; `scheme.colors` keys restricted to the Phase 1
    `_NEOABS_TOKEN_MAP["colors"]` set.
  - Sync into the Phase 7 keyboard layer: seed
    `keyboard.shortcuts.toggle_reading_mode` from
    `{key: reading_mode.shortcut_key, label: "Toggle reading mode",
    enabled: reading_mode.enabled, persisted: reading_mode.persisted}`
    **before** the Phase 7 deep-merge, so an explicit
    `keyboard.shortcuts.toggle_reading_mode` still wins.
  - Emit `extra["neoabs_reading_mode"] = reading_mode` (like
    `neoabs_keyboard` / `neoabs_content`).
- `neoabs/templates/base.html`:
  - Add `data-md-neoabs-reading-hide="header sidebar toc footer progress"`
    to `<html>` listing only the `sections.<name>` set to true, and
    `data-md-neoabs-reading-notes="false"` when `notes.show` is false.
  - Render the configured `scheme.colors` overrides (when the author sets any)
    + typography into the Phase 1 token `<style>` override block, scoped to
    `html[data-md-neoabs-reading="active"] { ... }` (user values win over
    anything emitted by the compiled CSS; `scheme.enabled: false` emits
    nothing, keeping the active scheme untouched).
  - Add `"reading_mode": {{ config.extra.neoabs_reading_mode | default({}) | tojson }}`
    to the `#__config` JSON.
- `neoabs/templates/assets/stylesheets/neoabs.scss`:
  - Add `--neoabs-reading-font-size`, `--neoabs-reading-line-height`,
    `--neoabs-reading-measure` defaults to the `:root` token block.
- `neoabs/templates/assets/stylesheets/components.scss`:
  - No default palette is emitted — the view inherits the active colour
    scheme (dark by default); `scheme.colors` overrides come from the
    `#neoabs-reading-tokens` block in `base.html`.
  - Section hiding: `html[data-md-neoabs-reading="active"]` +
    `[data-md-neoabs-reading-hide~="sidebar"]` → `.neoabs-nav` hidden, and
    matching rules for `header`/`.neoabs-header`, `toc`/`.neoabs-toc`,
    `footer`/`.neoabs-footer`, `progress`/`.neoabs-progress` +
    `.neoabs-back-to-top`; `data-md-neoabs-reading-notes="false"` →
    `.neoabs-notes-btn` hidden.
  - Space reclaim + measure: `[data-md-neoabs-reading="active"] .neoabs-main`
    resets `margin-left/right: 0` (mirrors the existing `.neoabs-nav-hidden`
    rules) and `.neoabs-article` / `.neoabs-content` centers itself with
    `max-width: var(--neoabs-reading-measure)`.
  - Typography: keep the existing Phase 7
    `.neoabs-reading-mode .neoabs-article` stub intact and add token-driven
    rules under `[data-md-neoabs-reading="active"]` using
    `var(--neoabs-reading-font-size, ...)` / `var(--neoabs-reading-line-height, ...)`.
- `neoabs/templates/assets/javascripts/neoabs.js`:
  - Extend `toggleReadingMode()` (do not rename/delete): return early when
    `_config.reading_mode.enabled === false`; toggle
    `neoabs-reading-mode` on `<body>` and `data-md-neoabs-reading`
    `"active"`/`"off"` on `<html>`; persist `ui-reading-mode` when
    `persisted`; on enter, `notesSetOpen(true)` if `notes.open_on_enter`,
    and `notesSetOpen(false)` if `notes.show === false`.
  - New `initReadingMode()`: restore the persisted state on boot; bind the
    built-in keydown branch via the existing helpers —
    `kbdEnabled("toggle_reading_mode")` +
    `matchesKeyCombo(e, kbdKey("toggle_reading_mode", "Alt+Shift+R"))` →
    `preventDefault()` + `toggleReadingMode()`; register
    `keyboardActions.toggle_reading_mode = toggleReadingMode`. Register it in
    the boot init list.
  - Help modal: add the `toggle_reading_mode` row alongside the existing
    `toggle_notes` / `toggle_sidebar` / `toggle_toc` rows.
- `mkdocs.yml` + `PLAN.md` — add the Phase 15 reference block above after the
  Phase 14 block and record this phase in the implementation order / full
  default config sections.
- Harness: new `phase15-harness` (temp) verifying the default build shows no
  reading attributes, `Alt+Shift+R` binds, entering hides the configured
  sections and keeps the active colour scheme (dark by default),
  `scheme.colors` overrides apply when supplied, `notes.open_on_enter` /
  `notes.show: false` behave, `persisted` round-trips, `enabled: false`
  leaves the feature inert, and a bad config type fails the build with a
  clear message.

---

## Phase 16: Action Button Cluster (Plus Menu)

**Goal:** Evolve the floating notes launcher into a richer action hub: a single
"plus" button (an enhancement of the existing `.neoabs-notes-btn`) that expands
into a cluster of quick actions — **?** (keyboard shortcuts), **notes** (notes
panel), **timer** (focus timer), and **read** (reading mode). Every visual and
behavioral aspect is configurable from `mkdocs.yml`, and each action dispatches
through the existing `keyboardActions` registry so features built later (Phase
17 timer) light up automatically.

### Config additions

```yaml
theme:
  neoabs:
    # Phase 7 keyboard layer: shortcut to expand/collapse the cluster
    keyboard:
      shortcuts:
        toggle_action_cluster:
          key: "Alt+Shift+A"
          label: "Toggle action cluster"
          enabled: true
          persisted: false

    action_cluster:
      enabled: true                   # Master switch for the whole cluster
      position: "bottom-left"         #  bottom-left | bottom-right
      offset: { bottom: "16px", left: "16px" }

      main:
        icon: "plus"                  #  plus | menu | notes
        size: "44px"
        glass: true                   # Reuse the note-btn glass pill look
        icon_transform: true          # plus morphs into x while open

      behavior:
        min_actions: 2                # Hide the cluster if fewer actions are enabled
        close_on_select: true         # Collapse after an action is chosen
        close_on_escape: true
        close_on_outside: true
        animation: "normal"           #  normal | reduced | none (Phase 9 tokens apply)
        tooltips: true                # Show action labels on hover / focus
        focus_trap: true              # Keep Tab cycling inside the open cluster

      actions:                        # Each slot is independently configurable
        - id: keyboard_help           #  "?" icon
          icon: "help"
          label: "Keyboard shortcuts"
          enabled: true
        - id: notes                   #  notes icon
          icon: "notes"
          label: "Open notes panel"
          enabled: true
        - id: timer                   #  timer icon (engine lands in Phase 17)
          icon: "timer"
          label: "Focus timer"
          enabled: true
        - id: reading_mode            #  read icon (Phase 15 feature)
          icon: "reading"
          label: "Reading mode"
          enabled: true

      replaces_notes_button: true     # Keep hiding the standalone notes button
                                      # (display:none driven by data attr; the
                                      # notes feature, panel, and shortcut stay on)
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — the `.neoabs-notes-btn` element and
>   `notesEnsureUi()` keep existing; when `replaces_notes_button: true` the
>   button is hidden via an attribute-driven CSS rule, never deleted.
> - **Don't remove any feature** — notes, help, reading mode all keep their
>   existing entry points (`.neoabs-notes-btn` stays functional when config
>   allows); the cluster only adds new ones.
> - **Don't remove any function** — no existing JS function, Python method,
>   plugin hook, or init entry point may be deleted or renamed; add
>   `initActionCluster()` / `toggleActionCluster()` and extend the
>   `keyboardActions` registry.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — the cluster ships ON
>   (`enabled: true`, all four actions shown, shortcut bound). The `timer`
>   action button is rendered now; its handler (`keyboardActions.timer_toggle`)
>   is intentionally a Phase 17 dependency, following the Phase 15 precedent of
>   building on Phase 7 groundwork.
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py`:
  - Add `_NEOABS_DEFAULT_ACTION_CLUSTER` with the defaults above (including the
    four action slots and the icon/label/enabled per action).
  - Deep-merge user `theme.neoabs.action_cluster` and validate with clear
    `ConfigurationError` messages: booleans, `position` in the allowed set,
    `offset` keys as length strings, `icon` in the allowed set, `actions` a
    list of known `id`s with boolean `enabled`; unknown action `id`s and
    unknown `icon` values fail the build with the offending key named.
  - Sync the Phase 7 layer: seed `keyboard.shortcuts.toggle_action_cluster`
    before the Phase 7 deep-merge (so an explicit override wins).
  - Emit `extra["neoabs_action_cluster"] = action_cluster` (consumed by
    `#__config` and the `<html>` attribute emission below).
- `neoabs/templates/base.html`:
  - Emit `data-md-neoabs-action-cluster="replace-notes"` on `<html>` when
    `replaces_notes_button` is true (CSS then hides `.neoabs-notes-btn`).
  - Add `"action_cluster": {{ config.extra.neoabs_action_cluster | default({}) | tojson }}`
    to `#__config`.
- `neoabs/templates/assets/stylesheets/components.scss`:
  - `.neoabs-action-cluster` container: fixed positioning driven by
    `--neoabs-action-cluster-bottom` / `--neoabs-action-cluster-left`.
  - `.neoabs-action-cluster__main`: reuses the notes-btn glass-pill language
    (`--neoabs-glass-bg-strong`, `--neoabs-glass-border-strong`,
    `--neoabs-shadow-md`, `--neoabs-radius-pill`); the `plus` icon rotates 45°
    into an x when `.neoabs-action-cluster--open` (configurable via
    `icon_transform`).
  - `.neoabs-action-cluster__menu`: staggered reveal animation for the stacked
    action buttons; `aria-hidden`/inert handling not CSS — see JS.
  - `.neoabs-action-cluster[data-md-neoabs-action-cluster-tooltips="false"]`
    label suppression, `prefers-reduced-motion` no-animation override, and the
    hide rule `[data-md-neoabs-action-cluster="replace-notes"]
    .neoabs-notes-btn { display: none }`.
- `neoabs/templates/assets/javascripts/neoabs.js`:
  - New `initActionCluster()`: reads `_config.action_cluster`; builds the
    container from the configured `actions` list (inline SVG per icon: help,
    notes, timer, reading, plus); wires `aria-expanded` / `aria-controls`
    focus trap; Escape / outside-click / select close per `behavior`.
  - New `toggleActionCluster()`; register
    `keyboardActions.toggle_action_cluster = toggleActionCluster`;
    add the `toggle_action_cluster` keydown branch in `initKeyboardNav()`.
  - Dispatch: each action button calls
    `(keyboardActions[id] || resolveKeyboardAction(id))` — `keyboard_help →
    open_help`, `notes → toggle_notes`, `reading_mode → toggle_reading_mode`,
    `timer → timer_toggle` (registered by Phase 17). Register `initActionCluster`
    in the boot init list.
  - Help modal: add the `toggle_action_cluster` row with
    `kbdKey("toggle_action_cluster", "Alt+Shift+A")`.
- `mkdocs.yml` + `PLAN.md` — add the Phase 16 reference block and record the
  phase in the implementation order / full default config sections.
- Harness: new `phase16-harness` (temp) verifying defaults render the four
  actions, `Alt+Shift+A` binds, open/close state toggles the body/container
  class, `replaces_notes_button` emits the attr (notes button still present in
  DOM), a disabled action is not rendered, and an invalid action `id` / `icon`
  / `position` fails the build with a clear message.

---

## Phase 17: Focus Timer

**Goal:** A built-in focus timer controlled from the cluster's timer action or
its own shortcut: start/pause/reset, live status in the **TOC panel**, and a
dedicated chip while **reading mode** is active (the TOC is hidden there, so
the chip is the visible surface). A settings popup on the timer action lets the
reader configure the defaults; everything is configurable from `mkdocs.yml`.

### Config additions

```yaml
theme:
  neoabs:
    # Phase 7 keyboard layer
    keyboard:
      shortcuts:
        timer_toggle:
          key: "Alt+Shift+T"
          label: "Toggle focus timer"
          enabled: true

    timer:
      enabled: true                   # Master switch for the whole timer
      default_minutes: 25             # Duration used when starting fresh
      toc:
        show: true                    # Status widget inside the TOC panel
        position: "bottom"            #  top | bottom of the .neoabs-toc column
        style: "ring"                 #  ring | bar | digits
      reading:
        show: true                    # Chip visible while reading mode is active
      notifications:
        enabled: true
        toast: true                   #  neoabsToast("session complete")
        sound: true                   #  short WebAudio chime
      persist: true                   # Keep elapsed/remaining across reloads + SPA nav
      settings_popup: true            # Config popup opened from the timer action
      colors:
        progress: "#8a5a33"           # Ring/bar progress accent while running
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — the TOC widget and reading chip are new
>   elements injected into existing containers (`.neoabs-toc__inner` and
>   `<body>`); nothing existing is deleted.
> - **Don't remove any feature** — nothing the theme does today stops working;
>   when `toc.show` or `reading.show` are off, the widget/chip elements are
>   simply not injected (config gate, not removal).
> - **Don't remove any function** — timestamped tick engine, notes-UI pattern,
>   toast, and storage helpers are reused, not renamed; add `initFocusTimer()`
>   and the `focusTimerStart/Pause/Reset/Tick` helpers.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — the timer ships ON
>   (`enabled: true`, TOC widget, reading chip, notifications). Session state
>   is not started automatically; `default_minutes` only applies on start.
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py`:
  - Add `_NEOABS_DEFAULT_TIMER` with the defaults above.
  - Deep-merge and validate (clear `ConfigurationError`): booleans, positive
    integer `default_minutes`, `toc.position` / `toc.style` / allowed sets,
    string `colors.progress`. Emit `extra["neoabs_timer"] = timer` and seed
    `keyboard.shortcuts.timer_toggle` before the Phase 7 merge.
- `neoabs/templates/base.html`:
  - `#__config`: add `"timer": {{ config.extra.neoabs_timer | default({}) | tojson }}`.
- `neoabs/templates/assets/stylesheets/components.scss`:
  - `.neoabs-timer-toc`: compact widget inside `.neoabs-toc__inner` —
    `position: top|bottom` variants, `style: ring` (SVG circle +
    `stroke-dashoffset` driven by `--neoabs-timer-progress`), `style: bar`
    (thin gradient bar), `style: digits` (monospace mm:ss).
  - `.neoabs-timer-reading`: floating chip positioned inside `read` view —
    bound to `[data-md-neoabs-reading="active"]` so it appears exactly when
    the TOC is hidden, with the same glass styling family.
  - `.neoabs-timer-settings`: modal reuse of the `.neoabs-keyboard-help`
    pattern (overlay + panel + header + close).
- `neoabs/templates/assets/javascripts/neoabs.js`:
  - New `initFocusTimer()`: state machine (idle → running → paused) driven by
    `Date.now()` accounting (not `setInterval` count, so the browser throttling
    never drifts the time); `focusTimerStart(width)` / `focusTimerPause()` /
    `focusTimerReset()`; persists `{remaining, running, updatedAt}` under the
    `focus-timer` storage key when `persist` is on, restored on boot and on
    SPA route changes.
  - `focusTimerEnsureUi()` (mirrors `notesEnsureUi`): injects the TOC widget
    into `.neoabs-toc__inner` when `toc.show`, and the reading chip when
    `reading.show`; `focusTimerTick()` updates all surfaces from a single
    shared state.
  - `openTimerSettings()`: popup with fields for `default_minutes`,
    `toc.style`/`toc.position`, `reading.show`, `notifications.toast/sound`;
    values saved back to the store and applied live. The cluster timer action
    opens this popup when a session is idle, otherwise toggles
    start/pause (documented split in the plan so the acceptance tests are
    unambiguous).
  - Completion: `neoabsToast` + WebAudio chime when
    `notifications.enabled`; auto-reset to idle.
  - Register `keyboardActions.timer_toggle = function () { ... }` (start/pause/
    open-popup semantics above); bind the `timer_toggle` keydown branch; add
    the `timer_toggle` help-modal row. Register `initFocusTimer` in the boot
    init list.
- `mkdocs.yml` + `PLAN.md` — add the Phase 17 reference block and record the
  phase in the implementation order / full default config sections.
- Harness: new `phase17-harness` (temp) verifying the TOC widget renders per
  `position`/`style`, the reading chip appears only with
  `data-md-neoabs-reading="active"`, start/pause/reset transitions persist
  between two consecutive builds (store replayed), `default_minutes` respects
  the configured value, the settings popup round-trips user values, and a bad
  `default_minutes` type fails the build with a clear message.

---

## Phase 18: Action Shortcuts & Cluster Customization

**Goal:** Complete the keyboard surface for all cluster actions — every action
gets a configurable shortcut, the help modal lists them all, and the cluster /
timer gain the "more" customizations (per-action shortcut/badge, timer display
format, live tab-title countdown, auto-start when reading begins). Everything
remains `mkdocs.yml`-driven as in the other phases.

### Config additions

```yaml
theme:
  neoabs:
    # Phase 7 keyboard layer — full built-in keymap for the new actions
    keyboard:
      shortcuts:
        toggle_action_cluster: { key: "Alt+Shift+A", label: "Toggle action cluster", enabled: true }
        timer_toggle: { key: "Alt+Shift+T", label: "Toggle focus timer", enabled: true }
        # notes (Ctrl+Shift+N), help (?), reading mode (Alt+Shift+R) already built in

    action_cluster:
      actions:
        - id: timer
          shortcut: "Alt+Shift+T"    # Shown in tooltip + help modal
          badge: time                #  none | time  (remaining mm:ss on the action)
        - id: reading_mode
          shortcut: "Alt+Shift+R"
        - id: keyboard_help
          shortcut: "?"
        - id: notes
          shortcut: "Ctrl+Shift+N"

    timer:
      start_with_reading: false      # Auto-start (or restart) when reading mode turns on
      display_format: "mm:ss"        #  mm:ss | m:ss | "SS"
      document_title: true           # Show remaining time in the tab title while running
      badge_in_cluster: true         # Mirror the badge into the cluster timer action
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — no existing HTML, CSS rule/class, ID, or
>   markup may be deleted; everything here extends Phase 16/17 surfaces.
> - **Don't remove any feature** — cluster, timer, notes, help, reading mode
>   all keep behaving as before; this phase only adds configurability.
> - **Don't remove any function** — the Phase 16/17 init functions, the
>   `keyboardActions` registry, `toggleKeyboardHelp()` and `kbdKey/kbdEnabled`
>   helpers are untouched except for additive rows and registry entries.
> - **Don't make any typo** — every config key, CSS variable, class name, and
>   file path must be verified against the actual source before and after
>   every edit.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — all added surfaces default
>   to ON; `start_with_reading` and `document_title` default false/off only
>   because they change behavior *auto-starting* a session or *rewriting the
>   page title*, which the phase explicitly defines as opt-in.
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py`:
  - Extend `_NEOABS_DEFAULT_TIMER` and the `action_cluster.actions` schema with
    the keys above; validate (`shortcut` non-empty string, `badge` in
    `none|time`, booleans, `display_format` in the allowed set).
  - `timer.start_with_reading` syncs into the Phase 15 reading block merge
    (an explicit `reading_mode` key stays authoritative); emit the extended
    `extra["neoabs_timer"]` / `extra["neoabs_action_cluster"]`.
- `neoabs/templates/assets/javascripts/neoabs.js`:
  - Per-action `shortcut`: an additive keydown branch (parsed with the existing
    `matchesKeyCombo`) per configured action; rows for these appear in the help
    modal via `keyboardHelpRows()` regardless of whether they alias a built-in.
  - `badge: time`: the cluster timer action shows `mm:ss` (updated by
    `focusTimerTick()`), honoring `timer.badge_in_cluster`.
  - `document_title`: while running, `document.title = "<mm:ss> — <site>"`,
    restored on pause/reset (safe-edits only when `timer.document_title`).
  - `start_with_reading`: `toggleReadingMode()` (Phase 15) route — on entering
    reading mode with the config flag, `focusTimerStart()` is invoked if the
    session is idle (idempotent; does not restart a running session).
  - Help modal: ensure `toggle_action_cluster` + `timer_toggle` rows stay in
    sync with their (possibly overridden) keys.
- `neoabs/templates/assets/stylesheets/components.scss`:
  - `.neoabs-action-cluster__action--badge`: small `mm:ss` pill on the timer
    action; `.neoabs-timer-toc--digits`, `--ring`, `--bar` formatting refinements.
- `mkdocs.yml` + `PLAN.md` — add the Phase 18 reference block and update the
  implementation order / full default config sections.
- Harness: extend `phase17-harness` → `phase18-harness` (temp) verifying each
  action shortcut fires its handler via a synthetic keydown, the timer badge
  text updates, `document_title` is set/restored, `start_with_reading`
  auto-starts only from idle, and invalid `badge` / `display_format` /
  `shortcut` values fail the build with a clear message.

---

## Phase 19: AI-Readable Content Mode

**Goal:** Make every page directly readable by AI agents' `curl` / `webfetch`
tools. The plugin emits a clean, **watermarked markdown mirror** of each page
next to its HTML output (so `curl https://site/foo/bar.md` returns proper
structured markdown — no JS, no rendering), a machine-readable **`llms.txt`**
index at the site root, and an optional **`llms-full.txt`** with the whole site
concatenated; HTML output gains a machine-readable watermark + an `alternate`
link to the mirror so agents that fetch the HTML first can discover the
markdown. Everything is configurable from `mkdocs.yml`.

### Config additions

```yaml
theme:
  neoabs:
    ai_reader:
      enabled: true                   # Master switch for the whole feature
      markup: true                    # Emit per-page markdown mirrors (.md sidecars)

      url_style: "sidecar"            # sidecar (foo/bar.md) | inline (foo/bar/index.md)
      overwrite: false                # Never clobber an existing real .md source file
      auto_title: true                # Add "# <Title>" when the source has no H1
      exclude: []                     # src_path globs to skip (e.g. "drafts/*.md")

      llms: true                      # Emit llms.txt at the site root
      llms_full: true                 # Emit llms-full.txt (all mirrors concatenated)
      sitemap: true                   # List the mirror URLs in sitemap.xml

      description: ""                 # llms.txt description source override
                                      #  (empty = page.meta.description or page title)

      watermark:
        enabled: true
        header: true                  # Metadata block at the top of every mirror
        footer: true                  # Short closing line at the bottom
        text: "Generated by NeoAbs for AI agents."   # Marker line
        include_site: true            #   site_name
        include_url: true             #   canonical URL of the page
        include_generated: true       #   build timestamp (UTC)
        include_version: true         #   theme version

    # HTML-side discoverability (baseline markup, no extra config needed):
    #  <link rel="alternate" type="text/markdown" href="<mirror URL>">
    #  <!-- neoabs-ai-readable: <mirror URL> -->  at the very top of <body>
```

### Must follow (mandatory rules)

> **Binding rules for this phase** (see the ⚠️ Mandatory Working Rules at the
> top of the file). Violating any of these makes this phase a defect:
>
> - **Don't remove any element** — mirrors and indexes are new files; existing
>   HTML, CSS, JS, and features are untouched. HTML output only gains a
>   `<head>` `alternate` link and a leading comment.
> - **Don't remove any feature** — the normal site renders exactly as before;
>   the AI surface is additive and invisible to readers (only mirrored files
>   and llms indexes are added).
> - **Don't remove any function** — the plugin's existing `on_config` stays;
>   the phase adds `on_post_page` / `on_post_build` hooks and helpers.
> - **Don't make any typo** — every config key, glob, file path, and URL must
>   be verified against the actual source before and after every edit;
>   `data-md-*` attribute, `rel="alternate"` type, and llms.txt line format
>   (`<url>\t<description>`) are exact.
> - **Don't touch any code outside this phase's topic** — only the files
>   listed in this phase may be edited; anything else is out of scope.
> - **Don't miss any feature in this phase** — implement **every** config
>   key, template, and behavior listed above; nothing in this phase may be
>   skipped or left partially wired.
> - **Everything stays enabled/active by default** — the AI surface ships ON
>   (`enabled: true`, mirrors + llms.txt + llms-full.txt + watermarks).
>   `overwrite: false` and `auto_title: true` mirror only the defaults above.
> - **Verify before done** — `npm run build`, `mkdocs build --quiet`,
>   `npm test`, and the relevant harnesses must pass at the end of this
>   phase.

### Implementation

**Files to modify:**
- `neoabs/plugins/neoabs_plugin.py`:
  - Add `_NEOABS_DEFAULT_AI_READER` with the defaults above; deep-merge user
    `theme.neoabs.ai_reader` and validate with clear `ConfigurationError`
    messages (`url_style` in `sidecar|inline`, booleans, `exclude` a list of
    non-empty glob strings, watermark booleans + non-empty `text` when
    `watermark.enabled`).
  - New `on_post_page(output, page, config, files)` hook (the plugin currently
    only implements `on_config`, so this is purely additive):
    - Skip when `ai_reader.enabled`/`markup` is off, or `page.file.src_path`
      matches an `exclude` glob.
    - Derive the mirror destination from `page.file` / `page.url`
      (directory-URL aware): `url_style=sidecar` → `foo/bar.md`;
      `url_style=inline` → `foo/bar/index.md`. When `overwrite: false`, skip
      (and warn once) if a real source page already owns that destination.
    - Build the mirror from `page.markdown` (raw source, highest fidelity for
      agents), prepending/appending the `watermark` block (site, URL,
      generated timestamp, version, `text` marker — all gated by their
      `include_*` / `header` / `footer` keys) and adding `# <Title>` when
      `auto_title` is on and the source has no H1. Write it into
      `config["site_dir"]`.
    - Inject the HTML-side watermark: a `<!-- neoabs-ai-readable: <url> -->`
      comment before the rendered markup and
      `<link rel="alternate" type="text/markdown" href="<mirror>">` into the
      `<head>`, then return the modified `output`.
  - New `on_post_build(config)`:
    - Emit `llms.txt` at `site_dir` root when `llms` is on: title + one
      `<url>\t<description>` line per mirrored page (description from the
      configured `description` template, else `page.meta.description`, else
      the page title).
    - Emit `llms-full.txt` when `llms_full` is on: all watermarked mirrors
      concatenated with `\n\n--- (site) ---\n\n` separators.
    - When `sitemap` is on, append the mirror URLs to the generated
      `sitemap.xml` entries (deduped against existing `<loc>`).
- `neoabs/templates/base.html`:
  - Add `"ai_reader": {{ config.extra.neoabs_ai_reader | default({}) | tojson }}`
    to `#__config` for parity with the other phases (JS is NOT required for
    this feature — the mirrors and indexes are pure build output, which is
    what makes them `curl`/`webfetch`-friendly).
- `mkdocs.yml` + `PLAN.md` — add the Phase 19 reference block and record the
  phase in the implementation order / full default config sections; note in
  the D8 section that its *"sitemap/llms.txt wiring"* item is now delivered by
  Phase 19.
- Harness: new `phase19-harness` (temp) verifying: for a two-page doc,
  `foo.md` (sidecar) and `dir/index.md` (inline style) exist and contain the
  watermark (site/url/version lines); `auto_title` adds no duplicate H1;
  `exclude` and `overwrite` collision cases skip cleanly; `llms.txt` line
  format matches `<url>\t<description>`; `llms-full.txt` concatenation order;
  the HTML contains the `alternate` link + `neoabs-ai-readable` comment;
  `sitemap` lists the mirrors; and an invalid `url_style` / non-list `exclude`
  fails the build with a clear message. Verify a real `curl` of
  `http://site/foo.md` (or the local `mkdocs serve`) returns the mirror.

---

## Implementation Order

| Phase | Priority | Effort | Description |
|-------|----------|--------|-------------|
| 1 | High | Medium | Design token overrides (colors, typography, spacing) |
| 2 | High | Large | Component visibility toggles |
| 3 | High | Medium | Header/navbar full customization |
| 4 | High | Medium | Footer full customization |
| 5 | Medium | Small | Sidebar & navigation customization |
| 6 | Medium | Small | TOC customization |
| 7 | Medium | Small | Keyboard shortcuts customization |
| 8 | High | Small | Custom CSS/JS & head injection |
| 9 | Medium | Medium | Advanced visual customization |
| 10 | Medium | Small | Search customization |
| 11 | Medium | Medium | Content area customization |
| 12 | Low | Small | Global branding & meta |
| 13 | Medium | Medium | Page-level front matter overrides |
| 14 | Low | Small | Plugin config passthrough |
| 15 | Medium | Medium | Reading mode (Alt+Shift+R, Ink colour theme) |
| 16 | Medium | Medium | Action button cluster (plus menu with ?/notes/timer/read) |
| 17 | Medium | Medium | Focus timer (TOC status, reading chip, settings popup) |
| 18 | Low | Small | Action shortcuts & cluster customization ("and more") |
| 19 | Medium | Medium | AI-readable content mode (markdown mirrors, llms.txt, watermark) |

> **Per-phase checklist (rule 6):** each phase's config block above IS the
> acceptance list. Implement every listed key and behavior; a phase is done only
> when all of them work AND the Mandatory Working Rules are satisfied.

---

## Full Default Config (After All Phases)

```yaml
theme:
  name: neoabs
  logo: assets/images/logo.svg
  favicon: assets/images/favicon.svg
  language: en
  direction: ltr
  palette:
    - scheme: slate
      primary: black
      accent: red
      toggle:
        name: Switch to light mode
    - scheme: default
      primary: white
      accent: red
      toggle:
        name: Switch to dark mode
  font:
    text: Space Grotesk
    code: Space Mono
  features:
    - navigation.sections
    - navigation.top
    - navigation.footer
    - content.code.copy
    - search.suggest
    - search.highlight
  extra_css: []
  extra_javascript: []
  neoabs:
    # Phase 1: Design tokens
    colors: {}
    typography: {}
    spacing: {}
    border_radius: {}
    transitions: {}
    shadows: {}

    # Phase 2: Component toggles
    components:
      header: { show: true, show_logo: true, show_site_name: true, show_search: true, show_repo_link: true, show_palette_toggle: true, show_page_title: true }
      sidebar: { show: true }
      toc: { show: true, levels: { h2: true, h3: true, h4: true } }
      footer: { show: true, show_prev_next: true, show_copyright: true }
      content: { show: true, show_progress_bar: true, show_back_to_top: true }
      search: { show: true }
      notes: { show: true }
      code: { show_copy_button: true }
      admonitions: { show: true }
      mermaid: { show: true }
      math: { show: true }
      highlighting: { show: true }
      repo_popover: { show: true }
      tags: { show: true }
      toast: { show: true }
      keyboard_help: { show: true }

    # Phase 3: Header
    header: { position: "fixed", glass: true, height: "56px", brand: { show: true, logo_height: 26, show_site_name: true }, right: [palette_toggle, search, repo_link] }

    # Phase 4: Footer
    footer: { glass: true, prev_next: { show: true }, copyright: { show: true }, social: [] }

    # Phase 5: Sidebar
    sidebar: { position: "left", width: "280px", collapsible: true, glass: true, nav: { show_toggle_buttons: true, show_active_border: true, indent_nested: true } }

    # Phase 6: TOC
    toc: { position: "right", width: "240px", title: "On this page", collapsible: true, levels: { h2: true, h3: true, h4: true }, tracking: { enabled: true } }

    # Phase 7: Keyboard
    keyboard:
      enabled: true
      shortcuts:
        toggle_reading_mode: { key: "Alt+Shift+R", label: "Toggle reading mode", enabled: true, persisted: true }
        toggle_action_cluster: { key: "Alt+Shift+A", label: "Toggle action cluster", enabled: true }
        timer_toggle: { key: "Alt+Shift+T", label: "Toggle focus timer", enabled: true }

    # Phase 9: Visual
    glass: { intensity: "medium", blur: true, blur_amount: "12px" }
    dot_matrix: { enabled: true }
    animation: { mode: "normal" }
    border: { width: "thin" }

    # Phase 10: Search
    search: { enabled: true, shortcut_key: "/", placeholder: "Search...", min_chars: 2, max_results: 10 }

    # Phase 11: Content
    content: { max_width: "800px", code: { show_copy_button: true }, admonitions: { enabled: true } }

    # Phase 15: Reading mode
    reading_mode:
      enabled: true
      shortcut_key: "Alt+Shift+R"
      sections: { header: true, sidebar: true, toc: true, footer: true, progress: true }
      notes: { show: true, open_on_enter: false }
      persisted: true
      scheme:
        enabled: true
        name: "ink"
        colors: {}                   # empty = inherit the active colour scheme (dark default)
      typography: { font_size: "1.125rem", line_height: "1.75", measure: "100%" }

    # Phase 16: Action cluster (plus menu)
    action_cluster:
      enabled: true
      position: "bottom-left"
      offset: { bottom: "16px", left: "16px" }
      main: { icon: "plus", size: "44px", glass: true, icon_transform: true }
      behavior: { min_actions: 2, close_on_select: true, close_on_escape: true, close_on_outside: true, animation: "normal", tooltips: true, focus_trap: true }
      actions:
        - { id: keyboard_help, icon: "help", label: "Keyboard shortcuts", shortcut: "?", badge: none, enabled: true }
        - { id: notes, icon: "notes", label: "Open notes panel", shortcut: "Ctrl+Shift+N", badge: none, enabled: true }
        - { id: timer, icon: "timer", label: "Focus timer", shortcut: "Alt+Shift+T", badge: time, enabled: true }
        - { id: reading_mode, icon: "reading", label: "Reading mode", shortcut: "Alt+Shift+R", badge: none, enabled: true }

    # Phase 17 + 18: Focus timer
    timer:
      enabled: true
      default_minutes: 25
      toc: { show: true, position: "bottom", style: "ring" }
      reading: { show: true }
      notifications: { enabled: true, toast: true, sound: true }
      persist: true
      settings_popup: true
      start_with_reading: false
      display_format: "mm:ss"
      document_title: false           # Opt-in: live mm:ss in the tab title
      badge_in_cluster: true
      colors: { progress: "#8a5a33" }

    # Phase 19: AI-readable content mode
    ai_reader:
      enabled: true
      markup: true
      url_style: "sidecar"
      overwrite: false
      auto_title: true
      exclude: []
      llms: true
      llms_full: true
      sitemap: true
      description: ""
      watermark:
        enabled: true
        header: true
        footer: true
        text: "Generated by NeoAbs for AI agents."
        include_site: true
        include_url: true
        include_generated: true
        include_version: true

extra:
  neoabs_logo_dark: ""
  neoabs_logo_light: ""
  neoabs_favicon_dark: ""
  neoabs_favicon_light: ""
  neoabs_og_image: ""
  neoabs_theme_color: ""
  neoabs_custom_head: ""
  neoabs_custom_body_start: ""
  neoabs_custom_body_end: ""
```

---

## Documentation & GitHub Wiki Plan (Phases D1–D8)

> Plan for **updating all existing docs** with a proper use/create/learning path
> for developers and for **adding the GitHub Wiki** to this project.
> Deep-dive details, target content inventory, and target nav live in
> **`DOCS_WIKI_PLAN.md`**; positioning lives in **`WHY_PLAN.md`**.
> These phases are documentation-only: they may touch `docs/`, `README.md`,
> `mkdocs.yml` (nav/extensions), `tools/` (doc/screenshot utilities) and the
> wiki. Per the Mandatory Working Rules they must not remove or rename any
> feature, function, or element, and must not touch template/JS/SCSS behavior
> except where a feature doc depends on already-planned changes.

| Phase | Priority | Effort | Description |
|-------|----------|--------|-------------|
| D1 | High | Medium | Audit & fix the docs foundation (links, screenshots, dead-config talk, `tools/check_docs.py`, CI) |
| D2 | High | Medium | Why & onboarding (why-neoabs, showcase, quick start, model project, `neoabs new`) |
| D3 | High | Large | Configuration Bible (generated from plugin, kitchen-sink config, per-key pages) |
| D4 | Medium | Large | Design system & components deep-dive (7-section template per component) |
| D5 | Medium | Medium | Theme behavior & features (search, SPA, SW, repo popover, persistence, degradation table) |
| D6 | Medium | Large | Developer docs & learning curve (architecture, development, testing, 4-level "Learn" track) |
| D7 | Medium | Medium | GitHub Wiki (enable, seed, sidebar, sync Action, cross-links) |
| D8 | Low | Small | Quality & CI maintenance (reference diff, example builds, release→wiki sync, translation readiness) |

### D1 — Audit & fix the docs foundation
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- Reconcile `docs/screenshots.md` ↔ disk (add `light-mode.png`, `code-blocks.png`,
  `mobile.png` or drop the refs).
- Document `theme.font` / `theme.features` truthfully (after `WHY_PLAN.md` P1
  wires them); until wired, remove them from examples so no one copies a no-op.
- New `tools/check_docs.py`: intra-doc links, screenshot existence, config-key
  existence, one-H1 rule, no TODO/FIXME. Wire into `.github/workflows/docs.yml`.
- **Acceptance:** link/screenshot/config checks pass in CI.

### D2 — Why & onboarding
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- `docs/why-neoabs.md` (three pillars + dated honest comparison), `docs/showcase.md`,
  rewritten `docs/getting-started.md`, `docs/getting-started/model-project.md`.
- **Acceptance:** clean machine → visible branded site in under 5 minutes via
  `pip install mkdocs-neoabs` + the minimal config.

### D3 — Configuration Bible
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- `tools/emit_config_reference.py` generates `docs/getting-started/configuration.md`
  from `_NEOABS_TOKEN_MAP`, `_neoabs_defaults`, `extra.*`, plugin options.
- Kitchen-sink commented config; component-toggle before/after docs (Phase 2).
- **Acceptance:** every documented key has a consumer; reference regenerates
  deterministically (CI diff).

### D4 — Design system & components deep-dive
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- Expand `docs/design/*` (tokens, glass table, dot-matrix, animation, borders,
  a11y/`prefers-reduced-motion`).
- Every `docs/components/*` page follows the 7-section template (what/when/
  markdown/config/screenshot/under-the-hood/a11y); add missing ones; extend
  `tools/screenshots_gen.py` so each has a screenshot.
- **Acceptance:** full §3.5 inventory covered; screenshots exist and are linked.

### D5 — Theme behavior & features
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- New `docs/features/**`: search, SPA nav & scroll restore, service worker
  diagram, repo popover (caching + rate limits; token when shipped),
  persistence (tabs/task lists/palette/notes export), keyboard reference,
  progress/TOC tracking, graceful-degradation table (no-JS/offline/reduced
  motion/no `backdrop-filter`).
- **Acceptance:** every documented behavior matches code (verified by existing
  harnesses referenced from the docs).

### D6 — Developer docs & learning curve
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- Expand `docs/architecture.md` + `docs/development.md`; add
  `docs/contributing.md`, `docs/testing.md`, and `docs/learn/*` with four levels
  (Explorer → Maker → Customizer → Contributor), each ending in checkpoints.
- **Acceptance:** a first-time contributor completes the Contributor level using
  only these docs.

### D7 — GitHub Wiki
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- Enable `rkriad585/mkdocs-neoabs.wiki`; seed `Home`, `_Sidebar`, `Why-NeoAbs`,
  `Quick-Start`, `Configuration-Bible`, `Recipes`, `Release-Notes`,
  `Screenshots`, `Contributing-to-the-Wiki`.
- `tools/wiki_sync/` + release-triggered GitHub Action; docs↔wiki cross-link
  contract. No changes to `llms.txt`/sitemap here — that wiring is shipped by
  Phase 19 (`ai_reader`).
- **Acceptance:** wiki live at `github.com/rkriad585/mkdocs-neoabs/wiki`; sync
  Action green on tag; every wiki page links back to the canonical docs.

### D8 — Quality, CI & maintenance
> **Must follow (mandatory rules):** no deletions, no typos, no out-of-scope
> edits, no skipped items in this phase, everything stays on by default;
> build + `tools/check_docs.py` + tests green before done.


- CI owns docs quality: `check_docs.py`, generated-reference diff, docs-examples
  build (each snippet tested), screenshot regeneration.
- Release → `CHANGELOG.md` → wiki `Release-Notes.md` alignment; translation
  readiness (`docs/translating.md`); sitemap/llms.txt wiring (`WHY_PLAN.md` P4).
- **Acceptance:** push → CI proves docs health with zero manual steps.
