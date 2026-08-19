---
title: Forms
---

# Forms

Form elements in NeoAbs follow the glass aesthetic. Inputs, textareas, and selects use translucent backgrounds with subtle borders.

!!! note
    The `.neoabs-input` and `.neoabs-label` classes are implemented in the theme. The `.neoabs-textarea`, `.neoabs-select`, `.neoabs-hint`, and `.neoabs-form` classes shown below are part of the design system specification. Add them to your custom CSS if needed.

## Text input

```html
<input type="text" class="neoabs-input" placeholder="Enter text..." />
```

```css
.neoabs-input {
  font-family: var(--neoabs-font-display);
  font-size: var(--neoabs-text-sm);
  padding: 0.6rem 0.85rem;
  background: var(--neoabs-glass-light);
  border: 1px solid var(--neoabs-ghost-strong);
  border-radius: 8px;
  color: var(--neoabs-ink);
  outline: none;
  transition: border-color 0.2s ease;
  width: 100%;
}

.neoabs-input::placeholder {
  color: var(--neoabs-ink-muted);
  opacity: 0.6;
}

.neoabs-input:focus {
  border-color: var(--neoabs-accent);
}
```

## Textarea

```html
<textarea class="neoabs-textarea" rows="4" placeholder="Write something..."></textarea>
```

```css
.neoabs-textarea {
  font-family: var(--neoabs-font-display);
  font-size: var(--neoabs-text-sm);
  padding: 0.75rem 0.85rem;
  background: var(--neoabs-glass-light);
  border: 1px solid var(--neoabs-ghost-strong);
  border-radius: 8px;
  color: var(--neoabs-ink);
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: border-color 0.2s ease;
}

.neoabs-textarea:focus {
  border-color: var(--neoabs-accent);
}
```

## Select

```html
<select class="neoabs-select">
  <option>Option one</option>
  <option>Option two</option>
  <option>Option three</option>
</select>
```

```css
.neoabs-select {
  font-family: var(--neoabs-font-display);
  font-size: var(--neoabs-text-sm);
  padding: 0.6rem 2rem 0.6rem 0.85rem;
  background: var(--neoabs-glass-light);
  border: 1px solid var(--neoabs-ghost-strong);
  border-radius: 8px;
  color: var(--neoabs-ink);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg ...");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  outline: none;
  cursor: pointer;
}

.neoabs-select:focus {
  border-color: var(--neoabs-accent);
}
```

!!! tip
    Use `appearance: none` and a custom SVG arrow to keep the select consistent across browsers. Native select styling varies heavily.

## Labels

Pair inputs with labels using the mono uppercase style:

```html
<label class="neoabs-label">Email address</label>
<input type="email" class="neoabs-input" />
```

```css
.neoabs-label {
  display: block;
  font-family: var(--neoabs-font-mono);
  font-size: var(--neoabs-text-xs);
  text-transform: uppercase;
  letter-spacing: var(--neoabs-tracking-widest);
  color: var(--neoabs-ink-muted);
  margin-bottom: 0.35rem;
}
```

## Validation states

```css
.neoabs-input--error {
  border-color: var(--neoabs-error);
}

.neoabs-input--success {
  border-color: var(--neoabs-success);
}
```

```html
<label class="neoabs-label">Username</label>
<input type="text" class="neoabs-input neoabs-input--error" value="ab" />
<span class="neoabs-hint neoabs-hint--error">Minimum 3 characters</span>
```

!!! warning
    Validation colors should always be paired with text hints. Color alone is not sufficient to communicate errors.

## Form layout

Use a vertical stack with consistent spacing:

```css
.neoabs-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 480px;
}
```

```html
<form class="neoabs-form">
  <div>
    <label class="neoabs-label">Name</label>
    <input type="text" class="neoabs-input" />
  </div>
  <div>
    <label class="neoabs-label">Email</label>
    <input type="email" class="neoabs-input" />
  </div>
  <button class="neoabs-btn" type="submit">Submit</button>
</form>
```

!!! note
    Forms inside glass cards inherit the card's background. The inputs sit on top with their own lighter glass layer, creating a readable stack.
