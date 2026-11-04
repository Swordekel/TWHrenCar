# Foto armada TWH Rent Car: sumber-foto/armada/*.jpeg (foto produk berlatar putih dari klien) -> mobil tanpa latar.
#   python -I alat/foto.py            -> public/assets/armada/<slug>.webp (lebar 1400, untuk hero dan halaman mobil)
#                                         dan <slug>-720.webp (kartu), plus src/armada-ukuran.json (rasio tiap foto)
#   python -I alat/foto.py --cek      -> juga sumber-foto/cek-armada.png: semua hasil di atas latar mint dan navy
#
# Latar putih yang tersambung ke tepi foto jadi bening; bayangan di lantai foto jadi hitam bening (ikut terlihat di
# atas warna apa pun). Mobil putih dan perak berbatasan dengan latar yang sama putihnya, jadi latar dikenali dengan
# batas yang ketat (hampir putih murni dan tanpa warna) lalu siluet mobil ditutup (lubang di dalamnya diisi), dan baru
# di luar siluet itulah bayangan dihitung. Foto kecil diperbesar (Lanczos) lalu dipertajam sedikit.
# Foto asli yang lebih tajam dari klien cukup diletakkan di sumber-foto/armada/ dengan nama berkas yang sama. Foto yang
# latarnya sudah bening (PNG) diletakkan sebagai sumber-foto/armada/<slug>.png dan dipakai apa adanya.
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

AKAR = Path(__file__).resolve().parent.parent
SUMBER = AKAR / 'sumber-foto' / 'armada'
TUJUAN = AKAR / 'public' / 'assets' / 'armada'

# slug -> (berkas, opsi). hapus = kotak (x0, y0, x1, y1 pecahan) yang diisi warna latar sebelum diproses (logo merek
# di pojok foto); kanan_terpotong = mobilnya terpotong tepi kanan foto (situs menempelkannya ke tepi kanan kartu)
ARMADA = {
    'toyota-avanza': ('TOYOTA AVANZA.jpeg', {}),
    'daihatsu-xenia': ('DAIHATSU XENIA.jpeg', {}),
    'toyota-innova-reborn': ('TOYOTA INNOVA REBORN.jpeg', {}),
    'toyota-innova-zenix': ('TOYOTA INNOVA ZENIX.jpeg', {}),
    'toyota-alphard': ('TOYOTA ALPHARD.jpeg', {}),
    'toyota-fortuner': ('TOYOTA FORTUNER.jpeg', {}),
    'toyota-hiace': ('TOYOTA HIACE.jpeg', {}),
    'isuzu-elf': ('ISUZU ELF.jpeg', {'hapus': (0.70, 0.0, 1.0, 0.13), 'kanan_terpotong': True, 'toleransi': 0.045}),
    'bus-medium': ('MEDIUM BUS.jpeg', {}),
    'bus-besar': ('BIG BUS.jpeg', {'pita_lantai': 0.07, 'kurung': False}),  # bumper putih menyentuh lantai
}

LUM = np.array([0.299, 0.587, 0.114], np.float32)


def bidang_latar(a, lum):
    """Terang latar per piksel: bidang miring yang dicocokkan ke piksel tepi foto (latar Elf bergradasi abu-abu)."""
    h, w = lum.shape
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    tepi = np.zeros((h, w), bool)
    tepi[:6], tepi[-6:], tepi[:, :6], tepi[:, -6:] = True, True, True, True
    # hanya tepi yang terang (bukan mobil yang menyentuh tepi)
    tepi &= lum >= np.percentile(lum[tepi], 35)
    A = np.stack([xs[tepi] / w, ys[tepi] / h, np.ones(tepi.sum(), np.float32)], 1)
    b = lum[tepi]
    # diulang: piksel tepi yang jauh dari bidang (mobil yang terpotong tepi foto) dibuang lalu dicocokkan lagi
    for _ in range(3):
        k, *_ = np.linalg.lstsq(A, b, rcond=None)
        dekat = np.abs(A @ k - b) < 0.01
        if dekat.sum() < 50:
            break
        A, b = A[dekat], b[dekat]
    return np.clip(k[0] * xs / w + k[1] * ys / h + k[2], 0.5, 1.0)


