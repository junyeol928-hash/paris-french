"""フランス語の音声を Microsoft の neural 音声（edge-tts、fr-FR）で作り、data/audio.js に data URI で埋め込む。
端末の読み上げは機種によってフランス語の声が無い・質が低いので、ここで作った音を優先して鳴らす（core.js の TTS）。

1 文ずつ取得（assets/audio/_seg にキャッシュ、git 管理外）→ 前後の無音を削る → 32 kbps / 24 kHz モノラルの MP3 → base64。
文の id は core.js と同じ FNV-1a 32bit（"t:" + 8 桁）。合計 3 MB 前後なので、ページに直接埋め込んで別ファイルを出さない。

使い方: python tools/gen-audio.py（取得済みの文は再取得しない）
依存: pip install edge-tts lameenc miniaudio
"""
import asyncio, base64, hashlib, json, subprocess, sys, array
from pathlib import Path
import edge_tts, lameenc, miniaudio

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "assets" / "audio" / "_seg"
CACHE.mkdir(parents=True, exist_ok=True)
VOICE = {"W": "fr-FR-DeniseNeural", "M": "fr-FR-HenriNeural"}
SR = 24000
KBPS = 32   # MPEG-2 で使えるのは 8,16,24,32,… 。フランス語の子音（s・ch）が潰れないよう 32


def strip_id3(b: bytes) -> bytes:
    if b[:3] == b"ID3":
        size = (b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]
        return b[10 + size:]
    return b


def trim(pcm: bytes, thresh=350, keep=0.06) -> bytes:
    a = array.array("h"); a.frombytes(pcm)
    n = len(a); i = 0; j = n
    while i < n and abs(a[i]) < thresh: i += 1
    while j > i and abs(a[j - 1]) < thresh: j -= 1
    k = int(SR * keep)
    return a[max(0, i - k):min(n, j + k)].tobytes()


def fnv(text: str) -> str:
    h = 0x811C9DC5
    for ch in text.strip():
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, "08x")


def load_items():
    """読む文 → 声。node で data/*.js と numbers.js を読む"""
    js = """global.window={};for(const f of ['phrases','listen','pron','dialogs'])require('./data/'+f+'.js');const NUM=require('./assets/js/numbers.js');
    const D=window.DATA;const nums=[];for(let n=0;n<=100;n++)nums.push(NUM.fr(n));
    const dl=D.dialogs.flatMap(d=>d.lines.flatMap(l=>l.who==='s'?[['s',l.fr]]:l.opts.map(o=>['me',o.fr])));
    process.stdout.write(JSON.stringify({phrases:D.phrases.map(p=>p.fr),listen:D.listen.map(x=>[x.id,x.fr]),pron:D.pron.flatMap(r=>r.ex.map(e=>e[0])),nums,dl}));"""
    D = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
    out = {}
    def add(t, who):
        t = t.strip()
        if t and t not in out: out[t] = who
    for t in D["phrases"]: add(t, "W")
    for i, (id_, t) in enumerate(D["listen"]): add(t, "M" if int(id_[1:]) % 2 else "W")   # 店員さん・放送は男女を交互に
    for t in D["pron"]: add(t, "W")
    for t in D["nums"]: add(t, "M")
    for who, t in D["dl"]: add(t, "M" if who == "s" else "W")   # 会話の相手は男声、自分の番は女声
    add("Bonjour, bienvenue à Paris.", "W")   # 設定で速さを変えたときの試聴
    add("Bravo !", "W")   # 家族からの応援・家族で会話の終わり
    return out


sem = asyncio.Semaphore(4)


async def fetch(text: str, voice: str) -> Path:
    p = CACHE / (voice + "_" + hashlib.md5((voice + "|" + text).encode("utf-8")).hexdigest()[:16] + ".mp3")
    if p.exists() and p.stat().st_size > 0:
        return p
    async with sem:
        for i in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate="-5%").save(str(p))
                if p.exists() and p.stat().st_size > 0:
                    return p
            except Exception as e:  # noqa: BLE001  取得失敗は再試行し、最後は落とす
                print("retry", voice, text[:30], e, file=sys.stderr)
                await asyncio.sleep(2 + i * 3)
    raise RuntimeError("tts failed: " + text[:40])


async def encode(text: str, who: str) -> str:
    p = await fetch(text, VOICE[who])
    d = miniaudio.decode(strip_id3(p.read_bytes()), output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1, sample_rate=SR)
    pcm = trim(bytes(d.samples)) + bytes(int(SR * 0.15) * 2)
    e = lameenc.Encoder(); e.set_bit_rate(KBPS); e.set_in_sample_rate(SR); e.set_channels(1); e.set_quality(2)
    return "data:audio/mpeg;base64," + base64.b64encode(e.encode(pcm) + e.flush()).decode("ascii")


async def run():
    items = load_items()
    print(f"{len(items)} items", flush=True)
    out = {}
    keys = list(items.items())
    for i in range(0, len(keys), 16):
        chunk = keys[i:i + 16]
        res = await asyncio.gather(*(encode(t, w) for t, w in chunk), return_exceptions=True)
        for (t, _), r in zip(chunk, res):
            if isinstance(r, Exception):
                print("FAILED", t, r, file=sys.stderr)
            else:
                out["t:" + fnv(t)] = r
        print(f"{min(i + 16, len(keys))} / {len(keys)}", flush=True)
    js = "/* tools/gen-audio.py が生成する。手で編集しない。\"t:<fnv>\"（文そのものの id）→ MP3 の data URI */\nwindow.DATA = window.DATA || {};\n"
    js += "window.DATA.audio = " + json.dumps(out, separators=(",", ":")) + ";\n"
    (ROOT / "data" / "audio.js").write_text(js, encoding="utf-8")
    print(f"audio {len(out)} items, {len(js) / 1024 / 1024:.1f} MB → data/audio.js")
    if len(out) < len(items):
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run())
