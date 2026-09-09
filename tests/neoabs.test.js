/**
 * NeoAbs JS smoke test.
 *
 * Stubs a minimal DOM/browser environment and loads the theme's neoabs.js IIFE
 * to verify the boot sequence (all init* functions) runs without throwing. It
 * also exercises:
 *   1. Browser-local notes storage (TTL purge)
 *   2. Phase 3 shared search deep links (?q= auto-open + per-result copy link)
 *
 * Run:  node tests/neoabs.test.js
 */
"use strict"

const fs = require("fs")
const path = require("path")

// ---- Tiny DOM element stub -------------------------------------------------
function makeNode() {
  const el = {
    _children: [],
    _attrs: {},
    _classes: new Set(),
    style: {},
    dataset: {},
    childNodes: [],
    parentNode: null,
    parentElement: null,
    textContent: "",
    id: "",
    className: "",
    disabled: false,
    checked: false,
    type: "",
    listeners: {},
    value: "",
    setAttribute(attr, val) { this._attrs[attr] = String(val) },
    getAttribute(attr) { return this._attrs[attr] },
    hasAttribute(attr) { return attr in this._attrs },
    removeAttribute(attr) { delete this._attrs[attr] },
    classList: {
      _c: new Set(),
      toggle(c, force) { const on = force !== undefined ? !!force : !this._c.has(c); on ? this._c.add(c) : this._c.delete(c); return on },
      add(c) { this._c.add(c) },
      remove(c) { this._c.delete(c) },
      contains(c) { return this._c.has(c) },
    },
    closest(sel) {
      if (sel.includes("input:checked")) return null
      return null
    },
    contains(node) {
      let cursor = node
      while (cursor) {
        if (cursor === this) return true
        cursor = cursor.parentNode
      }
      return false
    },
    appendChild(child) {
      if (!child) return child
      child.parentNode = this
      child.parentElement = this
      this._children.push(child)
      this.childNodes.push(child)
      return child
    },
    removeChild(child) {
      this._children = this._children.filter((c) => c !== child)
      this.childNodes = this.childNodes.filter((c) => c !== child)
      return child
    },
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this)
    },
    insertBefore(child, ref) {
      if (!child) return child
      child.parentNode = this
      child.parentElement = this
      this._children.push(child)
      this.childNodes.push(child)
      return child
    },
    addEventListener(type, fn) {
      this.listeners[type] = this.listeners[type] || []
      this.listeners[type].push(fn)
    },
    focus() {},
    scrollIntoView() {},
    setProperty() {},
    select() {},
    querySelector(sel) {
      // Make neoabsToast functional in the harness: a freshly created toast
      // container gets a querySelector that hands back its message span.
      if (sel === ".neoabs-toast__msg") {
        if (!this._toastMsg) this._toastMsg = makeNode()
        return this._toastMsg
      }
      return null
    },
  }
  return el
}

// ---- DOM / window stubs ----------------------------------------------------
const body = makeNode()
body.textContent = ""

function searchDomFixture() {
  const p = makeNode()
  p.tagName = "P"
  const status = makeNode()
  status.querySelector = (sel) => (sel === "p" ? p : null)
  const list = makeNode()
  list.querySelector = () => null
  const input = makeNode()
  input.tagName = "INPUT"
  const searchEl = makeNode()
  searchEl.querySelector = (sel) => {
    if (sel === ".neoabs-search__status") return status
    if (sel === ".neoabs-search__list") return list
    if (sel === ".neoabs-search__input") return input
    return null
  }
  const checkbox = makeNode()
  checkbox.id = "neoabs-search"
  checkbox.type = "checkbox"
  const closeBtn = makeNode()
  return { checkbox, searchEl, input, status, list, closeBtn }
}

let _searchDom = null

// Phase 5: lightbox — images the harness injects for the zoom test.
let _zoomImgs = []
let _zoomOverlayMode = false
function zoomImageFixture() {
  const img = makeNode()
  img.tagName = "IMG"
  img.src = "https://x/img.png"
  img.alt = "fixture"
  img.tabIndex = -1
  return img
}
function zoomOverlayNode() {
  const ov = makeNode()
  const view = makeNode(); view.tagName = "IMG"
  const stage = makeNode()
  const caption = makeNode()
  const state = makeNode(); state.textContent = "100%"
  const close = makeNode(); close.tagName = "BUTTON"
  const prev = makeNode(); prev.tagName = "BUTTON"; prev.disabled = true
  const next = makeNode(); next.tagName = "BUTTON"; next.disabled = true
  const zoomin = makeNode(); zoomin.tagName = "BUTTON"
  const zoomout = makeNode(); zoomout.tagName = "BUTTON"
  const copyBtn = makeNode(); copyBtn.tagName = "BUTTON"; copyBtn.innerHTML = "\u29c9"
  const download = makeNode(); download.tagName = "BUTTON"
  ov.querySelector = (sel) => {
    if (sel === "img" || sel === ".neoabs-zoom__img") return view
    if (sel === ".neoabs-zoom__stage") return stage
    if (sel === ".neoabs-zoom__caption") return caption
    if (sel === ".neoabs-zoom__close") return close
    if (sel === ".neoabs-zoom__prev") return prev
    if (sel === ".neoabs-zoom__next") return next
    if (sel === ".neoabs-zoom__zoomin") return zoomin
    if (sel === ".neoabs-zoom__zoomout") return zoomout
    if (sel === ".neoabs-zoom__copy") return copyBtn
    if (sel === ".neoabs-zoom__download") return download
    if (sel === ".neoabs-zoom__state") return state
    return null
  }
  return ov
}

// Phase 21: config builder fixture. The dialog host, its inner containers, the
// schema script node, the TOC (for the pinned-trigger / hidden check) and a
// minimal action-cluster menu so the mirror can be asserted too.
function configBuilderFixture() {
  const dialog = makeNode()
  const groups = makeNode()
  const presets = makeNode()
  const preview = makeNode()
  const shell = makeNode()
  const close = makeNode()
  const copy = makeNode()
  const download = makeNode()
  const trigger = makeNode()
  const schema = makeNode()
  schema.textContent = JSON.stringify(phase21Schema())
  dialog.querySelector = (sel) => {
    if (sel === "[data-md-neoabs-config-builder-groups]") return groups
    if (sel === "[data-md-neoabs-config-builder-presets]") return presets
    if (sel === ".neoabs-config-builder__yaml") return preview
    if (sel === "[data-md-neoabs-config-builder-shell]") return shell
    if (sel === ".neoabs-config-builder__close") return close
    if (sel === ".neoabs-config-builder__copy") return copy
    if (sel === ".neoabs-config-builder__download") return download
    return null
  }
  dialog.querySelectorAll = () => []
  const toc = makeNode()
  toc.tagName = "ASIDE"
  const cluster = makeNode()
  const menu = makeNode()
  cluster.querySelector = (sel) => (sel === ".neoabs-action-cluster__menu" ? menu : null)
  return { dialog, groups, presets, preview, shell, close, copy, download, trigger, triggers: [trigger], schema, toc, cluster, menu }
}

