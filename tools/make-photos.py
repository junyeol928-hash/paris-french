"""駅の写真（Wikimedia Commons の自由ライセンス）を、画面で使う大きさと色にそろえる。
元の写真と出典 credits.json は assets/img/st/_src/（git 管理外）に置く。
出力: assets/img/st/<id>.webp と data/photos.js（パス・切り抜きの中心・出典）。
使い方: python tools/make-photos.py
"""
import json
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "st" / "_src"
OUT = ROOT / "assets" / "img" / "st"

# 駅 id → 画面で切り抜くときの中心（CSS の object-position）。写真ごとに見せたい所が違う
FOCUS = {
    "welcome": "50% 38%", "bonjour": "50% 45%", "lire": "50% 42%", "comprendre": "42% 40%",
    "aeroport": "32% 50%", "taxi": "50% 40%", "hotel": "74% 50%", "cafe": "50% 58%",
    "metro": "68% 52%", "musee": "52% 62%", "resto": "50% 45%", "carte": "50% 72%",
    "boutique": "50% 50%", "urgence": "40% 58%", "paris": "38% 50%",
}
# 元の写真から使う範囲（左・上・右・下の割合）。文字を重ねる所に写真の看板が来ないように切る
CROP = {"taxi": (0, 0.3, 1, 1)}
LONG = 1000      # 長い辺の画素数（スマホの 2 倍密度で幅いっぱいに出しても粗くならない大きさ）
QUALITY = 72


def grade(im: Image.Image) -> Image.Image:
    """色をそろえる: 彩度を少し落とし、コントラストをわずかに上げる（写真ごとの色かぶりの差を小さくする）"""
    im = ImageEnhance.Color(im).enhance(0.9)
    return ImageEnhance.Contrast(im).enhance(1.04)


def main():
    credits = json.loads((SRC / "credits.json").read_text(encoding="utf-8"))
    out = {}
    for sid, pos in FOCUS.items():
        src = SRC / f"{sid}.jpg"
        if not src.exists():
            raise SystemExit(f"元の写真がありません: {src}")
        im = Image.open(src).convert("RGB")
        if sid in CROP:
            l, t, r, btm = CROP[sid]
            im = im.crop((int(im.width * l), int(im.height * t), int(im.width * r), int(im.height * btm)))
        im.thumbnail((LONG, LONG), Image.Resampling.LANCZOS)
        dst = OUT / f"{sid}.webp"
        grade(im).save(dst, "WEBP", quality=QUALITY, method=6)
        c = credits[sid]
        out[sid] = {"src": f"assets/img/st/{sid}.webp", "pos": pos, "w": im.width, "h": im.height,
                    "title": c["title"], "author": c["author"], "license": c["license"],
                    "licenseUrl": c["licenseUrl"], "source": c["source"]}
        print(f"{sid:11s} {im.width}x{im.height} {dst.stat().st_size // 1024} KB  {c['license']}")
    js = "/* tools/make-photos.py が生成する。手で編集しない。駅の写真（Wikimedia Commons）と出典 */\n"
    js += "window.DATA = window.DATA || {};\nwindow.DATA.photos = " + json.dumps(out, ensure_ascii=False, indent=0) + ";\n"
    (ROOT / "data" / "photos.js").write_text(js, encoding="utf-8", newline="\n")
    total = sum((OUT / f"{k}.webp").stat().st_size for k in out)
    print(f"写真 {len(out)} 枚、合計 {total // 1024} KB -> data/photos.js")


if __name__ == "__main__":
    main()
