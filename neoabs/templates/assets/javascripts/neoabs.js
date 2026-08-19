/**
 * NeoAbs Theme JavaScript
 * Apple Liquid Glass + NothingOS Design System
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
    const resultsInner = $(".neoabs-search__results-inner")
    const noResults = $(".neoabs-search__no-results")
    const closeBtn = $(".neoabs-search__close")
    if (!checkbox || !searchEl || !input) return

    let activeResultIndex = -1
    let searchIndex = null
    let searchIndexLoaded = false

    const t = (config && config.translations) || {}
    const tSearch = t.search || {}
    const tPlaceholder = tSearch.placeholder || "Search"
    const tNoResults = tSearch.noResults || "No results found"

    input.setAttribute("placeholder", tPlaceholder)

    function openSearch() {
      checkbox.checked = true
      searchEl.classList.add("neoabs-search--active")
      searchEl.setAttribute("aria-hidden", "false")
      document.body.style.overflow = "hidden"
      requestAnimationFrame(() => input.focus())
    }

    function closeSearch() {
      checkbox.checked = false
      searchEl.classList.remove("neoabs-search--active")
      searchEl.setAttribute("aria-hidden", "true")
      document.body.style.overflow = ""
      clearTimeout(searchDebounce)
      input.value = ""
      activeResultIndex = -1
      clearResultHighlight()
      if (resultsInner) resultsInner.innerHTML = ""
      if (noResults) {
        noResults.style.display = ""
        const p = noResults.querySelector("p")
        if (p) p.textContent = "Start typing to search..."
      }
    }

    function clearResultHighlight() {
      $$(".neoabs-search__result--active", searchEl).forEach((el) => {
        el.classList.remove("neoabs-search__result--active")
      })
    }

    function highlightResult(index) {
      const items = $$(".neoabs-search__result", searchEl)
      if (!items.length) return
      clearResultHighlight()
      if (index < 0) index = items.length - 1
      if (index >= items.length) index = 0
      activeResultIndex = index
      items[activeResultIndex].classList.add("neoabs-search__result--active")
      items[activeResultIndex].scrollIntoView({ block: "nearest" })
    }

    function loadSearchIndex() {
      if (searchIndexLoaded) return Promise.resolve(searchIndex)
      const indexPath = (config && config.search) || "search/search_index.json"
      return fetch(indexPath)
        .then((resp) => {
          if (!resp.ok) throw new Error("Search index not found")
          return resp.json()
        })
        .then((data) => { searchIndex = data; searchIndexLoaded = true; return data })
        .catch(() => { searchIndexLoaded = true; searchIndex = null; return null })
    }

    function performSearch(query) {
      if (!query || query.length < 2) {
        if (resultsInner) resultsInner.innerHTML = ""
        if (noResults) {
          noResults.style.display = ""
          const p = noResults.querySelector("p")
          if (p) p.textContent = "Start typing to search..."
        }
        return
      }

      loadSearchIndex().then((index) => {
        if (!index || !index.docs) {
          if (resultsInner) resultsInner.innerHTML = ""
          if (noResults) {
            noResults.style.display = ""
            const p = noResults.querySelector("p")
            if (p) p.textContent = tNoResults
          }
          return
        }

        const q = query.toLowerCase()
        const results = []
        index.docs.forEach((doc) => {
          const title = (doc.title || "").toLowerCase()
          const text = (doc.text || "").toLowerCase()
          if (title.includes(q) || text.includes(q)) results.push(doc)
        })

        if (results.length === 0) {
          if (resultsInner) resultsInner.innerHTML = ""
          if (noResults) {
            noResults.style.display = ""
            const p = noResults.querySelector("p")
            if (p) p.textContent = tNoResults
          }
          return
        }

        if (noResults) noResults.style.display = "none"
        activeResultIndex = -1

        if (resultsInner) {
          resultsInner.innerHTML = results
            .slice(0, 10)
            .map((doc) => {
              let context = doc.text || ""
              const idx = context.toLowerCase().indexOf(q)
              if (idx >= 0) {
                const start = Math.max(0, idx - 40)
                const end = Math.min(context.length, idx + query.length + 60)
                context = (start > 0 ? "..." : "") +
                  escapeHtml(context.slice(start, idx)) +
                  "<mark>" + escapeHtml(context.slice(idx, idx + query.length)) + "</mark>" +
                  escapeHtml(context.slice(idx + query.length, end)) +
                  (end < context.length ? "..." : "")
              } else {
                context = escapeHtml(context.slice(0, 100) + (context.length > 100 ? "..." : ""))
              }

              var href = doc.location ? new URL(doc.location, config && config.base || window.location.origin + "/").href : "#"

              return (
                '<a class="neoabs-search__result" href="' + href + '">' +
                '<div class="neoabs-search__result-title">' + escapeHtml(doc.title || "Untitled") + "</div>" +
                '<div class="neoabs-search__result-context">' + context + "</div>" +
                "</a>"
              )
            })
            .join("")
        }
      })
    }

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

    let searchDebounce = null
    input.addEventListener("input", () => {
      clearTimeout(searchDebounce)
      searchDebounce = setTimeout(() => {
        performSearch(input.value.trim())
      }, 200)
    })

    // Arrow key + Enter navigation in search results
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        highlightResult(activeResultIndex + 1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        highlightResult(activeResultIndex - 1)
      } else if (e.key === "Enter") {
        e.preventDefault()
        const items = $$(".neoabs-search__result", searchEl)
        if (activeResultIndex >= 0 && activeResultIndex < items.length) {
          // The result item IS the <a> element — click it directly
          items[activeResultIndex].click()
        }
      }
    })

    searchEl._neoabsOpen = openSearch
    searchEl._neoabsClose = closeSearch
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
      activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" })
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
  // 9. Code Copy Buttons
  // ---------------------------------------------------------------------------

  function initCopyButtons(config) {
    const t = (config && config.translations && config.translations.clipboard) || {}
    const tCopy = t.copy || "Copy to clipboard"
    const tCopied = t.copied || "Copied to clipboard"

    const blocks = $$(".highlight pre")
    blocks.forEach((pre) => {
      if (pre.closest(".neoabs-code")) return
      if (pre.querySelector(".neoabs-code__copy")) return

      const wrapper = pre.parentNode
      if (!wrapper) return

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

    const shortcuts = [
      { keys: "/", desc: "Open search" },
      { keys: "Esc", desc: "Close active overlay" },
      { keys: "\u2191 / \u2193", desc: "Navigate search results" },
      { keys: "Enter", desc: "Open selected result" },
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

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  onReady(function () {
    const config = readConfig()

    initTheme()
    initColorScheme()
    initMobileNav()
    initSearch(config)
    initTocTracking()
    initBackToTop()
    initScrollBehavior()
    initCopyButtons(config)
    initAnchorLinks()
    initKeyboardNav()
    initNavToggle()
  })
})()
