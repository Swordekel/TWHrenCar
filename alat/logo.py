# Logo TWH Rent Car dari berkas klien (sumber-foto/logo/twh-asli.png: tangkapan layar 720x1424, lencana segi enam di
# tengah, latar hitam di sudut-sudutnya). Jalankan dari folder repo:  python -I alat/logo.py
#   public/assets/logo/lencana.webp   lencana utuh berlatar bening (intro, kaki, gantungan kunci WebGL)
#   public/assets/logo/lencana.png    sama, PNG 512 (logo di data terstruktur dan gambar bagikan)
#   public/favicon.png (64), public/apple-touch-icon.png (180), public/assets/logo/ikon-512.png
#       tanda kecil: segi enam navy, isi mint, "TWH" (Archivo tebal); detail lencana tidak terbaca sekecil favicon
# Rasio segi enam dicetak untuk tanda SVG di bangun.mjs.
import io
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

AKAR = Path(__file__).resolve().parent.parent
LOGO = AKAR / 'public' / 'assets' / 'logo'
LOGO.mkdir(parents=True, exist_ok=True)
MINT, NAVY, PUTIH = (144, 208, 191), (27, 71, 102), (255, 255, 255)

asli = Image.open(AKAR / 'sumber-foto' / 'logo' / 'twh-asli.png').convert('RGB')
a = np.asarray(asli).astype(np.float32)
# baris lencana: baris yang ujung kirinya hitam (di atas dan di bawahnya pita mint polos)
hitam = a[:, 2].max(1) < 30
ys = np.where(hitam)[0]
y0, y1 = ys.min(), ys.max() + 1
lenc = a[y0:y1]
# bening: piksel hitam sudut yang tersambung ke tepi
gelap = lenc.max(2) < 40
lab, _ = ndimage.label(gelap)
t = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
luar = np.isin(lab, t[t > 0])
alfa = 1 - ndimage.gaussian_filter(luar.astype(np.float32), 0.8)
alfa[luar] = np.minimum(alfa[luar], 0.0)
alfa = ndimage.gaussian_filter(np.where(luar, 0.0, 1.0), 0.6)
rgba = np.dstack([lenc / 255, alfa])
im = Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
im = im.crop(bb)
im.save(LOGO / 'lencana.webp', 'WEBP', quality=92, method=6)
k = im.resize((512, round(im.height * 512 / im.width)), Image.LANCZOS)
k.save(LOGO / 'lencana.png', optimize=True)
print('lencana', im.size)

# segi enam lencana: runcing di atas dan bawah, sisi kiri-kanan tegak; tinggi/lebar dicetak untuk tanda SVG
print('rasio tinggi/lebar %.4f' % (im.height / im.width))
RASIO = im.height / im.width

# font Archivo tebal untuk tanda kecil
f = TTFont(AKAR / 'public' / 'assets' / 'font' / 'archivo.woff2')
f.flavor = None
f = instantiateVariableFont(f, {'wght': 800, 'wdth': 100})
buf = io.BytesIO()
f.save(buf)


def tanda(n, latar=None, pad=0.0):
    s = 4  # digambar 4x lalu diperkecil (tepi halus)
    N = n * s
    kanvas = Image.new('RGBA', (N, N), latar or (0, 0, 0, 0))
    d = ImageDraw.Draw(kanvas)
    h = N * (1 - 2 * pad)
    w = h / RASIO
    ox, oy = (N - w) / 2, (N - h) / 2

    def heks(i):
        # segi enam runcing atas-bawah, menyusut i piksel ke dalam
        x0, x1, y0, y1 = ox + i, ox + w - i, oy + i * 1.15, oy + h - i * 1.15
        hh = y1 - y0
        return [(ox + w / 2, y0), (x1, y0 + hh * 0.25), (x1, y0 + hh * 0.75), (ox + w / 2, y1), (x0, y0 + hh * 0.75), (x0, y0 + hh * 0.25)]

    d.polygon(heks(0), fill=NAVY)
    d.polygon(heks(w * 0.07), fill=MINT)
    buf.seek(0)
    fnt = ImageFont.truetype(buf, round(w * 0.31))
    tb = d.textbbox((0, 0), 'TWH', font=fnt)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    d.text((ox + (w - tw) / 2 - tb[0], oy + (h - th) / 2 - tb[1]), 'TWH', font=fnt, fill=NAVY)
    return kanvas.resize((n, n), Image.LANCZOS)


tanda(64).save(AKAR / 'public' / 'favicon.png', optimize=True)
tanda(180, latar=MINT + (255,), pad=0.12).convert('RGB').save(AKAR / 'public' / 'apple-touch-icon.png', optimize=True)
tanda(512, latar=MINT + (255,), pad=0.12).convert('RGB').save(LOGO / 'ikon-512.png', optimize=True)
print('favicon, apple-touch-icon, ikon-512 ditulis')
