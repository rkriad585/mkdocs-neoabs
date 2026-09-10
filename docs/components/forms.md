---
date: 2026-09-07
title: Forms
---

# Forms

Void form elements use translucent glass backgrounds with subtle borders.
Labels are mono uppercase; inputs, textareas, and selects share a consistent
look. Validation states add colored borders paired with hint text.

!!! tip
    Form controls are interactive out of the box via `initUIExamples()`: submitting
    a form fires a success or error toast, and pressing <kbd>Enter</kbd> or changing
    an input/select fires a toast confirming the action.

## Text input

<div class="void-form">
  <div>
    <label class="void-label">Full name</label>
    <input type="text" class="void-input" placeholder="Jane Doe" />
  </div>
</div>

```html
<label class="void-label">Full name</label>
<input type="text" class="void-input" placeholder="Jane Doe" />
```

## Textarea

<div class="void-form">
  <div>
    <label class="void-label">Message</label>
    <textarea class="void-textarea" placeholder="Write something..."></textarea>
  </div>
</div>

```html
<label class="void-label">Message</label>
<textarea class="void-textarea" placeholder="Write something..."></textarea>
```

## Select

<div class="void-form">
  <div>
    <label class="void-label">Priority</label>
    <select class="void-select">
      <option>Low</option>
      <option>Medium</option>
      <option>High</option>
    </select>
  </div>
</div>

```html
<label class="void-label">Priority</label>
<select class="void-select">
  <option>Low</option>
  <option>Medium</option>
  <option>High</option>
</select>
```

## Validation states

Add `--error` or `--success` modifier classes to inputs and textareas.
Always pair color with a hint so the meaning is clear without relying on color alone.

<div class="void-form">
  <div>
    <label class="void-label">Username</label>
    <input type="text" class="void-input void-input--error" value="ab" />
    <span class="void-hint void-hint--error">Minimum 3 characters</span>
  </div>
  <div>
    <label class="void-label">Email</label>
    <input type="email" class="void-input void-input--success" value="jane@example.com" />
    <span class="void-hint void-hint--success">Email looks good</span>
  </div>
</div>

```html
<label class="void-label">Username</label>
<input type="text" class="void-input void-input--error" value="ab" />
<span class="void-hint void-hint--error">Minimum 3 characters</span>

<label class="void-label">Email</label>
<input type="email" class="void-input void-input--success" value="jane@example.com" />
<span class="void-hint void-hint--success">Email looks good</span>
```

## Full form

A complete form using vertical flex layout with consistent spacing. It is a real `<form>` — try submitting it empty to see validation in action.

<form class="void-form" novalidate>
  <div class="void-field">
    <label class="void-label" for="f-name">Name</label>
    <input type="text" id="f-name" class="void-input" placeholder="Jane Doe" required />
    <span class="void-hint void-hint--error" hidden>Name is required</span>
  </div>
  <div class="void-field">
    <label class="void-label" for="f-email">Email</label>
    <input type="email" id="f-email" class="void-input" placeholder="jane@example.com" required />
    <span class="void-hint void-hint--error" hidden>Email is required</span>
  </div>
  <div class="void-field">
    <label class="void-label" for="f-role">Role</label>
    <select class="void-select" id="f-role">
      <option>Designer</option>
      <option>Engineer</option>
      <option>Manager</option>
    </select>
  </div>
  <div class="void-field">
    <label class="void-label" for="f-notes">Notes</label>
    <textarea class="void-textarea" id="f-notes" placeholder="Anything else..."></textarea>
  </div>
  <button class="void-btn void-btn--pill void-form__submit" type="submit">Submit</button>
</form>

```html
<form class="void-form" novalidate>
  <div class="void-field">
    <label class="void-label" for="f-name">Name</label>
    <input type="text" id="f-name" class="void-input" placeholder="Jane Doe" required />
    <span class="void-hint void-hint--error" hidden>Name is required</span>
  </div>
  <div class="void-field">
    <label class="void-label" for="f-email">Email</label>
    <input type="email" id="f-email" class="void-input" placeholder="jane@example.com" required />
    <span class="void-hint void-hint--error" hidden>Email is required</span>
  </div>
  <div class="void-field">
    <label class="void-label" for="f-role">Role</label>
    <select class="void-select" id="f-role">
      <option>Designer</option>
      <option>Engineer</option>
      <option>Manager</option>
    </select>
  </div>
  <div class="void-field">
    <label class="void-label" for="f-notes">Notes</label>
    <textarea class="void-textarea" id="f-notes" placeholder="Anything else..."></textarea>
  </div>
  <button class="void-btn void-btn--pill void-form__submit" type="submit">Submit</button>
</form>
```

The `initUIExamples()` initializer handles the submit: it validates any `[required]` field, toggling the `--error` class and showing the paired error hint when empty. The submit button turns green (`.void-form--valid`) when everything is filled in.
