---
date: 2026-09-07
---

# Diagrams (Mermaid)

Void renders fenced `mermaid` blocks through [Mermaid.js](https://mermaid.js.org)
loaded from a CDN. Diagrams are themed to match your light/dark palette and
draw inside a glass card.

## Usage

````markdown
```mermaid
graph TD
    A[Start] --> B{Check}
    B -->|yes| C(Done)
    B -->|no| A
```
````

## Examples

### Flowchart

```mermaid
graph TD
    A[Install] --> B{Configure?}
    B -->|yes| C[Build]
    C --> D[Deploy]
    B -->|no| E[Guides]
```

### Sequence diagram

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant M as MkDocs
    U->>B: open docs
    B->>M: fetch page
    M-->>B: html
    B->>U: render
```

### Class diagram

```mermaid
classDiagram
    class Theme
    class Component
    Theme <|-- Void
    Void : Component
    Component : +render()
```

### ER diagram

```mermaid
erDiagram
    USER ||--o{ NOTE : writes
    USER {
        string name
    }
    NOTE {
        string body
        string color
    }
```

### Pie chart

```mermaid
pie title Browser usage
    "Chrome" : 60
    "Firefox" : 20
    "Safari" : 15
    "Other" : 5
```

## Theme

Diagrams use the `base` Mermaid theme with token colors that track the palette.
Switch light/dark and the diagram re-renders automatically with matching colors.

## Configuration

The `mermaid` fence is enabled in `mkdocs.yml`:

```yaml
- pymdownx.superfences:
    custom_fences:
      - name: mermaid
        class: mermaid
        format: !!python/name:pymdownx.superfences.fence_code_format
```

Mermaid is only downloaded when a page actually contains a `.mermaid` block.
