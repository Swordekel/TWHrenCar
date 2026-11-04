# Membetulkan kesalahan tulisan pada foto armada hasil ChatGPT (sumber-foto/armada/<slug>.png, dikirim pemilik
# 2026-11-04). Berkas aslinya disimpan sekali sebagai <slug>-chatgpt.png; skrip ini selalu mulai dari salinan itu.
#   python -I alat/rapikan_ai.py
# - Innova Zenix: plat depan tertulis "INNOVA ZENIK" dengan satu baris huruf acak di atasnya -> plat dihitamkan dan
#   ditulis ulang "INNOVA ZENIX" (Archivo tebal, putih).
# - Isuzu Elf: tulisan samping "ISUZU" dan baris acak "XEN LONGDEL NLR JOURNEY" -> dihapus (tiap baris diisi
#   warna bodi dari kiri ke kanan bidang tulisan).
import io
import shutil
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

AKAR = Path(__file__).resolve().parent.parent
ARM = AKAR / 'sumber-foto' / 'armada'


def asli(slug):
    p, cad = ARM / f'{slug}.png', ARM / f'{slug}-chatgpt.png'
    if not cad.exists():
        shutil.copy(p, cad)
    return Image.open(cad).convert('RGBA'), p


def huruf(ukuran, lebar=92):
    f = TTFont(AKAR / 'public' / 'assets' / 'font' / 'archivo.woff2')
    f.flavor = None
    f = instantiateVariableFont(f, {'wght': 800, 'wdth': lebar})
    b = io.BytesIO()
    f.save(b)
    b.seek(0)
    return ImageFont.truetype(b, ukuran)


def isi_lubang(a, m, langkah=(1.5, 3, 6, 12, 24)):
    """Isi piksel bertopeng m dengan rata-rata tetangga yang tidak bertopeng (makin jauh, makin lebar)."""
    out = a.copy()
    tahu = (~m).astype(np.float32)
    sisa = m.copy()
    for s in langkah:
        bobot = ndimage.gaussian_filter(tahu, s)
        for c in range(3):
            nilai = ndimage.gaussian_filter(out[..., c] * tahu, s) / np.maximum(bobot, 1e-4)
            out[..., c] = np.where(sisa & (bobot > 0.05), nilai, out[..., c])
        sisa &= ~(bobot > 0.05)
        if not sisa.any():
            break
    return out


def zenix():
    im, tujuan = asli('toyota-innova-zenix')
    a = np.asarray(im).astype(np.float32)
    # plat: daerah gelap di sekitar (180..355, 588..646); batasnya dicari dari piksel gelap
    x0, x1, y0, y1 = 150, 380, 575, 660
    kot = a[y0:y1, x0:x1, :3].mean(2)
    gelap = kot < 60
    kol = np.where(gelap.mean(0) > 0.5)[0]
    bar = np.where(gelap.mean(1) > 0.45)[0]
    px0, px1 = x0 + kol.min(), x0 + kol.max()
    py0, py1 = y0 + bar.min(), y0 + bar.max()
    hitam = np.median(a[py0:py1, px0:px1, :3].reshape(-1, 3)[gelap[bar.min():bar.max(), kol.min():kol.max()].reshape(-1)], 0)
    d = ImageDraw.Draw(im)
    d.rectangle([px0 + 3, py0 + 3, px1 - 3, py1 - 3], fill=tuple(int(v) for v in hitam) + (255,))
    w, h = px1 - px0, py1 - py0
    f1, f2 = huruf(round(h * 0.36)), huruf(round(h * 0.31))
    for teks, f, cy in (('INNOVA', f1, py0 + h * 0.36), ('ZENIX', f2, py0 + h * 0.74)):
        bb = d.textbbox((0, 0), teks, font=f)
        d.text((px0 + (w - (bb[2] - bb[0])) / 2 - bb[0], cy - (bb[3] - bb[1]) / 2 - bb[1]), teks, font=f, fill=(246, 246, 246, 255))
    im.save(tujuan, optimize=True)
    print('zenix: plat', (px0, py0, px1, py1))


def elf():
    # bodi di sekitar tulisan adalah bidang putih yang halus: tiap baris diisi garis lurus antara warna bodi tepat di
    # kiri dan di kanan bidang tulisan (garis lipatan bodi ikut tersambung), lalu tepinya dilunakkan
    im, tujuan = asli('isuzu-elf')
    a = np.asarray(im).astype(np.float32)
    x0, x1, y0, y1 = 1452, 1662, 150, 226
    def sisi(xa, xb):
        # rata-rata piksel bodi yang buram saja (di sudut atap, sisi kanan bisa sudah latar bening)
        k = a[y0:y1, xa:xb]
        w = (k[..., 3] > 250).astype(np.float32)[..., None]
        return (k[..., :3] * w).sum(1) / np.maximum(w.sum(1), 1), w.sum(1)[:, 0] > 0
    kiri, ok_k = sisi(x0 - 8, x0 - 2)
    kanan, ok_n = sisi(x1 + 2, x1 + 8)
    kiri[~ok_k], kanan[~ok_n] = kanan[~ok_k], kiri[~ok_n]
    t = np.linspace(0, 1, x1 - x0)[None, :, None]
    isi = kiri[:, None, :] * (1 - t) + kanan[:, None, :] * t
    lama = a[y0:y1, x0:x1, :3]
    # campur di tepi kiri-kanan dan atas-bawah supaya tidak ada sambungan
    wx = np.clip(np.minimum(np.arange(x1 - x0), np.arange(x1 - x0)[::-1]) / 6, 0, 1)[None, :, None]
    wy = np.clip(np.minimum(np.arange(y1 - y0), np.arange(y1 - y0)[::-1]) / 3, 0, 1)[:, None, None]
    w = wx * wy
    a[y0:y1, x0:x1, :3] = isi * w + lama * (1 - w)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA').save(tujuan, optimize=True)
    print('elf: tulisan samping dihapus')


zenix()
elf()
