"""NeoAbs theme plugin for MkDocs."""

from datetime import datetime

from mkdocs.plugins import BasePlugin


class NeoAbsPlugin(BasePlugin):
    """Plugin that enhances the NeoAbs theme with additional context."""

    _neoabs_defaults = {
        "glass": "medium",
        "dot_matrix": True,
        "animation": "normal",
        "border": "thin",
        "highlight": True,
        "notes": True,
    }

    def on_config(self, config, **kwargs):
        theme = config.get("theme") or {}

        neoabs = theme.get("neoabs") if "neoabs" in theme else {}
        if not isinstance(neoabs, dict):
            neoabs = {}
        for key, value in self._neoabs_defaults.items():
            neoabs.setdefault(key, value)
        theme["neoabs"] = neoabs

        # B2: inject current year for the footer copyright far from relying on a
        # Jinja `now` global that MkDocs does not provide.
        # C1-C3: surface the neoabs theme options to templates so they can be
        # applied to the rendered output (glass, dot matrix, animation, border).
        extra = config.get("extra") or {}
        extra["neoabs_copyright_year"] = datetime.now().year
        extra["neoabs_glass"] = neoabs["glass"]
        extra["neoabs_dot_matrix"] = bool(neoabs["dot_matrix"])
        extra["neoabs_animation"] = neoabs["animation"]
        extra["neoabs_border"] = neoabs["border"]
        extra["neoabs_highlight"] = bool(neoabs["highlight"])
        extra["neoabs_notes"] = bool(neoabs["notes"])
        extra["neoabs_notes_ttl"] = neoabs.get("notes_ttl")
        config["extra"] = extra

        # Search: the built-in MkDocs `search` plugin injects `search/main.js`
        # into `config.extra_javascript`. We drive its worker (`search/worker.js`
        # + lunr index) directly from our own themed UI instead, so drop the stock
        # main.js to avoid a second, incompatible search controller.
        if "search" in config.get("plugins", []):
            extra_js = config.get("extra_javascript") or []
            config["extra_javascript"] = [p for p in extra_js if p != "search/main.js"]

        return config