def potong_latar(im, opsi):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    h, w, _ = a.shape
    lum = a @ LUM
    if 'hapus' in opsi:
        x0, y0, x1, y1 = opsi['hapus']
        bg0 = bidang_latar(a, lum)
        sl = (slice(int(y0 * h), int(y1 * h)), slice(int(x0 * w), int(x1 * w)))
        a[sl] = bg0[sl][..., None]
        lum = a @ LUM
    bg = bidang_latar(a, lum)
    rel = lum / bg                              # 1 = sama terang dengan latar
    putih = a.min(2) / bg                       # kanal tergelap dibanding latar: bodi putih jarang mencapai 0,985
    sat = a.max(2) - a.min(2)

    def dari_tepi(m):
        lab, _ = ndimage.label(m)
        t = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        return np.isin(lab, t[t > 0])

    # 1) latar ketat: seputih latar (tidak lebih terang, tidak lebih gelap dari 1,5%) dan tanpa warna, tersambung ke tepi
    # toleransi = boleh lebih gelap dari latar sebanyak itu (latar bergradasi); tidak pernah lebih terang dari 1,2%
    # (bodi putih Elf lebih terang dari latar abu-abunya)
    tol = opsi.get('toleransi', 0.015)
    latar = dari_tepi((putih > 1 - tol) & (putih < 1.012) & (rel > 1 - tol) & (rel < 1.012) & (sat < 0.03 + tol / 2))
    # 2) bayangan lantai: di pita bawah siluet sementara, abu-abu netral yang berubah pelan (tanpa garis tegas) dan
    #    tersambung ke latar; ini yang jadi hitam bening
    sem = ndimage.binary_fill_holes(~latar)
    baris = np.where(sem.any(1))[0]
    y = np.arange(h)[:, None]
    atas, bawah = (baris[0], baris[-1]) if len(baris) else (0, h)
    pita = y > bawah - (bawah - atas) * 0.2
    gy, gx = np.gradient(ndimage.gaussian_filter(lum, 1.2))
    halus = np.hypot(gx, gy) < 0.03
    bayang_m = dari_tepi(latar | (pita & halus & (sat < 0.06) & (rel > 0.35))) & ~latar
    # lantai foto di bawah mobil (abu-abu sangat muda, sering bergradasi tajam dekat ban): per kolom, dari bawah ke atas,
    # piksel netral yang terang (atau latar) sampai bertemu yang gelap (kolong, ban) atau berwarna; hanya di pita bawah
    lantai_c = ((rel > opsi.get('lantai', 0.5)) & (sat < 0.07)) | latar
    run = np.cumprod(lantai_c[::-1].astype(np.uint8), axis=0)[::-1].astype(bool)
    pita_l = y > bawah - (bawah - atas) * opsi.get('pita_lantai', 0.17)
    bayang_m |= run & pita_l & ~latar
    # sisa lantai putih yang terkurung bayangan (foto kecil seperti Fortuner): komponen terang dan netral di pita bawah
    # yang bersinggungan dengan latar atau bayangan lantai; pelek ban tidak, karena dikelilingi ban yang gelap
    calon = pita_l & (rel > 0.78) & (sat < 0.06) & ~latar & ~bayang_m
    lab3, n3 = ndimage.label(calon)
    if n3 and opsi.get('kurung', True):
        tetangga = ndimage.binary_dilation(latar | bayang_m, iterations=2)
        kena = np.unique(lab3[tetangga & calon])
        bayang_m |= np.isin(lab3, kena[kena > 0])
    # 3) siluet mobil: sisanya, lubang diisi, bintik kecil dibuang
    sil = ndimage.binary_fill_holes(~(latar | bayang_m))
    sil = ndimage.binary_opening(sil, iterations=2)
    lab2, n = ndimage.label(sil)
    if n:
        luas = ndimage.sum(np.ones_like(lum), lab2, range(1, n + 1))
        sil = np.isin(lab2, [i + 1 for i, s in enumerate(luas) if s >= luas.max() * 0.04])
    # tepi putih tipis (sisa latar JPEG) dikikis satu piksel
    sil = ndimage.binary_erosion(sil, iterations=1)
    gelap = np.clip((1 - rel) * 1.6, 0, 0.7) ** 1.1
    bayang = np.where(~sil, gelap, 0) * ndimage.gaussian_filter(bayang_m.astype(np.float32), 1.5)
    # tepi mobil sedikit dilunakkan
    lunak = ndimage.gaussian_filter(sil.astype(np.float32), 0.6)
    alfa = np.clip(lunak + (1 - lunak) * bayang, 0, 1)
    rgb = a * (lunak / np.maximum(alfa, 1e-4))[..., None]
    out = np.dstack([np.clip(rgb, 0, 1), alfa])
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA'), sil


