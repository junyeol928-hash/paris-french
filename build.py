"""index.html を 1 ファイルにまとめて dist/site.html を作る（Artifact 公開用）。
CSS と JS はインライン化、Google Fonts の link はそのまま残す。"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def inline(html: str) -> str:
    def css(m):
        p = ROOT / m.group(1)
        return "<style>\n" + p.read_text(encoding="utf-8") + "\n</style>"

    def js(m):
        p = ROOT / m.group(1)
        if not p.exists():
            print(f"warning: {p.relative_to(ROOT)} がない（空のまま）", file=sys.stderr)
            return f"<script>/* {m.group(1)} missing */</script>"
        body = p.read_text(encoding="utf-8").replace("</script>", "<\\/script>")
        return f"<script>/* {m.group(1)} */\n{body}\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+\.css)">', css, html)
    html = re.sub(r'<script src="((?:assets|data)/[^"]+\.js)"></script>', js, html)
    return html


def strip_skeleton(html: str) -> str:
    """Artifact 側が doctype/html/head/body を付けるので、こちらの骨組みは外して <title> から始める。"""
    for pat in [r"<!doctype html>\s*", r"<html[^>]*>\s*", r"<head>\s*", r'<meta charset="utf-8">\s*',
                r'<meta name="viewport"[^>]*>\s*', r"</head>\s*", r"<body>\s*", r"</body>\s*</html>\s*$"]:
        html = re.sub(pat, "", html, count=1, flags=re.I)
    return html


def main():
    DIST.mkdir(exist_ok=True)
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    out = strip_skeleton(inline(src))
    (DIST / "site.html").write_text(out, encoding="utf-8")
    print(f"dist/site.html {len(out.encode('utf-8')) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
