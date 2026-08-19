"""NeoAbs theme plugin for MkDocs."""

from mkdocs.plugins import BasePlugin


class NeoAbsPlugin(BasePlugin):
    """Plugin that enhances the NeoAbs theme with additional context."""

    def on_config(self, config, **kwargs):
        theme = config.get("theme", {})

        defaults = {
            "language": "en",
            "direction": "ltr",
            "features": [],
            "palette": [],
            "font": {"text": "Space Grotesk", "code": "Space Mono"},
            "neoabs": {
                "glass": "medium",
                "dot_matrix": True,
                "animation": "normal",
                "border": "thin",
            },
        }

        for key, value in defaults.items():
            if key not in theme:
                theme[key] = value

        if "neoabs" in theme and isinstance(theme["neoabs"], dict):
            neoabs = theme["neoabs"]
            for key, value in defaults["neoabs"].items():
                if key not in neoabs:
                    neoabs[key] = value

        config["theme"] = theme
        return config
