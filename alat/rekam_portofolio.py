# Media untuk portofolio arswordlab.com (/portofolio/, kunci twh-rent-car): rekaman layar dan tangkapan layar situs
# live https://twhrentcar.vercel.app/, dengan ukuran dan nama yang sama seperti karya lain di sana
# (racik-paket-pos/tools/build-portofolio.py dan tools/cloudinary-media.py).
#
#   python -I alat/rekam_portofolio.py video <media-source>   -> video/karya/twh-rent-car.webm (VP9 1280x630),
#        .mp4 (H.264 960x472), -sm.mp4 (H.264 640x314), img/karya/twh-rent-car-poster.webp (bingkai di MULAI detik)
#   python -I alat/rekam_portofolio.py foto <media-source>    -> img/karya/twh-rent-car-960/-1440 (halaman depan),
#        -s1-960 (armada), -s2-960 (lembar pesan), -s3-960 (gantungan kunci), -mobile (390x844 @2x), -tablet (820x1180)
#
# Rekaman: Chromium tanpa layar dengan GPU, viewport 1280x630 @2x, bingkai dari CDP screencast (beserta waktunya),
# lalu ffmpeg menyusunnya jadi 24 fps. Kursor kecil disisipkan supaya klik dan gerakan terlihat. Turnya: intro lencana,
# klik mobil (lampu menyala), ganti Alphard dan Big Bus, gulir kalimat dan rute, armada geser samping, layanan, peta
# tiga kota, lalu gantungan kunci yang digoyang dan diklik.
import asyncio
import base64
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

URL = 'https://twhrentcar.vercel.app/'
MULAI = 2.9  # detik: intro selesai, mobil sudah di panggung (data-start dan poster di portofolio)
GPU = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']

KURSOR = """
addEventListener('DOMContentLoaded', () => {
  const k = document.createElement('div');
  k.id = 'kursor-rekam';
  k.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;'
    + 'border:2px solid rgba(255,255,255,.95);background:rgba(15,36,51,.55);box-shadow:0 2px 10px rgba(0,0,0,.35);'
    + 'z-index:2147483647;pointer-events:none;transition:transform .15s;transform:translate(-100px,-100px)';
  document.body.append(k);
  let x = -100, y = -100, s = 1;
  const tulis = () => { k.style.transform = `translate(${x}px,${y}px) scale(${s})`; };
  addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; tulis(); }, true);
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; tulis(); }, true);
  addEventListener('mousedown', () => { s = .7; tulis(); }, true);
  addEventListener('mouseup', () => { s = 1; tulis(); }, true);
});
"""

# gerak kursor halus di dalam halaman (pointermove + mousemove ke elemen di bawah titik, tiap frame), cepat walau
# WebGL sibuk; klik tetap memakai mouse Playwright
GESER = """
([x0, y0, x1, y1, ms]) => new Promise((ok) => {
  const t0 = performance.now();
  const e = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  (function langkah(now) {
    const t = Math.min(1, (now - t0) / ms), q = e(t), x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q;
    const el = document.elementFromPoint(x, y) || document.body;
    const o = { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'mouse', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointermove', o)); el.dispatchEvent(new MouseEvent('mousemove', o));
    if (t < 1) requestAnimationFrame(langkah); else ok();
  })(t0);
})
"""

# gulir halus ke y dalam ms (easing), memakai window.scrollTo tiap frame
GULIR = """
([y1, ms]) => new Promise((ok) => {
  const y0 = scrollY, t0 = performance.now();
  const e = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  (function langkah(now) {
    const t = Math.min(1, (now - t0) / ms); scrollTo(0, y0 + (y1 - y0) * e(t));
    if (t < 1) requestAnimationFrame(langkah); else ok();
  })(t0);
})
"""


def ffmpeg(*a):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a], check=True)