function phase21Schema() {
  return [
    {
      group: "basics",
      title: "Site basics",
      questions: [
        { id: "site_name", label: "Site name", path: "site_name", type: "text", default: "", recommended: "My Docs" },
        { id: "glass", label: "Glass", path: "theme.neoabs.glass", type: "select", default: "medium",
          options: [{ value: "none", label: "None" }, { value: "medium", label: "Frosted", recommended: true }] },
        { id: "c_toc", label: "TOC", path: "theme.neoabs.components.toc.show", type: "toggle", default: true, recommended: true },
        { id: "f_nav_top", label: "Top nav", path: "features.navigation.top", type: "checkbox", default: false, recommended: false },
      ],
    },
  ]
}

const documentStub = {
  readyState: "complete",
  body,
  documentElement: makeNode(),
  head: makeNode(),
  title: "",
  _els: [],
  createElement(tag) {
    const n = makeNode()
    n.tagName = tag
    if (tag === "div" && _zoomOverlayMode) {
      // Phase 5 lightbox: every div created while the overlay is active gets
      // the overlay's sub-query support so bindOverlay can wire up controls.
      return zoomOverlayNode()
    }
    if (tag === "a") {
      // Browser-accurate <a>.href: store the raw value but resolve it against
      // the current document location (hash stripped) when read. Without this,
      // the share handler would read back "./guide/index.html" and the
      // assertion that the "."/fragment bugs are gone would be meaningless.
      let _href = ""
      Object.defineProperty(n, "href", {
        configurable: true,
        get() {
          const raw = _href
          const baseHref = String((globalThis.location && globalThis.location.href) || "").replace(/#.*$/, "")
          if (!baseHref) return raw
          try { return new __RealURL(raw, baseHref).href }
          catch (_e) { return raw }
        },
        set(v) { _href = String(v) },
      })
    }
    return n
  },
  createTextNode(txt) { const n = makeNode(); n.textContent = txt; return n },
  createDocumentFragment() { return makeNode() },
  createTreeWalker() {
    return { nextNode: () => null }
  },
  querySelector(sel) {
    if (_searchDom) {
      if (sel === ".neoabs-search") return _searchDom.searchEl
      if (sel === ".neoabs-search__input") return _searchDom.input
      if (sel === ".neoabs-search__status") return _searchDom.status
      if (sel === ".neoabs-search__list") return _searchDom.list
      if (sel === ".neoabs-search__close") return _searchDom.closeBtn
    }
    if (_repoFixture && sel === ".neoabs-header__repo") return _repoFixture.link
    if (_configBuilderDom) {
      if (sel === ".neoabs-config-builder") return _configBuilderDom.dialog
      if (sel === ".neoabs-toc") return _configBuilderDom.toc
      if (sel === ".neoabs-action-cluster") return _configBuilderDom.cluster
    }
    if (sel === "article .neoabs-typeset") return _typesetNode
    return null
  },
  querySelectorAll(sel) {
    if (sel === "article .neoabs-typeset img") return _zoomImgs
    if (sel === "img[data-md-scheme-dark][data-md-scheme-light]") return _schemeImgs
    if (_configBuilderDom && sel === "[data-md-neoabs-config-builder-open]") {
      return _configBuilderDom.triggers ? _configBuilderDom.triggers.slice() : []
    }
    return []
  },
  getElementById(id) {
    if (id === "__config") return _configEl
    if (_configBuilderDom && id === "neoabs-config-builder-schema") return _configBuilderDom.schema
    if (_searchDom && id === "neoabs-search") return _searchDom.checkbox
    if (id === "neoabs-search-share") return null
    return null
  },
  addEventListener(type, fn) { this._handlers = this._handlers || {}; (this._handlers[type] = this._handlers[type] || []).push(fn) },
  removeEventListener() {},
  get activeElement() { return null },
  getSelection() { return { toString: () => "", removeAllRanges: () => {} } },
  get elementById() { return null },
}

let stored = {}
const storageStub = {
  getItem(key) { return key in stored ? stored[key] : null },
  setItem(key, val) { stored[key] = String(val) },
  removeItem(key) { delete stored[key] },
}

const windowStub = {
  addEventListener(type, fn) { this._handlers = this._handlers || {}; (this._handlers[type] = this._handlers[type] || []).push(fn) },
  removeEventListener() {},
  innerWidth: 1024,
  innerHeight: 768,
  location: { hostname: "x", href: "https://x/", pathname: "/" },
  _scriptsLoaded: [],
  _opened: [],
  open(url, name, features) { this._opened.push({ url: String(url), name: String(name), features: features || "" }) },
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  getSelection() { return { toString: () => "", removeAllRanges: () => {}, anchorNode: null } },
  setTimeout() { return 0 },
  clearTimeout() {},
}

let _configEl = null
let _typesetNode = null
let _repoFixture = null
let _schemeImgs = []
let _configBuilderDom = null

// Capture Node's real WHATWG URL before it is stubbed away, so "<a>.href" in the
// harness can resolve relative paths the way a real browser does.
const __RealURL = globalThis.URL

globalThis.document = documentStub
globalThis.window = windowStub
globalThis.localStorage = storageStub
globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 }
globalThis.URL = { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }
globalThis.getComputedStyle = () => ({ position: "static" })
globalThis.requestAnimationFrame = (cb) => { cb(); return 0 }
globalThis.cancelAnimationFrame = () => {}
globalThis.Blob = class Blob { constructor(text, opts) { this.text = text; this.opts = opts } }

// Phase 3: Worker shim so initSearch creates the search worker without throwing.
globalThis.Worker = class Worker {
  constructor(url) { this.url = url; this.onmessage = null; this._ready = false }
  postMessage(msg) {
    if (msg.init) {
      this._ready = true
      // Simulate the built-in search plugin telling the theme the worker is ready.
      if (this.onmessage) this.onmessage({ data: { allowSearch: true } })
    }
    if (msg.query && this.onmessage) {
      // Return a tiny fixture result so buildResults / share button is reachable.
      // The first hit carries a #fragment so we can prove the share URL strips it
      // before appending ?q= (a "...#frag?q=" deep link is silently lost).
      this.onmessage({ data: {
        results: [
          { location: "guide/index.html#tokens", title: "Guide", text: "Getting started guide for tokens and setup." },
          { location: "search/index.html", title: "Search", text: "Full-text search over the documentation." },
        ]
      }})
    }
  }
  terminate() {}
}

// Phase 3: navigator.clipboard shim so share-button writeText can be asserted.
let clipboardCaptured = ""
const navigatorStub = { clipboard: { writeText: (text) => { clipboardCaptured = text; return Promise.resolve() } } }
try {
  Object.defineProperty(globalThis, "navigator", {
    value: navigatorStub,
    configurable: true,
    writable: true,
    enumerable: true
  })
} catch (_e) {
  if (!globalThis.navigator) globalThis.navigator = {}
  globalThis.navigator.clipboard = navigatorStub.clipboard
}

const code = fs.readFileSync(
  path.join(__dirname, "..", "neoabs", "templates", "assets", "javascripts", "neoabs.js"),
  "utf-8"
)

