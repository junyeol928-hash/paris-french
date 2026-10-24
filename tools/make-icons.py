"""ホーム画面のアイコンを作る: python tools/make-icons.py → assets/img/icon/*.png
図柄はパリのメトロの丸い標識: 白タイルの地に、紫（4 号線）の太い輪と濃紺の円、白いセリフ体の « Fr »。
maskable は Android が円や角丸に切り抜くので、絵を中央 76% に収める。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img" / "icon"
OUT.mkdir(parents=True, exist_ok=True)
BG, NAVY, RING, WHITE = "#F6F5F1", "#1B2A5C", "#9B2F8F", "#FFFFFF"


def font(px):
    for f in ["C:/Windows/Fonts/georgiab.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"]:
        if Path(f).exists():
            return ImageFont.truetype(f, px)
    return ImageFont.load_default()


def draw(size, scale=0.86, rounded=False):
    s = size * 4   # 4 倍で描いて縮める（縁をなめらかに）
    im = Image.new("RGBA", (s, s), BG)
    d = ImageDraw.Draw(im)
    if rounded:   # iOS 用は角丸にしない（OS が丸める）。favicon だけ少し丸める
        mask = Image.new("L", (s, s), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, s, s], radius=s * 0.22, fill=255)
        im.putalpha(mask)
    r = s * scale / 2; c = s / 2
    d.ellipse([c - r, c - r, c + r, c + r], fill=RING)
    r2 = r * 0.74
    d.ellipse([c - r2, c - r2, c + r2, c + r2], fill=NAVY)
    f = font(int(r2 * 0.95))
    bbox = d.textbbox((0, 0), "Fr", font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((c - w / 2 - bbox[0], c - h / 2 - bbox[1] - r2 * 0.04), "Fr", font=f, fill=WHITE)
    return im.resize((size, size), Image.Resampling.LANCZOS)


draw(192).save(OUT / "icon-192.png")
draw(512).save(OUT / "icon-512.png")
draw(512, scale=0.66).save(OUT / "maskable-512.png")
draw(180, scale=0.8).convert("RGB").save(OUT / "apple-touch-icon.png")
draw(32, scale=0.96, rounded=True).save(OUT / "favicon-32.png")
print("icons →", OUT)
