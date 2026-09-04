/**
 * NeoAbs JS smoke test.
 *
 * Stubs a minimal DOM/browser environment and loads the theme's neoabs.js IIFE
 * to verify the boot sequence (all init* functions) runs without throwing. It
 * also exercises the browser-local notes storage helpers (TTL purge) which are
 * deterministic and need no DOM.
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
    classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
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
    insertBefore(child, ref) {
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
    closest() { return null },
  }
  return el
}

// ---- DOM / window stubs ----------------------------------------------------
const body = makeNode()
body.textContent = ""
let elId = 0

const documentStub = {
  readyState: "complete",
  body,
  documentElement: makeNode(),
  _els: [],
  createElement(tag) { const n = makeNode(); n.tagName = tag; return n },
  createTextNode(txt) { const n = makeNode(); n.textContent = txt; return n },
  createDocumentFragment() { return makeNode() },
  createTreeWalker() {
    // Minimal tree-walk returning nothing.
    return { nextNode: () => null }
  },
  querySelector(sel) { return null },
  querySelectorAll(sel) { return [] },
  getElementById(id) { return null },
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
  addEventListener() {},
  innerWidth: 1024,
  innerHeight: 768,
  _scriptsLoaded: [],
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  getSelection() { return { toString: () => "", removeAllRanges: () => {}, anchorNode: null } },
}

globalThis.document = documentStub
globalThis.window = windowStub
globalThis.localStorage = storageStub
globalThis.location = { pathname: "/page/", search: "", href: "https://x/page/" }
globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 }
globalThis.URL = { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }
globalThis.getComputedStyle = () => ({ position: "static" })
globalThis.requestAnimationFrame = (cb) => { cb(); return 0 }
globalThis.cancelAnimationFrame = () => {}
globalThis.Blob = class Blob { constructor(text, opts) { this.text = text; this.opts = opts } }

const code = fs.readFileSync(
  path.join(__dirname, "..", "neoabs", "templates", "assets", "javascripts", "neoabs.js"),
  "utf-8"
)

// Run the IIFE. It should attach onReady and run it immediately (readyState != loading).
let bootRan = false
try {
  new Function("document", "window", "localStorage", "location", "Node", "URL", "getComputedStyle", "Blob", code)(
    documentStub, windowStub, storageStub, globalThis.location, globalThis.Node,
    globalThis.URL, globalThis.getComputedStyle, globalThis.Blob
  )
  bootRan = true
} catch (e) {
  console.error("BOOT THREW:", e.message)
  process.exit(1)
}

// ---- Exercises -------------------------------------------------------------
let failures = 0
function check(name, cond) {
  if (cond) console.log("PASS  " + name)
  else { console.error("FAIL  " + name); failures++ }
}

check("IIFE boot completes without throwing", bootRan)

// Boot's initNotes -> notesReapply() runs a TTL purge on load. Seed an expired
// note (1 year old, far beyond the 3-day window) and confirm it is removed.
const now = Date.now()
stored = {
  "neoabs-notes": JSON.stringify([
    { id: "expired", url: "/page/", ts: now - 31536000000 }
  ])
}
// Re-run boot so initNotes sees the seeded data.
try {
  new Function("document","window","localStorage","location","Node","URL","getComputedStyle","Blob","requestAnimationFrame",
    code)(documentStub, windowStub, storageStub, globalThis.location, globalThis.Node,
    globalThis.URL, globalThis.getComputedStyle, globalThis.Blob,
    globalThis.requestAnimationFrame)
} catch (e) {
  console.error("SECOND BOOT THREW:", e.message)
  process.exit(1)
}

let expiredPurged = true
try { expiredPurged = JSON.parse(storageStub.getItem("neoabs-notes")).length === 0 }
catch { expiredPurged = false }

check("expired (1-year-old) note purged after 3-day TTL on load", expiredPurged)

// A fresh note (created now) survives the same purge.
stored = {
  "neoabs-notes": JSON.stringify([
    { id: "fresh", url: "/page/", ts: now }
  ])
}
try {
  new Function("document","window","localStorage","location","Node","URL","getComputedStyle","Blob","requestAnimationFrame",
    code)(documentStub, windowStub, storageStub, globalThis.location, globalThis.Node,
    globalThis.URL, globalThis.getComputedStyle, globalThis.Blob,
    globalThis.requestAnimationFrame)
} catch {}
let freshKept = false
try { freshKept = JSON.parse(storageStub.getItem("neoabs-notes")).length === 1 }
catch {}

check("fresh note retained after TTL purge", freshKept)

console.log("\n" + (failures === 0
  ? "All JS smoke checks passed (" + (4 - 0) + " checks)."
  : failures + " check(s) FAILED."))
process.exit(failures === 0 ? 0 : 1)