async def video(keluar: Path):
    kerja = Path(os.environ.get('TEMP', '.')) / 'twh-rekam'
    shutil.rmtree(kerja, ignore_errors=True)
    (kerja / 'f').mkdir(parents=True)
    bingkai = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU)
        ctx = await b.new_context(viewport={'width': 1280, 'height': 630}, device_scale_factor=2)
        await ctx.add_init_script(KURSOR)
        pg = await ctx.new_page()
        cdp = await ctx.new_cdp_session(pg)

        def terima(ev):
            bingkai.append((ev['metadata']['timestamp'], ev['data']))
            asyncio.ensure_future(cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']}))
        cdp.on('Page.screencastFrame', terima)
        await pg.goto('about:blank')
        await cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 92, 'everyNthFrame': 1})
        await pg.goto(URL, wait_until='domcontentloaded')
        t0 = time.time()
        jeda = lambda s: asyncio.sleep(s)
        geser = lambda *a: pg.evaluate(GESER, list(a))
        gulir = lambda y, ms: pg.evaluate(GULIR, [y, ms])
        atas = lambda sel: pg.evaluate(f"document.querySelector('{sel}').getBoundingClientRect().top + scrollY")
        await jeda(3.2)                                   # intro lencana, mobil masuk
        await geser(640, 560, 930, 420, 900)              # kursor ke mobil
        await pg.mouse.click(930, 420); await jeda(1.3)   # lampu depan menyala
        k = await pg.evaluate("(() => { const r = document.querySelector('[data-mobil=\"toyota-alphard\"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
        await geser(930, 420, k[0], k[1], 700); await pg.mouse.click(k[0], k[1]); await jeda(2.3)
        k2 = await pg.evaluate("(() => { const r = document.querySelector('[data-mobil=\"bus-besar\"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
        await geser(k[0], k[1], k2[0], k2[1], 500); await pg.mouse.click(k2[0], k2[1]); await jeda(2.2)
        await geser(k2[0], k2[1], 1180, 300, 500)
        # kalimat dan rute
        y = await atas('.pernyataan'); h = await pg.evaluate("document.querySelector('.pernyataan').offsetHeight")
        await gulir(y, 1100); await gulir(y + h - 630, 2600); await jeda(0.3)
        # armada geser samping
        y = await atas('.armada-geser'); h = await pg.evaluate("document.querySelector('.armada-geser').offsetHeight")
        await gulir(y, 900); await gulir(y + h - 630, 4200); await jeda(0.2)
        # layanan, lalu peta tiga kota
        await gulir(await atas('#layanan') - 40, 1200); await jeda(0.9)
        await gulir(await atas('#kota') + 60, 1400); await jeda(2.2)
        # gantungan kunci: digoyang kursor, kunci diklik
        y = await pg.evaluate("document.getElementById('ajakan').getBoundingClientRect().top + scrollY")
        await gulir(y, 1500); await jeda(1.0)
        await geser(1150, 330, 700, 360, 700); await geser(700, 360, 1100, 330, 600); await jeda(0.8)
        t = await pg.evaluate("(() => { const r = document.getElementById('ajakan').getBoundingClientRect(); const W = r.width, H = r.height, s = Math.min(W, H) * 0.13; return [W * 0.7 + s * 0.6, r.top + H * 0.2 + s * 2.4]; })()")
        await geser(1100, 330, t[0], t[1], 500); await pg.mouse.click(t[0], t[1]); await jeda(2.4)
        await cdp.send('Page.stopScreencast')
        print('rekaman', round(time.time() - t0, 1), 's,', len(bingkai), 'bingkai')
        await b.close()
    # bingkai -> daftar concat dengan lama tiap bingkai -> 24 fps
    awal = next(i for i, (ts, _) in enumerate(bingkai) if ts >= bingkai[0][0])  # semua
    daftar = []
    for i, (ts, data) in enumerate(bingkai[awal:]):
        f = kerja / 'f' / f'{i:05d}.jpg'
        f.write_bytes(base64.b64decode(data))
        daftar.append((f, ts))
    # buang bingkai sebelum halaman TWH tampil (about:blank / putih): mulai dari bingkai pertama yang tidak polos
    while daftar and Image.open(daftar[0][0]).convert('L').getextrema()[1] - Image.open(daftar[0][0]).convert('L').getextrema()[0] < 8:
        daftar.pop(0)
    with open(kerja / 'daftar.txt', 'w', encoding='utf-8') as d:
        for i, (f, ts) in enumerate(daftar):
            lama = (daftar[i + 1][1] - ts) if i + 1 < len(daftar) else 1 / 24
            d.write(f"file '{f.as_posix()}'\nduration {max(lama, 0.001):.4f}\n")
        d.write(f"file '{daftar[-1][0].as_posix()}'\n")
    induk = kerja / 'induk.mp4'
    ffmpeg('-f', 'concat', '-safe', '0', '-i', str(kerja / 'daftar.txt'), '-vf', 'fps=24,scale=1280:630:flags=lanczos',
           '-c:v', 'libx264', '-crf', '10', '-preset', 'slow', '-pix_fmt', 'yuv420p', str(induk))
    v = keluar / 'video' / 'karya'; im = keluar / 'img' / 'karya'
    v.mkdir(parents=True, exist_ok=True); im.mkdir(parents=True, exist_ok=True)
    ffmpeg('-i', str(induk), '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-deadline', 'good',
           '-cpu-used', '2', '-an', str(v / 'twh-rent-car.webm'))
    ffmpeg('-i', str(induk), '-vf', 'scale=960:472:flags=lanczos', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(v / 'twh-rent-car.mp4'))
    ffmpeg('-i', str(induk), '-vf', 'scale=640:314:flags=lanczos', '-c:v', 'libx264', '-crf', '25', '-preset', 'slow',
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(v / 'twh-rent-car-sm.mp4'))
    ffmpeg('-ss', str(MULAI), '-i', str(induk), '-frames:v', '1', str(kerja / 'poster.png'))
    Image.open(kerja / 'poster.png').convert('RGB').save(im / 'twh-rent-car-poster.webp', 'WEBP', quality=82, method=6)
    shutil.copy(induk, kerja.parent / 'twh-rekam-induk.mp4')
    print('video selesai; induk disalin ke', kerja.parent / 'twh-rekam-induk.mp4')


async def foto(keluar: Path):
    im = keluar / 'img' / 'karya'
    im.mkdir(parents=True, exist_ok=True)
    sementara = Path(os.environ.get('TEMP', '.')) / 'twh-foto'
    shutil.rmtree(sementara, ignore_errors=True); sementara.mkdir()

    def simpan(src, nama, lebar):
        g = Image.open(src).convert('RGB')
        g = g.resize((lebar, round(g.height * lebar / g.width)), Image.LANCZOS)
        g.save(im / nama, 'WEBP', quality=82, method=6)
        print(nama, g.size)

    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU)

        async def halaman(w, h, dsf, mobile=False):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dsf, is_mobile=mobile, has_touch=mobile)
            await ctx.add_init_script("try{sessionStorage.setItem('twh-intro','1')}catch(e){}")
            pg = await ctx.new_page()
            await pg.goto(URL, wait_until='load'); await pg.wait_for_timeout(2600)
            return ctx, pg

        ctx, pg = await halaman(1440, 900, 2)
        await pg.screenshot(path=str(sementara / 'depan.png'))
        simpan(sementara / 'depan.png', 'twh-rent-car-1440.webp', 1440); simpan(sementara / 'depan.png', 'twh-rent-car-960.webp', 960)
        # armada: sepertiga jalan geser samping
        y = await pg.evaluate("(() => { const s = document.querySelector('.armada-geser'); return s.getBoundingClientRect().top + scrollY + (s.offsetHeight - innerHeight) * .38; })()")
        await pg.evaluate(f'scrollTo(0, {y})'); await pg.wait_for_timeout(2200)
        await pg.screenshot(path=str(sementara / 's1.png')); simpan(sementara / 's1.png', 'twh-rent-car-s1-960.webp', 960)
        # lembar pesan: Alphard, tiga hari, ke bandara
        await pg.evaluate('scrollTo(0, 0)'); await pg.wait_for_timeout(900)
        await pg.evaluate("""(() => {
          document.querySelector('.hero-isi [data-pesan]').click();
          const f = document.getElementById('lembar-form');
          f.elements.mobil.value = 'toyota-alphard';
          const d = new Date(Date.now() + 7 * 864e5), iso = (x) => x.toISOString().slice(0, 10);
          f.elements.mulai.value = iso(d); f.elements.selesai.value = iso(new Date(d.getTime() + 3 * 864e5));
          f.querySelector('[data-chips="tempat"] [data-nilai="Bandara"]').click();
          f.elements.alamat.value = 'Terminal 3 Soekarno-Hatta, pukul 09.30';
          f.elements.nama.value = 'Rina';
          f.dispatchEvent(new Event('input', { bubbles: true }));
          f.elements.mobil.dispatchEvent(new Event('input', { bubbles: true }));
        })()""")
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=str(sementara / 's2.png')); simpan(sementara / 's2.png', 'twh-rent-car-s2-960.webp', 960)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        # gantungan kunci di kaki
        await pg.evaluate("scrollTo(0, document.getElementById('ajakan').getBoundingClientRect().top + scrollY)"); await pg.wait_for_timeout(1500)
        await pg.mouse.move(1150, 330); await pg.mouse.move(800, 360, steps=12); await pg.wait_for_timeout(700)
        await pg.screenshot(path=str(sementara / 's3.png')); simpan(sementara / 's3.png', 'twh-rent-car-s3-960.webp', 960)
        await ctx.close()

        ctx, pg = await halaman(390, 844, 2, mobile=True)
        await pg.screenshot(path=str(sementara / 'hp.png')); simpan(sementara / 'hp.png', 'twh-rent-car-mobile.webp', 780)
        await ctx.close()
        ctx, pg = await halaman(820, 1180, 1)
        await pg.screenshot(path=str(sementara / 'tablet.png')); simpan(sementara / 'tablet.png', 'twh-rent-car-tablet.webp', 820)
        await ctx.close()
        await b.close()


if __name__ == '__main__':
    mode, keluar = sys.argv[1], Path(sys.argv[2])
    asyncio.run(video(keluar) if mode == 'video' else foto(keluar))
