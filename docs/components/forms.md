---
date: 2026-09-07
title: Forms
---

# Forms

NeoAbs form elements use translucent glass backgrounds with subtle borders.
Labels are mono uppercase; inputs, textareas, and selects share a consistent
look. Validation states add colored borders paired with hint text.

!!! tip
    Form controls are interactive out of the box via `initUIExamples()`: submitting
    a form fires a success or error toast, and pressing <kbd>Enter</kbd> or changing
    an input/select fires a toast confirming the action.

## Text input

<div class="neoabs-form">
  <div>
    <label class="neoabs-label">Full name</label>
    <input type="text" class="neoabs-input" placeholder="Jane Doe" />
  </div>
</div>

```html
<label class="neoabs-label">Full name</label>
<input type="text" class="neoabs-input" placeholder="Jane Doe" />
```

## Textarea

<div class="neoabs-form">
  <div>
    <label class="neoabs-label">Message</label>
    <textarea class="neoabs-textarea" placeholder="Write something..."></textarea>
  </div>
</div>

```html
<label class="neoabs-label">Message</label>
<textarea class="neoabs-textarea" placeholder="Write something..."></textarea>
```

## Select

<div class="neoabs-form">
  <div>
    <label class="neoabs-label">Priority</label>
    <select class="neoabs-select">
      <option>Low</option>
      <option>Medium</option>
      <option>High</option>
    </select>
  </div>
</div>

```html
<label class="neoabs-label">Priority</label>
<select class="neoabs-select">
  <option>Low</option>
  <option>Medium</option>
  <option>High</option>
</select>
```

## Validation states

Add `--error` or `--success` modifier classes to inputs and textareas.
Always pair color with a hint so the meaning is clear without relying on color alone.

<div class="neoabs-form">
  <div>
    <label class="neoabs-label">Username</label>
    <input type="text" class="neoabs-input neoabs-input--error" value="ab" />
    <span class="neoabs-hint neoabs-hint--error">Minimum 3 characters</span>
  </div>
  <div>
    <label class="neoabs-label">Email</label>
    <input type="email" class="neoabs-input neoabs-input--success" value="jane@example.com" />
    <span class="neoabs-hint neoabs-hint--success">Email looks good</span>
  </div>
</div>

```html
<label class="neoabs-label">Username</label>
<input type="text" class="neoabs-input neoabs-input--error" value="ab" />
<span class="neoabs-hint neoabs-hint--error">Minimum 3 characters</span>

<label class="neoabs-label">Email</label>
<input type="email" class="neoabs-input neoabs-input--success" value="jane@example.com" />
<span class="neoabs-hint neoabs-hint--success">Email looks good</span>
```

## Full form

A complete form using vertical flex layout with consistent spacing. It is a real `<form>` — try submitting it empty to see validation in action.

<form class="neoabs-form" novalidate>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-name">Name</label>
    <input type="text" id="f-name" class="neoabs-input" placeholder="Jane Doe" required />
    <span class="neoabs-hint neoabs-hint--error" hidden>Name is required</span>
  </div>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-email">Email</label>
    <input type="email" id="f-email" class="neoabs-input" placeholder="jane@example.com" required />
    <span class="neoabs-hint neoabs-hint--error" hidden>Email is required</span>
  </div>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-role">Role</label>
    <select class="neoabs-select" id="f-role">
      <option>Designer</option>
      <option>Engineer</option>
      <option>Manager</option>
    </select>
  </div>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-notes">Notes</label>
    <textarea class="neoabs-textarea" id="f-notes" placeholder="Anything else..."></textarea>
  </div>
  <button class="neoabs-btn neoabs-btn--pill neoabs-form__submit" type="submit">Submit</button>
</form>

```html
<form class="neoabs-form" novalidate>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-name">Name</label>
    <input type="text" id="f-name" class="neoabs-input" placeholder="Jane Doe" required />
    <span class="neoabs-hint neoabs-hint--error" hidden>Name is required</span>
  </div>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-email">Email</label>
    <input type="email" id="f-email" class="neoabs-input" placeholder="jane@example.com" required />
    <span class="neoabs-hint neoabs-hint--error" hidden>Email is required</span>
  </div>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-role">Role</label>
    <select class="neoabs-select" id="f-role">
      <option>Designer</option>
      <option>Engineer</option>
      <option>Manager</option>
    </select>
  </div>
  <div class="neoabs-field">
    <label class="neoabs-label" for="f-notes">Notes</label>
    <textarea class="neoabs-textarea" id="f-notes" placeholder="Anything else..."></textarea>
  </div>
  <button class="neoabs-btn neoabs-btn--pill neoabs-form__submit" type="submit">Submit</button>
</form>
```

The `initUIExamples()` initializer handles the submit: it validates any `[required]` field, toggling the `--error` class and showing the paired error hint when empty. The submit button turns green (`.neoabs-form--valid`) when everything is filled in.
