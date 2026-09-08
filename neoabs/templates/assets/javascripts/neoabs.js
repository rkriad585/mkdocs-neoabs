/**
 * NeoAbs Theme JavaScript
 * Glass + NothingOS Design System
 * Vanilla ES6+ — zero dependencies
 */
;(function () {
  "use strict"

  var NEOABS_VERSION = "11"

  const $ = (sel, ctx) => (ctx || document).querySelector(sel)
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)]

  const STORAGE_PREFIX = "neoabs-"

  function storageGet(key) {
    try { return localStorage.getItem(STORAGE_PREFIX + key) } catch { return null }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(STORAGE_PREFIX + key, value) } catch {}
  }

  // ---------------------------------------------------------------------------
  // Generic cache with TTL (stored in localStorage)
  // ---------------------------------------------------------------------------

  const CACHE_PREFIX = "neoabs-cache-"

  function cacheGet(key, maxAgeMs) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + key)
      if (!raw) return null
      var entry = JSON.parse(raw)
      if (Date.now() - entry.ts > maxAgeMs) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      return entry.data
    } catch { return null }
  }

  function cacheSet(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data: data }))
    } catch {}
  }

  function cacheRemove(key) {
    try { localStorage.removeItem(CACHE_PREFIX + key) } catch {}
  }

  function cacheClear() {
    try {
      var keys = []
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i)
        if (k && k.indexOf(CACHE_PREFIX) === 0) keys.push(k)
      }
      keys.forEach(function (k) { localStorage.removeItem(k) })
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // Session memory — remembers where the visitor left off:
  //   { lastPage, lastAt, navCollapsed: [], search }
  // Stored as a single JSON blob under STORAGE_PREFIX + "session".
  // ---------------------------------------------------------------------------

  const SESSION_KEY = "session"

  function sessionGet() {
    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + SESSION_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  }

  function sessionMutate(mutator) {
    try {
      var s = sessionGet()
      mutator(s)
      localStorage.setItem(STORAGE_PREFIX + SESSION_KEY, JSON.stringify(s))
    } catch {}
  }

  function onReady(fn) {
    if (document.readyState !== "loading") fn()
    else document.addEventListener("DOMContentLoaded", fn)
  }

  // Lazy-load an external script exactly once; deduplicates concurrent requests.
  function ensureScript(src, onload, onerror) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (onload) onload()
      return
    }
    if (typeof window._neoabsScriptsLoaded !== "undefined" &&
        window._neoabsScriptsLoaded.indexOf(src) !== -1) {
      if (onload) onload()
      return
    }
    window._neoabsScriptsLoaded = window._neoabsScriptsLoaded || []
    window._neoabsScriptsLoaded.push(src)
    var s = document.createElement("script")
    s.src = src
    s.async = true
    s.defer = true
    if (onload) s.addEventListener("load", onload)
    if (onerror) s.addEventListener("error", onerror)
    document.head.appendChild(s)
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
  }

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  function readConfig() {
    const el = document.getElementById("__config")
    if (!el) return {}
    try { return JSON.parse(el.textContent) } catch { return {} }
  }

  // Phase 2 component toggles. `_config` is populated on boot from `#__config`.
  let _config = {}

  // `componentShow(name, key)` -> whether a theme component is enabled. Absent
  // keys default to ON, so a site that never sets `theme.neoabs.components`
  // keeps every feature enabled.
  function componentShow(name, key) {
    const comp = _config.components ? _config.components[name] : null
    if (!comp) return true
    if (key !== undefined) return comp[key] !== false
    return comp.show !== false
  }

  // Phase 11 content-area settings (`theme.neoabs.content`, injected as
  // `_config.content`). Absent keys fall back to the provided default, keeping
  // sites that never opt in stable. Nested sections (typography, code, ...) are
  // looked up as `_config.content.<section>.<key>`; top-level keys such as
  // `back_to_top_threshold` are read directly off `_config.content`.
  function contentSetting(section, key, fallback) {
    const conf = _config.content || {}
    const holder = conf[section]
    if (holder && typeof holder === "object" && holder[key] !== undefined && holder[key] !== "") {
      return holder[key]
    }
    if (conf[key] !== undefined && conf[key] !== "") return conf[key]
    return fallback
  }

  // Optional CDN override per component (`theme.neoabs.components.<name>.cdn_url`).
  function cdnUrlFor(name) {
    const comp = _config.components ? _config.components[name] : null
    if (comp && comp.cdn_url) return comp.cdn_url
    return ""
  }

  // Phase 13: page-level front-matter overrides. The page's `neoabs:` front
  // matter is serialized into `#__config` under `config.page.neoabs`; fold the
  // `components`/`content` groups into the runtime config so every initializer
  // reads the page-effective values. Anything the page does not set is left
  // untouched.
  function applyPageOverrides(target) {
    if (!target || typeof target !== "object") return
    const over = target.page && typeof target.page.neoabs === "object" ? target.page.neoabs : null
    if (!over) return
    const groups = ["components", "content"]
    for (let g = 0; g < groups.length; g++) {
      const group = groups[g]
      const src = over[group]
      if (!src || typeof src !== "object" || Array.isArray(src)) continue
      if (!target[group] || typeof target[group] !== "object") target[group] = {}
      Object.keys(src).forEach(function (key) {
        const val = src[key]
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const base = target[group][key]
          target[group][key] = base && typeof base === "object" && !Array.isArray(base)
            ? Object.assign({}, base, val)
            : Object.assign({}, val)
        } else if (val !== undefined) {
          target[group][key] = val
        }
      })
    }
    // Mirror the site-level Phase 11 propagation (`content` -> `components`) for
    // the runtime duplicates so page overrides match what the JS initializers
    // gate on (progress bar, back-to-top button, code copy/numbers/lines).
    if (over.content && typeof over.content === "object" && target.components) {
      const compContent = target.components.content
      if (compContent && typeof compContent === "object") {
        const topKeys = ["show_progress_bar", "show_back_to_top"]
        topKeys.forEach(function (k) {
          if (over.content[k] !== undefined) compContent[k] = over.content[k]
        })
      }
      const overCode = over.content.code
      const compCode = target.components.code
      if (overCode && typeof overCode === "object" && compCode && typeof compCode === "object") {
        const codeKeys = ["show_copy_button", "show_line_numbers", "highlight_lines"]
        codeKeys.forEach(function (k) {
          if (overCode[k] !== undefined) compCode[k] = overCode[k]
        })
      }
    }
  }

  // Phase 7 keyboard helpers. `_config.keyboard` is injected by the theme
  // plugin (all shortcuts enabled by default); every built-in shortcut can be
  // re-keyed, relabeled, or disabled via `theme.neoabs.keyboard`.
  const readKeyboard = () => (_config.keyboard || {})

  function kbdShortcut(name) {
    const kb = readKeyboard()
    return (kb.shortcuts && kb.shortcuts[name]) || {}
  }

  function kbdEnabled(name) {
    const kb = readKeyboard()
    if (kb.enabled === false) return false
    return kbdShortcut(name).enabled !== false
  }

  function kbdKey(name, fallback) {
    const key = kbdShortcut(name).key
    return typeof key === "string" && key.trim() ? key.trim() : fallback
  }

  function kbdLabel(name, fallback) {
    const label = kbdShortcut(name).label
    return typeof label === "string" && label.trim() ? label.trim() : fallback
  }

  function kbdPersisted(name) {
    return kbdShortcut(name).persisted !== false
  }

  // ---------------------------------------------------------------------------
  // 1. Theme Initialization
  // ---------------------------------------------------------------------------

  function initTheme() {
    const savedScheme = storageGet("color-scheme")
    if (savedScheme) {
      applyColorScheme(savedScheme)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyColorScheme("slate")
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      applyColorScheme("default")
    }

    const savedGlass = storageGet("glass-intensity")
    const attrGlass = document.documentElement.getAttribute("data-md-neoabs-glass")
    if (savedGlass) {
      applyGlassIntensity(savedGlass)
    } else if (attrGlass) {
      applyGlassIntensity(attrGlass)
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Color Scheme Toggle
  // ---------------------------------------------------------------------------

  function initColorScheme() {
    const current = document.documentElement.getAttribute("data-md-color-scheme")
    if (current) {
      let radio = $(".neoabs-palette__input[value='" + current + "']")
      if (!radio) {
        radio = $(".neoabs-palette__input[data-md-color-scheme='" + current + "']")
      }
      if (radio) radio.checked = true
    }

    document.addEventListener("change", (e) => {
      const radio = e.target.closest(".neoabs-palette__input")
      if (!radio) return
      const scheme = radio.getAttribute("data-md-color-scheme") || radio.value
      if (!scheme) return
      applyColorScheme(scheme)
      storageSet("color-scheme", scheme)

      const primary = radio.getAttribute("data-md-color-primary")
      const accent = radio.getAttribute("data-md-color-accent")
      if (primary) document.documentElement.setAttribute("data-md-color-primary", primary)
      if (accent) document.documentElement.setAttribute("data-md-color-accent", accent)
    })

    updatePaletteIconVisibility()
  }

  function applyColorScheme(scheme) {
    document.documentElement.setAttribute("data-md-color-scheme", scheme)
    $$(".neoabs-palette__input").forEach((radio) => {
      const radioScheme = radio.getAttribute("data-md-color-scheme") || radio.value
      radio.checked = radioScheme === scheme
    })
    updatePaletteIconVisibility()
    syncSchemeImages(scheme)
    syncHighlightTheme(scheme)
    syncFavicon(scheme)
    syncCommentsTheme()
    if (typeof _mermaidGenericInit === "function") _mermaidGenericInit()
  }

  // Swap to the next configured palette scheme (dark/light toggle). It cycles
  // the `.neoabs-palette__input` radios exactly like a manual palette click,
  // including the persisted preference and primary/accent attributes. Requires
  // at least two schemes; a single-scheme site simply ignores the shortcut.
  function toggleScheme() {
    const radios = Array.prototype.slice.call(document.querySelectorAll(".neoabs-palette__input"))
    if (radios.length < 2) return false
    const current = document.documentElement.getAttribute("data-md-color-scheme")
    let index = radios.findIndex(function (r) {
      return (r.getAttribute("data-md-color-scheme") || r.value) === current
    })
    if (index < 0) index = 0
    const next = radios[(index + 1) % radios.length]
    if (!next) return false
    const scheme = next.getAttribute("data-md-color-scheme") || next.value
    applyColorScheme(scheme)
    storageSet("color-scheme", scheme)
    const primary = next.getAttribute("data-md-color-primary")
    const accent = next.getAttribute("data-md-color-accent")
    if (primary) document.documentElement.setAttribute("data-md-color-primary", primary)
    if (accent) document.documentElement.setAttribute("data-md-color-accent", accent)
    return true
  }

  // Swap the active favicon to match the current color scheme.
  function syncFavicon(scheme) {
    var link = document.getElementById("neoabs-favicon")
    if (!link) return
    var dark = link.getAttribute("data-md-favicon-dark")
    var light = link.getAttribute("data-md-favicon-light")
    // If no per-scheme favicons configured, nothing to do.
    if (!dark) return
    var isLight = scheme === "default" || scheme === "light"
    var target = isLight && light ? light : dark
    if (target && link.getAttribute("href") !== target) {
      link.setAttribute("href", target)
    }
  }

  function syncSchemeImages(scheme) {
    const isLight = scheme === "default" || scheme === "light"
    $$("img[data-md-scheme-dark][data-md-scheme-light]").forEach((img) => {
      const target = isLight
        ? img.getAttribute("data-md-scheme-light")
        : img.getAttribute("data-md-scheme-dark")
      if (target && img.getAttribute("src") !== target) {
        img.setAttribute("src", target)
      }
    })
  }

  // Toggle the active highlight.js theme stylesheet to match the scheme.
  function syncHighlightTheme(scheme) {
    const dark = document.getElementById("neoabs-hljs-theme-dark")
    const light = document.getElementById("neoabs-hljs-theme-light")
    if (!dark && !light) return
    const isLight = scheme === "default" || scheme === "light"
    if (dark) dark.disabled = isLight
    if (light) light.disabled = !isLight
  }

  function updatePaletteIconVisibility() {
    const scheme = document.documentElement.getAttribute("data-md-color-scheme")
    if (!scheme) return

    $$(".neoabs-palette__input").forEach((radio) => {
      const radioScheme = radio.getAttribute("data-md-color-scheme") || radio.value
      const label = radio.closest("label.neoabs-palette__option")
      if (!label) return
      label.style.display = radioScheme === scheme ? "none" : ""
    })
  }

  // ---------------------------------------------------------------------------
  // 3. Glass Intensity
  // ---------------------------------------------------------------------------

  function applyGlassIntensity(intensity) {
    document.documentElement.setAttribute("data-md-neoabs-glass", intensity)
  }

  // ---------------------------------------------------------------------------
  // 4. Mobile Navigation Drawer
  // ---------------------------------------------------------------------------

  function initMobileNav() {
    const checkbox = document.getElementById("neoabs-drawer")
    if (!checkbox) return
    const nav = $(".neoabs-nav")

    function updateAria() {
      const open = checkbox.checked
      if (nav) {
        nav.classList.toggle("neoabs-nav--open", open)
        nav.setAttribute("aria-hidden", String(!open))
      }
      document.body.style.overflow = open ? "hidden" : ""
    }

    checkbox.addEventListener("change", updateAria)

    if (nav) {
      nav.addEventListener("click", (e) => {
        if (e.target.closest("a") && checkbox.checked) {
          checkbox.checked = false
          updateAria()
        }
      })
    }

    checkbox._neoabsToggle = function () {
      checkbox.checked = !checkbox.checked
      updateAria()
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Search
  // ---------------------------------------------------------------------------

  function initSearch(config) {
    if (!componentShow("search", "show")) return

    // Phase 10: `theme.neoabs.search` — full control over search behavior.
    const sc = (config && config.neoabs_search) || {}
    if (sc.enabled === false) return

    const checkbox = document.getElementById("neoabs-search")
    const searchEl = $(".neoabs-search")
    const input = $(".neoabs-search__input")
    const statusEl = $(".neoabs-search__status")
    const listEl = $(".neoabs-search__list")
    const closeBtn = $(".neoabs-search__close")
    if (!checkbox || !searchEl || !input || !statusEl || !listEl) return

    // Restore the last query the visitor typed, so they pick up where they left off.
    const remembered = sessionGet().search
    if (remembered) input.value = remembered

    // Phase 3: shared search deep links (?q=…). When present, win over any
    // remembered session and re-open search with the query on page load.
    let deepLink = null
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.has("q")) {
      deepLink = String(urlParams.get("q") || "").trim()
      if (deepLink) {
        input.value = deepLink
        sessionMutate((s) => { s.search = deepLink })
      }
    }

    const resCfg = sc.result || {}
    const sExplicitMin = typeof sc.min_chars === "number" || typeof sc.min_chars === "string"
    const sMinChars = Math.max(1, parseInt(sc.min_chars, 10) || 2)
    const sMaxResults = Math.max(1, parseInt(sc.max_results, 10) || 10)
    const sShowContext = sc.show_context !== false
    const sContextLen = Math.max(0, parseInt(sc.context_length, 10) || 120)
    const sHighlight = sc.highlight_results !== false && resCfg.show_highlights !== false
    const sSuggest = sc.suggest !== false
    const sShowIcon = resCfg.show_icon !== false
    const sShowPath = resCfg.show_breadcrumb !== false
    const sShowShare = resCfg.show_share !== false

    let searchTrigger = null
    let minSearchLength = sMinChars
    let searchReady = false
    let searchWorker = null
    let activeIndex = -1
    let currentResults = []
    let searchToken = 0
    let pendingQuery = 0
    let lastTerms = []
    let suggestionsEl = null

    const base = (config && config.base) || "."

    const joinUrl = (b, p) => {
      if (!p) return b
      if (p.charAt(0) === "/") return p
      if (b.length && b.charAt(b.length - 1) === "/") return b + p
      return b + "/" + p
    }

    const showStatus = (msg) => {
      clearSuggestions()
      statusEl.style.display = ""
      const p = statusEl.querySelector("p")
      if (p) p.textContent = msg
      listEl.innerHTML = ""
      listEl.style.display = "none"
      activeIndex = -1
      currentResults = []
      input.setAttribute("aria-activedescendant", "")
    }

    const showResults = () => {
      clearSuggestions()
      statusEl.style.display = "none"
      listEl.style.display = ""
    }

    // Phase 10 helpers ---------------------------------------------------------

    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    const splitTerms = (q) =>
      String(q || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

    // Wrap every occurrence of `terms` in <mark>, escaping all other text.
    const wrapTerms = (text, terms) => {
      const str = String(text || "")
      if (!terms.length) return escapeHtml(str)
      const re = new RegExp("(" + terms.map(escapeRe).join("|") + ")", "gi")
      const out = []
      let last = 0
      let m
      while ((m = re.exec(str)) !== null) {
        if (!m[0].length) { re.lastIndex++ ; continue }
        out.push(escapeHtml(str.slice(last, m.index)))
        out.push("<mark>" + escapeHtml(m[0]) + "</mark>")
        last = m.index + m[0].length
        re.lastIndex = last
      }
      out.push(escapeHtml(str.slice(last)))
      return out.join("")
    }

    // Build the context snippet, centered on the first matching term.
    const snippetOf = (text, terms, len, highlight) => {
      const str = String(text || "").replace(/\s+/g, " ").trim()
      if (!len) return highlight ? wrapTerms(str, terms) : escapeHtml(str)
      let start = 0
      const lower = str.toLowerCase()
      for (let k = 0; k < terms.length; k++) {
        const idx = lower.indexOf(terms[k])
        if (idx !== -1) { start = Math.max(0, idx - Math.floor(len / 3)); break }
      }
      const slice = str.slice(start, start + len)
      const prefix = start > 0 ? "\u2026" : ""
      const suffix = start + len < str.length ? "\u2026" : ""
      return escapeHtml(prefix) + (highlight ? wrapTerms(slice, terms) : escapeHtml(slice)) + escapeHtml(suffix)
    }

    // Human-readable path, e.g. "getting-started/installation/" -> "getting-started / installation"
    const breadcrumbOf = (location) => {
      const parts = String(location || "")
        .replace(/^\.?\//, "")
        .replace(/\/+$/, "")
        .split("/")
        .filter(Boolean)
      if (parts[parts.length - 1] === "index") parts.pop()
      return parts.join(" / ")
    }

    const RESULT_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L17.5 8H13V3.5zM12 12v1.5h5V15h-5v1.5h-1.5V15h-5v-1.5h5V12h1.5zm0 3v3H7v-3h5z"/></svg>'

    // Phase 3: per-result "copy link" button. Markup comes from the
    // #neoabs-search-share <template> in partials/search.html when present, so
    // the icon/labels stay a single source of truth; fall back inline.
    const shareTpl = document.getElementById("neoabs-search-share")
    const shareIcon = (shareTpl && shareTpl.innerHTML) ||
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>'
    const shareLabels = ((config && config.translations && config.translations.clipboard) || {})
    const shareTitle = shareLabels.copy || "Copy link"
    const shareCopiedTitle = shareLabels.copied || "Link copied"

    const clearSuggestions = () => {
      if (suggestionsEl && suggestionsEl.parentNode) suggestionsEl.parentNode.removeChild(suggestionsEl)
    }

    const renderSuggestions = (recent) => {
      if (!suggestionsEl) {
        suggestionsEl = document.createElement("div")
        suggestionsEl.className = "neoabs-search__suggestions"
        suggestionsEl.setAttribute("aria-label", "Search suggestions")
      }
      suggestionsEl.innerHTML = ""
      recent.forEach((q) => {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "neoabs-search__suggestion"
        btn.textContent = q
        btn.addEventListener("click", () => {
          input.value = q
          sessionMutate((s) => { s.search = q })
          input.focus()
          runSearch(q)
        })
        suggestionsEl.appendChild(btn)
      })
      statusEl.style.display = "none"
      listEl.style.display = "none"
      const resultsWrap = $(".neoabs-search__results", searchEl)
      if (resultsWrap && !suggestionsEl.parentNode) resultsWrap.appendChild(suggestionsEl)
      activeIndex = -1
      input.setAttribute("aria-activedescendant", "")
    }

    function buildResults(results) {
      const list = []
      const terms = lastTerms
      for (let i = 0; i < results.length; i++) {
        const doc = results[i]
        const href = joinUrl(base, doc.location || "")

        // Phase 3: outer container holds the link + per-result share button.
        const row = document.createElement("div")
        row.className = "neoabs-search__result"
        row.setAttribute("role", "option")
        row.id = "neoabs-search-result-" + i

        const link = document.createElement("a")
        link.className = "neoabs-search__result-link"
        link.href = href

        if (sShowIcon) {
          const icon = document.createElement("div")
          icon.className = "neoabs-search__result-icon"
          icon.innerHTML = RESULT_ICON_SVG
          link.appendChild(icon)
        }

        const body = document.createElement("div")
        body.className = "neoabs-search__result-body"

        const title = document.createElement("div")
        title.className = "neoabs-search__result-title"
        title.innerHTML = sHighlight ? wrapTerms(doc.title || "Untitled", terms) : escapeHtml(doc.title || "Untitled")
        body.appendChild(title)

        if (sShowContext) {
          const context = document.createElement("div")
          context.className = "neoabs-search__result-context"
          context.innerHTML = snippetOf(doc.text || "", terms, sContextLen, sHighlight)
          body.appendChild(context)
        }

        if (sShowPath && doc.location) {
          const path = document.createElement("div")
          path.className = "neoabs-search__result-path"
          path.textContent = breadcrumbOf(doc.location) || doc.location
          body.appendChild(path)
        }

        link.appendChild(body)
        row.appendChild(link)

        if (sShowShare) {
          // Phase 3: per-result copy-link — re-opens search via ?q= when visited.
          const shareBtn = document.createElement("button")
          shareBtn.type = "button"
          shareBtn.className = "neoabs-search__result-share"
          shareBtn.title = shareTitle
          shareBtn.setAttribute("aria-label", shareTitle)
          shareBtn.innerHTML = shareIcon
          shareBtn.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()
            const q = (input.value || "").trim()
            // Build the deep link from the row's resolved browser URL (link.href is
            // absolute in the real DOM, so "./result/" or "../result/" hosts are
            // gone), drop any #fragment, then append ?q= so the query survives
            // server-side and re-opens search on the shared page.
            let abs = link.href || href
            const fragIdx = abs.indexOf("#")
            if (fragIdx !== -1) abs = abs.slice(0, fragIdx)
            const url = abs + (q ? "?q=" + encodeURIComponent(q) : "")
            copyToClipboard(url).then(() => {
              shareBtn.title = shareCopiedTitle
              shareBtn.setAttribute("aria-label", shareCopiedTitle)
              shareBtn.classList.add("neoabs-search__result-share--copied")
              neoabsToast(shareCopiedTitle, "success")
              setTimeout(() => {
                shareBtn.title = shareTitle
                shareBtn.setAttribute("aria-label", shareTitle)
                shareBtn.classList.remove("neoabs-search__result-share--copied")
              }, 1600)
            }).catch(() => {
              neoabsToast("Copy link failed — clipboard unavailable", "error")
            })
          })
          row.appendChild(shareBtn)
        }
        list.push(row)
      }
      return list
    }

    function renderResults(results) {
      clearSuggestions()
      currentResults = results
      listEl.innerHTML = ""
      if (!results.length) {
        showStatus("No results found")
        return
      }
      const capped = results.length > sMaxResults ? results.slice(0, sMaxResults) : results
      const items = buildResults(capped)
      items.forEach((item, i) => {
        item.addEventListener("click", () => {
          if (searchTrigger && typeof searchTrigger.focus === "function") searchTrigger.focus()
        })
        item.addEventListener("mousemove", () => setActive(i))
        listEl.appendChild(item)
      })
      const q = (input.value || "").trim()
      if (q) {
        sessionMutate((s) => {
          const hist = Array.isArray(s.search_history) ? s.search_history.slice() : []
          s.search_history = [q].concat(hist.filter((x) => x !== q)).slice(0, 5)
        })
      }
      showResults()
    }

    function setActive(index) {
      const items = $$(".neoabs-search__result", listEl)
      if (!items.length) return
      if (index < 0) index = items.length - 1
      if (index >= items.length) index = 0
      items.forEach((el) => el.classList.remove("neoabs-search__result--active"))
      items[index].classList.add("neoabs-search__result--active")
      activeIndex = index
      input.setAttribute("aria-activedescendant", items[index].id)
      if (typeof items[index].scrollIntoView === "function") {
        items[index].scrollIntoView({ block: "nearest", behavior: "auto" })
      }
    }

    function openSearch() {
      searchTrigger = document.activeElement
      checkbox.checked = true
      searchEl.classList.add("neoabs-search--active")
      searchEl.setAttribute("aria-hidden", "false")
      document.body.style.overflow = "hidden"
      requestAnimationFrame(() => {
        input.focus()
        input.select()
        // Auto-run the restored query so results show immediately.
        if (input.value) runSearch(input.value)
      })
    }

    function closeSearch() {
      checkbox.checked = false
      searchEl.classList.remove("neoabs-search--active")
      searchEl.setAttribute("aria-hidden", "true")
      document.body.style.overflow = ""
      searchToken++
      input.value = ""
      showStatus("Start typing to search...")
      // Phase 3: clean the shared deep-link (?q=) from the URL so re-opening
      // search does not re-inject a stale query.
      try {
        if (window.history && window.history.replaceState && new URLSearchParams(location.search).has("q")) {
          const cleaned = new URLSearchParams(location.search)
          cleaned.delete("q")
          const qs = cleaned.toString()
          const cleanUrl = location.pathname + (qs ? "?" + qs : "") + (location.hash || "")
          window.history.replaceState(null, "", cleanUrl)
        }
      } catch (_err) { /* noop — environment may not support history */ }
      if (searchTrigger && typeof searchTrigger.focus === "function") {
        searchTrigger.focus()
      }
      searchTrigger = null
    }

    function runSearch(query) {
      const token = ++searchToken
      const q = (query || "").trim()
      if (!q || q.length < minSearchLength) {
        if (sSuggest && q) {
          const recent = sessionGet().search_history || []
          if (Array.isArray(recent) && recent.length) {
            renderSuggestions(recent.slice(0, 5))
            return
          }
        }
        showStatus("Start typing to search...")
        return
      }
      if (!searchReady || !searchWorker) {
        showStatus("Loading search...")
        return
      }
      pendingQuery = token
      lastTerms = splitTerms(q)
      clearSuggestions()
      listEl.innerHTML = ""
      listEl.style.display = ""
      statusEl.style.display = "none"
      activeIndex = -1
      currentResults = []
      searchWorker.postMessage({ query: q })
    }

    searchWorker = new Worker(joinUrl(base, "search/worker.js"))
    searchWorker.onmessage = (e) => {
      const data = e.data
      if (!data) return
      if (data.config) {
        // The built-in search plugin's `min_search_length` only applies when the
        // theme's `theme.neoabs.search.min_chars` was not explicitly configured.
        if (typeof data.config.min_search_length === "number" && !sExplicitMin) {
          minSearchLength = Math.max(1, data.config.min_search_length - 1)
        }
      } else if (data.allowSearch) {
        searchReady = true
        // The input may have received text (restored from the session or typed)
        // before the worker finished warming up — re-run it so the overlay is
        // never stuck on "Loading search...".
        if (input.value && input.value.trim().length >= minSearchLength) runSearch(input.value)
      } else if (data.results) {
        if (pendingQuery === 0) return
        pendingQuery = 0
        renderResults(data.results)
      }
    }
    searchWorker.postMessage({ init: true })

    // Checkbox change — guard against double-fire from label toggle
    let lastToggleTime = 0
    checkbox.addEventListener("change", () => {
      const now = Date.now()
      if (now - lastToggleTime < 50) return
      lastToggleTime = now
      if (checkbox.checked) openSearch()
      else closeSearch()
    })

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault()
        closeSearch()
      })
    }

    searchEl.addEventListener("click", (e) => {
      if (e.target === searchEl || e.target.classList.contains("neoabs-search__overlay")) {
        closeSearch()
      }
    })

    // Debounced query on input
    let debounce = null
    input.addEventListener("input", () => {
      sessionMutate((s) => { s.search = input.value })
      clearTimeout(debounce)
      debounce = setTimeout(() => runSearch(input.value), 150)
    })

    // Keyboard navigation (configurable via `theme.neoabs.keyboard`).
    input.addEventListener("keydown", (e) => {
      if (kbdEnabled("search_down") && matchesKeyCombo(e, kbdKey("search_down", "ArrowDown"))) {
        e.preventDefault()
        setActive(activeIndex + 1)
      } else if (kbdEnabled("search_up") && matchesKeyCombo(e, kbdKey("search_up", "ArrowUp"))) {
        e.preventDefault()
        setActive(activeIndex - 1)
      } else if (kbdEnabled("search_open") && matchesKeyCombo(e, kbdKey("search_open", "Enter"))) {
        const items = $$(".neoabs-search__result", listEl)
        if (items.length) {
          e.preventDefault()
          const active = items[activeIndex >= 0 ? activeIndex : 0]
          const target = active.querySelector && active.querySelector(".neoabs-search__result-link")
          if (target && target.click) target.click()
          else active.click()
        }
      }
    })

    searchEl._neoabsOpen = openSearch
    searchEl._neoabsClose = closeSearch

    // Trap tab focus within the search dialog while it is open (focus never
    // escapes into the page behind the modal).
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !checkbox.checked || !searchEl.classList.contains("neoabs-search--active")) return
      const focusables = $$(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        searchEl
      ).filter((el) => el.offsetParent !== null)
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    })

    // Phase 3: auto-open search when arriving via a shared deep link (?q=…).
    if (deepLink) openSearch()
  }

  // ---------------------------------------------------------------------------
  // 6. TOC Intersection Tracking
  // ---------------------------------------------------------------------------

  // Module-level TOC state. The scroll listener is bound once; every page
  // (including SPA-swapped pages) swaps in its own refresh closure.
  let _tocPage = null
  let _tocScrollBound = false

  function initTocTracking() {
    const tocCfg = (_config && _config.toc) || {}
    if (!componentShow("toc", "show") || tocCfg.tracking_enabled === false) return
    const tocLinks = $$(".neoabs-toc__link")
    const levelSel = (tocCfg.levels && Object.keys(tocCfg.levels).length)
      ? ["h2", "h3", "h4", "h5", "h6"].filter((k) => tocCfg.levels[k] !== false).join(",")
      : "h2,h3,h4"
    if (!levelSel) return
    const headings = $$(".neoabs-content " + levelSel)
    if (!tocLinks.length || !headings.length) return
    const linkMap = {}
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href")
      if (href && href.charAt(0) === "#") {
        const id = decodeURIComponent(href.slice(1))
        linkMap[id] = link
      }
    })
    const list = headings.filter((h) => h.id && linkMap[h.id])
    if (!list.length) return

    let activeLink = null

    function setActive(id) {
      const link = linkMap[id]
      if (!link || link === activeLink) return
      tocLinks.forEach((l) => l.classList.remove("neoabs-toc__link--active"))
      link.classList.add("neoabs-toc__link--active")
      activeLink = link
      if (typeof link.scrollIntoView === "function") {
        link.scrollIntoView({ block: "nearest", behavior: "auto" })
      }
    }

    // The section whose heading is closest above a probe line (the tracking
    // offset in px, or ~25% down the viewport by default). This is the
    // standard "current position" algorithm and it keeps the highlight glued
    // to the section being read.
    let probeOffset = null
    if (tocCfg.tracking_offset != null) {
      const parsed = parseFloat(tocCfg.tracking_offset)
      if (!isNaN(parsed)) probeOffset = parsed
    }
    function refresh() {
      const probe = probeOffset != null
        ? window.scrollY + probeOffset
        : window.scrollY + window.innerHeight * 0.25
      let current = null
      for (let i = 0; i < list.length; i++) {
        const top = list[i].getBoundingClientRect().top + window.scrollY
        if (top > probe + 1) break
        current = list[i].id
      }
      // At the very top nothing is above the probe line yet — highlight the
      // first section so the indicator never sits empty.
      if (!current) current = list[0].id
      if (current) setActive(current)
    }

    _tocPage = { refresh }

    if (!_tocScrollBound) {
      _tocScrollBound = true
      let ticking = false
      const onScroll = () => {
        if (ticking) return
        ticking = true
        window.requestAnimationFrame(() => {
          ticking = false
          if (_tocPage) {
            try { _tocPage.refresh() } catch (e) {}
          }
        })
      }
      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onScroll, { passive: true })
    }

    // Immediate calc so the right item is already highlighted on load.
    refresh()
  }

  // ---------------------------------------------------------------------------
  // 7. Scroll Header, Progress Bar & Back-to-top
  // ---------------------------------------------------------------------------

  function initScrollBehavior() {
    const header = $(".neoabs-header")
    const progressBar = $(".neoabs-progress__bar")
    let ticking = false

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY

        if (header) {
          header.classList.toggle("neoabs-header--scrolled", y > 100)
        }

        if (progressBar) {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight
          const pct = docHeight > 0 ? Math.min((y / docHeight) * 100, 100) : 0
          progressBar.style.width = pct + "%"
        }

        // Back to top — query each time since button is dynamically created
        const backToTop = $(".neoabs-back-to-top")
        if (backToTop) {
          const threshold = contentSetting("content", "back_to_top_threshold", 500)
          backToTop.classList.toggle("neoabs-back-to-top--visible", y > threshold)
        }

        ticking = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
  }

  // ---------------------------------------------------------------------------
  // 8. Back to Top
  // ---------------------------------------------------------------------------

  function initBackToTop() {
    if (!componentShow("content", "show_back_to_top")) return
    let btn = $(".neoabs-back-to-top")
    if (!btn) {
      btn = document.createElement("button")
      btn.className = "neoabs-back-to-top"
      btn.setAttribute("aria-label", contentSetting("content", "back_to_top_label", "Back to top"))
      btn.setAttribute("type", "button")
      btn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="18 15 12 9 6 15"></polyline></svg>'
      document.body.appendChild(btn)
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  // ---------------------------------------------------------------------------
  // 9. Tabs (pymdownx.tabbed)
  // ---------------------------------------------------------------------------

  // Enables keyboard navigation (ArrowLeft/ArrowRight) across a .tabbed-set
  // and persists the last-active tab per page URL in localStorage.
  function initTabs() {
    $$(".tabbed-set").forEach(function (set) {
      const labels = $$(".tabbed-labels > label", set)
      const inputs = $$(".tabbed-set > input", set)
      if (labels.length < 2 || inputs.length < 2) return

      let activeIndex = 0
      const current = set.querySelector(".tabbed-set > input:checked")
      if (current) activeIndex = Math.max(0, inputs.indexOf(current))

      labels.forEach(function (label, i) {
        label.setAttribute("role", "tab")
        label.setAttribute("id", "tab-" + i)
        label.setAttribute("tabindex", i === activeIndex ? "0" : "-1")
        label.setAttribute("aria-selected", i === activeIndex ? "true" : "false")

        label.addEventListener("keydown", function (e) {
          const left = kbdEnabled("tab_left") && matchesKeyCombo(e, kbdKey("tab_left", "ArrowLeft"))
          const right = kbdEnabled("tab_right") && matchesKeyCombo(e, kbdKey("tab_right", "ArrowRight"))
          if (!left && !right) return
          e.preventDefault()
          const dir = right ? 1 : -1
          const next = (activeIndex + dir + labels.length) % labels.length
          activate(next)
        })

        label.addEventListener("click", function () {
          activate(i)
        })
      })

      inputs.forEach(function (input) {
        input.setAttribute("aria-hidden", "true")
      })

      function activate(i) {
        if (i === activeIndex) return
        activeIndex = i
        if (inputs[i]) inputs[i].checked = true
        labels.forEach(function (l, j) {
          l.setAttribute("tabindex", j === i ? "0" : "-1")
          l.setAttribute("aria-selected", j === i ? "true" : "false")
          if (j === i) l.focus()
        })
        try {
          storageSet("tabs." + location.pathname + "." + set.getAttribute("data-tabs"), String(i))
        } catch {}
      }
    })
  }

  // ---------------------------------------------------------------------------
  // 9.5 Task Lists (pymdownx.tasklist)
  // ---------------------------------------------------------------------------

  // Makes checkbox task lists interactive (the extension ships them `disabled`)
  // and persists checked state per page URL + item in localStorage.
  function initTaskLists() {
    if (!contentSetting("task_lists", "enabled", true)) return
    const persist = contentSetting("task_lists", "persist_state", true)
    const base = location.pathname
    let index = 0

    $$(".task-list-item input[type='checkbox']").forEach(function (input, i) {
      index++
      const key = "task." + base + "." + index

      // Re-enable so the user can toggle it.
      input.disabled = false

      if (!persist) return

      // Restore saved state.
      const saved = storageGet(key)
      if (saved === "1") input.checked = true

      input.addEventListener("change", function () {
        try { storageSet(key, input.checked ? "1" : "0") } catch {}
      })
    })
  }

  // ---------------------------------------------------------------------------
  // 10. Code Highlighting (highlight.js via CDN)
  // ---------------------------------------------------------------------------

  // Marks up code blocks with highlight.js, preserving the __codelineno anchors
  // that MkDocs/pymdownx emit at the top of each <pre>. Runs before copy buttons
  // so the pre/wrapper relationship stays stable.
  function initHighlighting() {
    if (!componentShow("highlighting", "show")) return
    if (!document.querySelector(".highlight pre, .codehilite pre, pre.highlight"))
      return

    syncHighlightTheme(
      document.documentElement.getAttribute("data-md-color-scheme") || "slate"
    )

    const src = cdnUrlFor("highlighting") ||
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"
    ensureScript(src, function () {
      if (!window.hljs) return
      try {
        hljs.configure({ ignoreUnescapedHTML: true })

        $$(".highlight pre > code, .codehilite pre > code, pre.code code, pre.highlight code, pre.codehilite code")
          .forEach(function (codeEl) {
            if (codeEl.dataset.highlighted || codeEl.hasAttribute("data-no-highlight")) return

            // Rebucket any leading line anchors into a kept holder so hljs
            // doesn't wrap/move them; restore after highlight.
            const anchors = []
            ;[].slice.call(codeEl.childNodes).forEach(function (node) {
              if (node.nodeType === 1 && (node.id || "").indexOf("__codelineno") === 0) {
                anchors.push(node)
                codeEl.removeChild(node)
              }
            })

            const pre = codeEl.parentElement
            let language = codeEl.className.match(/language-([a-zA-Z0-9_+-]+)/)
            language = language ? language[1] : pre.className.match(/language-([a-zA-Z0-9_+-]+)/)
            language = language ? language[1] : ""
            if (language && hljs.getLanguage(language)) {
              delete codeEl.dataset.highlighted
              hljs.highlightElement(codeEl)
            } else {
              // Fall back to language auto-detection only when no lang hints exist.
              if (!pre.className.match(/language-|no-highlight/) &&
                  !pre.className.match(/highlight/)) {
                delete codeEl.dataset.highlighted
                hljs.highlightElement(codeEl)
              }
            }

            // Re-insert the line anchors first so they lead the block.
            const frag = document.createDocumentFragment()
            anchors.forEach(function (a) { frag.appendChild(a) })
            codeEl.insertBefore(frag, codeEl.firstChild)
          })

        // highlight.js rebuilds each code block, so annotation badges must be
        // re-applied after re-folding (idempotent).
        applyCodeAnnotations()
      } catch (e) {}
    })
  }

  // ---------------------------------------------------------------------------
  // 11. Mermaid.js diagrams
  // ---------------------------------------------------------------------------

  // Global so the palette handler can re-render on scheme change.
  let _mermaidGenericInit = null

  function initMermaid() {
    if (!componentShow("mermaid", "show")) return
    const sources = $$(".mermaid")
    if (!sources.length) return

    const themeVars = function (scheme) {
      const isLight = scheme === "default" || scheme === "light"
      return {
        primaryColor: isLight ? "#ffffff" : "#1f1f1f",
        primaryBorderColor: isLight ? "#0b0b0b" : "#3a3f4b",
        primaryTextColor: isLight ? "#111111" : "#ffffff",
        lineColor: isLight ? "#9aa7b0" : "#c9cdd4",
        secondaryColor: isLight ? "#f1f1f1" : "#2b2f36",
        tertiaryColor: isLight ? "#ececec" : "#262a2e",
        darkMode: !isLight
      }
    }

    _mermaidGenericInit = function () {
      if (!window.mermaid) return
      const scheme = document.documentElement.getAttribute("data-md-color-scheme") || "slate"
      const vars = themeVars(scheme)

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          fontFamily: "'Space Mono', 'SF Mono', Consolas, monospace",
          fontSize: 14,
          themeVariables: vars
        })
      } catch (e) {}

      renderMermaidDiagrams()
    }

    // Converts every `.mermaid` block into a themed card and renders its SVG via
    // mermaid.render(text). Uses a stored source so scheme changes can re-render.

    // --- Phase 20: diagram view controls (zoom / pan / fullscreen / reset) ---

    function diagramTransformString(view) {
      return "translate(" + view.tx + "px," + view.ty + "px) scale(" + view.scale + ")"
    }

    function diagramCurrentView(mark) {
      if (!mark._view) mark._view = { tx: 0, ty: 0, scale: 1 }
      return mark._view
    }

    function diagramApplyTransform(mark) {
      const svg = mark.querySelector(".neoabs-diagram__frame svg")
      if (!svg) return
      const view = diagramCurrentView(mark)
      svg.style.transformOrigin = "center center"
      svg.style.transform = diagramTransformString(view)
      mark.classList.toggle("neoabs-diagram--zoomed",
        view.scale !== 1 || view.tx !== 0 || view.ty !== 0)
    }

    function diagramZoom(mark, factor) {
      const view = diagramCurrentView(mark)
      view.scale = Math.max(0.25, Math.min(view.scale * factor, 8))
      diagramApplyTransform(mark)
    }

    function diagramPan(mark, dx, dy) {
      const view = diagramCurrentView(mark)
      view.tx += dx
      view.ty += dy
      diagramApplyTransform(mark)
    }

    function diagramResetView(mark) {
      mark._view = { tx: 0, ty: 0, scale: 1 }
      diagramApplyTransform(mark)
    }

    function diagramToggleFullscreen(mark) {
      const doc = document
      if (doc.fullscreenElement === mark || doc.webkitFullscreenElement === mark) {
        if (doc.exitFullscreen) doc.exitFullscreen()
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen()
      } else if (mark.requestFullscreen) {
        mark.requestFullscreen()
      } else if (mark.webkitRequestFullscreen) {
        mark.webkitRequestFullscreen()
      }
    }

    function diagramSyncFullscreenButtons() {
      const doc = document
      const fsEl = doc.fullscreenElement || doc.webkitFullscreenElement || null
      $$(".neoabs-diagram__mark").forEach(function (mark) {
        const btn = mark.querySelector('.neoabs-diagram__ctl[data-action="fullscreen"]')
        if (btn) btn.setAttribute("aria-pressed", mark === fsEl ? "true" : "false")
      })
    }

    // A single fullscreenchange hook for the whole document; initMermaid may
    // re-run after a SPA content swap, so bind only once per page.
    if (!initMermaid._diagramFsBound) {
      initMermaid._diagramFsBound = true
      document.addEventListener("fullscreenchange", diagramSyncFullscreenButtons)
      document.addEventListener("webkitfullscreenchange", diagramSyncFullscreenButtons)
    }

    const DIAGRAM_CTL_ICONS = {
      zoom_in: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
      zoom_out: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M19 13H5v-2h14v2z"/></svg>',
      reset: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
      pan_up: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>',
      pan_down: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>',
      pan_left: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
      pan_right: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>',
      fullscreen: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>'
    }

    const DIAGRAM_CTL_ACTIONS = {
      zoom_in: function (mark) { diagramZoom(mark, 1.25) },
      zoom_out: function (mark) { diagramZoom(mark, 0.8) },
      reset: function (mark) { diagramResetView(mark) },
      pan_up: function (mark) { diagramPan(mark, 0, 48) },
      pan_down: function (mark) { diagramPan(mark, 0, -48) },
      pan_left: function (mark) { diagramPan(mark, 48, 0) },
      pan_right: function (mark) { diagramPan(mark, -48, 0) },
      fullscreen: function (mark) { diagramToggleFullscreen(mark) }
    }

    const DIAGRAM_CTL_LABELS = {
      zoom_in: "Zoom in",
      zoom_out: "Zoom out",
      reset: "Reset view",
      pan_up: "Pan up",
      pan_down: "Pan down",
      pan_left: "Pan left",
      pan_right: "Pan right",
      fullscreen: "Enter fullscreen"
    }

    // Zoom so the given content point (cx, cy, relative to the frame) stays put.
    function diagramZoomAt(mark, factor, cx, cy) {
      const view = diagramCurrentView(mark)
      const clamped = Math.max(0.25, Math.min(view.scale * factor, 8))
      const applied = clamped / view.scale
      view.tx = cx - (cx - view.tx) * applied
      view.ty = cy - (cy - view.ty) * applied
      view.scale = clamped
      diagramApplyTransform(mark)
    }

    function diagramZoomed(view) {
      return view.scale !== 1 || view.tx !== 0 || view.ty !== 0
    }

    // --- Phase 20: mouse wheel, trackpad pinch and touch gestures, drag pan. ---
    // Delegated listeners live on the frame (not the SVG) so they survive every
    // scheme-change re-render. Drag/pinch only engage after the viewer is used
    // (zoomed or while a second finger joins), leaving untouched diagrams on the
    // default native scroll/selection behaviour.
    function setupDiagramInteraction(mark, frame) {
      const pointers = new Map()

      frame.addEventListener("wheel", function (e) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const rect = frame.getBoundingClientRect()
          const factor = Math.pow(1.08, -e.deltaY / 70)
          diagramZoomAt(mark, factor, e.clientX - rect.left, e.clientY - rect.top)
          return
        }
        if (diagramZoomed(diagramCurrentView(mark))) {
          e.preventDefault()
          const dx = typeof e.deltaX === "number" ? e.deltaX : 0
          const dy = typeof e.deltaY === "number" ? e.deltaY : 0
          diagramPan(mark, -dx, -dy)
        }
      }, { passive: false })

      frame.addEventListener("pointerdown", function (e) {
        if (e.button !== 0 && e.pointerType !== "touch") return
        if (e.target.closest && e.target.closest(".neoabs-diagram__toolbar, .neoabs-diagram__ctl")) return
        if (!diagramZoomed(diagramCurrentView(mark)) && pointers.size === 0) return
        try { frame.setPointerCapture(e.pointerId) } catch (err) {}
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        e.preventDefault()
      })

      frame.addEventListener("pointermove", function (e) {
        const prev = pointers.get(e.pointerId)
        if (!prev) return
        if (pointers.size >= 2) {
          const all = Array.from(pointers.values()).filter(function (p) { return p !== prev })
          const other = all[0]
          const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y)
          const prevMidX = (prev.x + other.x) / 2
          const prevMidY = (prev.y + other.y) / 2
          const curX = e.clientX
          const curY = e.clientY
          const curDist = Math.hypot(curX - other.x, curY - other.y)
          if (prevDist > 0 && curDist > 0) {
            const rect = frame.getBoundingClientRect()
            const curMidX = (curX + other.x) / 2
            const curMidY = (curY + other.y) / 2
            diagramZoomAt(mark, curDist / prevDist, curMidX - rect.left, curMidY - rect.top)
            const view = diagramCurrentView(mark)
            view.tx += curMidX - prevMidX
            view.ty += curMidY - prevMidY
            diagramApplyTransform(mark)
          }
        } else if (diagramZoomed(diagramCurrentView(mark))) {
          diagramPan(mark, e.clientX - prev.x, e.clientY - prev.y)
        }
        prev.x = e.clientX
        prev.y = e.clientY
      })

      const endPointer = function (e) {
        pointers.delete(e.pointerId)
      }
      frame.addEventListener("pointerup", endPointer)
      frame.addEventListener("pointercancel", endPointer)

      frame.addEventListener("touchstart", function (e) {
        if (diagramZoomed(diagramCurrentView(mark))) e.preventDefault()
      }, { passive: false })

      frame.addEventListener("dblclick", function (e) {
        if (e.target.closest && e.target.closest(".neoabs-diagram__toolbar, .neoabs-diagram__ctl")) return
        const rect = frame.getBoundingClientRect()
        diagramZoomAt(mark, 1.6, e.clientX - rect.left, e.clientY - rect.top)
        e.preventDefault()
      })

      // Safari-specific trackpad pinch gestures.
      frame.addEventListener("gesturestart", function (e) {
        e.preventDefault()
        frame._neoabsGesture = { scale: 1 }
      })
      frame.addEventListener("gesturechange", function (e) {
        e.preventDefault()
        const base = frame._neoabsGesture || (frame._neoabsGesture = { scale: 1 })
        const factor = e.scale > 0 ? e.scale / base.scale : 1
        if (factor === 1 || !isFinite(factor)) return
        base.scale = e.scale
        const rect = frame.getBoundingClientRect()
        const cx = typeof e.clientX === "number" ? e.clientX - rect.left : rect.width / 2
        const cy = typeof e.clientY === "number" ? e.clientY - rect.top : rect.height / 2
        diagramZoomAt(mark, factor, cx, cy)
      })
      frame.addEventListener("gestureend", function () {
        frame._neoabsGesture = null
      })
    }

    function mermaidRenderDiagram(mark) {
      const src = (mark.dataset.mermaidSource || "").trim()
      const frame = mark.querySelector(".neoabs-diagram__frame")
      if (!frame) return
      frame.innerHTML = '<span class="neoabs-diagram__loading">rendering…</span>'
      // v10 signature: render(id, text); v11: render(text). Give an id — v10
      // requires it, v11 tolerates/ignores the second param safely.
      const id = "neoabs-mm-" + (mark._n || (mark._n = 1 + Math.floor(Math.random() * 1e6)))
      mermaid.render(id, src)
        .then(function (result) {
          // v10/v11 return { svg, bindFunctions } (older v9 returns a raw string).
          const svg = typeof result === "string" ? result : (result && result.svg)
          if (!svg) throw new Error("render returned no svg")
          frame.innerHTML = svg
          if (result && typeof result.bindFunctions === "function" && frame.firstChild) {
            try { result.bindFunctions(frame) } catch {}
          }
          mark.classList.add("neoabs-diagram--ready")
          diagramApplyTransform(mark)
        })
        .catch(function (err) {
          // Never lose content: fall back to the raw source in the card.
          frame.innerHTML = ""
          const msg = document.createElement("p")
          msg.className = "neoabs-diagram__errmsg"
          msg.textContent = "Diagram couldn't render: " + (err && err.message ? err.message : String(err))
          const pre = document.createElement("pre")
          pre.className = "neoabs-diagram__error"
          pre.textContent = src
          frame.appendChild(msg)
          frame.appendChild(pre)
          mark.classList.add("neoabs-diagram--error")
          console.error("[neoabs-mermaid]", err)
        })
    }

    function renderMermaidDiagrams() {
      $$(".neoabs-diagram__mark").forEach(mermaidRenderDiagram)
    }

    // Build a card wrapper for a raw <pre class="mermaid"> (or .mermaid element),
    // hiding the original and rendering into a frame. Called once per element.
    function mermaidUpgrade(el) {
      const source = (el.dataset.mermaidSource || (el.querySelector("code") || el).textContent || "").trim()

      const mark = document.createElement("div")
      mark.className = "neoabs-diagram__mark"
      mark.dataset.mermaidSource = source

      const frame = document.createElement("div")
      frame.className = "neoabs-diagram__frame"
      frame.innerHTML = '<span class="neoabs-diagram__loading">rendering…</span>'
      mark.appendChild(frame)

      // Phase 20: control toolbar (zoom / pan / fullscreen / reset). Hidden by
      // CSS until the diagram has rendered; skipped entirely when the
      // `components.mermaid.controls` toggle is off.
      if (componentShow("mermaid", "controls")) {
        const toolbar = document.createElement("div")
        toolbar.className = "neoabs-diagram__toolbar"
        const controlIds = ["zoom_in", "zoom_out", "reset", "pan_up", "pan_down", "pan_left", "pan_right", "fullscreen"]
        controlIds.forEach(function (id) {
          const btn = document.createElement("button")
          btn.type = "button"
          btn.className = "neoabs-diagram__ctl"
          btn.dataset.action = id
          btn.title = DIAGRAM_CTL_LABELS[id]
          btn.setAttribute("aria-label", DIAGRAM_CTL_LABELS[id])
          if (id === "fullscreen") btn.setAttribute("aria-pressed", "false")
          btn.innerHTML = DIAGRAM_CTL_ICONS[id]
          btn.addEventListener("click", function (e) {
            e.preventDefault()
            e.stopPropagation()
            DIAGRAM_CTL_ACTIONS[id](mark)
          })
          toolbar.appendChild(btn)
        })
        mark.appendChild(toolbar)
        setupDiagramInteraction(mark, frame)
      }

      const card = document.createElement("div")
      card.className = "neoabs-diagram"
      card.appendChild(mark)

      // Hide the original pre but keep it as a no-JS/fallback source.
      el.style.display = "none"
      if (el.parentNode) el.parentNode.insertBefore(card, el)
    }

    // Capture raw source and upgrade all present diagrams. Rendering itself is
    // deferred until mermaid finishes loading (see ensureScript below).
    $$(".mermaid").forEach(function (el) {
      mermaidUpgrade(el)
    })

    const src = cdnUrlFor("mermaid") ||
      "https://cdn.jsdelivr.net/npm/mermaid@10.9.8/dist/mermaid.min.js"
    ensureScript(src, function () { if (_mermaidGenericInit) _mermaidGenericInit() })
  }

  // ---------------------------------------------------------------------------
  // 12. Code Copy Buttons
  // ---------------------------------------------------------------------------

  function initCopyButtons(config) {
    if (!componentShow("code", "show_copy_button")) return
    const t = (config && config.translations && config.translations.clipboard) || {}
    const tCopy = contentSetting("code", "copy_label", "") || t.copy || "Copy to clipboard"
    const tCopied = contentSetting("code", "copied_label", "") || t.copied || "Copied to clipboard"

    // Match both Pygments markup forms:
    //   newer: <div class="highlight"><pre>...    -> ".highlight pre"
    //   older: <pre class="highlight">...         -> "pre.highlight"
    const blocks = $$(
      ".highlight pre, .codehilite pre, .neoabs-code pre, " +
      "pre.highlight, pre.codehilite, pre.neoabs-code"
    )
    blocks.forEach((pre) => {
      const wrapper = pre.closest(".highlight, .codehilite, .neoabs-code") || pre.parentNode
      if (!wrapper) return
      if (pre.querySelector(".neoabs-code__copy") || wrapper.querySelector(".neoabs-code__copy")) return

      if (getComputedStyle(wrapper).position === "static") {
        wrapper.style.position = "relative"
      }

      const btn = document.createElement("button")
      btn.className = "neoabs-code__copy"
      btn.setAttribute("type", "button")
      btn.setAttribute("aria-label", tCopy)
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
        '</svg>' +
        '<span class="neoabs-code__copy-label">' + tCopy + '</span>'
      wrapper.appendChild(btn)

      btn.addEventListener("click", () => {
        const code = pre.querySelector("code") || pre
        const text = code.textContent
        copyToClipboard(text).then(() => {
          const label = btn.querySelector(".neoabs-code__copy-label")
          if (label) label.textContent = tCopied
          btn.classList.add("neoabs-code__copy--copied")
          setTimeout(() => {
            if (label) label.textContent = tCopy
            btn.classList.remove("neoabs-code__copy--copied")
          }, 2000)
        }).catch(() => {})
      })
    })
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
    }
    return new Promise((resolve) => {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.cssText = "position:fixed;opacity:0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      resolve()
    })
  }

  // ---------------------------------------------------------------------------
  // 10. Smooth Scroll for Anchor Links
  // ---------------------------------------------------------------------------

  function initAnchorLinks() {
    const smooth = contentSetting("typography", "link_behavior", "smooth") === "smooth"
    const behavior = smooth ? "smooth" : "auto"
    document.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href^="#"]')
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || href === "#") return
      const target = document.getElementById(decodeURIComponent(href.slice(1)))
      if (!target) return
      e.preventDefault()
      target.scrollIntoView({ behavior: behavior, block: "start" })
      history.pushState(null, "", href)
    })

    // Restore the previous in-page scroll/highlight when the user navigates
    // back with the browser's Back button.
    window.addEventListener("popstate", () => {
      const hash = window.location.hash
      if (!hash) return
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" })
    })
  }

  // ---------------------------------------------------------------------------
  // 10b. TOC Permalinks (heading anchor links)
  // ---------------------------------------------------------------------------

  // Phase 6: theme.neoabs.toc — `permalink: false` hides the heading anchor
  // links; `permalink_symbol` swaps their glyph (handled here so SPA-swapped
  // content gets them reapplied on every page).
  function initPermalinks() {
    const tocCfg = (_config && _config.toc) || {}
    const typeset = (_config.content && _config.content.typography) || {}
    if (tocCfg.permalink === false || typeset.heading_anchor === false) {
      document.body.classList.add("neoabs-no-permalink")
    }
    const symbol = typeset.anchor_symbol || tocCfg.permalink_symbol
    if (symbol) {
      $$(".headerlink").forEach((link) => { link.textContent = symbol })
    }
  }

  // ---------------------------------------------------------------------------
  // 11. Content Media & Line Numbers (theme.neoabs.content)
  // ---------------------------------------------------------------------------

  // Responsive embeds/videos and lazy images driven by typography behavior
  // settings. Video width/height attributes (when present) win over the 16/9
  // fallback so YouTube/iframe embeds keep their authored aspect ratio.
  function initContentMedia() {
    if (contentSetting("typography", "video_behavior", "responsive") === "responsive") {
      $$("article iframe, article video").forEach(function (el) {
        if (el.classList.contains("neoabs-video--responsive")) return
        const w = el.getAttribute("width")
        const h = el.getAttribute("height")
        if (w && h && parseInt(w, 10) > 0 && parseInt(h, 10) > 0) {
          el.style.aspectRatio = parseInt(w, 10) + " / " + parseInt(h, 10)
        }
        el.classList.add("neoabs-video--responsive")
      })
    }
    if (contentSetting("typography", "image_behavior", "normal") === "lazy") {
      $$("article img").forEach(function (img) {
        if (img.getAttribute("loading")) return
        img.loading = "lazy"
        img.decoding = "async"
      })
    }
  }

  // Image lightbox: opens a full-viewport overlay when any content image
  // without a wrapping link is clicked. One reusable overlay is created on
  // first open and reused — navigating swaps the image in place instead of
  // stacking overlays (which left stale layers behind and broke the close
  // button after the first prev/next). Controls: close (button, Escape, tap
  // on the backdrop), prev/next (buttons, arrow keys, swipe), zoom in/out
  // (buttons, mouse wheel, pinch, double-click), pan while zoomed (mouse or
  // touch drag), plus copy and download. Closes on page scroll/resize.
  // Opt out via theme.neoabs.content.typography.image_lightbox = false.
  function initImageZoom() {
    if (contentSetting("typography", "image_lightbox", true) === false) return
    const images = $$("article .neoabs-typeset img")
    if (!images.length) return

    let overlay = null
    let stageEl = null
    let openIndex = -1
    let zoom = 1
    let panX = 0
    let panY = 0
    let drag = null
    let touchMap = {}
    let pinch = null
    let pinching = false
    const MIN_ZOOM = 0.5
    const MAX_ZOOM = 6

    function makeBtn(className, label, aria) {
      const b = document.createElement("button")
      b.className = className
      b.setAttribute("type", "button")
      b.setAttribute("aria-label", aria)
      b.innerHTML = label
      return b
    }

    function buildOverlay() {
      const ov = document.createElement("div")
      ov.className = "neoabs-zoom"
      ov.setAttribute("role", "dialog")
      ov.setAttribute("aria-modal", "true")
      ov.setAttribute("aria-label", "Image preview")

      const stage = document.createElement("div")
      stage.className = "neoabs-zoom__stage"

      const img = document.createElement("img")
      img.className = "neoabs-zoom__img"
      img.alt = ""
      img.draggable = false
      stage.appendChild(img)

      const caption = document.createElement("div")
      caption.className = "neoabs-zoom__caption"

      const close = makeBtn("neoabs-zoom__btn neoabs-zoom__close", "\u00d7", "Close preview")
      const prev = makeBtn("neoabs-zoom__btn neoabs-zoom__prev", "\u2039", "Previous image")
      const next = makeBtn("neoabs-zoom__btn neoabs-zoom__next", "\u203a", "Next image")

      const tools = document.createElement("div")
      tools.className = "neoabs-zoom__tools"
      const zoomin = makeBtn("neoabs-zoom__btn neoabs-zoom__tool neoabs-zoom__zoomin", "\u002b", "Zoom in")
      const zoomout = makeBtn("neoabs-zoom__btn neoabs-zoom__tool neoabs-zoom__zoomout", "\u2212", "Zoom out")
      const copy = makeBtn("neoabs-zoom__btn neoabs-zoom__tool neoabs-zoom__copy", "\u29c9", "Copy image")
      const download = makeBtn("neoabs-zoom__btn neoabs-zoom__tool neoabs-zoom__download", "\u2193", "Download image")
      const state = document.createElement("span")
      state.className = "neoabs-zoom__state"
      state.textContent = "100%"
      tools.appendChild(zoomin)
      tools.appendChild(zoomout)
      tools.appendChild(copy)
      tools.appendChild(download)
      tools.appendChild(state)

      ov.appendChild(stage)
      ov.appendChild(caption)
      ov.appendChild(close)
      if (images.length > 1) {
        ov.appendChild(prev)
        ov.appendChild(next)
      }
      ov.appendChild(tools)
      return ov
    }

    function bindOverlay(ov) {
      stageEl = ov.querySelector(".neoabs-zoom__stage")
      ov.addEventListener("click", function (e) {
        if (!overlay) return
        if (zoom > 1) return
        if (e.target === ov || (stageEl && e.target === stageEl)) close()
      })
      ov.querySelector(".neoabs-zoom__close").addEventListener("click", function (e) {
        e.stopPropagation()
        close()
      })
      const prev = ov.querySelector(".neoabs-zoom__prev")
      const next = ov.querySelector(".neoabs-zoom__next")
      if (prev) prev.addEventListener("click", function (e) { e.stopPropagation(); navigate(-1) })
      if (next) next.addEventListener("click", function (e) { e.stopPropagation(); navigate(1) })
      ov.querySelector(".neoabs-zoom__zoomin").addEventListener("click", function (e) { e.stopPropagation(); zoomStep(1.25) })
      ov.querySelector(".neoabs-zoom__zoomout").addEventListener("click", function (e) { e.stopPropagation(); zoomStep(1 / 1.25) })
      ov.querySelector(".neoabs-zoom__copy").addEventListener("click", function (e) { e.stopPropagation(); copyImage() })
      ov.querySelector(".neoabs-zoom__download").addEventListener("click", function (e) { e.stopPropagation(); downloadImage() })
      if (stageEl) {
        stageEl.addEventListener("wheel", onWheel, { passive: false })
        stageEl.addEventListener("dblclick", onDblClick)
        stageEl.addEventListener("pointerdown", onPointerDown)
        stageEl.addEventListener("pointermove", onPointerMove)
        stageEl.addEventListener("pointerup", onPointerUp)
        stageEl.addEventListener("pointercancel", onPointerCancel)
        stageEl.addEventListener("touchstart", onTouchStart, { passive: false })
        stageEl.addEventListener("touchmove", onTouchMove, { passive: false })
        stageEl.addEventListener("touchend", onTouchEnd, { passive: false })
      }
      window.addEventListener("keydown", onKey)
      window.addEventListener("scroll", close, true)
      window.addEventListener("resize", close)
    }

    function show(index) {
      if (!overlay) {
        overlay = buildOverlay()
        bindOverlay(overlay)
        document.body.appendChild(overlay)
      }
      openIndex = ((index % images.length) + images.length) % images.length
      const img = images[openIndex]
      const view = overlay.querySelector(".neoabs-zoom__img")
      view.src = img.currentSrc || img.src
      view.alt = img.alt || ""
      const cap = overlay.querySelector(".neoabs-zoom__caption")
      if (cap) cap.textContent = "" + (openIndex + 1) + " / " + images.length
      document.body.classList.add("neoabs-zoom--open")
      resetView()
    }

    function close() {
      if (!overlay) return
      document.body.classList.remove("neoabs-zoom--open")
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
      overlay.remove()
      overlay = null
      stageEl = null
      openIndex = -1
      drag = null
      touchMap = {}
      pinch = null
      pinching = false
    }

    function navigate(delta) {
      if (!images.length) return
      show(openIndex + delta)
    }

    function applyView() {
      if (!overlay) return
      const view = overlay.querySelector(".neoabs-zoom__img")
      if (view) {
        view.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + zoom + ") translateZ(0)"
      }
      if (stageEl) stageEl.classList.toggle("neoabs-zoom__stage--pan", zoom > 1)
      const state = overlay.querySelector(".neoabs-zoom__state")
      if (state) state.textContent = Math.round(zoom * 100) + "%"
    }

    function resetView() {
      zoom = 1
      panX = 0
      panY = 0
      applyView()
    }

    function rectOfStage() {
      return stageEl && typeof stageEl.getBoundingClientRect === "function"
        ? stageEl.getBoundingClientRect()
        : null
    }

    function zoomAt(factor, cx, cy, rect) {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor))
      const f = next / zoom
      let nx = 0
      let ny = 0
      if (rect) {
        nx = cx - rect.left - rect.width / 2
        ny = cy - rect.top - rect.height / 2
      }
      panX = nx - (nx - panX) * f
      panY = ny - (ny - panY) * f
      zoom = next
      applyView()
    }

    function zoomStep(factor) {
      const rect = rectOfStage()
      const cx = rect ? rect.left + rect.width / 2 : 0
      const cy = rect ? rect.top + rect.height / 2 : 0
      zoomAt(factor, cx, cy, rect)
    }

    function onWheel(e) {
      if (!overlay) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      zoomAt(factor, e.clientX, e.clientY, rectOfStage())
    }

    function onDblClick(e) {
      if (!overlay) return
      if (zoom > 1) {
        resetView()
      } else {
        zoomAt(2, e.clientX, e.clientY, rectOfStage())
      }
    }

    function onPointerDown(e) {
      if (pinching) return
      drag = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        px: e.clientX,
        py: e.clientY,
        moved: false,
      }
      if (stageEl && stageEl.setPointerCapture) {
        try {
          if (stageEl.setPointerCapture) stageEl.setPointerCapture(e.pointerId)
        } catch (_err) { /* capture can throw for unsupported pointers */ }
      }
    }

    function onPointerMove(e) {
      if (!drag || pinching || drag.id !== e.pointerId) return
      const dx = e.clientX - drag.px
      const dy = e.clientY - drag.py
      if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 4) drag.moved = true
      drag.px = e.clientX
      drag.py = e.clientY
      if (zoom <= 1) return
      panX += dx
      panY += dy
      applyView()
    }

    function onPointerUp(e) {
      if (!drag || drag.id !== e.pointerId) return
      const wasDrag = drag.moved
      const dx = e.clientX - drag.x0
      const dy = e.clientY - drag.y0
      drag = null
      if (pinching || zoom > 1 || wasDrag) return
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) close()
    }

    function onPointerCancel() {
      drag = null
    }

    function touchDistance() {
      const keys = Object.keys(touchMap)
      if (keys.length < 2) return 0
      const a = touchMap[keys[0]]
      const b = touchMap[keys[1]]
      return Math.max(0.001, Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)))
    }

    function onTouchStart(e) {
      const changed = e.changedTouches || []
      for (let i = 0; i < changed.length; i++) {
        touchMap[changed[i].identifier] = { x: changed[i].clientX, y: changed[i].clientY }
      }
      const keys = Object.keys(touchMap)
      if (keys.length < 2) return
      e.preventDefault()
      pinching = true
      drag = null
      pinch = { dist0: touchDistance(), zoom0: zoom }
    }

    function onTouchMove(e) {
      const keys = Object.keys(touchMap)
      if (keys.length < 2 || !pinch) return
      const changed = e.changedTouches || []
      for (let i = 0; i < changed.length; i++) {
        if (touchMap[changed[i].identifier]) {
          touchMap[changed[i].identifier] = { x: changed[i].clientX, y: changed[i].clientY }
        }
      }
      e.preventDefault()
      const a = touchMap[keys[0]]
      const b = touchMap[keys[1]]
      const rect = rectOfStage()
      const cx = rect ? (a.x + b.x) / 2 : 0
      const cy = rect ? (a.y + b.y) / 2 : 0
      zoomAt(touchDistance() / pinch.dist0, cx, cy, rect)
    }

    function onTouchEnd(e) {
      const changed = e.changedTouches || []
      for (let i = 0; i < changed.length; i++) {
        delete touchMap[changed[i].identifier]
      }
      const keys = Object.keys(touchMap)
      if (keys.length === 2) {
        pinch = { dist0: touchDistance(), zoom0: zoom }
      } else if (pinch) {
        e.preventDefault()
        pinch = null
        pinching = false
      }
    }

    function copyImage() {
      const view = overlay.querySelector(".neoabs-zoom__img")
      const src = view ? view.src || "" : ""
      const btn = overlay.querySelector(".neoabs-zoom__copy")
      function feedback() {
        if (!btn) return
        const old = btn.innerHTML
        btn.innerHTML = "\u2713"
        setTimeout(function () { btn.innerHTML = old }, 1200)
      }
      const nav = (typeof navigator !== "undefined" && navigator) || {}
      const clip = nav.clipboard || {}
      function urlFallback() {
        if (clip.writeText) {
          try {
            clip.writeText(src).then(feedback, function () {})
          } catch (_err) {
            feedback()
          }
        }
      }
      if (window.ClipboardItem && clip.write && src.indexOf("data:") !== 0) {
        fetch(src)
          .then(function (r) { return r.blob() })
          .then(function (blob) {
            const type = blob.type || "image/png"
            return clip.write([new window.ClipboardItem({ [type]: blob })])
          })
          .then(feedback, urlFallback)
      } else if (clip.writeText) {
        urlFallback()
      }
    }

    function fileNameFromUrl(src) {
      let name = decodeURIComponent(src.split(/[?#]/)[0].split("/").pop() || "")
      if (!name || name === "image") name = "image"
      return name
    }

    function extFromMime(type) {
      const m = /^image\/([a-z0-9.+-]+)/i.exec(type || "")
      if (!m) return ""
      const ext = m[1].toLowerCase().replace(/jpeg$/, "jpg").split("+")[0]
      return "." + ext
    }

    function fileNameWithExt(name, type) {
      if (String(name).indexOf(".") !== -1) return name
      const ext = extFromMime(type)
      return name + (ext || ".png")
    }

    function triggerDownload(href, name) {
      const a = document.createElement("a")
      a.href = href
      a.download = name || "image"
      a.rel = "noopener"
      a.style.display = "none"
      document.body.appendChild(a)
      if (typeof a.click === "function") a.click()
      window.setTimeout(function () { a.remove() }, 0)
    }

    function downloadImage() {
      const view = overlay.querySelector(".neoabs-zoom__img")
      const src = view ? view.src || "" : ""
      if (!src) return
      const name = fileNameFromUrl(src)

      // The `download` attribute is ignored by browsers for cross-origin URLs,
      // which then navigate to the raw image instead of downloading. Fetch the
      // bytes and serve them from an object URL so the attribute is honored
      // (and the filename sticks) for every same-origin or CORS-enabled image.
      const hasFetch = typeof fetch === "function"
      const hasObjectUrl = typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"

      if (src.indexOf("blob:") === 0) {
        triggerDownload(src, name)
        return
      }
      if (!hasFetch || !hasObjectUrl) {
        triggerDownload(src, name)
        return
      }

      fetch(src)
        .then(function (r) {
          if (!r.ok) throw new Error("image fetch failed")
          return r.blob()
        })
        .then(function (blob) {
          const url = URL.createObjectURL(blob)
          triggerDownload(url, fileNameWithExt(name, blob.type))
          window.setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
        })
        .catch(function () {
          // Cross-origin image without CORS: we cannot force a download from
          // this page, so fall back to the raw URL (may navigate).
          triggerDownload(src, name)
        })
    }

    function onKey(e) {
      if (!overlay) return
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault()
        close()
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        navigate(1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        navigate(-1)
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        zoomStep(1.25)
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault()
        zoomStep(1 / 1.25)
      } else if (e.key === "0") {
        e.preventDefault()
        resetView()
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault()
        copyImage()
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault()
        downloadImage()
      }
    }

    images.forEach(function (img, i) {
      if (img.closest("a")) return
      img.tabIndex = 0
      img.setAttribute("role", "button")
      img.setAttribute("aria-label", "Preview image")
      img.addEventListener("click", function (e) {
        e.preventDefault()
        show(i)
      })
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          show(i)
        }
      })
    })
  }

  // ---------------------------------------------------------------------------
  // Phase 6 — Engagement & privacy
  // ---------------------------------------------------------------------------

  // Consent memory. The theme never stores anything but a binary accept/decline
  // flag in localStorage; `null` (nothing stored) means undecided.
  function consentState() {
    return storageGet("consent")
  }
  function consentAccepted() { return consentState() === "accepted" }
  function consentDeclined() { return consentState() === "declined" }

  // Deferred-integration handlers: run now when consent was already accepted,
  // otherwise once the reader clicks "Accept". Used by giscus so no third-party
  // request is made before the reader opts in.
  let _consentAcceptHandlers = []
  function onConsentAccept(fn) {
    if (consentAccepted()) { try { fn() } catch (e) {} return }
    _consentAcceptHandlers.push(fn)
  }
  function runConsentAcceptHandlers() {
    const pending = _consentAcceptHandlers
    _consentAcceptHandlers = []
    pending.forEach(function (fn) { try { fn() } catch (e) {} })
  }

  // "Was this page helpful?" — GitHub-issue-backed feedback. A short widget is
  // appended to the article; "Yes" and "No" both open a prefilled issue in a new
  // tab (positive/negative body). No analytics, no tracking — the click is a
  // plain issue link.
  function openFeedbackIssue(config, f, vote) {
    const repo = String((config && config.repo_url) || "").replace(/\/+$/, "")
    if (!repo) return
    const labels = Array.isArray(f.github_labels) && f.github_labels.length
      ? f.github_labels.map(encodeURIComponent).join(",")
      : "feedback"
    const who = vote === "yes" ? "Positive" : "Negative"
    const pageUrl = (typeof location !== "undefined" && location.href) || ""
    const body = "## " + who + " feedback\n\n" + "Page: " + pageUrl + "\n"
    const title = (typeof document !== "undefined" && document.title) || ""
    const issueUrl =
      repo + "/issues/new?labels=" + labels +
      "&title=" + encodeURIComponent("Feedback: " + title) +
      "&body=" + encodeURIComponent(body)
    if (typeof window !== "undefined" && typeof window.open === "function") {
      window.open(issueUrl, "_blank", "noopener")
    }
    if (vote === "yes" && typeof neoabsToast === "function") {
      neoabsToast(f.thanks || "Thanks for the feedback!", "success")
    }
  }

  function initFeedback(config) {
    if (!componentShow("feedback", "show")) return
    const f = (config && config.feedback) || {}
    if (f.enabled === false || f.show === false) return
    const repo = String((config && config.repo_url) || "").replace(/\/+$/, "")
    if (!repo) return
    const typeset = $("article .neoabs-typeset")
    if (!typeset || typeset.querySelector(".neoabs-feedback")) return

    const widget = document.createElement("div")
    widget.className = "neoabs-feedback"
    const title = document.createElement("div")
    title.className = "neoabs-feedback__title"
    title.textContent = f.title || "Was this page helpful?"
    const actions = document.createElement("div")
    actions.className = "neoabs-feedback__actions"
    const yes = document.createElement("button")
    yes.type = "button"
    yes.className = "neoabs-btn neoabs-btn--ghost neoabs-feedback__btn neoabs-feedback__btn--yes"
    yes.dataset.feedback = "yes"
    yes.textContent = f.positive || "Yes — thanks!"
    const no = document.createElement("button")
    no.type = "button"
    no.className = "neoabs-btn neoabs-btn--accent neoabs-feedback__btn neoabs-feedback__btn--no"
    no.dataset.feedback = "no"
    no.textContent = f.negative || "No — open an issue"
    actions.appendChild(yes)
    actions.appendChild(no)
    widget.appendChild(title)
    widget.appendChild(actions)
    typeset.appendChild(widget)

    yes.addEventListener("click", function (e) {
      if (e && e.preventDefault) e.preventDefault()
      openFeedbackIssue(config, f, "yes")
    })
    no.addEventListener("click", function (e) {
      if (e && e.preventDefault) e.preventDefault()
      openFeedbackIssue(config, f, "no")
    })
  }

  // Dismissable announcement bar. A one-line bar is fixed to the bottom of the
  // viewport. Dismissal persists in localStorage keyed by the bar text, so
  // updating the announcement re-shows it. `extra.neoabs_announce` and
  // `theme.neoabs.announcement_bar.text` both work (dict wins).
  function dismissAnnouncement(bar, key) {
    storageSet(key, "1")
    bar.remove()
  }
  function initAnnouncement(config) {
    if (!componentShow("announcement_bar", "show")) return
    const a = (config && config.announcement_bar) || {}
    if (a.enabled === false || a.show === false) return
    const text = String(a.text || "").trim()
    if (!text) return
    if ($(".neoabs-announcement")) return

    const key = "announcement-dismissed-" + encodeURIComponent(text).slice(0, 80)
    if (storageGet(key) === "1") return

    const positions = ["top", "right", "bottom", "left", "center"]
    const pos = positions.indexOf(a.position) !== -1 ? a.position : "bottom"

    // `center` turns the announcement into a popup: a dimmed backdrop is added
    // behind the card and clicking it dismisses the announcement.
    let backdrop = null
    if (pos === "center") {
      backdrop = document.createElement("div")
      backdrop.className = "neoabs-popup-backdrop"
      backdrop.addEventListener("click", function () { dismissAnnouncement(bar, key) })
    }

    const bar = document.createElement("div")
    bar.className = "neoabs-announcement neoabs-announcement--" + pos
    const inner = document.createElement("div")
    inner.className = "neoabs-announcement__inner"
    const label = document.createElement("span")
    label.className = "neoabs-announcement__text"
    label.textContent = text
    inner.appendChild(label)
    bar.appendChild(inner)
    if (a.dismissable !== false) {
      const close = document.createElement("button")
      close.type = "button"
      close.className = "neoabs-announcement__close"
      close.setAttribute("aria-label", "Dismiss")
      close.dataset.announceDismiss = ""
      close.textContent = "\u00d7"
      bar.appendChild(close)
      close.addEventListener("click", function () {
        dismissAnnouncement(bar, key)
        if (backdrop) backdrop.remove()
      })
    }
    if (backdrop) document.body.appendChild(backdrop)
    document.body.appendChild(bar)
  }

  // Rewrite anchor hrefs that carry the deployed `site_url` (from mkdocs.yml)
  // onto the current origin. Navigation links are emitted relative and work on
  // any origin; this only dishes out links that were baked/hardcoded with the
  // main site URL. On a localhost:{port} preview such links are rewired to the
  // dev server (production base path stripped) so a click never leaves the
  // preview; on the deployed origin it is a no-op. Links that are already
  // relative, fragmented, or target another host are left untouched.
  function initLinkRebase(config) {
    const prodUrl = (config && config.site_url) || ""
    if (!prodUrl) return
    let prod
    try { prod = new URL(prodUrl, location.href) } catch (_) { return }
    const prodOrigin = prod.origin
    const here = location.origin
    if (!here || prodOrigin === here) return
    const prodBase = prod.pathname ? prod.pathname.replace(/\/+$/, "") : ""
    const links = document.querySelectorAll("a[href]")
    for (let i = 0; i < links.length; i++) {
      const el = links[i]
      const href = el.getAttribute("href")
      if (!href || href.charAt(0) === "#") continue
      if (href.indexOf("://") === -1 && href.charAt(0) !== "/") continue
      let u
      try { u = new URL(href, location.href) } catch (_) { continue }
      if (u.origin !== prodOrigin) continue
      let rel = u.pathname || "/"
      if (prodBase && (rel === prodBase || rel.indexOf(prodBase + "/") === 0)) {
        rel = rel === prodBase ? "/" : rel.slice(prodBase.length)
      }
      el.setAttribute("href", here + rel + u.search + u.hash)
    }
  }

  // Privacy-first cookie consent. NeoAbs ships no trackers, so the banner only
  // renders when `config.consent_needed` is true (an actual integration like
  // gtag or giscus is configured). Accept/decline is a plain localStorage flag;
  // accepting also unlocks delayed integrations via runConsentAcceptHandlers().
  function initConsent(config) {
    if (!componentShow("cookie_consent", "show")) return
    const c = (config && config.cookie_consent) || {}
    if (c.enabled === false || c.show === false) return
    if (!(config && config.consent_needed)) return
    if (consentAccepted() || consentDeclined()) return
    if ($(".neoabs-consent")) return

    const panel = document.createElement("div")
    const positions = ["top", "right", "bottom", "left", "center"]
    const pos = positions.indexOf(c.position) !== -1 ? c.position : "bottom"
    panel.className = "neoabs-consent neoabs-consent--" + pos
    // `center` shows the consent card as a centered popup over a dimmed
    // backdrop. The backdrop is intentionally inert: the Accept/Decline
    // buttons are the only way to settle the prompt.
    let backdrop = null
    if (pos === "center") {
      backdrop = document.createElement("div")
      backdrop.className = "neoabs-popup-backdrop"
    }
    const message = document.createElement("span")
    message.className = "neoabs-consent__message"
    message.textContent = c.message ||
      "This site stores nothing about you unless you enable integrations."
    const actions = document.createElement("div")
    actions.className = "neoabs-consent__actions"
    const accept = document.createElement("button")
    accept.type = "button"
    accept.className = "neoabs-btn neoabs-consent__btn neoabs-consent__accept"
    accept.dataset.consent = "accept"
    accept.textContent = c.accept_label || "Accept"
    const decline = document.createElement("button")
    decline.type = "button"
    decline.className = "neoabs-btn neoabs-btn--ghost neoabs-consent__btn neoabs-consent__decline"
    decline.dataset.consent = "decline"
    decline.textContent = c.decline_label || "Decline"
    actions.appendChild(accept)
    actions.appendChild(decline)
    panel.appendChild(message)
    panel.appendChild(actions)
    if (backdrop) document.body.appendChild(backdrop)
    document.body.appendChild(panel)

    const settleConsent = function (choice) {
      storageSet("consent", choice)
      if (choice === "accepted") runConsentAcceptHandlers()
      if (backdrop) backdrop.remove()
      panel.remove()
    }
    accept.addEventListener("click", function () {
      settleConsent("accepted")
    })
    decline.addEventListener("click", function () {
      settleConsent("declined")
    })
  }

  // Opt-in comments via giscus (the only supported provider). The container and
  // loader script are created client-side so the cookie-consent flow holds:
  // when an integration is configured, nothing loads until "Accept".
  let _giscusLoaded = false

  function currentScheme() {
    return document.documentElement.getAttribute("data-md-color-scheme") || ""
  }

  function giscusThemeFor(config) {
    const cm = (config && config.comments) || {}
    const conf = (cm.theme && typeof cm.theme === "object") ? cm.theme : {}
    const scheme = currentScheme()
    const isLight = scheme === "default" || scheme === "light"
    return isLight ? (conf.light || "light") : (conf.dark || "dark")
  }

  function syncCommentsTheme() {
    const theme = giscusThemeFor(_config)
    // Keep the loader script's theme in sync for widgets mounted later, then
    // push theme updates into already-rendered widgets via giscus' setConfig
    // message (client.js reads config from the script tag, so updating its
    // data-theme alone would not affect a live iframe).
    $$("script[data-giscus='loaded']").forEach(function (s) {
      if (s.dataset.theme !== theme) s.dataset.theme = theme
    })
    $$("iframe.giscus-frame").forEach(function (frame) {
      let origin = "https://giscus.app"
      try { origin = new URL(frame.src).origin } catch (e) {}
      frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, origin)
    })
  }

  function commentsAllowed(config) {
    const c = (config && config.cookie_consent) || {}
    const consentOn = c.enabled !== false && c.show !== false &&
      !!(config && config.consent_needed)
    return !consentOn || consentAccepted()
  }

  function loadGiscusScript(config) {
    if (_giscusLoaded) return
    if (document.querySelector('script[data-giscus="loaded"]')) {
      _giscusLoaded = true
      return
    }
    const cm = (config && config.comments) || {}
    const typeset = $("article .neoabs-typeset")

    const wrap = document.createElement("div")
    wrap.className = "neoabs-comments"
    const heading = document.createElement("h2")
    heading.className = "neoabs-comments__title"
    heading.textContent = (config && config.translations &&
      config.translations.comments && config.translations.comments.title) ||
      "Comments"
    const box = document.createElement("div")
    box.className = "giscus neoabs-giscus"
    wrap.appendChild(heading)
    wrap.appendChild(box)
    if (typeset) typeset.appendChild(wrap)

    // giscus reads its configuration from the loader script's OWN data-*
    // attributes (client.js uses `script.dataset`); the .giscus element is
    // only the mount point for the widget iframe.
    const src = cdnUrlFor("giscus") || "https://giscus.app/client.js"
    const s = document.createElement("script")
    s.src = src
    s.async = true
    s.defer = true
    s.crossOrigin = "anonymous"
    s.dataset.giscus = "loaded"
    s.dataset.repo = cm.repo || ""
    s.dataset.repoId = cm.repo_id || ""
    if (cm.category) s.dataset.category = cm.category
    if (cm.category_id) s.dataset.categoryId = cm.category_id
    s.dataset.mapping = cm.mapping || "pathname"
    if (cm.mapping === "specific" && cm.term) s.dataset.term = cm.term
    s.dataset.inputPosition = "top"
    s.dataset.loading = "lazy"
    if (cm.language) s.dataset.lang = cm.language
    if (cm.strict) s.dataset.strict = "1"
    s.dataset.theme = giscusThemeFor(config)
    _giscusLoaded = true
    document.head.appendChild(s)
  }

  function initComments(config) {
    if (!componentShow("giscus", "show")) return
    const cm = (config && config.comments) || {}
    if (cm.enabled === false) return
    if (cm.provider && cm.provider !== "giscus") return
    if (!cm.repo || !cm.repo_id) return
    if ($(".neoabs-comments")) return

    if (commentsAllowed(config)) {
      loadGiscusScript(config)
    } else if (config && config.consent_needed) {
      onConsentAccept(function () { loadGiscusScript(_config) })
    }
  }

  // Responsive tables: wraps markdown <table> in a horizontally scrollable
  // `.table-wrapper`. Opt out via theme.neoabs.content.tables.responsive = false.
  function initContentTables() {
    if (document.documentElement.getAttribute("data-md-neoabs-tables-responsive") === "false") return
    $$("article table").forEach(function (table) {
      if (table.closest(".table-wrapper")) return
      const wrap = document.createElement("div")
      wrap.className = "table-wrapper"
      table.parentNode.insertBefore(wrap, table)
      wrap.appendChild(table)
    })
  }

  // Numbered code blocks: injects an absolute line-number gutter into every
  // multi-line <pre> and marks the block as `neoabs-code--numbered`. Respects
  // the authored `data-line-numbers` attribute and the start offset. Runs after
  // initHighlighting so highlight.js cannot move the injected gutter.
  function initCodeLineNumbers() {
    if (!contentSetting("code", "show_line_numbers", false)) return
    const cfg = (_config.content && _config.content.code) || {}
    const startNum = Number(cfg.line_number_start) > 0 ? Number(cfg.line_number_start) : 1

    if (!contentSetting("code", "highlight_lines", true)) {
      document.body.classList.add("neoabs-no-line-highlight")
    }

    $$(".highlight pre, .codehilite pre, pre.highlight, pre.codehilite, pre.neoabs-code")
      .forEach(function (pre) {
        if (pre.classList.contains("neoabs-code--numbered")) return
        const code = pre.querySelector("code") || pre
        const text = (code.textContent || "").replace(/\s+$/, "")
        const count = text ? (text.match(/\n/g) || []).length + 1 : 0
        const hasAnchors = !!pre.querySelector('a[id^="__codelineno"]')
        if (count < 2 && !hasAnchors && !pre.hasAttribute("data-line-numbers")) return

        const digits = String(count - 1 + startNum).length
        let nums = ""
        for (let i = 0; i < count; i++) nums += (i + startNum) + "\n"

        const gutter = document.createElement("span")
        gutter.className = "neoabs-code__line-numbers"
        gutter.setAttribute("aria-hidden", "true")
        gutter.textContent = nums

        const codeStyle = getComputedStyle(code)
        const preStyle = getComputedStyle(pre)
        const lh = parseFloat(codeStyle.lineHeight) > 0 ? codeStyle.lineHeight : codeStyle.fontSize
        gutter.style.fontSize = codeStyle.fontSize
        gutter.style.lineHeight = lh
        gutter.style.paddingTop = preStyle.paddingTop || "13px"
        gutter.style.paddingBottom = preStyle.paddingBottom || "13px"
        gutter.style.width = (digits + 1) + "ch"

        pre.classList.add("neoabs-code--numbered")
        code.style.paddingLeft = (digits + 2) + "ch"
        pre.insertBefore(gutter, pre.firstChild)
      })
  }

  // Code annotations (`# (1)!` markers, pymdownx.highlight "annotate" guide).
  // Walks the highlighted source as text nodes so it works whether the block was
  // rendered by Pygments at build time or re-folded by highlight.js at runtime.
  // The trailing marker on a line like `os.getcwd()  # (1)!` becomes a numbered
  // pill; the definition list that follows the code block is the legend.
  function applyCodeAnnotations() {
    if (contentSetting("code", "annotate", true) === false) return
    $$("article .highlight pre > code, article pre.highlight > code, article .codehilite pre > code")
      .forEach(function (codeEl) {
        if (codeEl.querySelector(".neoabs-annotation")) return
        collectCodeAnnotationMarkers(codeEl)
      })
    wireAnnotationLegend()
  }

  function codeTextNodes(root) {
    const nodes = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let n
    while ((n = walker.nextNode())) nodes.push(n)
    return nodes
  }

  function collectCodeAnnotationMarkers(codeEl) {
    const textNodes = codeTextNodes(codeEl)
    if (!textNodes.length) return
    let full = ""
    textNodes.forEach(function (t) { full += t.nodeValue })

    // A marker is `(N)!` at the end of a source line, optionally prefixed by a
    // comment leader (`# `, `// `, `-- `, `/* ` ...). Match per line so a marker
    // can never span into the next line.
    let cursor = 0
    full.split("\n").forEach(function (line) {
      const m = /\((\d+)\)!(\s*)$/.exec(line)
      if (m) {
        const markerStart = cursor + m.index
        const markerEnd = cursor + m.index + m[0].length - m[1].length - 1 // drop `!...`
        wrapAnnotationRange(codeEl, markerStart, markerEnd, m[1])
      }
      cursor += line.length + 1 // +1 for the consumed newline
    })
  }

  function wrapAnnotationRange(codeEl, start, end, label) {
    const textNodes = codeTextNodes(codeEl)
    let pos = 0
    textNodes.forEach(function (tn) {
      if (!tn.nodeValue.length) return
      const nodeStart = pos
      const nodeEnd = pos + tn.nodeValue.length
      pos = nodeEnd
      const ovStart = Math.max(nodeStart, start)
      const ovEnd = Math.min(nodeEnd, end)
      if (ovStart >= ovEnd) return
      let seg = tn
      if (ovStart > nodeStart) seg = tn.splitText(ovStart - nodeStart)
      const overlap = end - ovStart
      if (overlap < seg.nodeValue.length) seg = seg.splitText(overlap)
      const badge = document.createElement("span")
      badge.className = "neoabs-annotation"
      badge.setAttribute("data-index", label)
      badge.setAttribute("aria-label", "Annotation " + label)
      badge.textContent = label
      seg.parentNode.replaceChild(badge, seg)
    })
  }

  function wireAnnotationLegend() {
    const list = $$("article .neoabs-typeset ol.neoabs-annotations")[0] || null
    if (!list) return
    const items = $$("li", list)
    function clearActive() {
      items.forEach(function (li) { li.classList.remove("is-active") })
    }
    list.addEventListener("mouseover", function (e) {
      const li = e.target.closest("li")
      if (!li) return
      const idx = items.indexOf(li) + 1
      clearActive()
      $$(".neoabs-annotation").forEach(function (b) {
        if (Number(b.getAttribute("data-index")) === idx) b.classList.add("is-active")
      })
      li.classList.add("is-active")
    })
    list.addEventListener("mouseout", function () {
      clearActive()
      $$(".neoabs-annotation").forEach(function (b) { b.classList.remove("is-active") })
    })
  }

  function initCodeAnnotations() {
    if (contentSetting("code", "annotate", true) === false) return
    // Number the definition lists that immediately follow annotated blocks.
    $$("article .neoabs-typeset div.highlight + ol, article .neoabs-typeset pre.highlight + ol, article .neoabs-typeset pre + ol")
      .forEach(function (ol) {
        if (ol.classList.contains("neoabs-annotations")) return
        ol.classList.add("neoabs-annotations")
        $$("li", ol).forEach(function (li, i) {
          li.setAttribute("data-index", "" + (i + 1))
        })
      })
    applyCodeAnnotations()
  }

  // ---------------------------------------------------------------------------
  // 11. Keyboard Navigation
  // ---------------------------------------------------------------------------

  let isComposing = false

  // Map a configured shortcut string like "Ctrl+Shift+B", "Escape", "g", or
  // "Cmd+Shift+K" to the matching KeyboardEvent. `Ctrl` and `Meta` are treated
  // as interchangeable (Cmd == Ctrl on macOS), matching the theme's existing
  // toggles. Plain keys (no modifiers) only fire without Ctrl/Meta/Alt; Shift
  // is tolerated so shifted punctuation such as "?" still works.
  function matchesKeyCombo(e, combo) {
    const parts = String(combo || "").split("+").map((p) => p.trim())
    if (!parts.length) return false
    const ctrl = parts.indexOf("Ctrl") !== -1 || parts.indexOf("Cmd") !== -1 || parts.indexOf("Meta") !== -1
    const shift = parts.indexOf("Shift") !== -1
    const alt = parts.indexOf("Alt") !== -1
    const key = parts[parts.length - 1]
    if (!key || e.key.toLowerCase() !== key.toLowerCase()) return false
    if (!ctrl && !shift && !alt) return !e.ctrlKey && !e.metaKey && !e.altKey
    if (ctrl && !(e.ctrlKey || e.metaKey)) return false
    if (!ctrl && (e.ctrlKey || e.metaKey)) return false
    if (shift && !e.shiftKey) return false
    if (alt && !e.altKey) return false
    return true
  }

  // Human-friendly display for a configured key string (used in the help modal).
  function displayKey(combo) {
    return String(combo || "")
      .replace("Cmd", "Ctrl/Cmd")
      .replace("Ctrl", "Ctrl/Cmd")
      .replace("Escape", "Esc")
      .replace("ArrowUp", "\u2191")
      .replace("ArrowDown", "\u2193")
      .replace("ArrowLeft", "\u2190")
      .replace("ArrowRight", "\u2192")
  }

  // Order- and case-insensitive canonical form of a key combo, used to detect
  // Phase 18 action shortcuts that alias an enabled built-in shortcut (so the
  // cluster action never double-fires).
  function normalizeCombo(combo) {
    return String(combo || "").split("+").map((p) => p.trim().toLowerCase()).sort().join("+")
  }

  // Built-in action registry for user-defined shortcuts
  // (`theme.neoabs.keyboard.custom`). Feature toggles register their exact
  // handlers here; unknown action names resolve to null and are ignored.
  const keyboardActions = {}

  function toggleReadingMode() {
    const cfg = _config.reading_mode || {}
    if (cfg.enabled === false) return false
    const entering = document.documentElement.getAttribute("data-md-neoabs-reading") !== "active"
    readingModeSet(entering)
    return entering
  }

  // Apply/remove the reading view state. The state lives on `data-md-neoabs-reading`
  // ("active"/"off") on <html> plus the `neoabs-reading-mode` body class; the
  // compiled CSS drives the section hiding, Ink palette, and reading measure.
  // Nothing is removed — the DOM and templates stay intact, like the Phase 5/6
  // sidebar/TOC collapse pattern.
  function readingModeSet(active) {
    const cfg = _config.reading_mode || {}
    const root = document.documentElement
    root.setAttribute("data-md-neoabs-reading", active ? "active" : "off")
    document.body.classList.toggle("neoabs-reading-mode", active)
    if (cfg.persisted) storageSet("ui-reading", active ? "1" : "0")
    if (!active) return
    const notes = cfg.notes || {}
    if (notes.open_on_enter) notesSetOpen(true)
    if (notes.show === false) notesSetOpen(false)

    // Phase 18: auto-start the focus timer when reading mode turns on
    // (`timer.start_with_reading`). The plugin mirrors that flag into the
    // reading-mode block (`reading_mode.start_with_reading`), so the JS reads
    // it here on the Phase 15 route; an explicit reading-mode key stays
    // authoritative. Only an idle session is started, so a running/paused one
    // is never disturbed; this also covers the boot-restore path where a
    // persisted reading state is reapplied on load.
    const rmCfg = _config.reading_mode || {}
    const tcfg = timerConfig()
    if (rmCfg.start_with_reading === true &&
        tcfg.enabled && _timerState.phase === "idle") {
      focusTimerStart()
    }
  }

  function initReadingMode(config) {
    const cfg = config.reading_mode || {}
    if (cfg.enabled === false) return

    // Restore the persisted reading state on boot (only when the author opted in).
    if (cfg.persisted && storageGet("ui-reading") === "1") readingModeSet(true)

    document.addEventListener("keydown", (e) => {
      if (kbdEnabled("toggle_reading_mode") &&
          matchesKeyCombo(e, kbdKey("toggle_reading_mode", "Alt+Shift+R"))) {
        e.preventDefault()
        toggleReadingMode()
      }
    })
    keyboardActions.toggle_reading_mode = toggleReadingMode
  }

  function resolveKeyboardAction(name) {
    if (keyboardActions[name]) return keyboardActions[name]
    if (name === "scroll_to_top") {
      return function () { window.scrollTo({ top: 0, behavior: "smooth" }) }
    }
    if (name === "open_search") {
      return function () {
        const searchEl = $(".neoabs-search")
        if (searchEl && searchEl._neoabsOpen) searchEl._neoabsOpen()
      }
    }
    if (name === "open_help") {
      return function () { toggleKeyboardHelp() }
    }
    if (name === "toggle_reading_mode") {
      return toggleReadingMode
    }
    if (name === "toggle_scheme") {
      return toggleScheme
    }
    if (name === "toggle_repo_popover") {
      return toggleRepoPopover
    }
    if (name === "open_repo") {
      return openRepoLink
    }
    return null
  }

  function initKeyboardNav() {
    // Phase 20: expose the new actions so custom `keyboard.custom` entries can
    // reference them by name.
    keyboardActions.toggle_scheme = toggleScheme
    keyboardActions.toggle_repo_popover = toggleRepoPopover
    keyboardActions.open_repo = openRepoLink

    document.addEventListener("compositionstart", () => { isComposing = true })
    document.addEventListener("compositionend", () => { isComposing = false })

    const editableGuard = (e) => {
      if (isComposing) return true
      const tag = (document.activeElement || {}).tagName
      const editable = (document.activeElement || {}).isContentEditable
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable
    }
    const overlayOpen = (e) => {
      const searchEl = $(".neoabs-search")
      const drawerCheckbox = document.getElementById("neoabs-drawer")
      if (searchEl && searchEl.classList.contains("neoabs-search--active")) return true
      if (drawerCheckbox && drawerCheckbox.checked) return true
      return false
    }

    // User-defined shortcuts bind at boot, one listener per configured key.
    const custom = readKeyboard().custom
    if (Array.isArray(custom)) {
      custom.forEach((entry) => {
        if (!entry || typeof entry.key !== "string" || typeof entry.action !== "string") return
        const combo = entry.key
        document.addEventListener("keydown", (e) => {
          if (editableGuard(e) || overlayOpen(e)) return
          const action = resolveKeyboardAction(entry.action)
          if (!action) return
          if (matchesKeyCombo(e, combo)) {
            e.preventDefault()
            e.stopPropagation()
            action()
          }
        })
      })
    }

    document.addEventListener("keydown", (e) => {
      // Skip during IME composition
      if (isComposing) return

      const tag = (document.activeElement || {}).tagName
      const editable = (document.activeElement || {}).isContentEditable
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable

      if (inInput && !matchesKeyCombo(e, kbdKey("close", "Escape"))) return

      const searchEl = $(".neoabs-search")
      const searchOpen = searchEl && searchEl.classList.contains("neoabs-search--active")
      const drawerCheckbox = document.getElementById("neoabs-drawer")
      const drawerOpen = drawerCheckbox && drawerCheckbox.checked

      // Escape — Close active overlay (action cluster, search, drawer, help modal)
      if (kbdEnabled("close") && matchesKeyCombo(e, kbdKey("close", "Escape"))) {
        if (_actionClusterOpen) {
          const acb = (_config.action_cluster && _config.action_cluster.behavior) || {}
          if (acb.close_on_escape !== false) {
            e.preventDefault()
            e.stopPropagation()
            actionClusterSetOpen(false)
            return
          }
        }
        if (searchOpen && searchEl._neoabsClose) {
          e.preventDefault()
          e.stopPropagation()
          searchEl._neoabsClose()
          return
        }
        if (drawerOpen && drawerCheckbox._neoabsToggle) {
          e.preventDefault()
          e.stopPropagation()
          drawerCheckbox._neoabsToggle()
          return
        }
        const helpModal = $(".neoabs-keyboard-help--visible")
        if (helpModal) {
          helpModal.classList.remove("neoabs-keyboard-help--visible")
          return
        }
      }

      if (searchOpen || drawerOpen) return

      // / — Open search (preventDefault blocks Firefox quick find). An explicit
      // Phase 10 `search.shortcut_key` wins; otherwise the Phase 7 keyboard
      // config applies, falling back to the Phase 2 component key.
      const scShortcut = _config.neoabs_search && _config.neoabs_search.shortcut_key
      const searchKey = (typeof scShortcut === "string" && scShortcut.trim())
        ? scShortcut.trim()
        : kbdKey("search",
            (_config.components && _config.components.search &&
              _config.components.search.shortcut_key) || "/")
      if (kbdEnabled("search") && matchesKeyCombo(e, searchKey)) {
        e.preventDefault()
        e.stopPropagation()
        if (searchEl && searchEl._neoabsOpen) searchEl._neoabsOpen()
        return
      }

      // ? — Show keyboard shortcuts help (also gated by the Phase 2
      // keyboard_help component toggle).
      if (componentShow("keyboard_help", "show") && kbdEnabled("help") &&
          matchesKeyCombo(e, kbdKey("help", "?"))) {
        e.preventDefault()
        e.stopPropagation()
        toggleKeyboardHelp()
        return
      }

      // Alt+Shift+A — Expand/collapse the action cluster (Phase 16).
      if (kbdEnabled("toggle_action_cluster") &&
          matchesKeyCombo(e, kbdKey("toggle_action_cluster", "Alt+Shift+A"))) {
        e.preventDefault()
        e.stopPropagation()
        toggleActionCluster()
        return
      }

      // Ctrl/Cmd+Shift+L — Switch to the next color scheme (Phase 20).
      // Requires at least two configured palette schemes; otherwise the key
      // is ignored (toggleScheme returns false and no default is triggered).
      if (kbdEnabled("toggle_scheme") &&
          matchesKeyCombo(e, kbdKey("toggle_scheme", "Ctrl+Shift+L"))) {
        e.preventDefault()
        e.stopPropagation()
        toggleScheme()
        return
      }

      // Ctrl/Cmd+Shift+G — Toggle the repo popover, or open the repository
      // link when the popover is unavailable (Phase 20).
      if (kbdEnabled("toggle_repo_popover") &&
          matchesKeyCombo(e, kbdKey("toggle_repo_popover", "Ctrl+Shift+G"))) {
        e.preventDefault()
        e.stopPropagation()
        toggleRepoPopover()
        return
      }
    })
  }

  // ---------------------------------------------------------------------------
  // 11b. Keyboard Shortcuts Help Modal
  // ---------------------------------------------------------------------------

  function keyboardHelpRows() {
    const rows = []
    const scShortcut = _config.neoabs_search && _config.neoabs_search.shortcut_key
    const searchFallback = (typeof scShortcut === "string" && scShortcut.trim())
      ? scShortcut.trim()
      : (_config.components && _config.components.search &&
        _config.components.search.shortcut_key) || "/"
    const sidebarCfg = (_config && _config.sidebar) || {}
    const tocCfg = (_config && _config.toc) || {}

    const push = (enabled, keys, desc) => {
      if (enabled) rows.push({ keys, desc })
    }

    push(kbdEnabled("search"), displayKey(kbdKey("search", searchFallback)), kbdLabel("search", "Open search"))
    push(kbdEnabled("close"), displayKey(kbdKey("close", "Escape")), kbdLabel("close", "Close active overlay"))
    if (kbdEnabled("search_up") || kbdEnabled("search_down")) {
      rows.push({ keys: "\u2191 / \u2193", desc: "Navigate search results" })
    }
    push(kbdEnabled("search_open"), displayKey(kbdKey("search_open", "Enter")), kbdLabel("search_open", "Open selected result"))
    if (kbdEnabled("tab_left") || kbdEnabled("tab_right")) {
      rows.push({ keys: "\u2190 / \u2192", desc: "Switch tabs (when a tab is focused)" })
    }
    push(kbdEnabled("toggle_notes"), displayKey(kbdKey("toggle_notes", "Ctrl+Shift+N")), kbdLabel("toggle_notes", "Toggle notes panel"))
    push(sidebarCfg.collapsible !== false && kbdEnabled("toggle_sidebar"),
      displayKey(kbdKey("toggle_sidebar", "Ctrl+Shift+B")), kbdLabel("toggle_sidebar", "Toggle sidebar"))
    push(tocCfg.collapsible !== false && kbdEnabled("toggle_toc"),
      displayKey(kbdKey("toggle_toc", "Ctrl+Shift+T")), kbdLabel("toggle_toc", "Toggle table of contents"))
    push(kbdEnabled("toggle_reading_mode"),
      displayKey(kbdKey("toggle_reading_mode", "Alt+Shift+R")), kbdLabel("toggle_reading_mode", "Toggle reading mode"))
    push(kbdEnabled("toggle_action_cluster"),
      displayKey(kbdKey("toggle_action_cluster", "Alt+Shift+A")), kbdLabel("toggle_action_cluster", "Toggle action cluster"))
    push($$(".neoabs-palette__input").length > 1 && kbdEnabled("toggle_scheme"),
      displayKey(kbdKey("toggle_scheme", "Ctrl+Shift+L")), kbdLabel("toggle_scheme", "Toggle color scheme"))
    push(componentShow("repo_popover", "show") && kbdEnabled("toggle_repo_popover"),
      displayKey(kbdKey("toggle_repo_popover", "Ctrl+Shift+G")), kbdLabel("toggle_repo_popover", "Toggle repo popover"))
    push(kbdEnabled("timer_toggle"),
      displayKey(kbdKey("timer_toggle", "Alt+Shift+T")), kbdLabel("timer_toggle", "Toggle focus timer"))
    push(componentShow("keyboard_help", "show") && kbdEnabled("help"),
      displayKey(kbdKey("help", "?")), kbdLabel("help", "Show keyboard shortcuts"))

    const custom = readKeyboard().custom
    if (Array.isArray(custom)) {
      custom.forEach((entry) => {
        if (!entry || typeof entry.key !== "string") return
        const label = typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : ""
        if (!label) return
        rows.push({ keys: displayKey(entry.key), desc: label })
      })
    }

    // Phase 18: surface the cluster action shortcuts with their action labels.
    // Rows appear regardless of whether the key aliases a built-in shortcut,
    // but an exact (key, desc) duplicate is dropped so the modal stays tidy.
    if (kbdEnabled("") !== false && _config.action_cluster) {
      const actions = Array.isArray(_config.action_cluster.actions)
        ? _config.action_cluster.actions
        : []
      actions.forEach((action) => {
        if (!action || action.enabled === false) return
        const keys = displayKey(action.shortcut)
        const desc = typeof action.label === "string" && action.label.trim() ? action.label.trim() : ""
        if (!keys || !desc) return
        const dup = rows.some((r) => r.keys === keys && r.desc === desc)
        if (!dup) rows.push({ keys, desc })
      })
    }
    return rows
  }

  function toggleKeyboardHelp() {
    let modal = $(".neoabs-keyboard-help")
    if (modal) {
      modal.classList.toggle("neoabs-keyboard-help--visible")
      return
    }

    modal = document.createElement("div")
    modal.className = "neoabs-keyboard-help neoabs-keyboard-help--visible"
    modal.setAttribute("role", "dialog")
    modal.setAttribute("aria-label", "Keyboard shortcuts")

    const rows = keyboardHelpRows().map((s) =>
      '<div class="neoabs-keyboard-help__row">' +
      '<kbd class="neoabs-keyboard-help__keys">' + escapeHtml(s.keys) + "</kbd>" +
      '<span class="neoabs-keyboard-help__desc">' + escapeHtml(s.desc) + "</span>" +
      "</div>"
    ).join("")

    modal.innerHTML =
      '<div class="neoabs-keyboard-help__overlay"></div>' +
      '<div class="neoabs-keyboard-help__panel">' +
      '<div class="neoabs-keyboard-help__header">' +
      '<span class="neoabs-keyboard-help__title">Keyboard Shortcuts</span>' +
      '<button class="neoabs-keyboard-help__close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="neoabs-keyboard-help__body">' + rows + "</div>" +
      "</div>"

    document.body.appendChild(modal)

    modal.querySelector(".neoabs-keyboard-help__close").addEventListener("click", () => {
      modal.classList.remove("neoabs-keyboard-help--visible")
    })
    modal.querySelector(".neoabs-keyboard-help__overlay").addEventListener("click", () => {
      modal.classList.remove("neoabs-keyboard-help--visible")
    })
  }

  // ---------------------------------------------------------------------------
  // 12. Nav Toggle (expand/collapse parent sections)
  // ---------------------------------------------------------------------------

  function initNavToggle() {
    $$(".neoabs-nav__toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true"
        btn.setAttribute("aria-expanded", String(!expanded))
        btn.classList.toggle("neoabs-nav__toggle--open", !expanded)

        const targetId = btn.getAttribute("aria-controls")
        if (targetId) {
          const target = document.getElementById(targetId)
          if (target) {
            target.classList.toggle("neoabs-nav__list--collapsed", expanded)
          }
        }
      syncNavMemory()
      })
    })
  }

  // Persist which nav sections the visitor has collapsed.
  function syncNavMemory() {
    const collapsed = $$(".neoabs-nav__toggle")
      .filter((btn) => btn.getAttribute("aria-expanded") !== "true")
      .map((btn) => btn.getAttribute("aria-controls"))
      .filter(Boolean)
    sessionMutate((s) => { s.navCollapsed = collapsed })
  }

  // Apply the remembered collapse state to the current nav tree.
  function applyNavMemory() {
    const s = sessionGet()
    const collapsed = s.navCollapsed || []
    $$(".neoabs-nav__toggle").forEach((btn) => {
      const id = btn.getAttribute("aria-controls")
      if (!id) return
      const isCollapsed = collapsed.indexOf(id) !== -1
      btn.setAttribute("aria-expanded", String(!isCollapsed))
      btn.classList.toggle("neoabs-nav__toggle--open", !isCollapsed)
      const target = document.getElementById(id)
      if (target) target.classList.toggle("neoabs-nav__list--collapsed", isCollapsed)
    })
  }

  // Toggle the left navigation sidebar via Ctrl/Cmd+Shift+B (persisted).
  function initSidebarToggle() {
    const nav = $(".neoabs-nav") || $(".md-sidebar--primary")
    const toc = $(".neoabs-toc")
    if (!nav) return

    const sidebarCfg = (_config && _config.sidebar) || {}
    const collapsible = sidebarCfg.collapsible !== false
    const defaultCollapsed = sidebarCfg.default_collapsed === true

    const tocCfg = (_config && _config.toc) || {}
    const tocCollapsible = tocCfg.collapsible !== false
    const tocDefaultCollapsed = tocCfg.default_collapsed === true

    const store = (key) => storageGet("ui-" + key) === "1"
    const save = (key, on) => storageSet("ui-" + key, on ? "1" : "0")

    // Restore persisted sidebar state, falling back to the config default.
    if (collapsible && ((kbdPersisted("toggle_sidebar") && store("sidebar")) || defaultCollapsed)) {
      setBody("nav-hidden", true)
    }
    // Restore persisted TOC state, falling back to the config default.
    if (tocCollapsible && ((kbdPersisted("toggle_toc") && store("toc")) || tocDefaultCollapsed)) {
      setBody("toc-hidden", true)
    } else if (!tocCollapsible) {
      // A non-collapsible TOC can never stay hidden.
      setBody("toc-hidden", false)
    }

    function setBody(cls, on) {
      document.body.classList.toggle("neoabs-" + cls, on)
    }

    function setSidebar(hidden) {
      setBody("nav-hidden", hidden)
      if (kbdPersisted("toggle_sidebar")) save("sidebar", hidden)
    }

    function setToc(hidden) {
      setBody("toc-hidden", hidden)
      if (kbdPersisted("toggle_toc")) save("toc", hidden)
    }

    // Configurable shortcut (default Ctrl/Cmd+Shift+B) toggles the nav sidebar.
    if (collapsible && kbdEnabled("toggle_sidebar")) {
      document.addEventListener("keydown", (e) => {
        if (matchesKeyCombo(e, kbdKey("toggle_sidebar", "Ctrl+Shift+B"))) {
          e.preventDefault()
          setSidebar(!document.body.classList.contains("neoabs-nav-hidden"))
        }
      })
    }
    keyboardActions.toggle_sidebar = function () {
      if (!collapsible) return
      setSidebar(!document.body.classList.contains("neoabs-nav-hidden"))
    }

    // Configurable shortcut (default Ctrl/Cmd+Shift+T) toggles the TOC.
    if (toc && tocCollapsible && kbdEnabled("toggle_toc")) {
      document.addEventListener("keydown", (e) => {
        if (matchesKeyCombo(e, kbdKey("toggle_toc", "Ctrl+Shift+T"))) {
          e.preventDefault()
          setToc(!document.body.classList.contains("neoabs-toc-hidden"))
        }
      })
    }
    keyboardActions.toggle_toc = function () {
      if (!toc || !tocCollapsible) return
      setToc(!document.body.classList.contains("neoabs-toc-hidden"))
    }
  }

  // ---------------------------------------------------------------------------
  // 12b. Header Controls (keyboard-activatable drawer/search buttons)
  // ---------------------------------------------------------------------------

  function initHeaderControls() {
    const drawerCheckbox = document.getElementById("neoabs-drawer")
    const hamburger = $(".neoabs-header__hamburger")
    if (drawerCheckbox && hamburger) {
      const sync = () =>
        hamburger.setAttribute("aria-expanded", String(drawerCheckbox.checked))
      hamburger.addEventListener("click", () => {
        if (drawerCheckbox._neoabsToggle) drawerCheckbox._neoabsToggle()
        sync()
      })
      drawerCheckbox.addEventListener("change", sync)
      sync()
    }

    const searchBtn = $(".neoabs-header__search")
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const searchEl = $(".neoabs-search")
        if (searchEl && searchEl._neoabsOpen) searchEl._neoabsOpen()
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 13. Notes & Annotations (browser-local, TTL + export)
  // ---------------------------------------------------------------------------

  const NOTES_KEY = "notes"
  const NOTES_TTL_DEFAULT = 259200000 // 3 days (ms)
  const NOTE_COLORS = ["#ffe66b", "#9be56c", "#7fd8ff", "#ff9e6b", "#f2a0ff"]

  function notesTtlMs(config) {
    const t = config && config.notes && config.notes.ttl_ms ? Number(config.notes.ttl_ms) : 0
    return t > 0 ? t : NOTES_TTL_DEFAULT
  }

  function notesEnabled(config) {
    return !(config && config.notes && config.notes.enabled === false)
  }

  function notesReadAll() {
    try {
      const items = JSON.parse(storageGet(NOTES_KEY) || "[]")
      return Array.isArray(items) ? items : []
    } catch { return [] }
  }

  function notesWriteAll(items) {
    storageSet(NOTES_KEY, JSON.stringify(items))
  }

  function notesPurgeExpired(items, ttl) {
    const now = Date.now()
    return items.filter((it) => now - (it.ts || 0) <= ttl)
  }

  // Notes are global (not scoped to a URL). Kept as an identity for the callers.
  function notesForPage(items, url) {
    return items
  }

  function notesCurrentUrl() {
    return location.pathname + location.search
  }

  // Build (once) the notes trigger button and slide-in panel.
  function notesEnsureUi() {
    if (document.querySelector(".neoabs-notes-btn")) return

    const btn = document.createElement("button")
    btn.className = "neoabs-notes-btn"
    btn.type = "button"
    btn.textContent = "Notes"
    btn.setAttribute("aria-haspopup", "true")
    btn.setAttribute("aria-controls", "neoabs-notes-panel")
    btn.setAttribute("aria-expanded", "false")

    const panel = document.createElement("aside")
    panel.className = "neoabs-notes-panel"
    panel.id = "neoabs-notes-panel"
    panel.setAttribute("aria-label", "Notes")

    const head = document.createElement("div")
    head.className = "neoabs-notes-panel__head"
    const title = document.createElement("span")
    title.textContent = "Notes"
    const close = document.createElement("button")
    close.type = "button"
    close.textContent = "×"
    close.setAttribute("aria-label", "Close notes")
    head.appendChild(title)
    head.appendChild(close)

    const tools = document.createElement("div")
    tools.className = "neoabs-notes-panel__tools"
    const btnAdd = document.createElement("button")
    btnAdd.type = "button"
    btnAdd.textContent = "+ Add note"
    btnAdd.className = "neoabs-notes-panel__add"
    const btnMd = document.createElement("button")
    btnMd.type = "button"
    btnMd.textContent = "Export .md"
    btnMd.className = "neoabs-notes-panel__export"
    const btnJson = document.createElement("button")
    btnJson.type = "button"
    btnJson.textContent = "Export .json"
    btnJson.className = "neoabs-notes-panel__export"
    tools.appendChild(btnAdd)
    tools.appendChild(btnMd)
    tools.appendChild(btnJson)

    const list = document.createElement("div")
    list.className = "neoabs-notes-panel__list"

    panel.appendChild(head)
    panel.appendChild(tools)
    panel.appendChild(list)

    document.body.appendChild(btn)
    document.body.appendChild(panel)

    btn.addEventListener("click", () => notesSetOpen(!panel.classList.contains("neoabs-open")))
    close.addEventListener("click", () => notesSetOpen(false))
    btnAdd.addEventListener("click", notesAddComposer)
    btnMd.addEventListener("click", notesExportMarkdown)
    btnJson.addEventListener("click", notesExportJson)
  }

  // Insert a composer (textarea + color + actions) in the panel. Used for both
// adding a new note (existing null) and editing an existing one.
  function notesCompose(existing) {
    const panel = document.getElementById("neoabs-notes-panel")
    const list = panel && panel.querySelector(".neoabs-notes-panel__list")
    if (!list) return
    if (document.querySelector(".neoabs-note__composer")) return

    const comp = document.createElement("div")
    comp.className = "neoabs-note__composer"

    const colors = document.createElement("div")
    colors.className = "neoabs-note__composer-colors"
    let activeColor = existing ? existing.color : NOTE_COLORS[0]
    NOTE_COLORS.forEach((c) => {
      const b = document.createElement("button")
      b.type = "button"
      b.className = "neoabs-note__color"
      b.style.background = c
      b.style.borderColor = c
      b.dataset.color = c
      b.setAttribute("aria-label", "Color " + c)
      b.addEventListener("click", () => {
        activeColor = c
        const all = document.querySelectorAll(".neoabs-note__color")
        Array.prototype.forEach.call(all, (x) =>
          x.setAttribute("aria-pressed", String(x.dataset.color === c)))
      })
      b.setAttribute("aria-pressed", String(c === activeColor))
      colors.appendChild(b)
    })

    const ta = document.createElement("textarea")
    ta.className = "neoabs-note__composer-input"
    ta.placeholder = "Write a note…"
    ta.rows = 3
    if (existing && existing.note) ta.value = existing.note

    const actions = document.createElement("div")
    actions.className = "neoabs-note__composer-actions"
    const cancel = document.createElement("button")
    cancel.type = "button"
    cancel.className = "neoabs-note__cancel"
    cancel.textContent = "Cancel"
    const save = document.createElement("button")
    save.type = "button"
    save.className = "neoabs-note__save"
    save.textContent = existing ? "Save changes" : "Save"
    actions.appendChild(cancel)
    actions.appendChild(save)

    comp.appendChild(colors)
    comp.appendChild(ta)
    comp.appendChild(actions)

    // For edits, place inside the existing item; otherwise prepend to the list.
    if (existing) {
      const item = list.querySelector(".neoabs-note__item[data-id='" + existing.id + "']")
      if (item) item.insertAdjacentElement("afterbegin", comp)
      else list.prepend(comp)
    } else {
      list.prepend(comp)
    }
    ta.focus()

    cancel.addEventListener("click", () => {
      if (comp.parentNode) comp.parentNode.removeChild(comp)
    })

    save.addEventListener("click", () => {
      const text = ta.value.trim()
      if (!text) return
      let items = notesReadAll()
      if (existing) {
        items = items.map(function (x) {
          if (x.id === existing.id) {
            x.note = text
            x.color = activeColor
            x.ts = Date.now()
          }
          return x
        })
      } else {
        items.unshift({
          id: "n_" + Math.random().toString(36).slice(2, 9),
          url: notesCurrentUrl(),
          text: "",
          note: text,
          color: activeColor,
          ts: Date.now()
        })
      }
      notesWriteAll(items)
      notesRefreshPanel()
    })
  }

  function notesAddComposer() { notesCompose(null) }

  let _notesOpen = false
  function notesSetOpen(open) {
    _notesOpen = open
    storageSet("ui-notes", open ? "1" : "0")
    const panel = document.getElementById("neoabs-notes-panel")
    const btn = $(".neoabs-notes-btn")
    if (panel) panel.classList.toggle("neoabs-open", open)
    if (btn) btn.setAttribute("aria-expanded", String(open))
    if (open) notesRefreshPanel()
  }

  function notesFocusTrap(e) {
    if (!_notesOpen) return
    if (e.key === "Escape") { notesSetOpen(false); return }
    if (e.key !== "Tab") return
    const panel = document.getElementById("neoabs-notes-panel")
    if (!panel) return
    const focusables = $$(".neoabs-notes-panel button", panel)
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Restore highlights for the current page.
  function notesReapply(items, ttl) {
    items = notesPurgeExpired(items, ttl)
    notesWriteAll(items)
    const url = notesCurrentUrl()
    notesForPage(items, url).forEach((it) => {
      notesHighlight(it, false)
    })
  }

  // Highlight the stored text within an anchor container (best-effort).
  function notesHighlight(it, announce) {
    if (!it.anchor) return false
    const container = document.getElementById(it.anchor)
    if (!container) return false
    const mark = notesWrapText(container, it.text || "", it)
    if (announce && mark) {
      storageSet("note-did-apply-" + it.id, "1")
    }
    return !!mark
  }

  // Wrap the first exact occurrence of `needle` inside `container` in a mark.
  function notesWrapText(container, needle, it) {
    if (!needle) return null
    const walker = document.createTreeWalker(container, Node.TEXT_NODE)
    let node
    while ((node = walker.nextNode())) {
      const idx = node.textContent.indexOf(needle)
      if (idx === -1) continue
      const mark = document.createElement("mark")
      mark.className = "neoabs-note__hl"
      mark.dataset.noteId = it.id
      mark.style.setProperty("--neoabs-note-color", it.color || "#ffe66b")
      mark.setAttribute("tabindex", "0")
      mark.addEventListener("click", () => notesFocusItem(it.id))

      const parent = node.parentNode
      const before = document.createTextNode(node.textContent.slice(0, idx))
      const mid = document.createTextNode(node.textContent.slice(idx, idx + needle.length))
      const after = document.createTextNode(node.textContent.slice(idx + needle.length))
      mark.appendChild(mid)
      parent.insertBefore(before, node)
      parent.insertBefore(mark, node)
      parent.insertBefore(after, node)
      parent.removeChild(node)
      return mark
    }
    return null
  }

  function notesFocusItem(id) {
    notesSetOpen(true)
    const el = $(".neoabs-note__item[data-id='" + id + "']")
    if (el) {
      el.scrollIntoView({ block: "center" })
      el.style.outline = "2px solid var(--neoabs-accent)"
      setTimeout(() => { el.style.outline = "" }, 1200)
    }
  }

  function notesRefreshPanel() {
    const panel = document.getElementById("neoabs-notes-panel")
    const list = panel && panel.querySelector(".neoabs-notes-panel__list")
    if (!list) return
    while (list.firstChild) list.removeChild(list.firstChild)

    const items = notesPurgeExpired(notesReadAll(), notesTtlMs(readConfig()))
    const url = notesCurrentUrl()
    const pageNotes = notesForPage(items, url)

    if (!pageNotes.length) {
      const empty = document.createElement("p")
      empty.className = "neoabs-notes-panel__empty"
      empty.textContent = "No notes yet."
      list.appendChild(empty)
      return
    }

    pageNotes.forEach((it) => {
      const item = document.createElement("div")
      item.className = "neoabs-note__item"
      item.dataset.id = it.id
      item.style.setProperty("--neoabs-note-color", it.color || "#ffe66b")

      if (it.text) {
        const quote = document.createElement("p")
        quote.className = "neoabs-note__quote"
        quote.textContent = "“" + it.text + "”"
        quote.style.color = it.color || "#ffe66b"
        item.appendChild(quote)
      }

      const body = document.createElement("p")
      body.className = "neoabs-note__body"
      body.textContent = it.note || "(no note)"
      item.appendChild(body)

      const meta = document.createElement("div")
      meta.className = "neoabs-note__meta"
      const when = document.createElement("span")
      when.className = "neoabs-note__when"
      when.textContent = new Date(it.ts || Date.now()).toLocaleDateString()
      const actionsRow = document.createElement("div")
      actionsRow.className = "neoabs-note__actions"
      const edit = document.createElement("button")
      edit.type = "button"
      edit.textContent = "Edit"
      edit.className = "neoabs-note__edit"
      edit.setAttribute("aria-label", "Edit note")
      edit.addEventListener("click", () => notesCompose(it))
      const del = document.createElement("button")
      del.type = "button"
      del.textContent = "Delete"
      del.className = "neoabs-note__delete"
      del.setAttribute("aria-label", "Delete note")
      del.addEventListener("click", () => notesDelete(it.id))
      actionsRow.appendChild(edit)
      actionsRow.appendChild(del)
      meta.appendChild(when)
      meta.appendChild(actionsRow)

      item.appendChild(meta)
      list.appendChild(item)
    })
  }

  function notesDelete(id) {
    let items = notesReadAll()
    items = items.filter((it) => it.id !== id)
    notesWriteAll(items)
    const hl = $$(".neoabs-note__hl[data-note-id='" + id + "']")
    hl.forEach((m) => {
      const parent = m.parentNode
      const txt = document.createTextNode(m.textContent)
      parent.replaceChild(txt, m)
    })
    notesRefreshPanel()
  }

  function notesDownload(filename, text, mime) {
    try {
      const blob = new Blob([text], { type: mime })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a) }, 100)
    } catch {}
  }

  function notesExportMarkdown() {
    const allNotes = notesForPage(notesReadAll(), notesCurrentUrl())
    const lines = ["# Notes\n"]
    allNotes.forEach((it) => {
      lines.push("## " + (it.note || "Note"))
      lines.push("> " + (it.text || ""))
      lines.push("")
      lines.push("- Source: " + (it.url || pageURL()))
      lines.push("- Added: " + new Date(it.ts || Date.now()).toISOString())
      lines.push("")
    })
    notesDownload("neoabs-notes.md", lines.join("\n"), "text/markdown;charset=utf-8")
  }

  function notesExportJson() {
    const allNotes = notesForPage(notesReadAll(), notesCurrentUrl())
    notesDownload("neoabs-notes.json", JSON.stringify(allNotes, null, 2),
      "application/json;charset=utf-8")
  }

  function pageURL() { return location.href }
  function pageSlug() {
    const seg = (location.pathname || "").split("/").filter(Boolean)
    return seg.length ? seg[seg.length - 1] : "index"
  }

  function initNotes(config) {
    if (!componentShow("notes", "show")) return
    if (!notesEnabled(config)) return
    const ttl = notesTtlMs(config)

    notesEnsureUi()

    // Restore any stored highlights (with expiry purging) on load.
    notesReapply(notesReadAll(), ttl)

    // Restore persisted open/closed state.
    if (storageGet("ui-notes") === "1") notesSetOpen(true)

    document.addEventListener("keydown", (e) => {
      if (kbdEnabled("toggle_notes") && matchesKeyCombo(e, kbdKey("toggle_notes", "Ctrl+Shift+N"))) {
        e.preventDefault()
        notesSetOpen(!_notesOpen)
      }
    })
    keyboardActions.toggle_notes = function () {
      notesSetOpen(!_notesOpen)
    }

    document.addEventListener("keydown", notesFocusTrap)
  }

  // ---------------------------------------------------------------------------
  // Phase 16: Action cluster (plus menu)
  // ---------------------------------------------------------------------------

  // Per-icon inline SVG (stroke style, matching the back-to-top / copy icons).
  // Keys are the `action_cluster.actions[].icon` ids plus the main button
  // icons (`plus`, `menu`, `notes`).
  const ACTION_CLUSTER_ICONS = {
    plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    help: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    notes: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="9" x2="17" y2="9"></line><line x1="7" y1="13" x2="17" y2="13"></line><line x1="7" y1="17" x2="13" y2="17"></line></svg>',
    timer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><line x1="12" y1="9" x2="12" y2="13"></line><line x1="14.5" y1="16.5" x2="17" y2="18.5"></line><line x1="9" y1="2" x2="15" y2="2"></line></svg>',
    reading: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 4.5 7.5 4 4 4v13c3.5 0 6.5.5 8 2.5 1.5-2 4.5-2.5 8-2.5V4c-3.5 0-6.5.5-8 2.5z"></path><line x1="12" y1="6.5" x2="12" y2="19.5"></line></svg>'
  }

  let _actionClusterOpen = false

  function toggleActionCluster() {
    actionClusterSetOpen(!_actionClusterOpen)
  }

  // Apply/remove the open state. The state lives on the menu (class, aria,
  // inert) and the main button's aria-expanded; nothing is removed from the
  // DOM, mirroring the reading-mode attribute pattern.
  function actionClusterSetOpen(open) {
    _actionClusterOpen = open
    const cluster = $(".neoabs-action-cluster")
    if (!cluster) return
    cluster.classList.toggle("neoabs-action-cluster--open", open)
    const menu = cluster.querySelector(".neoabs-action-cluster__menu")
    if (menu) {
      menu.setAttribute("aria-hidden", open ? "false" : "true")
      menu.inert = !open
    }
    const main = cluster.querySelector(".neoabs-action-cluster__main")
    if (main) main.setAttribute("aria-expanded", String(open))
  }

  // Dispatch an action slot through the Phase 7 registry. The slot ids differ
  // from the keyboard-action names (keyboard_help -> open_help, notes ->
  // toggle_notes, reading_mode -> toggle_reading_mode); timer -> timer_toggle
  // is an engine that lands in Phase 17 and is a no-op until then.
  function actionClusterDispatch(id) {
    const name = id === "keyboard_help" ? "open_help"
      : id === "notes" ? "toggle_notes"
      : id === "reading_mode" ? "toggle_reading_mode"
      : id === "timer" ? "timer_toggle" : id
    const fn = keyboardActions[name] || resolveKeyboardAction(name)
    if (typeof fn === "function") fn()
    const cfg = _config.action_cluster || {}
    const behavior = cfg.behavior || {}
    if (behavior.close_on_select !== false) actionClusterSetOpen(false)
  }

  // Keep Tab cycling inside the open cluster (`behavior.focus_trap`).
  function actionClusterFocusTrap(e) {
    if (!_actionClusterOpen) return
    if (e.key !== "Tab") return
    const cluster = $(".neoabs-action-cluster")
    if (!cluster) return
    const focusables = $$(".neoabs-action-cluster button", cluster)
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Build (once) the cluster DOM from the configured `actions` list.
  function actionClusterEnsureUi(cfg) {
    if (document.querySelector(".neoabs-action-cluster")) return

    const actions = Array.isArray(cfg.actions)
      ? cfg.actions.filter((a) => a && a.enabled !== false)
      : []
    const position = cfg.position === "bottom-right" ? "bottom-right" : "bottom-left"
    const offset = cfg.offset || {}
    const behavior = cfg.behavior || {}
    const mainCfg = cfg.main || {}
    const isRight = position === "bottom-right"

    const cluster = document.createElement("div")
    cluster.className = "neoabs-action-cluster"
    cluster.setAttribute("data-md-neoabs-action-cluster-position", position)
    if (behavior.tooltips === false) {
      cluster.setAttribute("data-md-neoabs-action-cluster-tooltips", "false")
    }
    if (mainCfg.glass === false) {
      cluster.setAttribute("data-md-neoabs-action-cluster-glass", "false")
    }
    if (mainCfg.icon_transform === false) {
      cluster.setAttribute("data-md-neoabs-action-cluster-transform", "false")
    }
    if (behavior.animation && behavior.animation !== "normal") {
      cluster.setAttribute("data-md-neoabs-action-cluster-animation", behavior.animation)
    }

    // Per-instance offsets / size from `action_cluster.offset` / `main.size`.
    cluster.style.setProperty("--neoabs-action-cluster-bottom",
      (typeof offset.bottom === "string" && offset.bottom) || "16px")
    const sideOffset = isRight ? offset.right : offset.left
    cluster.style.setProperty(isRight ? "--neoabs-action-cluster-right" : "--neoabs-action-cluster-left",
      (typeof sideOffset === "string" && sideOffset) || "16px")
    if (typeof mainCfg.size === "string" && mainCfg.size) {
      cluster.style.setProperty("--neoabs-action-cluster-size", mainCfg.size)
    }

    // Stack of actions revealed above the main button. The closest slot to the
    // main button is the last list item so the stagger reads bottom-up.
    const menu = document.createElement("div")
    menu.className = "neoabs-action-cluster__menu"
    menu.id = "neoabs-action-cluster-menu"
    menu.setAttribute("role", "group")
    menu.setAttribute("aria-label", "Quick actions")
    menu.setAttribute("aria-hidden", "true")
    menu.inert = true

    actions.forEach((action, index) => {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "neoabs-action-cluster__action"
      btn.setAttribute("aria-label", action.label || "")
      btn.setAttribute("data-md-neoabs-cluster-action", action.id || "")
      btn.style.setProperty("--neoabs-action-cluster-index", String(index))
      // Phase 18: a live remaining-time badge on the timer action (only when
      // the action opts in with `badge: time` and the timer layer agrees).
      let badgeHtml = ""
      if (action.badge === "time" && action.id === "timer") {
        const tcfg = (_config.timer && typeof _config.timer === "object") ? _config.timer : {}
        if (tcfg.enabled !== false && tcfg.badge_in_cluster !== false) {
          badgeHtml = '<span class="neoabs-action-cluster__badge">' +
            formatTimer(_timerState.remaining, timerConfig().display_format) + "</span>"
        }
      }
      btn.innerHTML =
        (ACTION_CLUSTER_ICONS[action.icon] || ACTION_CLUSTER_ICONS.plus) +
        '<span class="neoabs-action-cluster__tooltip">' + escapeHtml(action.label || "") + "</span>" +
        badgeHtml
      btn.addEventListener("click", () => actionClusterDispatch(action.id))
      menu.appendChild(btn)
    })

    const main = document.createElement("button")
    main.type = "button"
    main.className = "neoabs-action-cluster__main"
    main.setAttribute("aria-haspopup", "menu")
    main.setAttribute("aria-controls", "neoabs-action-cluster-menu")
    main.setAttribute("aria-expanded", "false")
    main.setAttribute("aria-label", "Quick actions")
    main.innerHTML = ACTION_CLUSTER_ICONS[mainCfg.icon] || ACTION_CLUSTER_ICONS.plus
    main.addEventListener("click", toggleActionCluster)

    cluster.appendChild(menu)
    cluster.appendChild(main)
    document.body.appendChild(cluster)
  }

  function initActionCluster(config) {
    const cfg = config.action_cluster || {}
    if (cfg.enabled === false) return

    const behavior = cfg.behavior || {}
    const actions = Array.isArray(cfg.actions)
      ? cfg.actions.filter((a) => a && a.enabled !== false)
      : []
    const minActions = typeof behavior.min_actions === "number" ? behavior.min_actions : 2
    if (actions.length < minActions) return

actionClusterEnsureUi(cfg)
    actionClusterBindShortcuts(cfg)

    if (behavior.focus_trap !== false) {
      document.addEventListener("keydown", actionClusterFocusTrap)
    }

    // Close when clicking outside the cluster (`behavior.close_on_outside`).
    document.addEventListener("click", (e) => {
      if (!_actionClusterOpen) return
      const cluster = $(".neoabs-action-cluster")
      if (cluster && cluster.contains(e.target)) return
      if (behavior.close_on_outside === false) return
      actionClusterSetOpen(false)
    })

    keyboardActions.toggle_action_cluster = toggleActionCluster
  }

  // Phase 18: cluster action id -> built-in keyboard shortcut name it aliases.
  // Used to skip a redundant bound handler when the matching built-in shortcut
  // is enabled for the exact same combo (so both never double-fire).
  const CLUSTER_ACTION_KEYBOARD = {
    timer: "timer_toggle",
    reading_mode: "toggle_reading_mode",
    notes: "toggle_notes",
    keyboard_help: "help",
  }

  // Phase 18: per-action shortcut binding. Every enabled cluster action with a
  // configured `shortcut` responds to that key, mirroring its click handler,
  // with the same editable/overlay guards as the Phase 7 dispatcher. When the
  // action's key aliases an *enabled* built-in shortcut (same normalized combo)
  // the redundant binding is skipped; if the built-in is re-keyed or turned
  // off, the action keeps answering to its own configured shortcut.
  function actionClusterBindShortcuts(cfg) {
    if (!cfg || kbdEnabled("") === false) return
    const actions = Array.isArray(cfg.actions) ? cfg.actions : []
    actions.forEach((action) => {
      if (!action || action.enabled === false) return
      const combo = action.shortcut
      if (typeof combo !== "string" || !combo.trim()) return
      const builtinName = CLUSTER_ACTION_KEYBOARD[action.id]
      if (builtinName) {
        const componentOk = builtinName === "help"
          ? componentShow("keyboard_help", "show")
          : true
        if (componentOk &&
            kbdEnabled(builtinName) &&
            normalizeCombo(kbdKey(builtinName)) === normalizeCombo(combo)) {
          return
        }
      }
      document.addEventListener("keydown", (e) => {
        if (isComposing) return
        const el = document.activeElement
        const tag = el ? el.tagName : ""
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el && el.isContentEditable)) return
        const search = $(".neoabs-search")
        if (search && search.classList.contains("neoabs-search--active")) return
        const drawer = document.getElementById("neoabs-drawer")
        if (drawer && drawer.checked) return
        if (matchesKeyCombo(e, combo)) {
          e.preventDefault()
          e.stopPropagation()
          actionClusterDispatch(action.id)
        }
      })
    })
  }

  // ---------------------------------------------------------------------------
  // Phase 17: Focus timer (theme.neoabs.timer)
  // ---------------------------------------------------------------------------

  const FOCUS_TIMER_KEY = "focus-timer"
  const FOCUS_TIMER_SETTINGS_KEY = "focus-timer-settings"

  // Inline icons for the TOC widget controls (play/pause, restart, cancel),
  // drawn in the same stroke idiom as ACTION_CLUSTER_ICONS but 14px-sized.
  const TIMER_CTRL_ICONS = {
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="5" x2="9" y2="19"></line><line x1="15" y1="5" x2="15" y2="19"></line></svg>',
    restart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
    cancel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  }

  // Session state machine: "idle" | "running" | "paused". Time is accounted
  // from `Date.now()` against an absolute `expiresAt` epoch while running, so
  // browser throttling can never drift the countdown; the 1s interval only
  // repaints surfaces from that model.
  let _timerState = {
    phase: "idle",
    total: 25 * 60000,
    remaining: 25 * 60000,
    updatedAt: 0,
    expiresAt: 0,
  }
  let _timerInterval = null

  // Effective config: `theme.neoabs.timer` merged with the reader's local
  // settings-popup overrides (`focus-timer-settings` in localStorage).
  function timerConfig() {
    const cfg = _config.timer || {}
    const saved = timerSettingsRead()
    const tocCfg = (cfg.toc && typeof cfg.toc === "object") ? cfg.toc : {}
    const readingCfg = (cfg.reading && typeof cfg.reading === "object") ? cfg.reading : {}
    const notifCfg = (cfg.notifications && typeof cfg.notifications === "object") ? cfg.notifications : {}
    const colorsCfg = (cfg.colors && typeof cfg.colors === "object") ? cfg.colors : {}
    const defaultMinutes = (typeof saved.default_minutes === "number")
      ? saved.default_minutes
      : (typeof cfg.default_minutes === "number" ? cfg.default_minutes : 25)
    const minutes = Math.max(1, Math.floor(defaultMinutes))
    return {
      enabled: cfg.enabled !== false,
      default_minutes: minutes,
      toc: {
        show: tocCfg.show !== false,
        style: saved.toc_style || tocCfg.style || "ring",
        position: saved.toc_position || tocCfg.position || "bottom",
      },
      reading: {
        show: saved.reading_show !== undefined ? !!saved.reading_show : readingCfg.show !== false,
      },
      notifications: {
        enabled: notifCfg.enabled !== false,
        toast: saved.toast !== undefined ? !!saved.toast : notifCfg.toast !== false,
        sound: saved.sound !== undefined ? !!saved.sound : notifCfg.sound !== false,
      },
      persist: cfg.persist !== false,
      settings_popup: cfg.settings_popup !== false,
      // Phase 18: cluster badge, display format, and the opt-in tab-title
      // countdown. `start_with_reading` is read from the reading-mode block
      // (the plugin mirrors `timer.start_with_reading` into it), so it is not
      // resolved here. `document_title` is opt-in; `display_format` falls back
      // to the theme default.
      display_format: ["mm:ss", "m:ss", "SS"].indexOf(cfg.display_format) !== -1
        ? cfg.display_format
        : "mm:ss",
      document_title: cfg.document_title === true,
      badge_in_cluster: cfg.badge_in_cluster !== false,
      colors: {
        progress: saved.progress || colorsCfg.progress || "#8a5a33",
      },
    }
  }

  function timerSettingsRead() {
    const raw = storageGet(FOCUS_TIMER_SETTINGS_KEY)
    if (!raw) return {}
    try {
      const value = JSON.parse(raw)
      return (value && typeof value === "object") ? value : {}
    } catch { return {} }
  }

  function timerSettingsWrite(obj) {
    storageSet(FOCUS_TIMER_SETTINGS_KEY, JSON.stringify(obj))
  }

  // Phase 17/18: time readout. `format` mirrors `timer.display_format`:
  // "mm:ss" zero-pads the minutes ("05:00"), "m:ss" leaves them bare ("5:00"),
  // and "SS" shows plain total seconds. The default is the canonical mm:ss the
  // theme ships with.
  function formatTimer(ms, format) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const pad = (n) => (n < 10 ? "0" : "") + n
    format = format || "mm:ss"
    if (format === "SS") return String(totalSeconds)
    if (format === "m:ss") return minutes + ":" + pad(seconds)
    return pad(minutes) + ":" + pad(seconds)
  }

  function focusTimerPersist() {
    if (!timerConfig().persist) return
    storageSet(FOCUS_TIMER_KEY, JSON.stringify({
      remaining: _timerState.remaining,
      running: _timerState.phase === "running",
      updatedAt: Date.now(),
    }))
  }

  function focusTimerRestore() {
    const raw = storageGet(FOCUS_TIMER_KEY)
    if (!raw) return
    let data = null
    try { data = JSON.parse(raw) } catch { return }
    if (!data || typeof data !== "object") return
    const cfg = timerConfig()
    const total = cfg.default_minutes * 60000
    let remaining = (typeof data.remaining === "number" && data.remaining >= 0)
      ? data.remaining
      : total
    if (data.running && typeof data.updatedAt === "number") {
      // The persisted session was mid-flight; elapse the wall-clock gap now.
      remaining -= Date.now() - data.updatedAt
      if (remaining > 0) {
        _timerState.phase = "running"
        _timerState.expiresAt = Date.now() + remaining
        _timerState.updatedAt = Date.now()
        focusTimerStartInterval()
      } else {
        remaining = 0
        _timerState.phase = "idle"
        focusTimerStopInterval()
      }
    } else if (remaining > 0 && remaining < total) {
      _timerState.phase = "paused"
    } else {
      _timerState.phase = "idle"
    }
    _timerState.total = total
    _timerState.remaining = remaining
    _timerState.updatedAt = Date.now()
  }

  function focusTimerStart(minutes) {
    const cfg = timerConfig()
    const effective = Math.max(1, Math.floor(Number(minutes) || cfg.default_minutes))
    _timerState.total = effective * 60000
    _timerState.remaining = effective * 60000
    _timerState.phase = "running"
    _timerState.expiresAt = Date.now() + _timerState.total
    _timerState.updatedAt = Date.now()
    focusTimerPersist()
    focusTimerStartInterval()
    focusTimerTick()
  }

  function focusTimerResume() {
    if (_timerState.phase !== "paused" || _timerState.remaining <= 0) return
    _timerState.expiresAt = Date.now() + _timerState.remaining
    _timerState.updatedAt = Date.now()
    _timerState.phase = "running"
    focusTimerPersist()
    focusTimerStartInterval()
    focusTimerTick()
  }

  function focusTimerPause() {
    if (_timerState.phase !== "running") return
    _timerState.remaining = Math.max(0, _timerState.expiresAt - Date.now())
    _timerState.phase = "paused"
    _timerState.updatedAt = Date.now()
    _timerState.expiresAt = 0
    focusTimerPersist()
    focusTimerStopInterval()
    focusTimerTick()
  }

  function focusTimerReset() {
    const cfg = timerConfig()
    _timerState.total = cfg.default_minutes * 60000
    _timerState.remaining = _timerState.total
    _timerState.phase = "idle"
    _timerState.updatedAt = Date.now()
    _timerState.expiresAt = 0
    focusTimerPersist()
    focusTimerStopInterval()
    focusTimerTick()
  }

  // TOC widget playback controls. Play on idle starts the default session
  // (the reader can still pick a length via the settings popup shown by the
  // cluster action / shortcut); cancel clears the session back to idle.
  function focusTimerPlayPause() {
    if (_timerState.phase === "running") {
      focusTimerPause()
    } else if (_timerState.phase === "paused") {
      focusTimerResume()
    } else {
      focusTimerStart()
    }
  }

  function focusTimerRestart() {
    if (_timerState.phase === "idle") return
    _timerState.remaining = _timerState.total
    _timerState.phase = "running"
    _timerState.expiresAt = Date.now() + _timerState.total
    _timerState.updatedAt = Date.now()
    focusTimerPersist()
    focusTimerStartInterval()
    focusTimerTick()
  }

  function focusTimerCancel() {
    if (_timerState.phase === "idle") return
    focusTimerReset()
  }

  // Cluster action + `timer_toggle` shortcut always surface the settings popup
  // (when enabled), so a running session can be reconfigured without any
  // destructive shortcut; play/pause/cancel/restart live on the TOC widget.
  function focusTimerToggle() {
    if (timerConfig().settings_popup) {
      openTimerSettings()
    } else if (_timerState.phase === "idle") {
      focusTimerStart()
    } else if (_timerState.phase === "running") {
      focusTimerPause()
    } else {
      focusTimerResume()
    }
  }

  function focusTimerStartInterval() {
    if (_timerInterval) return
    _timerInterval = window.setInterval(focusTimerTick, 1000)
  }

  function focusTimerStopInterval() {
    if (_timerInterval) {
      window.clearInterval(_timerInterval)
      _timerInterval = null
    }
  }

  function focusTimerTick() {
    const cfg = timerConfig()
    if (_timerState.phase === "running") {
      _timerState.remaining = Math.max(0, _timerState.expiresAt - Date.now())
      if (_timerState.remaining <= 0) {
        focusTimerComplete(cfg)
        return
      }
    }
    focusTimerRender(cfg)
  }

  function focusTimerComplete(cfg) {
    _timerState.phase = "idle"
    _timerState.remaining = 0
    _timerState.updatedAt = Date.now()
    _timerState.expiresAt = 0
    focusTimerPersist()
    focusTimerStopInterval()
    const notifications = cfg.notifications || {}
    if (notifications.enabled) {
      if (notifications.toast) neoabsToast("Focus session complete", "success")
      if (notifications.sound) timerChime()
    }
    focusTimerRender(cfg)
  }

  function focusTimerRender(cfg) {
    const accent = cfg.colors.progress || "#8a5a33"
    document.documentElement.style.setProperty("--neoabs-timer-accent", accent)

    const total = _timerState.total || cfg.default_minutes * 60000
    const progress = total > 0
      ? Math.max(0, Math.min(1, _timerState.remaining / total))
      : 0
    const label = formatTimer(_timerState.remaining, cfg.display_format)

    const tocWidget = $(".neoabs-timer-toc")
    if (tocWidget) {
      tocWidget.style.setProperty("--neoabs-timer-progress", String(progress))
      const digits = tocWidget.querySelector(".neoabs-timer-toc__digits")
      if (digits) digits.textContent = label

      const running = _timerState.phase === "running"
      const idle = _timerState.phase === "idle"
      const toggle = tocWidget.querySelector(".neoabs-timer-toc__control[data-md-neoabs-timer-ctrl='toggle']")
      if (toggle) {
        toggle.innerHTML = TIMER_CTRL_ICONS[running ? "pause" : "play"]
        toggle.setAttribute("aria-label",
          running ? "Pause timer"
          : _timerState.phase === "paused" ? "Resume timer"
          : "Start timer")
      }
      const restart = tocWidget.querySelector(".neoabs-timer-toc__control[data-md-neoabs-timer-ctrl='restart']")
      if (restart) restart.disabled = idle
      const cancel = tocWidget.querySelector(".neoabs-timer-toc__control[data-md-neoabs-timer-ctrl='cancel']")
      if (cancel) cancel.disabled = idle
      tocWidget.setAttribute("data-md-neoabs-timer-running", String(running))
    }

    const chip = $(".neoabs-timer-reading")
    if (chip) {
      const digitEl = chip.querySelector(".neoabs-timer-reading__digits")
      if (digitEl) digitEl.textContent = label
    }

    // Phase 18: mirror the same readout into the cluster badge (when present).
    const badge = $('.neoabs-action-cluster__action[data-md-neoabs-cluster-action="timer"] .neoabs-action-cluster__badge')
    if (badge) badge.textContent = label

    focusTimerApplyTitle()
  }

  // Phase 18: optional live countdown in the tab title (`timer.document_title`).
  // The page's real title is captured once (boot) and re-synced on SPA
  // navigation, so the template never shows a stale title once the session ends.
  let _tabTitleBase = ""

  function focusTimerApplyTitle() {
    const cfg = timerConfig()
    if (cfg.document_title && _timerState.phase === "running") {
      if (!_tabTitleBase) _tabTitleBase = document.title
      document.title = formatTimer(_timerState.remaining, cfg.display_format) + " \u2014 " + _tabTitleBase
    } else if (_timerState.phase !== "running" && _tabTitleBase) {
      document.title = _tabTitleBase
    }
  }

  // Teardown the injected surfaces so a settings change (style/position/show)
