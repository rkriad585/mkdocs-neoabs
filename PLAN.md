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
        show_header: true          # Show sidebar header/brand
        show_search: true          # Show search input in sidebar

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
        shortcut_key: "Ctrl+Shift+N"

      # Code blocks
      code:
        show_copy_button: true     # Copy-to-clipboard button
        show_line_numbers: false   # Line numbers by default
        highlight_lines: true      # Highlighted line support

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
        show_icons: false          # Show icons next to nav items (future)

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

**Goal:** Full control over content rendering and features.

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
- `neoabs/templates/partials/progress.html` — apply custom color
- `neoabs/templates/assets/stylesheets/components.scss` — update content max-width, padding, progress bar color, admonition colors
- `neoabs/templates/assets/stylesheets/neoabs.scss` — update content CSS variables
- `neoabs/templates/assets/javascripts/neoabs.js` — respect code.copy_label, back_to_top config, task list persistence

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
    keyboard: { enabled: true, shortcuts: {} }

    # Phase 9: Visual
    glass: { intensity: "medium", blur: true, blur_amount: "12px" }
    dot_matrix: { enabled: true }
    animation: { mode: "normal" }
    border: { width: "thin" }

    # Phase 10: Search
    search: { enabled: true, shortcut_key: "/", placeholder: "Search...", min_chars: 2, max_results: 10 }

    # Phase 11: Content
    content: { max_width: "800px", code: { show_copy_button: true }, admonitions: { enabled: true } }

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
  contract.
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
