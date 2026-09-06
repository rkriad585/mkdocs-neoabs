/**
 * NeoAbs Theme JavaScript
 * Glass + NothingOS Design System
 * Vanilla ES6+ — zero dependencies
 */
;(function () {
  "use strict"

  var NEOABS_VERSION = "9"

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

  // Optional CDN override per component (`theme.neoabs.components.<name>.cdn_url`).
  function cdnUrlFor(name) {
    const comp = _config.components ? _config.components[name] : null
    if (comp && comp.cdn_url) return comp.cdn_url
    return ""
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
    syncHighlightTheme(scheme)
    syncFavicon(scheme)
    if (typeof _mermaidGenericInit === "function") _mermaidGenericInit()
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
        const el = document.createElement("a")
        el.className = "neoabs-search__result"
        el.href = href
        el.setAttribute("role", "option")
        el.id = "neoabs-search-result-" + i

        if (sShowIcon) {
          const icon = document.createElement("div")
          icon.className = "neoabs-search__result-icon"
          icon.innerHTML = RESULT_ICON_SVG
          el.appendChild(icon)
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

        el.appendChild(body)
        list.push(el)
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
          items[activeIndex >= 0 ? activeIndex : 0].click()
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
          backToTop.classList.toggle("neoabs-back-to-top--visible", y > 500)
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
      btn.setAttribute("aria-label", "Back to top")
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
    const base = location.pathname
    let index = 0

    $$(".task-list-item > label > input[type='checkbox']").forEach(function (input, i) {
      index++
      const key = "task." + base + "." + index

      // Re-enable so the user can toggle it.
      input.disabled = false

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
    const tCopy = t.copy || "Copy to clipboard"
    const tCopied = t.copied || "Copied to clipboard"

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
    document.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href^="#"]')
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || href === "#") return
      const target = document.getElementById(decodeURIComponent(href.slice(1)))
      if (!target) return
      e.preventDefault()
      target.scrollIntoView({ behavior: "smooth", block: "start" })
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
    if (tocCfg.permalink === false) {
      document.body.classList.add("neoabs-no-permalink")
    }
    const symbol = tocCfg.permalink_symbol
    if (symbol) {
      $$(".headerlink").forEach((link) => { link.textContent = symbol })
    }
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

  // Built-in action registry for user-defined shortcuts
  // (`theme.neoabs.keyboard.custom`). Feature toggles register their exact
  // handlers here; unknown action names resolve to null and are ignored.
  const keyboardActions = {}

  function toggleReadingMode() {
    return document.body.classList.toggle("neoabs-reading-mode")
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
    return null
  }

  function initKeyboardNav() {
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

      // Escape — Close active overlay (search, drawer, help modal)
      if (kbdEnabled("close") && matchesKeyCombo(e, kbdKey("close", "Escape"))) {
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
      const pageTitle = $(".neoabs-header__page-title")
      if (pageTitle && data.pageTitle) pageTitle.innerHTML = data.pageTitle
    }

    function reinitPageScoped() {
      const inits = [
        initTocTracking, initHighlighting, initMermaid,
        () => initCopyButtons(_navConfig), initTabs, initTaskLists,
        initUIExamples, () => initMath(_navConfig), initNavToggle,
        initPermalinks
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
    _config = config

    if (window.console && console.info) {
      console.info("[neoabs] theme load (assets v" + NEOABS_VERSION + ")")
    }

    // Each initializer is isolated so a failure in an optional feature (e.g. an
    // older browser or missing optional dependency) cannot take down the theme.
    const init = [initTheme, initColorScheme, initMobileNav,
      () => initSearch(config), initTocTracking, initBackToTop,
      initScrollBehavior, initHighlighting, initMermaid,
      () => initCopyButtons(config), initTabs, initTaskLists,
      () => initNotes(config), initAnchorLinks, initPermalinks, initKeyboardNav,
      initNavToggle, initSidebarToggle, initHeaderControls, initUIExamples,
      initCodeFenceLinks,
      () => initMath(config), () => initRepoPopover(config),
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