// can rebuild them fresh; nothing theme-shipped is touched.
  function focusTimerTeardownUi() {
    const widget = $(".neoabs-timer-toc")
    if (widget && widget.parentNode) widget.parentNode.removeChild(widget)
    const chip = $(".neoabs-timer-reading")
    if (chip && chip.parentNode) chip.parentNode.removeChild(chip)
  }

  // Inject the TOC widget and reading chip exactly like notesEnsureUi: guard
  // against duplicates, build from scratch, and never remove existing markup.
  function focusTimerEnsureUi() {
    const cfg = timerConfig()
    const tocCfg = cfg.toc || {}
    if (tocCfg.show && !$(".neoabs-timer-toc")) {
      const inner = $(".neoabs-toc__inner")
      if (inner) {
        const widget = document.createElement("div")
        widget.className = "neoabs-timer-toc neoabs-timer-toc--" + (tocCfg.position === "top" ? "top" : "bottom")
        widget.setAttribute("data-md-neoabs-timer-style", tocCfg.style)
        widget.style.setProperty("--neoabs-timer-progress", "0")
        widget.innerHTML =
          '<div class="neoabs-timer-toc__label">Focus</div>' +
          (tocCfg.style === "ring"
            ? '<svg class="neoabs-timer-toc__ring" viewBox="0 0 44 44" aria-hidden="true">' +
              '<circle class="neoabs-timer-toc__ring-bg" cx="22" cy="22" r="20"></circle>' +
              '<circle class="neoabs-timer-toc__ring-fg" cx="22" cy="22" r="20"></circle></svg>'
            : "") +
          (tocCfg.style === "bar"
            ? '<div class="neoabs-timer-toc__bar" aria-hidden="true"><div class="neoabs-timer-toc__bar-fill"></div></div>'
            : "") +
          '<div class="neoabs-timer-toc__digits' + (tocCfg.style === "digits" ? " neoabs-timer-toc__digits--large" : "") + '">' +
          formatTimer(cfg.default_minutes * 60000) + "</div>" +
          '<div class="neoabs-timer-toc__controls" role="group" aria-label="Timer controls">' +
            '<button type="button" class="neoabs-timer-toc__control" data-md-neoabs-timer-ctrl="toggle" aria-label="Start timer">' + TIMER_CTRL_ICONS.play + "</button>" +
            '<button type="button" class="neoabs-timer-toc__control" data-md-neoabs-timer-ctrl="restart" aria-label="Restart timer" disabled>' + TIMER_CTRL_ICONS.restart + "</button>" +
            '<button type="button" class="neoabs-timer-toc__control" data-md-neoabs-timer-ctrl="cancel" aria-label="Cancel timer" disabled>' + TIMER_CTRL_ICONS.cancel + "</button>" +
          "</div>"
        if (tocCfg.position === "top") inner.insertBefore(widget, inner.firstChild)
        else inner.appendChild(widget)

        widget.querySelector(".neoabs-timer-toc__control[data-md-neoabs-timer-ctrl='toggle']").addEventListener("click", focusTimerPlayPause)
        widget.querySelector(".neoabs-timer-toc__control[data-md-neoabs-timer-ctrl='restart']").addEventListener("click", focusTimerRestart)
        widget.querySelector(".neoabs-timer-toc__control[data-md-neoabs-timer-ctrl='cancel']").addEventListener("click", focusTimerCancel)
      }
    }

    const readingCfg = cfg.reading || {}
    if (readingCfg.show && !$(".neoabs-timer-reading")) {
      const chip = document.createElement("div")
      chip.className = "neoabs-timer-reading"
      chip.setAttribute("role", "status")
      chip.innerHTML =
        '<span class="neoabs-timer-reading__dot" aria-hidden="true"></span>' +
        '<span class="neoabs-timer-reading__digits">' + formatTimer(cfg.default_minutes * 60000) + "</span>"
      document.body.appendChild(chip)
    }

    focusTimerRender(cfg)
  }

  // Settings popup (theme.neoabs.timer.settings_popup), mirroring the
  // keyboard-help modal: overlay + panel + header + close, with the session
  // form below. Submitting saves the reader's overrides locally and starts a
  // fresh session of the chosen length.
  function openTimerSettings() {
    let modal = $(".neoabs-timer-settings")
    if (modal) {
      modal.classList.add("neoabs-timer-settings--visible")
      return
    }
    const cfg = timerConfig()

    modal = document.createElement("div")
    modal.className = "neoabs-timer-settings neoabs-timer-settings--visible"
    modal.setAttribute("role", "dialog")
    modal.setAttribute("aria-label", "Focus timer settings")

    const styles = { ring: "Ring", bar: "Bar", digits: "Digits" }
    const positions = { top: "Top", bottom: "Bottom" }
    const styleOptions = Object.keys(styles).map((value) =>
      '<option value="' + value + '"' + (cfg.toc.style === value ? " selected" : "") + ">" + styles[value] + "</option>"
    ).join("")
    const positionOptions = Object.keys(positions).map((value) =>
      '<option value="' + value + '"' + (cfg.toc.position === value ? " selected" : "") + ">" + positions[value] + "</option>"
    ).join("")

    modal.innerHTML =
      '<div class="neoabs-timer-settings__overlay"></div>' +
      '<div class="neoabs-timer-settings__panel">' +
        '<div class="neoabs-timer-settings__header">' +
          '<span class="neoabs-timer-settings__title">Focus Timer</span>' +
          '<button class="neoabs-timer-settings__close" aria-label="Close">&times;</button>' +
        "</div>" +
        '<form class="neoabs-timer-settings__body">' +
          '<div class="neoabs-timer-settings__row">' +
            '<label class="neoabs-timer-settings__label" for="neoabs-timer-duration">Session length (minutes)</label>' +
            '<input class="neoabs-timer-settings__control" type="number" id="neoabs-timer-duration" min="1" max="180" step="1" value="' + cfg.default_minutes + '" />' +
          "</div>" +
          '<div class="neoabs-timer-settings__row">' +
            '<label class="neoabs-timer-settings__label" for="neoabs-timer-style">TOC timer style</label>' +
            '<select class="neoabs-timer-settings__control" id="neoabs-timer-style">' + styleOptions + "</select>" +
          "</div>" +
          '<div class="neoabs-timer-settings__row">' +
            '<label class="neoabs-timer-settings__label" for="neoabs-timer-position">TOC timer position</label>' +
            '<select class="neoabs-timer-settings__control" id="neoabs-timer-position">' + positionOptions + "</select>" +
          "</div>" +
          '<div class="neoabs-timer-settings__check">' +
            '<label class="neoabs-timer-settings__check-label"><input type="checkbox" id="neoabs-timer-reading" ' + (cfg.reading.show ? "checked" : "") + " />Reading-mode chip</label>" +
          "</div>" +
          '<div class="neoabs-timer-settings__check">' +
            '<label class="neoabs-timer-settings__check-label"><input type="checkbox" id="neoabs-timer-toast" ' + (cfg.notifications.toast ? "checked" : "") + " />Toast on completion</label>" +
          "</div>" +
          '<div class="neoabs-timer-settings__check">' +
            '<label class="neoabs-timer-settings__check-label"><input type="checkbox" id="neoabs-timer-sound" ' + (cfg.notifications.sound ? "checked" : "") + " />Chime on completion</label>" +
          "</div>" +
          '<div class="neoabs-timer-settings__actions">' +
            '<button type="button" class="neoabs-timer-settings__cancel">Cancel</button>' +
            '<button type="submit" class="neoabs-timer-settings__save">Start Session</button>' +
          "</div>" +
        "</form>" +
      "</div>"

    document.body.appendChild(modal)

    const close = () => modal.classList.remove("neoabs-timer-settings--visible")
    modal.querySelector(".neoabs-timer-settings__close").addEventListener("click", close)
    modal.querySelector(".neoabs-timer-settings__overlay").addEventListener("click", close)
    modal.querySelector(".neoabs-timer-settings__cancel").addEventListener("click", close)
    modal.querySelector(".neoabs-timer-settings__body").addEventListener("submit", (e) => {
      e.preventDefault()
      focusTimerApplySettings(modal, true)
    })
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("neoabs-timer-settings--visible")) close()
    })
  }

  function focusTimerApplySettings(modal, startSession) {
    const settings = timerSettingsRead()
    const minutes = Math.max(1, Math.floor(Number(modal.querySelector("#neoabs-timer-duration").value) || 25))
    settings.default_minutes = minutes
    settings.toc_style = modal.querySelector("#neoabs-timer-style").value
    settings.toc_position = modal.querySelector("#neoabs-timer-position").value
    settings.reading_show = modal.querySelector("#neoabs-timer-reading").checked
    settings.toast = modal.querySelector("#neoabs-timer-toast").checked
    settings.sound = modal.querySelector("#neoabs-timer-sound").checked
    timerSettingsWrite(settings)

    const cfg = timerConfig()
    if (_timerState.phase === "idle") {
      _timerState.total = cfg.default_minutes * 60000
      _timerState.remaining = _timerState.total
      _timerState.updatedAt = Date.now()
    }
    modal.classList.remove("neoabs-timer-settings--visible")
    focusTimerTeardownUi()
    focusTimerEnsureUi()
    if (startSession) focusTimerStart(minutes)
    else focusTimerRender(cfg)
  }

  // Short WebAudio two-note chime (best-effort; never blocks the theme).
  function timerChime() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const notes = [880, 1174.66]
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        const startAt = ctx.currentTime + index * 0.18
        gain.gain.setValueAtTime(0.0001, startAt)
        gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.45)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startAt)
        osc.stop(startAt + 0.5)
      })
      window.setTimeout(function () { try { ctx.close() } catch (e) {} }, 1500)
    } catch (e) { /* audio is best-effort */ }
  }

  function initFocusTimer(config) {
    const cfg = timerConfig()
    if (cfg.enabled === false) return

    _tabTitleBase = document.title

    if (cfg.persist) focusTimerRestore()

    focusTimerEnsureUi()

    document.addEventListener("keydown", (e) => {
      if (kbdEnabled("timer_toggle") &&
          matchesKeyCombo(e, kbdKey("timer_toggle", "Alt+Shift+T"))) {
        e.preventDefault()
        focusTimerToggle()
      }
    })
    keyboardActions.timer_toggle = focusTimerToggle
  }

  // ---------------------------------------------------------------------------
  // 13b. UI primitives (buttons & forms)
  // Provides inline behaviour for the documented .neoabs-btn / .neoabs-form
  // components: click feedback, form validation state toggles.
  // ---------------------------------------------------------------------------

  // ---- Global toast helper (exposed as neoabsToast) -----------------------
  let _toastTimer = null
  function neoabsToast(message, type) {
    if (!componentShow("toast", "show")) return
    let el = $(".neoabs-toast")
    if (!el) {
      el = document.createElement("div")
      el.className = "neoabs-toast"
      el.setAttribute("role", "status")
      el.setAttribute("aria-live", "polite")
      const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
      }
      el.innerHTML = (icons[type] || icons.info) + '<span class="neoabs-toast__msg"></span>'
      document.body.appendChild(el)
    }
    type = type || "info"
    el.className = "neoabs-toast neoabs-toast--" + type
    el.querySelector(".neoabs-toast__msg").textContent = message
    void el.offsetWidth
    el.classList.add("neoabs-toast--show")
    if (_toastTimer) clearTimeout(_toastTimer)
    _toastTimer = window.setTimeout(function () {
      el.classList.remove("neoabs-toast--show")
    }, 2600)
  }
  window.neoabsToast = neoabsToast

  function initUIExamples() {
    const labelOf = function (el) {
      return (el.getAttribute("aria-label") ||
              el.textContent ||
              el.getAttribute("title") ||
              el.className).trim()
    }

    // Buttons: pressed feedback + toast on click.
    $$(".neoabs-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return
        btn.classList.remove("neoabs-btn--pressed")
        void btn.offsetWidth // restart transition
        btn.classList.add("neoabs-btn--pressed")
        window.setTimeout(function () {
          btn.classList.remove("neoabs-btn--pressed")
        }, 180)
        neoabsToast("Clicked: " + labelOf(btn), "info")
      })
    })

    // Forms: on submit, validate required fields and flip hint/state classes.
    $$(".neoabs-form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault()
        let valid = true
        form.querySelectorAll("[required]").forEach(function (el) {
          var ok = (el.value || "").trim().length > 0
          var wrap = el.closest(".neoabs-field")
          if (!ok) {
            valid = false
            el.classList.add("neoabs-input--error")
          } else {
            el.classList.remove("neoabs-input--error")
          }
          // Explicit error/success hints
          if (wrap) {
            var err = wrap.querySelector(".neoabs-hint--error")
            if (err) err.style.display = ok ? "none" : "block"
          }
        })
        if (valid) {
          form.classList.add("neoabs-form--valid")
          neoabsToast("Form submitted", "success")
        } else {
          form.classList.remove("neoabs-form--valid")
          neoabsToast("Please fill in the required fields", "error")
        }
      })
    })

    // Inputs / textareas / selects: toast on change (Enter for text).
    $$(".neoabs-input, .neoabs-textarea, .neoabs-select").forEach(function (el) {
      var label = function () {
        const id = el.getAttribute("id")
        let text = ""
        if (id) {
          const lbl = document.querySelector("label[for='" + id + "']")
          if (lbl) text = lbl.textContent.trim()
        }
        return text || el.getAttribute("placeholder") || "field"
      }
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
          e.preventDefault()
          neoabsToast("Saved: " + label(), "success")
        }
      })
      el.addEventListener("change", function () {
        neoabsToast("Changed: " + label(), "info")
      })
    })
  }

  // ---------------------------------------------------------------------------
  // 13d. Math (KaTeX) — lazy-loaded when a page contains math
  // Uses pymdownx.arithmatex output: .arithmatex with type math/tex or math/tex;
  // ---------------------------------------------------------------------------

  const MATH_CDN_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
  const MATH_CDN_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"

  function mathEnabled(config) {
    return !(config && config.math && config.math.enabled === false)
  }

  function initMath(config) {
    if (!componentShow("math", "show")) return
    if (!mathEnabled(config)) return
    const scope = document.querySelector(".arithmatex, .math, .neoabs-math")
    if (!scope) return

    // Ensure CSS is present.
    if (!$('link[data-neoabs-math-css]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = MATH_CDN_CSS
      link.setAttribute("data-neoabs-math-css", "")
      document.head.appendChild(link)
    }

    const renderMath = function () {
      if (typeof window.katex === "undefined") return
      document.querySelectorAll(".arithmatex, .math").forEach(function (el) {
        if (el.dataset.neoabsProcessed) return
        el.dataset.neoabsProcessed = "1"
        // Strip the \( \) / \[ \] delimiters emitted by pymdownx.arithmatex.
        let tex = (el.textContent || "").replace(/^\s*\\[\(\[\]\\)]+\s*/, "")
        tex = tex.replace(/\s*\\[\)\]]\s*$/, "")
        const display = el.classList.contains("math") ||
                        el.tagName === "DIV" ||
                        (el.closest(".math") !== null)
        try {
          window.katex.render(tex, el, {
            displayMode: display,
            throwOnError: false,
            trust: true,
            output: "html"
          })
        } catch (e) { /* leave as text on failure */ }
      })
    }

    ensureScript(cdnUrlFor("math") || MATH_CDN_JS, renderMath, function () {
      // Optional retry after a short delay if CDN was slow.
      window.setTimeout(renderMath, 1200)
    })
  }

  // ---------------------------------------------------------------------------
  // 14. Repo (GitHub) popover — fetch live repo info on hover
  // ---------------------------------------------------------------------------

  const REPO_API_BASE = "https://api.github.com/repos/"
  const USER_API_BASE = "https://api.github.com/users/"

  function repoSlugFromUrl(url) {
    if (!url) return null
    const m = String(url)
      .replace(/\.git$/, "")
      .replace(/^git@/, "")
      .replace("https://", "")
      .replace("http://", "")
      .replace("ssh://", "")
      .split("/")
    if (m.length < 2) return null
    const host = m[0]
    if (!/(github|gitlab|bitbucket|gitea)/.test(host)) return null
    return {
      host: host.split(".")[0],
      owner: m[1],
      name: (m[2] || "").replace(/\.git$/, "")
    }
  }

  function fmtCount(n) {
    if (isNaN(n)) return "0"
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
    return String(n)
  }

  function fmtDate(iso) {
    if (!iso) return "—"
    const d = new Date(iso)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric"
    })
  }

  function repoPopoverEscape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  // GitHub's avatar API now returns short-lived JWT-signed "private" URLs
  // (private-avatars.githubusercontent.com?jwt=…) that expire within ~20
  // minutes — useless once cached. Prefer a long-lived public
  // avatars.githubusercontent.com URL, otherwise redirect through
  // https://github.com/<owner>.png which GitHub rewrites to a freshly signed
  // avatar on every request (no rate limit, never stale).
  function githubAvatarUrl(rawUrl, login) {
    const u = String(rawUrl || "")
    if (!/\bjwt=/i.test(u) && /^(https?:)?\/\/(?:avatars\.)?githubusercontent\.com\//.test(u)) return u
    if (login) return "https://github.com/" + encodeURIComponent(login) + ".png?size=80"
    return u
  }

  // Inline <img onerror> target: swap the letter avatar in when the image
  // fails to load (offline, blocked CDN, expired private-avatar URL).
  function avatarFallback(img) {
    if (!img || !img.parentNode) return
    img.onerror = null
    const letter = ((img.getAttribute("alt") || "R").charAt(0) || "R").toUpperCase()
    const span = document.createElement("span")
    span.className = "neoabs-repo-pop__avatar"
    span.textContent = letter
    img.parentNode.replaceChild(span, img)
  }
  window._neoabsAvatarFallback = avatarFallback

  function initRepoPopover(config) {
    if (!componentShow("repo_popover", "show")) return
    if (config.repo === false || config.repo_url === "") return
    const link = document.querySelector(".neoabs-header__repo")
    if (!link) return
    const slug = repoSlugFromUrl(config.repo_url || "")
    if (!slug || slug.host !== "github") return

    let loading = false
    const cacheKey = "repo-" + slug.owner + "/" + slug.name
    const cached = cacheGet(cacheKey, 3600000)  // 1 hour TTL

    // Popover root lives in the header markup next to the icon (revealed by
    // CSS hover) — JS only upgrades its content.
    const wrap = link.parentElement
    let pop = wrap ? wrap.querySelector(".neoabs-repo-pop") : null
    if (!pop) {
      pop = document.createElement("div")
      pop.className = "neoabs-repo-pop"
      pop.setAttribute("role", "tooltip")
      if (wrap) wrap.appendChild(pop)
      else document.body.appendChild(pop)
    }
    pop.setAttribute("role", "tooltip")

    if (window.console && console.info) {
      console.info("[neoabs] repo popover ready:", slug.owner + "/" + slug.name)
    }

    const buildRows = function (rows) {
      const out = rows.filter(function (r) { return r.v })
        .map(function (r) {
          return '<div class="neoabs-repo-pop__row">' +
            '<span class="neoabs-repo-pop__k">' + repoPopoverEscape(r.k) + "</span>" +
            '<span class="neoabs-repo-pop__v">' + r.v + "</span></div>"
        }).join("")
      return out
    }

    const renderError = function (msg) {
      pop.innerHTML =
        '<div class="neoabs-repo-pop__head">'
        + '<span class="neoabs-repo-pop__name">' + repoPopoverEscape(slug.owner + "/" + slug.name) + "</span></div>"
        + '<div class="neoabs-repo-pop__body">'
        + '<div class="neoabs-repo-pop__row"><span class="neoabs-repo-pop__k">Status</span>'
        + '<span class="neoabs-repo-pop__v">' + repoPopoverEscape(msg || "No public data") + "</span></div></div>"
    }

    let closeTimer = null

    const cancelClose = function () {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
    }

    const hide = function () {
      pop.classList.remove("neoabs-repo-pop--show")
    }

    // Delay hiding so the user can move from the icon onto the popover.
    const scheduleClose = function () {
      cancelClose()
      closeTimer = window.setTimeout(hide, 3000)
    }

    const loadAndShow = function () {
      cancelClose()
      pop.classList.add("neoabs-repo-pop--show")
      if (window.console && console.info && !pop._neoabsLoggedOpen) {
        pop._neoabsLoggedOpen = true
        console.info("[neoabs] repo popover opened (hover/pointer/click)")
      }
      if (cached) { renderBody(cached); return }
      if (loading) return
      loading = true

      // Immediate skeleton so the popover is never an empty void while the
      // GitHub API responds (or hangs on a rate-limited / offline network).
      pop.innerHTML =
        '<div class="neoabs-repo-pop__head">'
        + '<span class="neoabs-repo-pop__avatar">' + repoPopoverEscape((slug.owner.charAt(0) || "R").toUpperCase()) + "</span>"
        + '<span class="neoabs-repo-pop__title"><span class="neoabs-repo-pop__name">'
        + repoPopoverEscape(slug.owner + "/" + slug.name) + "</span></span></div>"
        + '<div class="neoabs-repo-pop__body"><div class="neoabs-repo-pop__row">'
        + '<span class="neoabs-repo-pop__k">Status</span><span class="neoabs-repo-pop__v">Loading…</span>'
        + "</div></div>"

      const api = REPO_API_BASE + slug.owner + "/" + slug.name
      Promise.all([
        fetch(api).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status)
          return r.json()
        }),
        fetch(api + "/tags?per_page=1").then(function (r) {
          return r.ok ? r.json() : []
        }).catch(function () { return [] }),
        fetch(api + "/commits?per_page=1").then(function (r) {
          const last = r.headers.get("Link")
          let total = null
          if (last) {
            const m = last.match(/per_page=(\d+)&page=(\d+)>;\s*rel="last"/)
            if (m) total = parseInt(m[1], 10) * parseInt(m[2], 10)
          }
          return r.ok ? r.json().then(function (list) {
            return { total: total, latest: list[0] || null }
          }) : { total: null, latest: null }
        }).catch(function () { return { total: null, latest: null } }),
        fetch(USER_API_BASE + slug.owner).then(function (r) {
          return r.ok ? r.json() : null
        }).catch(function () { return null })
      ]).then(function (results) {
        const repo = results[0]
        const tags = results[1]
        const commits = results[2]
        const ownerProfile = results[3] || {}

        const latestCommit = commits.latest
        const commitSha = latestCommit ? latestCommit.sha.slice(0, 7) : null
        const commitDate = latestCommit && latestCommit.commit
          ? fmtDate(latestCommit.commit.author && latestCommit.commit.author.date)
          : "—"
        const commitMsg = latestCommit && latestCommit.commit
          ? (latestCommit.commit.message || "").split("\n")[0] : null
        const totalCommits = commits.total != null ? commits.total : null
        const latestTag = tags && tags[0] ? tags[0].name : null

        const ownerFromRepo = repo.owner || {}
        const ownerData = {
          login: slug.owner,
          name: ownerProfile.name || ownerFromRepo.name || null,
          bio: ownerProfile.bio || null,
          avatar_url: ownerProfile.avatar_url || ownerFromRepo.avatar_url || null,
          followers: ownerProfile.followers != null ? ownerProfile.followers : null,
          public_repos: ownerProfile.public_repos != null ? ownerProfile.public_repos : null,
          location: ownerProfile.location || null,
          html_url: ownerProfile.html_url || ownerFromRepo.html_url || null
        }

        const repoData = {
          full_name: repo.full_name,
          description: repo.description,
          stargazers_count: repo.stargazers_count,
          watchers_count: repo.subscribers_count || repo.watchers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          language: repo.language,
          license: repo.license ? repo.license.spdx_id : null,
          license_url: repo.license && repo.license.spdx_id !== "NOASSERTION"
            ? repo.html_url + "/blob/" + (repo.default_branch || "main") + "/LICENSE"
            : null,
          default_branch: repo.default_branch,
          html_url: repo.html_url,
          total_commits: totalCommits,
          latest_tag: latestTag,
          commit_sha: commitSha,
          commit_date: commitDate,
          commit_msg: commitMsg,
          owner: ownerData
        }
        cacheSet(cacheKey, repoData)
        renderBody(repoData)
      }).catch(function () {
        loading = false
        renderError("Unable to load repo data")
      })
    }

    const owner = slug.owner
    const renderBody = function (d) {
      const ownerData = d.owner || {}
      const ownerLogin = ownerData.login || owner
      const ownerName = ownerData.name || null
      const ownerBlock = d.full_name ? d.full_name.split("/")[0] : ownerLogin

      let avatarHtml
      const avatarSrc = githubAvatarUrl(ownerData.avatar_url, ownerLogin)
      if (avatarSrc) {
        avatarHtml = '<img class="neoabs-repo-pop__avatar" src="' + repoPopoverEscape(avatarSrc)
          + '" alt="' + repoPopoverEscape(ownerName || ownerLogin) + '" referrerpolicy="no-referrer">'
      } else {
        avatarHtml = '<span class="neoabs-repo-pop__avatar">' + repoPopoverEscape((ownerBlock[0] || "R").toUpperCase()) + "</span>"
      }

      const authorLink = '<a href="' + repoPopoverEscape(ownerData.html_url || "https://github.com/" + ownerLogin)
        + '" target="_blank" rel="noopener">'
        + repoPopoverEscape(ownerName || "@" + ownerLogin)
        + "</a>"

      pop.innerHTML =
        '<div class="neoabs-repo-pop__head">'
        + avatarHtml
        + '<span class="neoabs-repo-pop__title">'
        + '<a class="neoabs-repo-pop__name" href="' + repoPopoverEscape(d.html_url || "#") + '" target="_blank" rel="noopener">'
        + repoPopoverEscape(d.full_name || ownerLogin + "/" + slug.name) + "</a>"
        + (d.description ? '<span class="neoabs-repo-pop__desc">' + repoPopoverEscape(d.description) + "</span>" : "")
        + "</span></div>"
        + '<div class="neoabs-repo-pop__body">'
        + (ownerData.bio ? '<div class="neoabs-repo-pop__bio">' + repoPopoverEscape(ownerData.bio) + "</div>" : "")
        + buildRows([
          { k: "Author", v: authorLink },
          { k: "Followers", v: ownerData.followers != null ? fmtCount(ownerData.followers) + " (" + ownerData.followers + ")" : null },
          { k: "Public repos", v: ownerData.public_repos != null ? fmtCount(ownerData.public_repos) : null },
          { k: "Location", v: ownerData.location ? repoPopoverEscape(ownerData.location) : null },
          { k: "Stars", v: d.stargazers_count != null ? fmtCount(d.stargazers_count) + " (" + d.stargazers_count + ")" : "—" },
          { k: "Watchers", v: d.watchers_count != null ? fmtCount(d.watchers_count) + " (" + d.watchers_count + ")" : "—" },
          { k: "Forks", v: d.forks_count != null ? fmtCount(d.forks_count) : "—" },
          { k: "Open issues", v: d.open_issues_count != null ? fmtCount(d.open_issues_count) : "—" },
          { k: "Language", v: d.language || "—" },
          { k: "License", v: d.license
              ? (d.license_url
                  ? '<a href="' + repoPopoverEscape(d.license_url) + '" target="_blank" rel="noopener">' + repoPopoverEscape(d.license) + "</a>"
                  : repoPopoverEscape(d.license))
              : (d.license_url
                  ? '<a href="' + repoPopoverEscape(d.license_url) + '" target="_blank" rel="noopener">None</a>'
                  : "None") },
          { k: "Default branch", v: d.default_branch || "—" },
          { k: "Commits", v: d.total_commits != null ? fmtCount(d.total_commits) : "—" },
          { k: "Tags", v: d.latest_tag ? "latest " + repoPopoverEscape(d.latest_tag) : "—" },
          { k: "Latest commit", v: (d.commit_sha ? d.commit_sha : "—") + (d.commit_date ? " · " + d.commit_date : "") },
          { k: "Last commit msg", v: d.commit_msg ? repoPopoverEscape(d.commit_msg) : "—" },
          { k: "Created", v: fmtDate(d.created_at) },
          { k: "Last updated", v: fmtDate(d.updated_at) },
          { k: "Last pushed", v: fmtDate(d.pushed_at) }
        ])
        + "</div>"

      const avImg = pop.querySelector("img.neoabs-repo-pop__avatar")
      if (avImg) avImg.addEventListener("error", avatarFallback)
    }

    // Hover / focus to open; leave / blur starts a 3s close timer so the user
    // can move onto the popover. Hovering the popover itself cancels the timer.
    // Clicking / Enter also opens it — some visitors click the icon rather
    // than hover (trackpad, touch) and the link still navigates to GitHub.
    link.addEventListener("mouseenter", loadAndShow)
    link.addEventListener("pointerenter", loadAndShow)
    link.addEventListener("mouseleave", scheduleClose)
    link.addEventListener("focus", loadAndShow)
    link.addEventListener("blur", scheduleClose)
    link.addEventListener("click", loadAndShow)
    link.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") loadAndShow()
    })
    pop.addEventListener("mouseenter", cancelClose)
    pop.addEventListener("mouseleave", scheduleClose)

    // Phase 20: expose the popover open/close so the keyboard shortcut
    // (`toggle_repo_popover`, default Ctrl/Cmd+Shift+G) can drive it without
    // coupling the shortcut handler to the popover's internals.
    pop._neoabsRepoShow = loadAndShow
    pop._neoabsRepoHide = hide
  }

  // Phase 20: open the configured repository link in a new tab. Used as the
  // fallback for `toggle_repo_popover` when the popover feature is off, when
  // no GitHub repo is configured, or when the popover element is missing.
  function openRepoLink() {
    const link = document.querySelector(".neoabs-header__repo")
    if (!link || !link.href) return false
    window.open(link.href, "_blank", "noopener")
    return true
  }

  // Phase 20: keyboard target for the repo. When the repo popover is available
  // (feature on + GitHub repo configured) the shortcut toggles it on/off;
  // otherwise it falls back to opening the repo link in a new tab.
  function toggleRepoPopover() {
    const link = document.querySelector(".neoabs-header__repo")
    if (link) {
      const wrap = link.parentElement
      const pop = wrap ? wrap.querySelector(".neoabs-repo-pop") : null
      if (pop && typeof pop._neoabsRepoShow === "function") {
        if (pop.classList.contains("neoabs-repo-pop--show")) pop._neoabsRepoHide()
        else pop._neoabsRepoShow()
        return true
      }
    }
    return openRepoLink()
  }

  // ---------------------------------------------------------------------------
  // 15. SPA-style client-side navigation
  // ---------------------------------------------------------------------------

  // Persist the config so per-page initializers can re-run after a swap.
  let _navConfig = null

  function initSPANavigation(config) {
    _navConfig = config
    const base = (config && config.base) || ""

    const joinUrl = (b, p) => {
      if (!p) return b
      if (p.charAt(0) === "/") return p
      if (b.length && b.charAt(b.length - 1) === "/") return b + p
      return b + "/" + p
    }

    const samePageHash = (url) => {
      const here = new URL(location.href)
      return url.origin === here.origin &&
             url.pathname.replace(/\/$/, "") === here.pathname.replace(/\/$/, "") &&
             url.hash
    }

    function isNavigable(link) {
      if (!link || link.hasAttribute("download")) return false
      if (link.target && link.target !== "_self") return false
      if (link.hostname && link.hostname !== window.location.hostname) return false
      if (link.protocol && !/^https?:$/.test(link.protocol)) return false
      const href = link.getAttribute("href")
      if (!href || href.charAt(0) === "#") return false
      if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return false
      return true
    }

    function extract(html) {
      const doc = new DOMParser().parseFromString(html, "text/html")
      const pick = (sel) => {
        const el = doc.querySelector(sel)
        return el ? el.outerHTML : ""
      }
      return {
        title: doc.title || "",
        content: pick(".neoabs-article") || pick(".neoabs-content") || "",
        toc: pick(".neoabs-toc") || "",
        nav: pick(".neoabs-nav") || "",
        footer: pick(".neoabs-footer") || "",
        pageTitle: (doc.querySelector(".neoabs-header__page-title") || {}).innerHTML || "",
        bodyClass: doc.body ? doc.body.className : ""
      }
    }

    function applyPage(data) {
      const article = $(".neoabs-article")
      if (article && data.content) article.innerHTML = data.content
      if (data.toc) {
        const toc = $(".neoabs-toc")
        if (toc) toc.outerHTML = data.toc
        else {
          const aside = document.createElement("div")
          aside.innerHTML = data.toc
          document.querySelector(".neoabs-layout").appendChild(aside.firstChild)
        }
      } else {
        const toc = $(".neoabs-toc")
        if (toc) toc.parentNode.removeChild(toc)
      }
      if (data.nav) {
        const nav = $(".neoabs-nav")
        if (nav) nav.outerHTML = data.nav
      }
      if (data.footer) {
        const footer = $(".neoabs-footer")
        if (footer) footer.outerHTML = data.footer
      }
      if (data.title) document.title = data.title
      // Phase 18: keep the timer's captured base title in sync across SPA
      // navigation so the tab-title countdown never anchors to a stale page.
      if (_tabTitleBase) {
        _tabTitleBase = document.title
        focusTimerApplyTitle()
      }
      const pageTitle = $(".neoabs-header__page-title")
      if (pageTitle && data.pageTitle) pageTitle.innerHTML = data.pageTitle
    }

    function reinitPageScoped() {
      const inits = [
        initTocTracking, initHighlighting, initCodeLineNumbers, initContentMedia,
        initContentTables, initMermaid, initImageZoom, initCodeAnnotations,
        () => initCopyButtons(_navConfig), initTabs, initTaskLists,
        initUIExamples, () => initMath(_navConfig), initNavToggle,
        initPermalinks, () => initFeedback(_navConfig), () => initComments(_navConfig),
        focusTimerEnsureUi
      ]
      inits.forEach(function (fn) {
        try { fn() } catch (e) {}
      })
    }

    // --- Scroll-position memory ----------------------------------------------
    // Remember where the user left off on each page and restore it when they
    // return (via browser back, SPA nav, or a fresh page load).

    const SCROLL_CACHE_KEY = "neoabs-scroll-pos"

    function pageKeyFromUrl(u) {
      try {
        const url = new URL(u, location.href)
        // Never persist or resume non-http(s) origins (e.g. a page that was
        // once opened from file://) — an http page cannot navigate to them.
        if (url.protocol !== "http:" && url.protocol !== "https:") return ""
        return url.href.split("#")[0].replace(/\/$/, "")
      } catch { return "" }
    }

    function readScrollPositions() {
      try {
        const raw = localStorage.getItem(SCROLL_CACHE_KEY)
        return raw ? JSON.parse(raw) : {}
      } catch { return {} }
    }

    function saveScrollPositions(map) {
      try { localStorage.setItem(SCROLL_CACHE_KEY, JSON.stringify(map)) } catch {}
    }

    function saveCurrentScroll() {
      const key = pageKeyFromUrl(location.href)
      if (!key) return
      const map = readScrollPositions()
      map[key] = { y: window.scrollY || 0, x: window.scrollX || 0, at: Date.now() }
      saveScrollPositions(map)
    }

    function restoreScroll(key) {
      const map = readScrollPositions()
      const pos = map[key]
      if (pos && typeof pos.y === "number") {
        window.scrollTo({ top: pos.y, left: pos.x || 0, behavior: "auto" })
        updateScrollProgress()
      } else {
        window.scrollTo({ top: 0, behavior: "auto" })
        updateScrollProgress()
      }
    }

    // Throttled save while scrolling.
    let _scrollSaveTimer = null
    window.addEventListener("scroll", () => {
      if (_scrollSaveTimer) return
      _scrollSaveTimer = true
      requestAnimationFrame(() => {
        saveCurrentScroll()
        _scrollSaveTimer = false
      })
    }, { passive: true })

    // Save on beforeunload (full page navigation / tab close).
    window.addEventListener("beforeunload", saveCurrentScroll)

    // Remember the current page as the visitor's most recent stop.
    function recordCurrentVisit() {
      const key = pageKeyFromUrl(location.href)
      if (!key) return
      sessionMutate((s) => {
        s.lastPage = key
        s.lastAt = Date.now()
      })
    }

    // The site's root route, resolved from config.base.
    function siteRootKey() {
      try {
        return pageKeyFromUrl(new URL(base, location.href).href)
      } catch { return "" }
    }

    // Expose an initial-restore hook used by the boot sequence:
    //  - head back to the last-visited page when the site is opened at the root
    //  - restore the nav collapse/search state and the page's scroll position
    window._neoabsRestoreScroll = function () {
      const hereKey = pageKeyFromUrl(location.href)
      const rootKey = siteRootKey()
      const s = sessionGet()
      if (s.lastPage && /^https?:/i.test(s.lastPage) && hereKey === rootKey && s.lastPage !== rootKey) {
        // Use directory-style URLs (trailing slash) so the fetch hits the page
        // directly instead of being 302-redirected by the server.
        let resumeUrl = s.lastPage
        if (resumeUrl && resumeUrl.charAt(resumeUrl.length - 1) !== "/") {
          resumeUrl += "/"
        }
        navigateTo(resumeUrl, false, { resume: true })
        return
      }
      applyNavMemory()
      restoreScroll(hereKey)
      recordCurrentVisit()
    }

    function navigateTo(url, push, opts) {
      if (!url) return
      const target = new URL(url, location.href)
      if (samePageHash(target)) {
        const el = document.getElementById(decodeURIComponent(target.hash.slice(1)))
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
        if (push) history.pushState(null, "", target.pathname + target.hash)
        else history.replaceState(null, "", target.pathname + target.hash)
        return
      }

      // Safety net: only SPA-render pages that live under this site's base
      // path. A stale/cached link resolving outside the mount (a doubled
      // relative path, a base-less href, etc.) must hard-navigate instead of
      // client-side fetching — otherwise it 404s and re-navigates in a loop.
      const siteRoot = (function () {
        try {
          return new URL(base, location.href).pathname.replace(/\/$/, "") || "/"
        } catch {
          return "/"
        }
      })()
      const targetPath = target.pathname.replace(/\/$/, "") || "/"
      if (
        siteRoot !== "/" &&
        targetPath !== siteRoot &&
        targetPath.indexOf(siteRoot + "/") !== 0
      ) {
        if (opts && opts.resume) {
          // A stale remembered page that resolves outside the current mount
          // must not yank the visitor into a redirect loop (the server 302s
          // "/" back to the site root, which re-triggers this resume). Forget
          // it and settle on the landing page instead.
          sessionMutate(function (s) { delete s.lastPage })
          history.replaceState(null, "", location.href)
          applyNavMemory()
          restoreScroll(pageKeyFromUrl(location.href))
          return
        }
        location.href = url
        return
      }

      // Save the current page's scroll position before leaving it.
      saveCurrentScroll()
      const targetKey = pageKeyFromUrl(target.href)
      const originHref = location.href

      if (push) history.pushState(null, "", url)
      else history.replaceState(null, "", url)

      // Fetch the page body for client-side rendering
      fetch(target.pathname + target.search, { headers: { "X-NeoAbs-SPA": "1" } })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status)
          return r.text()
        })
        .then(function (html) {
          applyPage(extract(html))
          reinitPageScoped()
          applyNavMemory()
          restoreScroll(targetKey)
          recordCurrentVisit()
          closeNavOverlays()
        })
        .catch(function (e) {
          if (opts && opts.resume) {
            // A stale remembered page (e.g. 404) must not yank the visitor off
            // the landing page. Forget it and settle here instead.
            sessionMutate(function (s) { delete s.lastPage })
            history.replaceState(null, "", originHref)
            applyNavMemory()
            restoreScroll(pageKeyFromUrl(originHref))
            return
          }
          // On failure, fall back to a normal full-page navigation.
          location.href = url
        })
    }

    // Update progress bar immediately after swapping content.
    function updateScrollProgress() {
      const progressBar = $(".neoabs-progress__bar")
      if (!progressBar) return
      const y = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min((y / docHeight) * 100, 100) : 0
      progressBar.style.width = pct + "%"
    }

    // Close any open mobile drawer / overlays after navigation.
    function closeNavOverlays() {
      const drawer = document.getElementById("neoabs-drawer")
      if (drawer && drawer.checked) drawer.checked = false
      const nav = $(".neoabs-nav")
      if (nav) nav.classList.remove("neoabs-nav--open")
      const search = $(".neoabs-search")
      if (search && typeof search._neoabsClose === "function") search._neoabsClose()
      document.body.style.overflow = ""
    }

    // Intercept internal link clicks.
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 && e.metaKey && e.ctrlKey) return
      const link = e.target.closest("a")
      if (!link || !isNavigable(link)) return
      e.preventDefault()
      navigateTo(link.href, true)
    })

    // Back / forward.
    window.addEventListener("popstate", () => {
      navigateTo(location.href, false)
    })
  }

  // Empty code-fence line anchors (pymdownx "linenums" output, e.g.
  // id="__codelineno-0-1") are focusable links with no text. They're valid
  // fragment targets for deep-linking, but as empty tab stops they trip
  // "links must have discernible text" audits. Pull them out of the tab order
  // and the accessibility tree.
  function initCodeFenceLinks() {
    const anchors = document.querySelectorAll('a[id^="__codelineno"]')
    anchors.forEach(function (a) {
      a.setAttribute("aria-hidden", "true")
      a.tabIndex = -1
    })
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  onReady(function () {
    const config = readConfig()
    applyPageOverrides(config)
    _config = config

    if (window.console && console.info) {
      console.info("[neoabs] theme load (assets v" + NEOABS_VERSION + ")")
    }

    // Each initializer is isolated so a failure in an optional feature (e.g. an
    // older browser or missing optional dependency) cannot take down the theme.
    const init = [initTheme, initColorScheme, initMobileNav,
      () => initSearch(config), initTocTracking, initBackToTop,
      initScrollBehavior, initHighlighting, initCodeLineNumbers, initContentMedia,
      initContentTables, initMermaid, initImageZoom, initCodeAnnotations,
      () => initCopyButtons(config), initTabs, initTaskLists,
      () => initNotes(config), () => initReadingMode(config), () => initActionCluster(config), () => initFocusTimer(config), initAnchorLinks, initPermalinks, initKeyboardNav,
      initNavToggle, initSidebarToggle, initHeaderControls, initUIExamples,
      initCodeFenceLinks,
      () => initMath(config), () => initRepoPopover(config),
      () => initFeedback(config), () => initComments(config),
      () => initAnnouncement(config), () => initConsent(config),
      () => initLinkRebase(config),
      () => initSPANavigation(config)]
    init.forEach(function (fn) {
      try { fn() } catch (e) {
        if (window.console && console.error) console.error("[neoabs] init failed:", e)
      }
    })

    // Restore the remembered scroll position for the initial page.
    // Runs after layout; `scrollRestorePage()` is exposed by initSPANavigation.
    if (typeof window._neoabsRestoreScroll === "function") {
      const doRestore = () => {
        try { window._neoabsRestoreScroll() } catch (e) { /* keep booting */ }
      }
      if (document.readyState === "complete") doRestore()
      else window.addEventListener("load", function onLoad() {
        window.removeEventListener("load", onLoad)
        doRestore()
      })
    }
  })
})()

// NOTES: this file ships with `neoabs-boot-guard` marker used by tests.
"use strict"