def potong_kosong(im, sil, kanan_terpotong):
    al = np.asarray(im)[..., 3]
    ys, xs = np.where(al > 10)
    sy, sx = np.where(sil)
    pad = 6
    x0 = max(min(xs.min(), sx.min()) - pad, 0)
    x1 = im.width if kanan_terpotong else min(max(xs.max(), sx.max()) + pad + 1, im.width)
    y0 = max(sy.min() - pad, 0)
    y1 = min(ys.max() + pad + 1, im.height)
    return im.crop((x0, y0, x1, y1))


def simpan(im, jalur, lebar, kualitas=86):
    if im.width != lebar:
        im = im.resize((lebar, round(im.height * lebar / im.width)), Image.LANCZOS)
        if lebar > 800:
            # diperbesar: pertajam warna saja (alfa tetap halus)
            rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
            rgb.putalpha(im.getchannel('A'))
            im = rgb
    im.save(jalur, 'WEBP', quality=kualitas, method=6, exact=False)
    return im


def main():
    TUJUAN.mkdir(parents=True, exist_ok=True)
    ukuran = {}
    hasil = []
    for slug, (berkas, opsi) in ARMADA.items():
        png = SUMBER / f'{slug}.png'
        if png.exists():
            # foto yang latarnya sudah bening (mis. dibuat pemilik lewat ChatGPT): cukup dipangkas
            im = Image.open(png).convert('RGBA')
            sil = np.asarray(im)[..., 3] > 128
            rgba = potong_kosong(im, sil, False)
            opsi = {}
        else:
            im = Image.open(SUMBER / berkas)
            rgba, sil = potong_latar(im, opsi)
            rgba = potong_kosong(rgba, sil, opsi.get('kanan_terpotong'))
        besar = simpan(rgba, TUJUAN / f'{slug}.webp', 1400)
        simpan(rgba, TUJUAN / f'{slug}-720.webp', 720)
        ukuran[slug] = {'w': besar.width, 'h': besar.height, 'asli': im.width, 'kanan': bool(opsi.get('kanan_terpotong'))}
        hasil.append((slug, besar))
        print(slug, im.size, '->', besar.size)
    (AKAR / 'src' / 'armada-ukuran.json').write_text(json.dumps(ukuran, indent=1) + '\n', encoding='utf-8')
    if '--cek' in sys.argv:
        W, H = 760, 330
        lembar = Image.new('RGB', (W * 2, H * len(hasil)), (0, 0, 0))
        for i, (slug, im) in enumerate(hasil):
            for j, warna in enumerate([(144, 208, 191), (16, 38, 56)]):
                kotak = Image.new('RGB', (W, H), warna)
                k = im.copy()
                k.thumbnail((W - 40, H - 30))
                kotak.paste(k, ((W - k.width) // 2, H - 15 - k.height), k)
                lembar.paste(kotak, (j * W, i * H))
        lembar.save(AKAR / 'sumber-foto' / 'cek-armada.png')
        print('cek: sumber-foto/cek-armada.png')


if __name__ == '__main__':
    main()
