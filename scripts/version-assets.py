"""Setzt ?v=<hash> an Stylesheet- und Script-Links, damit langes Caching nicht stale wird.

Aufruf nach jeder Aenderung an site/styles.css oder site/theme.js:
    python3 scripts/version-assets.py
"""
import hashlib
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"

ASSETS = ("styles.css", "theme.js")


def main() -> int:
    for name in ASSETS:
        digest = hashlib.sha256((SITE / name).read_bytes()).hexdigest()[:8]
        pattern = re.compile(re.escape(name) + r"(\?v=[0-9a-f]+)?")
        changed = []
        for html in sorted(SITE.glob("*.html")):
            text = html.read_text()
            replaced = pattern.sub(f"{name}?v={digest}", text)
            if replaced != text:
                html.write_text(replaced)
                changed.append(html.name)
        print(f"{name} v={digest} -> {', '.join(changed) if changed else 'keine Aenderung'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