// ---- Helpers ----------------------------------------------------------------
function bootIIFE(overrides) {
  overrides = overrides || {}
  if (overrides.location) globalThis.location = overrides.location
  if (overrides.config) {
    _configEl = makeNode()
    _configEl.textContent = JSON.stringify(overrides.config)
  } else {
    _configEl = null
  }
  _configBuilderDom = overrides.configBuilder || null
  _searchDom = overrides.searchDom || null
  if (overrides.stored !== undefined) stored = overrides.stored
  if (overrides.clipboard !== undefined) clipboardCaptured = overrides.clipboard

  try {
    new Function(
      "document", "window", "localStorage", "location", "Node",
      "URL", "getComputedStyle", "Blob", "requestAnimationFrame", "Worker", "navigator",
      code
    )(
      documentStub, windowStub, storageStub, globalThis.location, globalThis.Node,
      globalThis.URL, globalThis.getComputedStyle, globalThis.Blob,
      globalThis.requestAnimationFrame, globalThis.Worker, navigatorStub
    )
    return true
  } catch (e) {
    console.error("BOOT THREW:", e.message)
    return false
  }
}

// ---- Assertions -------------------------------------------------------------
let failures = 0
let checks = 0
function check(name, cond) {
  checks++
  if (cond) console.log("PASS  " + name)
  else { console.error("FAIL  " + name); failures++ }
}

// ============================================================================
// Test 1: IIFE boot completes without throwing (null search DOM, no config)
// ============================================================================
const boot1 = bootIIFE({ stored: {}, config: null, searchDom: null, location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" } })
check("IIFE boot completes without throwing", boot1)

// ============================================================================
// Test 2 + 3: Notes TTL purge (unchanged from original harness)
// ============================================================================
const now = Date.now()

// Expired note should be purged after boot.
const expiredBoot = bootIIFE({
  stored: { "neoabs-notes": JSON.stringify([{ id: "expired", url: "/page/", ts: now - 31536000000 }]) },
  config: null,
  searchDom: null,
})
let expiredPurged = true
try { expiredPurged = JSON.parse(storageStub.getItem("neoabs-notes")).length === 0 }
catch { expiredPurged = false }
check("expired (1-year-old) note purged after 3-day TTL on load", expiredPurged)

// Fresh note survives the purge.
const freshBoot = bootIIFE({
  stored: { "neoabs-notes": JSON.stringify([{ id: "fresh", url: "/page/", ts: now }]) },
  config: null,
  searchDom: null,
})
let freshKept = false
try { freshKept = JSON.parse(storageStub.getItem("neoabs-notes")).length === 1 }
catch {}
check("fresh note retained after TTL purge", freshKept)

// ============================================================================
// Test 4: Shared search deep link (?q=) re-opens search with the query
// ============================================================================
const dlDom = searchDomFixture()
const dlBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/docs/getting-started/", search: "?q=tokens", href: "https://x/docs/getting-started/?q=tokens", hash: "" },
  config: {
    base: "/docs/",
    neoabs_search: { enabled: true, min_chars: 2 },
    translations: { clipboard: { copy: "Copy link", copied: "Copied" } },
    components: {},
    content: {},
  },
  searchDom: dlDom,
  stored: {},
})

check(
  "?q= deep link auto-opens search with the query pre-filled",
  dlBoot &&
    dlDom.checkbox.checked === true &&
    dlDom.input.value === "tokens" &&
    dlDom.searchEl.classList.contains("neoabs-search--active")
)

// ============================================================================
// Test 5: Per-result share button writes a correct deep-link URL
// ============================================================================
// The auto-open above triggers runSearch; the Worker shim fires results which
// render two rows in the list. Find the share button and click it.
const shareRows = dlDom.list._children
const firstRow = shareRows[0] || null
const firstChild = firstRow && firstRow._children[1] || null
const firstShare = firstChild && String(firstChild.tagName).toUpperCase() === "BUTTON"
  ? firstChild
  : null

// Reset clipboard before clicking.
clipboardCaptured = ""

if (firstShare && Array.isArray(firstShare.listeners.click)) {
  firstShare.listeners.click.forEach((fn) => fn({ preventDefault() {}, stopPropagation() {} }))
}

check(
  "copy link writes the exact resolved deep-link URL (no stale dot, no #fragment)",
  typeof clipboardCaptured === "string" &&
    clipboardCaptured === "https://x/docs/guide/index.html?q=tokens"
)

check(
  "copy link keeps ?q= after the path and drops any #fragment",
  typeof clipboardCaptured === "string" &&
    clipboardCaptured.indexOf("#") === -1 &&
    clipboardCaptured.indexOf("?q=tokens") === clipboardCaptured.length - 9
)

// ============================================================================
// Test 6: config `result.show_share: false` hides the per-result share button
// ============================================================================
const noShareDom = searchDomFixture()
const noShareBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/docs/getting-started/", search: "?q=tokens", href: "https://x/docs/getting-started/?q=tokens", hash: "" },
  config: {
    base: "/docs/",
    neoabs_search: { enabled: true, min_chars: 2, result: { show_share: false } },
    translations: { clipboard: { copy: "Copy link", copied: "Copied" } },
    components: {},
    content: {},
  },
  searchDom: noShareDom,
  stored: {},
})

const noShareRow = noShareDom.list._children[0] || null
const noShareChildren = (noShareRow && noShareRow._children) || []
const noShareHasButton = noShareChildren.some(
  (c) => c && String(c.tagName).toUpperCase() === "BUTTON"
)

check(
  "result.show_share: false hides the per-result share button",
  noShareBoot &&
    noShareChildren.length === 1 &&
    noShareChildren[0].className === "neoabs-search__result-link" &&
    !noShareHasButton
)

// ============================================================================
// Test 7: vanilla image lightbox opens an overlay on click
// ============================================================================
const img1 = zoomImageFixture()
const img2 = zoomImageFixture()
_zoomImgs = [img1, img2]
_zoomOverlayMode = true
body._children = []
body.childNodes = []
windowStub._handlers = {}

const zoomBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: {
    base: "/",
    components: {},
    content: {},
    neoabs_search: { enabled: false },
    translations: {},
  },
  searchDom: null,
  stored: {},
})
_zoomOverlayMode = true // overlay is created on click, so stay in zoom mode

let zoomOpened = false
if (zoomBoot && Array.isArray(img1.listeners.click)) {
  const beforeCount = body._children.length
  img1.listeners.click.forEach((fn) => fn({ preventDefault() {}, currentTarget: null }))
  const afterCount = body._children.length
  const zoomOverlay = body._children[body._children.length - 1] || null
  zoomOpened = afterCount === beforeCount + 1 &&
    !!zoomOverlay &&
    zoomOverlay.className === "neoabs-zoom" &&
    body.classList.contains("neoabs-zoom--open") &&
    (windowStub._handlers.keydown || []).length > 0
}
_zoomOverlayMode = false
check("image lightbox opens an overlay on image click", zoomOpened)

// Test 7b: image lightbox can be turned off via content.typography.image_lightbox.
const offImg = zoomImageFixture()
_zoomImgs = [offImg]
body._children = []
body.childNodes = []
windowStub._handlers = {}

const offBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: {
    base: "/",
    components: {},
    content: { typography: { image_lightbox: false } },
    neoabs_search: { enabled: false },
    translations: {},
  },
  searchDom: null,
  stored: {},
})
const offClicks = Array.isArray(offImg.listeners.click) ? offImg.listeners.click.length : 0
const lightboxDisabled = offBoot && offImg.getAttribute("role") !== "button" && offClicks === 0
check("image lightbox is disabled when contentType typography.image_lightbox is false", lightboxDisabled)

