# Peta titik Pulau Jawa (dan Madura, Bali di ujung timur) untuk bagian "Tiga kota" di beranda dan /lokasi/: daratan
# sebagai titik-titik berpola sarang lebah, dari Natural Earth 1:50m (domain publik, sumber-foto/peta/ne_50m_land.geojson).
# Proyeksi equirectangular, bujur 105,0–115,0, lintang -9,0 sampai -5,6.
#   python -I alat/peta.py      -> src/peta.json  (lebar, tinggi, titik [[x, y], ...], tempat {kota: [x, y]})
import json
import pathlib

import numpy as np

AKAR = pathlib.Path(__file__).resolve().parent.parent
B0, B1, L0, L1, LANGKAH = 105.0, 115.0, -9.0, -5.6, 0.075
S = 120.0  # piksel per derajat
LEBAR, TINGGI = (B1 - B0) * S, (L1 - L0) * S
data = json.loads((AKAR / 'sumber-foto/peta/ne_50m_land.geojson').read_text(encoding='utf-8'))


def xy(lon, lat):
    return [round((lon - B0) * S, 1), round((L1 - lat) * S, 1)]


cincin = []
for f in data['features']:
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        for r in poly:
            a = np.array(r)
            if a[:, 0].max() < B0 - 1 or a[:, 0].min() > B1 + 1 or a[:, 1].max() < L0 - 1 or a[:, 1].min() > L1 + 1:
                continue
            cincin.append(a)


def di_darat(lon, lat):
    dalam = False
    for a in cincin:
        if lon < a[:, 0].min() or lon > a[:, 0].max() or lat < a[:, 1].min() or lat > a[:, 1].max():
            continue
        x, y = a[:, 0], a[:, 1]
        x2, y2 = np.roll(x, -1), np.roll(y, -1)
        c = ((y > lat) != (y2 > lat)) & (lon < (x2 - x) * (lat - y) / (y2 - y + 1e-12) + x)
        if np.count_nonzero(c) % 2:
            dalam = not dalam
    return dalam


titik = []
lat, baris = L1 - LANGKAH / 2, 0
while lat > L0:
    lon = B0 + LANGKAH / 2 + (LANGKAH / 2 if baris % 2 else 0)
    while lon < B1:
        if di_darat(lon, lat):
            titik.append(xy(lon, lat))
        lon += LANGKAH
    lat -= LANGKAH
    baris += 1

TEMPAT = {'jakarta': xy(106.8456, -6.2088), 'malang': xy(112.6326, -7.9666), 'surabaya': xy(112.7521, -7.2575)}
hasil = {'lebar': round(LEBAR), 'tinggi': round(TINGGI), 'langkah': round(LANGKAH * S, 2), 'titik': titik, 'tempat': TEMPAT}
(AKAR / 'src/peta.json').write_text(json.dumps(hasil, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
print('titik', len(titik), 'ukuran', round(LEBAR), round(TINGGI))
