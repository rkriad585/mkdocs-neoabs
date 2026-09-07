---
date: 2026-09-07
---

# Tabs

NeoAbs styles `pymdownx.tabbed` content with a glass-styled tab strip that
follows the theme accent. Styling supports up to 10 tabs and adds keyboard
navigation via a small script.

## Usage

```markdown
=== "Python"
    ```python
    print("hello")
    ```

=== "JavaScript"
    ```js
    console.log("hello");
    ```

=== "Bash"
    ```bash
    echo "hello"
    ```
```

## Example — three tabs

=== "Python"
    ```python
    def greet(name):
        print("hello " + name)
    ```

=== "JavaScript"
    ```js
    function greet(name) {
      console.log("hello " + name)
    }
    ```

=== "Bash"
    ```bash
    greet() {
      echo "hello $1"
    }
    ```

## Example — many tabs (8)

=== "Tab 1"

    Content one.

=== "Tab 2"

    Content two.

=== "Tab 3"

    Content three.

=== "Tab 4"

    Content four.

=== "Tab 5"

    Content five.

=== "Tab 6"

    Content six.

=== "Tab 7"

    Content seven.

=== "Tab 8"

    Content eight.

## Keyboard usage

Use `Tab` to focus a tab label, then `ArrowLeft` / `ArrowRight` to switch tabs.
The active tab is indicated with the accent underline.