// ============================================================================
// Test 8: lightbox navigation, zoom, copy — and close still works after a
// navigation (a stale-overlay stacking bug used to orphan the close button).
// ============================================================================
const navImg1 = zoomImageFixture()
const navImg2 = zoomImageFixture()
_zoomImgs = [navImg1, navImg2]
body._children = []
body.childNodes = []
body.classList._c = new Set()
windowStub._handlers = {}

const navBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: { base: "/", components: {}, content: {}, neoabs_search: { enabled: false }, translations: {} },
  searchDom: null,
  stored: {},
})
_zoomOverlayMode = true // new overlay-node mocks are created as the user interacts

let navArrows = false
let navZoom = false
let navCopy = false
let navClose = false
let navHasClose = false
if (navBoot && Array.isArray(navImg1.listeners.click)) {
  navImg1.listeners.click.forEach((fn) => fn({ preventDefault() {}, currentTarget: null }))
  const overlay = body._children[body._children.length - 1] || null
  const cap = overlay ? overlay.querySelector(".neoabs-zoom__caption") : null

  // 1. Arrow right navigates to the second image (caption "2 / 2").
  const keyFns = (windowStub._handlers.keydown || []).slice()
  const arrow = keyFns[keyFns.length - 1]
  if (arrow) arrow({ key: "ArrowRight", preventDefault() {} })
  navArrows = cap ? cap.textContent === "2 / 2" : false

  // 2. Zoom-in button scales the image (1x -> 1.25x).
  const state = overlay ? overlay.querySelector(".neoabs-zoom__state") : null
  const zoomin = overlay ? overlay.querySelector(".neoabs-zoom__zoomin") : null
  if (zoomin && Array.isArray(zoomin.listeners.click)) {
    zoomin.listeners.click.forEach((fn) => fn({ preventDefault() {}, stopPropagation() {} }))
  }
  navZoom = state ? state.textContent === "125%" : false

  // 3. Copy button falls back to copying the image URL (no ClipboardItem).
  clipboardCaptured = ""
  const copyBtn = overlay ? overlay.querySelector(".neoabs-zoom__copy") : null
  if (copyBtn && Array.isArray(copyBtn.listeners.click)) {
    copyBtn.listeners.click.forEach((fn) => fn({ preventDefault() {}, stopPropagation() {} }))
  }
  navCopy = clipboardCaptured === "https://x/img.png"

  // 4. Close still works after navigating (and removes every overlay layer).
  const closeBtn = overlay ? overlay.querySelector(".neoabs-zoom__close") : null
  if (closeBtn && Array.isArray(closeBtn.listeners.click)) {
    closeBtn.listeners.click.forEach((fn) => fn({ preventDefault() {}, stopPropagation() {} }))
  }
  const leftovers = body._children.filter((c) => c.className === "neoabs-zoom")
  navClose = leftovers.length === 0 && !body.classList.contains("neoabs-zoom--open")

  // 5. The close button must be an actual child of the overlay — a null
  // querySelector here used to crash `bindOverlay` before the overlay could
  // attach to the document, so no lightbox ever appeared on click.
  navHasClose = Array.isArray(overlay && overlay._children) &&
    overlay._children.some((c) => String(c.className || "").split(" ").includes("neoabs-zoom__close"))
}
_zoomOverlayMode = false
check("image lightbox navigates, zooms, copies, and stays closable after navigation", navArrows && navZoom && navCopy && navClose && navHasClose)

// ============================================================================
// Phase 6: feedback widget opens a prefilled GitHub issue (no tracking)
// ============================================================================
function resetPhase6() {
  _typesetNode = makeNode()
  documentStub.head = makeNode()
  windowStub._opened = []
  body._children = []
  body.childNodes = []
  body._classes = new Set()
  documentStub.title = "Feedback Test Page"
}

const phase6BaseConfig = (extra) => Object.assign({
  base: "/",
  repo_url: "https://github.com/neoabs/mkdocs-docs",
  components: {},
  content: {},
  neoabs_search: { enabled: false },
  translations: {},
  feedback: { enabled: true, show: true },
  announcement_bar: { enabled: true, show: true, text: "", dismissable: true },
  cookie_consent: { enabled: true, show: true },
  comments: { enabled: true, provider: "giscus", repo: "", repo_id: "" },
  consent_needed: false,
}, extra)

// Depth-first search for the first descendant whose className contains a token
// (the Phase 6 widgets nest their buttons in ".neoabs-feedback__actions" /
// ".neoabs-consent__actions", so a shallow scan of the widget's children misses
// them).
function findClass(root, token) {
  if (!root) return null
  if (String(root.className).indexOf(token) !== -1) return root
  const kids = root._children || []
  for (let i = 0; i < kids.length; i++) {
    const hit = findClass(kids[i], token)
    if (hit) return hit
  }
  return null
}

resetPhase6()
const fbBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    feedback: { enabled: true, show: true, title: "Was this page helpful?", positive: "Yes!", negative: "No!", github_labels: ["feedback", "docs"] },
  }),
  searchDom: null,
  stored: {},
})

const feedbackWidget = fbBoot
  ? (_typesetNode._children || []).find((c) => String(c.className).indexOf("neoabs-feedback") !== -1)
  : null
const yesBtn = findClass(feedbackWidget, "neoabs-feedback__btn--yes")
check("feedback widget renders under the article when enabled + repo_url", fbBoot && !!feedbackWidget && !!yesBtn)

if (yesBtn && Array.isArray(yesBtn.listeners.click)) {
  yesBtn.listeners.click.forEach((fn) => fn({ preventDefault() {} }))
}
const openedIssue = (windowStub._opened[0] || {}).url || ""
check(
  "feedback Yes opens a prefilled /issues/new URL with labels + title + body",
  fbBoot &&
    openedIssue.indexOf("/issues/new?labels=") !== -1 &&
    openedIssue.indexOf("feedback,docs") !== -1 &&
    decodeURIComponent(openedIssue).indexOf("Feedback: Feedback Test Page") !== -1 &&
    decodeURIComponent(openedIssue).indexOf("Positive feedback") !== -1 &&
    openedIssue !== ""
)

resetPhase6()
const fbHiddenBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({ feedback: { enabled: false, show: true } }),
  searchDom: null,
  stored: {},
})
check(
  "feedback widget is hidden when enabled: false",
  fbHiddenBoot && (_typesetNode._children || []).length === 0
)

// ============================================================================
// Phase 6: announcement bar renders, dismisses, and remembers
// ============================================================================
const announceText = "New in v0.2 — glass components!"
resetPhase6()
const annBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({ announcement_bar: { enabled: true, show: true, text: announceText, dismissable: true } }),
  searchDom: null,
  stored: {},
})
const annBar = annBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-announcement") !== -1)
  : null
const annClose = findClass(annBar, "neoabs-announcement__close")
const annKey = "announcement-dismissed-" + encodeURIComponent(announceText).slice(0, 80)
check("announcement bar renders (bottom-fixed) when text is set", annBoot && !!annBar)

resetPhase6()
const dismissBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({ announcement_bar: { enabled: true, show: true, text: announceText, dismissable: true } }),
  searchDom: null,
  stored: {},
})
const dismissBar = dismissBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-announcement") !== -1)
  : null
