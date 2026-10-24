"""駅の絵（パリを描いた名画。Wikimedia Commons のパブリックドメイン）を、画面で使う大きさにそろえる。
元の画像と出典 credits.json は assets/img/st/_src/（git 管理外）に置く。
出力: assets/img/st/<id>.webp と data/photos.js（パス・切り抜きの中心・作品名・出典）。
使い方: python tools/make-photos.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "st" / "_src"
OUT = ROOT / "assets" / "img" / "st"

# 駅 id → 画面で切り抜くときの中心（CSS の object-position）。縦長に切るので、人物や見せ場の横位置を決める
FOCUS = {
    "welcome": "66% 50%", "bonjour": "40% 40%", "lire": "50% 40%", "comprendre": "34% 45%",
    "aeroport": "46% 50%", "taxi": "50% 60%", "hotel": "35% 50%", "cafe": "56% 55%",
    "metro": "40% 50%", "musee": "50% 50%", "resto": "38% 50%", "carte": "50% 40%",
    "boutique": "50% 40%", "urgence": "50% 60%", "paris": "50% 50%",
}
# 元の絵から使う範囲（左・上・右・下の割合）。縦長に切ると見せ場が暗がりに隠れる絵だけ、先に切る
CROP = {}
# 解説札（カルテル）に出す 画家・作品名・年
ART = {
    "welcome": ("Gustave Caillebotte", "Rue de Paris, temps de pluie", "1877"),
    "bonjour": ("Pierre-Auguste Renoir", "Bal du moulin de la Galette", "1876"),
    "lire": ("Jean-Honoré Fragonard", "La Liseuse", "1770"),
    "comprendre": ("Mary Cassatt", "Le Thé", "1880"),
    "aeroport": ("Claude Monet", "La Gare Saint-Lazare", "1877"),
    "taxi": ("Camille Pissarro", "Boulevard Montmartre, printemps", "1897"),
    "hotel": ("Gustave Caillebotte", "Jeune homme au balcon", "1880"),
    "cafe": ("Jean Béraud", "La Pâtisserie Gloppe", "1889"),
    "metro": ("Gustave Caillebotte", "Le Pont de l'Europe", "1876"),
    "musee": ("Hubert Robert", "La Grande Galerie du Louvre", "1796"),
    "resto": ("Pierre-Auguste Renoir", "Le Déjeuner des canotiers", "1881"),
    "carte": ("Édouard Manet", "Un bar aux Folies Bergère", "1882"),
    "boutique": ("Edgar Degas", "Chez la modiste", "1881"),
    "urgence": ("Pierre-Auguste Renoir", "Le Pont-Neuf", "1872"),
    "paris": ("Claude Monet", "La Rue Montorgueil, fête du 30 juin", "1878"),
}
LONG = 1200      # 長い辺の画素数（絵を画面の上いっぱいに縦長で切り抜いても粗くならない大きさ）
QUALITY = 70


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
        im.save(dst, "WEBP", quality=QUALITY, method=6)
        c = credits[sid]
        out[sid] = {"src": f"assets/img/st/{sid}.webp", "pos": pos, "w": im.width, "h": im.height,
                    "artist": ART[sid][0], "work": ART[sid][1], "year": ART[sid][2],
                    "title": c["title"], "author": c["author"], "license": c["license"],
                    "licenseUrl": c["licenseUrl"], "source": c["source"]}
        print(f"{sid:11s} {im.width}x{im.height} {dst.stat().st_size // 1024} KB  {c['license']}")
    js = "/* tools/make-photos.py が生成する。手で編集しない。駅の絵（Wikimedia Commons のパブリックドメイン）と出典 */\n"
    js += "window.DATA = window.DATA || {};\nwindow.DATA.photos = " + json.dumps(out, ensure_ascii=False, indent=0) + ";\n"
    (ROOT / "data" / "photos.js").write_text(js, encoding="utf-8", newline="\n")
    total = sum((OUT / f"{k}.webp").stat().st_size for k in out)
    print(f"絵 {len(out)} 枚、合計 {total // 1024} KB -> data/photos.js")


if __name__ == "__main__":
    main()
