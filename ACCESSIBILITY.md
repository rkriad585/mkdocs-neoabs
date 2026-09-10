# Accessibility Statement

mkdocs-void is committed to ensuring digital accessibility for people with disabilities.

## Features

- Skip-to-content link for keyboard navigation
- Keyboard shortcuts for search (`/`) and help (`?`)
- `prefers-reduced-motion` respected: all animations and transitions are disabled
- `prefers-color-scheme` media query supported for automatic dark/light mode
- Semantic HTML structure with ARIA attributes on interactive elements
- Focus indicators on all interactive controls
- Screen reader labels on toggle buttons and search inputs

## Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| `/` | Open search |
| `?` | Show keyboard shortcuts help |
| `Esc` | Close search or help modal |
| `Tab` | Navigate between interactive elements |

## Browser Support

Void uses `backdrop-filter` for glass effects. This is supported in:

- Chrome 76+
- Edge 79+
- Safari 9+
- Firefox 103+

In browsers without `backdrop-filter` support, glass panels render as solid semi-transparent backgrounds, keeping the layout fully readable.

## Standards

This theme aims to conform with [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Level AA guidelines.

## Feedback

If you encounter any accessibility issues, please [open an issue](https://github.com/rkriad585/mkdocs-void/issues).