const dismissClose = findClass(dismissBar, "neoabs-announcement__close")
if (dismissClose && Array.isArray(dismissClose.listeners.click)) {
  dismissClose.listeners.click.forEach((fn) => fn({}))
}
check(
  "announcement dismiss persists a storage key and removes the bar",
  dismissBoot &&
    storageStub.getItem("neoabs-" + annKey) === "1" &&
    !(body._children || []).some((c) => String(c.className).indexOf("neoabs-announcement") !== -1)
)

resetPhase6()
const annBoot2 = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({ announcement_bar: { enabled: true, show: true, text: announceText, dismissable: true } }),
  searchDom: null,
  stored: { ["neoabs-" + annKey]: "1" },
})
check(
  "already-dismissed announcement is not rendered again",
  annBoot2 && !(body._children || []).some((c) => String(c.className).indexOf("neoabs-announcement") !== -1)
)

// ============================================================================
// Phase 6: floating position variants (top/right/bottom/left/center popup)
// ============================================================================
resetPhase6()
const topBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    announcement_bar: { enabled: true, show: true, text: announceText, dismissable: true, position: "top" },
  }),
  searchDom: null,
  stored: {},
})
const topBar = topBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-announcement--top") !== -1)
  : null
check(
  "announcement position top renders a floating --top card without a backdrop",
  topBoot && !!topBar &&
    !(body._children || []).some((c) => String(c.className).indexOf("neoabs-popup-backdrop") !== -1)
)

resetPhase6()
const popupBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    announcement_bar: { enabled: true, show: true, text: announceText, dismissable: true, position: "center" },
    cookie_consent: { enabled: true, show: true, message: "Opt in?", accept_label: "Accept", decline_label: "Decline", position: "center" },
    consent_needed: true,
  }),
  searchDom: null,
  stored: {},
})
const popupBar = popupBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-announcement--center") !== -1)
  : null
const popupPanel = popupBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-consent--center") !== -1)
  : null
const backdropCount = (popupBoot ? (body._children || []) : [])
  .filter((c) => String(c.className).indexOf("neoabs-popup-backdrop") !== -1)
  .length
check(
  "announcement + consent render as centered popups with a backdrop each",
  popupBoot && !!popupBar && !!popupPanel && backdropCount === 2
)

const popupClose = findClass(popupBar, "neoabs-announcement__close")
if (popupClose && Array.isArray(popupClose.listeners.click)) {
  popupClose.listeners.click.forEach((fn) => fn({}))
}
check(
  "closing the centered announcement also removes its backdrop",
  popupBoot && (body._children || []).filter((c) => String(c.className).indexOf("neoabs-popup-backdrop") !== -1).length === 1
)

const popupAccept = findClass(popupPanel, "neoabs-consent__accept")
if (popupAccept && Array.isArray(popupAccept.listeners.click)) {
  popupAccept.listeners.click.forEach((fn) => fn({}))
}
check(
  "accepting the centered consent popup removes its backdrop too",
  popupBoot && !(body._children || []).some((c) => String(c.className).indexOf("neoabs-popup-backdrop") !== -1)
)

// ============================================================================
// Phase 6: cookie consent — privacy-first, gated on a real integration
// ============================================================================
resetPhase6()
const noConsentBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({ cookie_consent: { enabled: true, show: true }, consent_needed: false }),
  searchDom: null,
  stored: {},
})
check(
  "consent banner is absent when no integration is configured (consent_needed: false)",
  noConsentBoot && !(body._children || []).some((c) => String(c.className).indexOf("neoabs-consent") !== -1)
)

resetPhase6()
const consentBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    cookie_consent: { enabled: true, show: true, message: "Opt in?", accept_label: "Accept", decline_label: "Decline" },
    consent_needed: true,
  }),
  searchDom: null,
  stored: {},
})
const consentPanel = consentBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-consent") !== -1)
  : null
const consentAccept = findClass(consentPanel, "neoabs-consent__accept")
check("consent banner renders when an integration is configured", consentBoot && !!consentPanel && !!consentAccept)

if (consentAccept && Array.isArray(consentAccept.listeners.click)) {
  consentAccept.listeners.click.forEach((fn) => fn({}))
}
check(
  "accept persists the consent flag and removes the banner",
  consentBoot && storageStub.getItem("neoabs-consent") === "accepted"
)

resetPhase6()
const consentDeclineBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    cookie_consent: { enabled: true, show: true, message: "Opt in?", accept_label: "Accept", decline_label: "Decline" },
    consent_needed: true,
  }),
  searchDom: null,
  stored: {},
})
const consentPanel2 = consentDeclineBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-consent") !== -1)
  : null
const consentDecline = findClass(consentPanel2, "neoabs-consent__decline")
if (consentDecline && Array.isArray(consentDecline.listeners.click)) {
  consentDecline.listeners.click.forEach((fn) => fn({}))
}
check(
  "decline persists the consent flag",
  consentDeclineBoot && storageStub.getItem("neoabs-consent") === "declined"
)

// ============================================================================
// Phase 6: giscus comments — configured repo loads the loader script
// ============================================================================
resetPhase6()
const giscusBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    comments: { enabled: true, provider: "giscus", repo: "neoabs/mkdocs-docs", repo_id: "R_kg", category: "Announcements", category_id: "DIC_1", mapping: "pathname", theme: { light: "light", dark: "dark" } },
    consent_needed: false,
  }),
  searchDom: null,
  stored: {},
})
const giscusScript = giscusBoot
  ? (documentStub.head._children || []).find((c) => c.dataset && c.dataset.giscus === "loaded")
  : null
const giscusBox = findClass(_typesetNode, "neoabs-giscus")
check(
  "giscus loader script is injected when repo + repo_id are configured",
  giscusBoot && !!giscusScript && !!giscusBox &&
    giscusScript.src === "https://giscus.app/client.js" &&
    giscusScript.dataset.repo === "neoabs/mkdocs-docs" &&
    giscusScript.dataset.repoId === "R_kg" &&
    giscusScript.dataset.category === "Announcements" &&
    giscusScript.dataset.mapping === "pathname"
)

// ============================================================================
// Phase 6: giscus defers behind consent when an integration serves
// ============================================================================
resetPhase6()
const giscusDeferredBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: phase6BaseConfig({
    comments: { enabled: true, provider: "giscus", repo: "neoabs/mkdocs-docs", repo_id: "R_kg", category: "Announcements", category_id: "DIC_1", mapping: "pathname" },
    consent_needed: true,
  }),
  searchDom: null,
  stored: {},
})
const deferredScriptBefore = (documentStub.head._children || []).find((c) => c.dataset && c.dataset.giscus === "loaded")
const consentPanel3 = giscusDeferredBoot
  ? (body._children || []).find((c) => String(c.className).indexOf("neoabs-consent") !== -1)
  : null
const consentAccept2 = findClass(consentPanel3, "neoabs-consent__accept")
check(
  "giscus does not load before consent is accepted",
  giscusDeferredBoot && !deferredScriptBefore && !!consentPanel3
)

if (consentAccept2 && Array.isArray(consentAccept2.listeners.click)) {
  consentAccept2.listeners.click.forEach((fn) => fn({}))
}
const deferredScriptAfter = (documentStub.head._children || []).find((c) => c.dataset && c.dataset.giscus === "loaded")
check(
  "giscus loads only after the reader accepts consent",
  giscusDeferredBoot && !!deferredScriptAfter
)

