# Gambar bagikan (Open Graph, 1200x630) untuk setiap halaman: judul pendek halaman, keterangan, lencana TWH, dan mobil
# halaman itu di panggung mint. Daftar halaman dari src/og.json (ditulis node bangun.mjs).
#   node bangun.mjs && python -I alat/og.py && node bangun.mjs     (yang kedua memperbarui penanda versi ?v=)
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

AKAR = Path(__file__).resolve().parent.parent
PUB = AKAR / 'public'
DAFTAR = json.loads((AKAR / 'src' / 'og.json').read_text(encoding='utf-8'))
KELUAR = PUB / 'assets' / 'og'
KELUAR.mkdir(parents=True, exist_ok=True)

TEMPLAT = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(/assets/font/archivo.woff2) format('woff2');font-weight:400 800;font-stretch:75% 100%}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:A,sans-serif;color:#0F2433;
  background:radial-gradient(ellipse 46% 52% at 74% 60%,rgba(144,208,191,.75),transparent 72%),linear-gradient(180deg,#F7FAF9 0%,#E6EEEA 76%,#D6E3DE 76.3%,#EAF1EE 100%)}
.teks{position:absolute;left:72px;top:70px;width:560px}
.merek{display:flex;align-items:center;gap:14px;font-size:24px;font-weight:700;letter-spacing:-.01em}
.merek img{width:58px;height:auto}
h1{margin-top:58px;font-size:70px;line-height:.98;letter-spacing:-.045em;font-weight:700;font-stretch:88%}
p{margin-top:26px;font-size:24px;line-height:1.4;color:#3E5462}
.url{position:absolute;left:72px;bottom:54px;font-size:20px;font-weight:600;color:#1B4766}
.mobil{position:absolute;right:40px;bottom:112px;width:620px}
.mobil::after{content:"";position:absolute;left:8%;right:8%;bottom:-2%;height:12%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(15,36,51,.28),transparent 70%);z-index:-1}
.mobil img{width:100%;height:auto;display:block}
.pita{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#1B4766 0 70%,#90D0BF 70%)}
</style></head><body>
<div class="teks"><div class="merek"><img src="/assets/logo/lencana.webp" alt="">TWH Rent Car</div><h1>{judul}</h1><p>{sub}</p></div>
<div class="url">twhrentcar.arswordlab.com</div>
<div class="mobil"><img src="/assets/armada/{mobil}.webp" alt=""></div><div class="pita"></div>
</body></html>"""


async def main():
    import functools
    import http.server
    import socketserver
    import threading

    class Diam(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 4671), functools.partial(Diam, directory=str(PUB)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    sementara = PUB / '_og.html'
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': 1200, 'height': 630})
            for o in DAFTAR:
                html = TEMPLAT.replace('{judul}', o['judul']).replace('{sub}', o['sub']).replace('{mobil}', o['mobil'])
                sementara.write_text(html, encoding='utf-8')
                await pg.goto('http://127.0.0.1:4671/_og.html', wait_until='networkidle')
                await pg.evaluate('document.fonts.ready')
                await pg.screenshot(path=str(KELUAR / f"{o['kunci']}.jpg"), type='jpeg', quality=86)
                print('og', o['kunci'])
            await b.close()
    finally:
        sementara.unlink(missing_ok=True)
        srv.shutdown()


asyncio.run(main())
