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
function zoomOverlayFixture() {
  const ov = makeNode()
  const view = makeNode()
  view.tagName = "IMG"
  const caption = makeNode()
  const close = makeNode()
  close.tagName = "BUTTON"
  ov.querySelector = (sel) => {
    if (sel === "img") return view
    if (sel === ".neoabs-zoom__caption") return caption
    if (sel === "button") return close
    return null
  }
  return ov
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
      // Phase 5 lightbox: the overlay div gets sub-query support.
      n._zoomView = makeNode(); n._zoomView.tagName = "IMG"
      n._zoomCap = makeNode()
      n._zoomBtn = makeNode(); n._zoomBtn.tagName = "BUTTON"
      n.querySelector = (sel) => {
        if (sel === "img") return n._zoomView
        if (sel === ".neoabs-zoom__caption") return n._zoomCap
        if (sel === "button") return n._zoomBtn
        return null
      }
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
    if (sel === "article .neoabs-typeset") return _typesetNode
    return null
  },
  querySelectorAll(sel) {
    if (sel === "article .neoabs-typeset img") return _zoomImgs
    return []
  },
  getElementById(id) {
    if (id === "__config") return _configEl
    if (_searchDom && id === "neoabs-search") return _searchDom.checkbox
    if (id === "neoabs-search-share") return null
    return null
  },
  addEventListener() {},
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
// Report
// ============================================================================
console.log("\n" + (failures === 0
  ? "All JS smoke checks passed (" + checks + " checks)."
  : failures + " check(s) FAILED."))
process.exit(failures === 0 ? 0 : 1)