// ============================================================================
// Phase 14: repo popover — dismissible (no auto-close timer), every info field
// stays by default, `fields` narrows what renders
// ============================================================================
function repoPopoverFixture() {
  const pop = makeNode()
  pop.className = "neoabs-repo-pop"
  const link = makeNode()
  link.className = "neoabs-header__repo"
  link.href = "https://github.com/neoabs/mkdocs-docs"
  const wrap = makeNode()
  wrap.className = "neoabs-header__repo-wrap"
  wrap.appendChild(link)
  wrap.appendChild(pop)
  pop.querySelector = function () { return null }
  wrap.querySelector = function (sel) { return sel === ".neoabs-repo-pop" ? pop : null }
  return { wrap, link, pop }
}

const repoSeedData = {
  full_name: "neoabs/mkdocs-docs",
  description: "A test description",
  stargazers_count: 1234,
  watchers_count: 56,
  forks_count: 7,
  open_issues_count: 8,
  language: "Python",
  license: "MIT",
  license_url: "https://github.com/neoabs/mkdocs-docs/blob/main/LICENSE",
  default_branch: "main",
  total_commits: 99,
  latest_tag: "v1.0.0",
  commit_sha: "abc1234",
  commit_date: "2024-01-05",
  commit_msg: "Initial commit",
  created_at: "2020-01-01",
  updated_at: "2020-02-01",
  pushed_at: "2020-03-01",
  html_url: "https://github.com/neoabs/mkdocs-docs",
  owner: {
    login: "neoabs", name: "Neo Abs", bio: "Owner bio",
    followers: 10, public_repos: 3, location: "Earth",
    html_url: "https://github.com/neoabs", avatar_url: "",
  },
}

function repoPopoverBoot(fieldsList) {
  const fixture = repoPopoverFixture()
  _repoFixture = fixture
  documentStub._handlers = {}
  const config = {
    base: "/",
    components: { repo_popover: { show: true } },
    repo_url: "https://github.com/neoabs/mkdocs-docs",
    neoabs_search: { enabled: false },
    translations: {},
  }
  if (fieldsList) config.components.repo_popover.fields = fieldsList
  stored["neoabs-cache-repo-neoabs/mkdocs-docs"] =
    JSON.stringify({ ts: Date.now(), data: repoSeedData })
  const boot = bootIIFE({
    location: { origin: "https://x", pathname: "/guide/", search: "", href: "https://x/guide/", hash: "" },
    config: config,
    searchDom: null,
    stored: stored,
    clipboard: false,
  })
  return { boot: boot, pop: fixture.pop, link: fixture.link, wrap: fixture.wrap }
}

const repoDefault = repoPopoverBoot(null)
const repoPop = repoDefault.pop
const repoWrap = repoDefault.wrap
const repoDefaultBoot = repoDefault.boot

const repoPopoverBooted = repoDefaultBoot && !!repoPop &&
  typeof repoPop._neoabsRepoShow === "function" &&
  typeof repoPop._neoabsRepoHide === "function" &&
  Array.isArray(repoDefault.link.listeners.mouseenter) &&
  Array.isArray(repoWrap.listeners.mouseleave) &&
  Array.isArray(repoWrap.listeners.focusout) &&
  typeof repoPop._neoabsCloseTimer === "undefined"
check(
  "repo popover boots with show/hide hooks + hover/wrap-dismiss bindings, no close timer",
  repoPopoverBooted
)

const repoDismissible = repoDefaultBoot &&
  Array.isArray(documentStub._handlers.pointerdown) && documentStub._handlers.pointerdown.length > 0 &&
  Array.isArray(documentStub._handlers.keydown) && documentStub._handlers.keydown.length > 0
check(
  "repo popover wires Escape + click-outside dismissal (no auto-close timeout)",
  repoDismissible
)

let repoPopToggle = ""
let repoStayedInside = false
let repoClosedOutside = false
if (repoDefaultBoot && repoPop._neoabsRepoShow && repoPop._neoabsRepoHide) {
  repoPop._neoabsRepoShow()
  repoPopToggle = repoPop.classList.contains("neoabs-repo-pop--show") ? "open" : "closed"
  if (documentStub._handlers.pointerdown && documentStub._handlers.pointerdown[0]) {
    documentStub._handlers.pointerdown[0]({ target: repoDefault.link })
    repoStayedInside = repoPop.classList.contains("neoabs-repo-pop--show")
    documentStub._handlers.pointerdown[0]({ target: body })
    repoClosedOutside = !repoPop.classList.contains("neoabs-repo-pop--show")
  }
  repoPop._neoabsRepoHide()
}
check("repo popover opens, stays open on inside press, closes on outside press", repoPopToggle === "open" && repoStayedInside && repoClosedOutside)

const repoAllRows = repoDefaultBoot && repoPop && repoPop.innerHTML != null ? repoPop.innerHTML : ""
const repoAllSections =
  repoAllRows.indexOf("A test description") !== -1 &&
  repoAllRows.indexOf("Owner bio") !== -1 &&
  repoAllRows.indexOf(">Author<") !== -1 &&
  repoAllRows.indexOf(">Followers<") !== -1 &&
  repoAllRows.indexOf(">Public repos<") !== -1 &&
  repoAllRows.indexOf(">Location<") !== -1 &&
  repoAllRows.indexOf(">Stars<") !== -1 &&
  repoAllRows.indexOf(">Watchers<") !== -1 &&
  repoAllRows.indexOf(">Forks<") !== -1 &&
  repoAllRows.indexOf(">Open issues<") !== -1 &&
  repoAllRows.indexOf(">Language<") !== -1 &&
  repoAllRows.indexOf(">License<") !== -1 &&
  repoAllRows.indexOf(">Default branch<") !== -1 &&
  repoAllRows.indexOf(">Commits<") !== -1 &&
  repoAllRows.indexOf(">Tags<") !== -1 &&
  repoAllRows.indexOf(">Latest commit<") !== -1 &&
  repoAllRows.indexOf(">Last commit msg<") !== -1 &&
  repoAllRows.indexOf(">Created<") !== -1 &&
  repoAllRows.indexOf(">Last updated<") !== -1 &&
  repoAllRows.indexOf(">Last pushed<") !== -1
check("repo popover keeps EVERY info section by default", repoAllSections)

const repoFiltered = repoPopoverBoot(["stars", "forks"])
const repoFilteredPop = repoFiltered.pop
const repoFilteredHtml = repoFiltered.boot && repoFilteredPop && repoFilteredPop._neoabsRepoShow
  ? (repoFilteredPop._neoabsRepoShow(), repoFilteredPop.innerHTML || "")
  : ""
const repoFieldFilter = repoFilteredHtml.indexOf(">Stars<") !== -1 &&
  repoFilteredHtml.indexOf(">Forks<") !== -1 &&
  repoFilteredHtml.indexOf(">Open issues<") === -1 &&
  repoFilteredHtml.indexOf("Owner bio") === -1 &&
  repoFilteredHtml.indexOf("A test description") === -1
check("repo popover fields: ['stars','forks'] hides every other section", repoFieldFilter)

