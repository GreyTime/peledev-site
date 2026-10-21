#!/usr/bin/env python3
"""Setzt ?v=<hash> an Stylesheet-Links, damit immutable-Caching nicht stale wird.

Aufruf nach jeder Aenderung an site/styles.css:
    python3 scripts/version-assets.py
"""
import hashlib
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"


def main() -> int:
    css = SITE / "styles.css"
    digest = hashlib.sha256(css.read_bytes()).hexdigest()[:8]
    changed = []
    for html in SITE.glob("*.html"):
        text = html.read_text()
        new = re.sub(r'styles\.css(\?v=[0-9a-f]+)?', f"styles.css?v={digest}", text)
        if new != text:
            html.write_text(new)
            changed.append(html.name)
    print(f"styles.css v={digest} -> {', '.join(changed) if changed else 'keine Aenderung'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
