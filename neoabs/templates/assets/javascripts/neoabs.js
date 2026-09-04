/**
 * NeoAbs Theme JavaScript
 * Glass + NothingOS Design System
 * Vanilla ES6+ — zero dependencies
 */
;(function () {
  "use strict"

  const $ = (sel, ctx) => (ctx || document).querySelector(sel)
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)]

  const STORAGE_PREFIX = "neoabs-"

  function storageGet(key) {
    try { return localStorage.getItem(STORAGE_PREFIX + key) } catch { return null }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(STORAGE_PREFIX + key, value) } catch {}
  }

  function onReady(fn) {
    if (document.readyState !== "loading") fn()
    else document.addEventListener("DOMContentLoaded", fn)
  }

  // Lazy-load an external script exactly once; onload/onerror are optional.
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
    const s = document.createElement("script")
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
    if (typeof _mermaidGenericInit === "function") _mermaidGenericInit()
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
    const checkbox = document.getElementById("neoabs-search")
    const searchEl = $(".neoabs-search")
    const input = $(".neoabs-search__input")
    const statusEl = $(".neoabs-search__status")
    const listEl = $(".neoabs-search__list")
    const closeBtn = $(".neoabs-search__close")
    if (!checkbox || !searchEl || !input || !statusEl || !listEl) return

    let searchTrigger = null
    let minSearchLength = 2
    let searchReady = false
    let searchWorker = null
    let activeIndex = -1
    let currentResults = []
    let searchToken = 0
    let pendingQuery = 0

    const base = (config && config.base) || "."

    const joinUrl = (b, p) => {
      if (!p) return b
      if (p.charAt(0) === "/") return p
      if (b.length && b.charAt(b.length - 1) === "/") return b + p
      return b + "/" + p
    }

    const showStatus = (msg) => {
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
      statusEl.style.display = "none"
      listEl.style.display = ""
    }

    function buildResults(results) {
      const list = []
      for (let i = 0; i < results.length; i++) {
        const doc = results[i]
        const href = joinUrl(base, doc.location || "")
        const el = document.createElement("a")
        el.className = "neoabs-search__result"
        el.href = href
        el.setAttribute("role", "option")
        el.id = "neoabs-search-result-" + i

        const title = document.createElement("div")
        title.className = "neoabs-search__result-title"
        title.textContent = doc.title || "Untitled"

        const context = document.createElement("div")
        context.className = "neoabs-search__result-context"
        context.textContent = (doc.text || "").slice(0, 180)

        el.appendChild(title)
        el.appendChild(context)
        list.push(el)
      }
      return list
    }

    function renderResults(results) {
      currentResults = results
      listEl.innerHTML = ""
      if (!results.length) {
        showStatus("No results found")
        return
      }
      const items = buildResults(results)
      items.forEach((item, i) => {
        item.addEventListener("click", () => {
          if (searchTrigger && typeof searchTrigger.focus === "function") searchTrigger.focus()
        })
        item.addEventListener("mousemove", () => setActive(i))
        listEl.appendChild(item)
      })
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
      if (!query || query.trim().length < minSearchLength) {
        showStatus("Start typing to search...")
        return
      }
      if (!searchReady || !searchWorker) {
        showStatus("Loading search...")
        return
      }
      pendingQuery = token
      listEl.innerHTML = ""
      listEl.style.display = ""
      statusEl.style.display = "none"
      activeIndex = -1
      currentResults = []
      searchWorker.postMessage({ query: query.trim() })
    }

    searchWorker = new Worker(joinUrl(base, "search/worker.js"))
    searchWorker.onmessage = (e) => {
      const data = e.data
      if (!data) return
      if (data.config) {
        if (typeof data.config.min_search_length === "number") {
          minSearchLength = Math.max(1, data.config.min_search_length - 1)
        }
      } else if (data.allowSearch) {
        searchReady = true
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
      clearTimeout(debounce)
      debounce = setTimeout(() => runSearch(input.value), 150)
    })

    // Keyboard navigation
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActive(activeIndex + 1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActive(activeIndex - 1)
      } else if (e.key === "Enter") {
        const items = $$(".neoabs-search__result", listEl)
        if (activeIndex >= 0 && activeIndex < items.length) {
          e.preventDefault()
          items[activeIndex].click()
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

  function initTocTracking() {
    const tocLinks = $$(".neoabs-toc__link")
    const headings = $$(".neoabs-content h2, .neoabs-content h3, .neoabs-content h4")
    if (!tocLinks.length || !headings.length) return

    const linkMap = {}
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href")
      if (href && href.startsWith("#")) {
        const id = decodeURIComponent(href.slice(1))
        linkMap[id] = link
      }
    })

    let activeLink = null

    function setActive(id) {
      if (!linkMap[id]) return
      if (activeLink === linkMap[id]) return
      tocLinks.forEach((l) => l.classList.remove("neoabs-toc__link--active"))
      linkMap[id].classList.add("neoabs-toc__link--active")
      activeLink = linkMap[id]
      activeLink.scrollIntoView({ block: "nearest", behavior: "auto" })
    }

    function deactivateAll() {
      if (activeLink) {
        tocLinks.forEach((l) => l.classList.remove("neoabs-toc__link--active"))
        activeLink = null
      }
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id)
          })
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      )
      headings.forEach((h) => { if (h.id) observer.observe(h) })

      let ticking = false
      window.addEventListener("scroll", () => {
        if (ticking) return
        ticking = true
        requestAnimationFrame(() => {
          const lastHeading = headings[headings.length - 1]
          if (lastHeading && lastHeading.getBoundingClientRect().bottom < 0) {
            deactivateAll()
          }
          ticking = false
        })
      }, { passive: true })
    }
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
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
          e.preventDefault()
          const dir = e.key === "ArrowRight" ? 1 : -1
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
    if (!document.querySelector(".highlight pre, .codehilite pre, pre.highlight"))
      return

    syncHighlightTheme(
      document.documentElement.getAttribute("data-md-color-scheme") || "slate"
    )

    const src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"
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

    const src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.8/dist/mermaid.min.js"
    ensureScript(src, function () { if (_mermaidGenericInit) _mermaidGenericInit() })
  }

  // ---------------------------------------------------------------------------
  // 12. Code Copy Buttons
  // ---------------------------------------------------------------------------

  function initCopyButtons(config) {
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
  // 11. Keyboard Navigation
  // ---------------------------------------------------------------------------

  let isComposing = false

  function initKeyboardNav() {
    document.addEventListener("compositionstart", () => { isComposing = true })
    document.addEventListener("compositionend", () => { isComposing = false })

    document.addEventListener("keydown", (e) => {
      // Skip during IME composition
      if (isComposing) return

      const tag = (document.activeElement || {}).tagName
      const editable = (document.activeElement || {}).isContentEditable
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable

      if (inInput && e.key !== "Escape") return

      const searchEl = $(".neoabs-search")
      const searchOpen = searchEl && searchEl.classList.contains("neoabs-search--active")
      const drawerCheckbox = document.getElementById("neoabs-drawer")
      const drawerOpen = drawerCheckbox && drawerCheckbox.checked

      if (e.key === "Escape") {
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

      // / — Open search (preventDefault blocks Firefox quick find)
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        if (searchEl && searchEl._neoabsOpen) searchEl._neoabsOpen()
        return
      }

      // ? — Show keyboard shortcuts help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
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

    const combo = (mods, k) => (mods ? mods + " " : "") + k
    const shortcuts = [
      { keys: "/", desc: "Open search" },
      { keys: "Esc", desc: "Close active overlay" },
      { keys: "\u2191 / \u2193", desc: "Navigate search results" },
      { keys: "Enter", desc: "Open selected result" },
      { keys: "\u2190 / \u2192", desc: "Switch tabs (when a tab is focused)" },
      { keys: combo("Ctrl/Cmd+Shift", "N"), desc: "Toggle notes panel" },
      { keys: combo("Ctrl/Cmd+Shift", "B"), desc: "Toggle sidebar" },
      { keys: combo("Ctrl/Cmd+Shift", "T"), desc: "Toggle table of contents" },
      { keys: "?", desc: "Show keyboard shortcuts" },
    ]

    const rows = shortcuts.map((s) =>
      '<div class="neoabs-keyboard-help__row">' +
      '<kbd class="neoabs-keyboard-help__keys">' + s.keys + "</kbd>" +
      '<span class="neoabs-keyboard-help__desc">' + s.desc + "</span>" +
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
      })
    })
  }

  // Toggle the left navigation sidebar via Ctrl/Cmd+Shift+B (persisted).
  function initSidebarToggle() {
    const nav = $(".neoabs-nav") || $(".md-sidebar--primary")
    const toc = $(".neoabs-toc")
    if (!nav) return

    const store = (key) => storageGet("ui-" + key) === "1"
    const save = (key, on) => storageSet("ui-" + key, on ? "1" : "0")

    // Restore persisted sidebar state on load.
    if (store("sidebar")) setBody("nav-hidden", true)
    if (store("toc")) setBody("toc-hidden", true)

    function setBody(cls, on) {
      document.body.classList.toggle("neoabs-" + cls, on)
    }

    function setSidebar(hidden) {
      setBody("nav-hidden", hidden)
      save("sidebar", hidden)
    }

    // Ctrl/Cmd+Shift+B toggles the nav sidebar (persisted).
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault()
        setSidebar(!document.body.classList.contains("neoabs-nav-hidden"))
      }
    })

    // Ctrl/Cmd+Shift+T toggles the "On this page" TOC (persisted).
    if (toc) {
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "t" || e.key === "T")) {
          e.preventDefault()
          const hidden = !document.body.classList.contains("neoabs-toc-hidden")
          setBody("toc-hidden", hidden)
          save("toc", hidden)
        }
      })
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
    if (!notesEnabled(config)) return
    const ttl = notesTtlMs(config)

    notesEnsureUi()

    // Restore any stored highlights (with expiry purging) on load.
    notesReapply(notesReadAll(), ttl)

    // Restore persisted open/closed state.
    if (storageGet("ui-notes") === "1") notesSetOpen(true)

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault()
        notesSetOpen(!_notesOpen)
      }
    })

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

    ensureScript(MATH_CDN_JS, renderMath, function () {
      // Optional retry after a short delay if CDN was slow.
      window.setTimeout(renderMath, 1200)
    })
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  onReady(function () {
    const config = readConfig()

    // Each initializer is isolated so a failure in an optional feature (e.g. an
    // older browser or missing optional dependency) cannot take down the theme.
    const init = [initTheme, initColorScheme, initMobileNav,
      () => initSearch(config), initTocTracking, initBackToTop,
      initScrollBehavior, initHighlighting, initMermaid,
      () => initCopyButtons(config), initTabs, initTaskLists,
      () => initNotes(config), initAnchorLinks, initKeyboardNav,
      initNavToggle, initSidebarToggle, initHeaderControls, initUIExamples,
      () => initMath(config)]
    init.forEach(function (fn) {
      try { fn() } catch (e) { /* keep booting */ }
    })
  })
})()

// NOTES: this file ships with `neoabs-boot-guard` marker used by tests.
"use strict"