const repoDisabled = (() => {
  const fixture = repoPopoverFixture()
  _repoFixture = fixture
  documentStub._handlers = {}
  const boot = bootIIFE({
    location: { origin: "https://x", pathname: "/guide/", search: "", href: "https://x/guide/", hash: "" },
    config: {
      base: "/",
      components: { repo_popover: { show: false } },
      repo_url: "https://github.com/neoabs/mkdocs-docs",
      neoabs_search: { enabled: false },
      translations: {},
    },
    searchDom: null,
    stored: {},
    clipboard: false,
  })
  return boot && !fixture.pop._neoabsRepoShow && !fixture.pop._neoabsRepoHide
})()
check("repo popover stays off when components.repo_popover.show is false", repoDisabled)
_repoFixture = null

// ============================================================================
// Phase 7: i18n — theme.neoabs.i18n overrides swap UI strings read from
// #__config.translations (repo popover labels here)
// ============================================================================
const i18nRepo = (() => {
  const fixture = repoPopoverFixture()
  _repoFixture = fixture
  documentStub._handlers = {}
  stored["neoabs-cache-repo-neoabs/mkdocs-docs"] =
    JSON.stringify({ ts: Date.now(), data: repoSeedData })
  const boot = bootIIFE({
    location: { origin: "https://x", pathname: "/guide/", search: "", href: "https://x/guide/", hash: "" },
    config: {
      base: "/",
      components: { repo_popover: { show: true } },
      repo_url: "https://github.com/neoabs/mkdocs-docs",
      neoabs_search: { enabled: false },
      translations: { repo: { author: "Autor", followers: "Fans", stars: "Sterne" } },
    },
    searchDom: null,
    stored: stored,
    clipboard: false,
  })
  const html = boot && fixture.pop._neoabsRepoShow
    ? (fixture.pop._neoabsRepoShow(), fixture.pop.innerHTML || "")
    : ""
  return html
})()
check(
  "i18n overrides translate repo popover labels (author/followers/stars)",
  i18nRepo.indexOf(">Autor<") !== -1 &&
    i18nRepo.indexOf(">Fans<") !== -1 &&
    i18nRepo.indexOf(">Sterne<") !== -1 &&
    i18nRepo.indexOf(">Author<") === -1 &&
    i18nRepo.indexOf(">Stars<") === -1
)

// ============================================================================
// Phase 7: dark-aware images — when the theme boots without a saved scheme or
// matchMedia signal, image srcs still follow the server-rendered scheme attr
// ============================================================================
const darkBoot = (() => {
  const lightImg = makeNode()
  lightImg.tagName = "IMG"
  lightImg.setAttribute("data-md-scheme-light", "https://x/light.png")
  lightImg.setAttribute("data-md-scheme-dark", "https://x/dark.png")
  lightImg.setAttribute("src", "https://x/light.png")
  const darkImg = makeNode()
  darkImg.tagName = "IMG"
  darkImg.setAttribute("data-md-scheme-light", "https://x/light.png")
  darkImg.setAttribute("data-md-scheme-dark", "https://x/dark.png")
  darkImg.setAttribute("src", "https://x/dark.png")
  _schemeImgs = [lightImg, darkImg]
  documentStub.documentElement.setAttribute("data-md-color-scheme", "default")
  const ok = bootIIFE({
    location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
    config: null,
    searchDom: null,
    stored: {},
  })
  _schemeImgs = []
  documentStub.documentElement.removeAttribute("data-md-color-scheme")
  return ok ? lightImg.getAttribute("src") : ""
})()
check(
  "dark-aware image srcs follow the boot scheme when no preference is stored",
  darkBoot === "https://x/light.png"
)

// ============================================================================
// Link rebase: `site_url` (mkdocs.yml) falls back to localhost:{port} in dev
// ============================================================================
const rebaseOrigQSA = documentStub.querySelectorAll
let rebaseProd = null
let rebaseExt = null
let rebaseSame = null
let rebaseNoCfg = null
function rebasePatch() {
  documentStub.querySelectorAll = (sel, root) => {
    if (sel === "a[href]") return [rebaseProd, rebaseExt, rebaseSame, rebaseNoCfg].filter(Boolean)
    return rebaseOrigQSA(sel, root)
  }
  return () => { documentStub.querySelectorAll = rebaseOrigQSA }
}

const PROD_ORIGIN = "https://rkriad585.github.io"
const PROD_URL = PROD_ORIGIN + "/mkdocs-neoabs"
const savedURL = globalThis.URL
globalThis.URL = __RealURL

resetPhase6()
rebaseProd = documentStub.createElement("a")
rebaseProd.setAttribute("href", PROD_URL + "/guide/")
rebaseExt = documentStub.createElement("a")
rebaseExt.setAttribute("href", "https://other.example/x/")
rebasePatch()
const devBoot = bootIIFE({
  location: { origin: "http://127.0.0.1:8000", pathname: "/guide/", search: "", href: "http://127.0.0.1:8000/guide/", hash: "" },
  config: phase6BaseConfig({ site_url: PROD_URL }),
  searchDom: null,
  stored: {},
})
check("dev preview rewrites production-URL links to localhost, base path stripped", devBoot && rebaseProd.getAttribute("href") === "http://127.0.0.1:8000/guide/")
check("dev preview leaves external links untouched", devBoot && rebaseExt.getAttribute("href") === "https://other.example/x/")

resetPhase6()
rebaseSame = documentStub.createElement("a")
rebaseSame.setAttribute("href", PROD_URL + "/guide/")
rebasePatch()
const prodBoot = bootIIFE({
  location: { origin: PROD_ORIGIN, pathname: "/mkdocs-neoabs/guide/", search: "", href: PROD_URL + "/guide/", hash: "" },
  config: phase6BaseConfig({ site_url: PROD_URL }),
  searchDom: null,
  stored: {},
})
check("deployed origin leaves baked links untouched", prodBoot && rebaseSame.getAttribute("href") === PROD_URL + "/guide/")

resetPhase6()
rebaseNoCfg = documentStub.createElement("a")
rebaseNoCfg.setAttribute("href", PROD_URL + "/guide/")
rebasePatch()
const noCfgBoot = bootIIFE({
  location: { origin: "http://127.0.0.1:8000", pathname: "/guide/", search: "", href: "http://127.0.0.1:8000/guide/", hash: "" },
  config: phase6BaseConfig({}),
  searchDom: null,
  stored: {},
})
check("no site_url configured means links are left untouched", noCfgBoot && rebaseNoCfg.getAttribute("href") === PROD_URL + "/guide/")
documentStub.querySelectorAll = rebaseOrigQSA
globalThis.URL = savedURL

// ============================================================================
// Phase 8: prefetch-on-hover + asset URL resolution
// ============================================================================
// The prefetch handler is bound on document pointerover. We drive it with a
// fake hover target and confirm the right prefetch <link> is appended — while
// never issuing a real network fetch (the harness has no service worker, so the
// low-priority fetch branch is skipped by design).
globalThis.URL = __RealURL
const _prefetchHeadChildren = () => (documentStub.head._children || []).filter((n) => n && n.rel === "prefetch")
const clearPrefetchHead = () => {
  const head = documentStub.head
  if (head) { head._children = []; head.childNodes = [] }
  if (documentStub._handlers) documentStub._handlers.pointerover = []
}

const prefetchTarget = (href) => {
  const anchor = documentStub.createElement("a")
  anchor.href = href
  anchor.hostname = "x"
  anchor.closest = () => anchor
  return anchor
}
const firePointerOver = (target) => {
  const handlers = documentStub._handlers && documentStub._handlers.pointerover
  if (handlers) handlers.forEach((fn) => fn({ target: target }))
}

// Default: prefetch on hover for an internal link.
clearPrefetchHead()
const pfBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: { base: "/", components: { prefetch: { show: true, external: false, exclude: [] } }, assets: {}, content: {} },
  searchDom: null,
  stored: {},
})
firePointerOver(prefetchTarget("/next/"))
const pfLinks = _prefetchHeadChildren()
check("prefetch appends a single <link rel=prefetch> on hover of an internal link", pfBoot && pfLinks.length === 1 && pfLinks[0].href === "https://x/next/")
firePointerOver(prefetchTarget("/next/"))
check("hovering the same link twice does not duplicate the prefetch", pfBoot && _prefetchHeadChildren().length === 1)

// External links are skipped unless `external: true`.
clearPrefetchHead()
const pfExtBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: { base: "/", components: { prefetch: { show: true, external: false, exclude: [] } }, assets: {}, content: {} },
  searchDom: null,
  stored: {},
})
const extAnchor = prefetchTarget("https://other.example/y/")
extAnchor.hostname = "other.example"
firePointerOver(extAnchor)
check("off-site link is not prefetched when external: false", pfExtBoot && _prefetchHeadChildren().length === 0)

clearPrefetchHead()
const pfExtOnBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: { base: "/", components: { prefetch: { show: true, external: true, exclude: [] } }, assets: {}, content: {} },
  searchDom: null,
  stored: {},
})
const extOnAnchor = prefetchTarget("https://other.example/y/")
extOnAnchor.hostname = "other.example"
firePointerOver(extOnAnchor)
check("off-site link IS prefetched when external: true", pfExtOnBoot && _prefetchHeadChildren().length === 1)

// Disabled component => nothing is prefetched.
clearPrefetchHead()
const pfOffBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: { base: "/", components: { prefetch: { show: false, external: false, exclude: [] } }, assets: {}, content: {} },
  searchDom: null,
  stored: {},
})
firePointerOver(prefetchTarget("/next/"))
check("prefetch is disabled when components.prefetch.show is false", pfOffBoot && _prefetchHeadChildren().length === 0)

// assetUrl resolves a site-relative vendor path against config.base.
const assetBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/guide/", search: "", href: "https://x/guide/", hash: "" },
  config: { base: "/mkdocs-neoabs/", components: { highlighting: { cdn_url: "assets/vendor/highlight/highlight.min.js", cdn_css_url: "assets/vendor/highlight/styles/" } }, assets: { mode: "local" }, content: {} },
  searchDom: null,
  stored: {},
})
const assetBoot2 = bootIIFE({
  location: { origin: "https://x", pathname: "/guide/", search: "", href: "https://x/guide/", hash: "" },
  config: { base: "../", components: { highlighting: { cdn_url: "assets/vendor/bundle/neoabs-offline.js" } }, assets: { mode: "bundle" }, content: {} },
  searchDom: null,
  stored: {},
})
globalThis.URL = savedURL
check("Phase 8 boots in local + bundle asset modes without throwing", assetBoot && assetBoot2)

// ============================================================================
// Phase 21: Interactive config builder
// ============================================================================
// OFF by default: even with the dialog present in the DOM, no builder UI is
// initialized and the preview stays empty.
const cbOff = configBuilderFixture()
const cbOffBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: { base: "/", components: {}, content: {} },
  searchDom: null,
  configBuilder: cbOff,
  stored: {},
})
check("config builder stays untouched when the master switch is off", cbOffBoot && !cbOff.preview.innerHTML && !cbOff.preview.dataset.yaml)

// ON: the builder renders its groups, opens/closes through the pinned trigger,
// generates live YAML and copies it to the clipboard.
const cbOn = configBuilderFixture()
const cbOnBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: {
    base: "/",
    config_builder: { enabled: true, toc_icon: true, cluster_icon: true, presets: ["default", "standard", "custom"], download: true, copy: true, target: "mkdocs.yml" },
    components: { toc: { show: true } },
    content: {},
  },
  searchDom: null,
  configBuilder: cbOn,
  stored: {},
  clipboard: "",
})
check(
  "config builder renders a highlighted YAML preview in the left pane when enabled",
  cbOnBoot &&
    cbOn.preview.dataset.yaml.indexOf("glass: medium") !== -1 &&
    cbOn.preview.innerHTML.indexOf("neoabs-config-builder__tok-key") !== -1 &&
    cbOn.preview.innerHTML.indexOf("neoabs-config-builder__tok-bool") !== -1
)
check("config builder starts closed", cbOnBoot && !cbOn.dialog.classList.contains("neoabs-config-builder--visible"))
cbOn.trigger.listeners.click[0]()
check("config builder opens from the pinned trigger", cbOn.dialog.classList.contains("neoabs-config-builder--visible"))
cbOn.close.listeners.click[0]()
check("config builder closes via its close button", !cbOn.dialog.classList.contains("neoabs-config-builder--visible"))
cbOn.trigger.listeners.click[0]()
cbOn.copy.listeners.click[0]()
check("config builder copies the generated YAML to the clipboard", clipboardCaptured.indexOf("glass: medium") !== -1)

// Cluster mirror: the build icon is always present in the action-cluster menu,
// regardless of TOC visibility (shown via attribute, nothing removed from DOM).
const cbMirror = configBuilderFixture()
const cbMirrorBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: {
    base: "/",
    config_builder: { enabled: true, toc_icon: true, cluster_icon: true, presets: ["default", "standard", "custom"], download: true, copy: true, target: "mkdocs.yml" },
    components: { toc: { show: false } },
    content: {},
  },
  searchDom: null,
  configBuilder: cbMirror,
  stored: {},
})
const cbMirrorBtn = (cbMirror.menu._children || []).find((n) => n.getAttribute && n.getAttribute("data-md-neoabs-cluster-action") === "config_builder")
check("config builder mirrors its icon into the cluster when the TOC is hidden", cbMirrorBoot && !!cbMirrorBtn && cbMirrorBtn.hidden === false)

const cbMirrorToc = configBuilderFixture()
const cbMirrorTocBoot = bootIIFE({
  location: { origin: "https://x", pathname: "/page/", search: "", href: "https://x/page/", hash: "" },
  config: {
    base: "/",
    config_builder: { enabled: true, toc_icon: true, cluster_icon: true, presets: ["default", "standard", "custom"], download: true, copy: true, target: "mkdocs.yml" },
    components: { toc: { show: true } },
    content: {},
  },
  searchDom: null,
  configBuilder: cbMirrorToc,
  stored: {},
})
const cbMirrorTocBtn = (cbMirrorToc.menu._children || []).find((n) => n.getAttribute && n.getAttribute("data-md-neoabs-cluster-action") === "config_builder")
check("config builder keeps its icon in the cluster even when the TOC is visible", cbMirrorTocBoot && !!cbMirrorTocBtn && cbMirrorTocBtn.hidden === false)

// ============================================================================
// Report
// ============================================================================
console.log("\n" + (failures === 0
  ? "All JS smoke checks passed (" + checks + " checks)."
  : failures + " check(s) FAILED."))
process.exit(failures === 0 ? 0 : 1)
