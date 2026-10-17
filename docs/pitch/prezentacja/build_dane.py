"""Buduje dane.js dla prezentacji: ścieżki SVG mapy syren, macierz JTBD i siatkę zadań z danymi.

Uruchom z katalogu repozytorium:  python -I docs/pitch/prezentacja/build_dane.py
Tylko biblioteka standardowa. Źródła: dane/soia-warszawa/, dane/adresy/, kontekst/jtbd-kryzys-warszawa.md.
"""
import csv
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOIA = ROOT / 'dane' / 'soia-warszawa'
OUT = Path(__file__).with_name('dane.js')

W = 1000  # szerokość viewBox mapy


def load(p):
    return json.load(open(p, encoding='utf-8'))


def rings(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        for ring in poly:
            yield ring


granica = load(SOIA / 'granica_warszawy.geojson')['features'][0]['geometry']
xs = [c[0] for r in rings(granica) for c in r]
ys = [c[1] for r in rings(granica) for c in r]
lon0, lon1, lat0, lat1 = min(xs), max(xs), min(ys), max(ys)
kx = math.cos(math.radians((lat0 + lat1) / 2))
scale = W / ((lon1 - lon0) * kx)
H = round((lat1 - lat0) * scale, 1)


def proj(lon, lat):
    return ((lon - lon0) * kx * scale, (lat1 - lat) * scale)


def dp(pts, tol):
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: idx + 1], tol)[:-1] + dp(pts[idx:], tol)


def path(geom, tol=0.7):
    out = []
    for r in rings(geom):
        p = [proj(*c[:2]) for c in r]
        h = len(p) // 2  # zamknięty pierścień: upraszczamy dwie połowy osobno
        pts = dp(p[: h + 1], tol)[:-1] + dp(p[h:], tol)
        if len(pts) < 4:
            continue
        out.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
    return ''.join(out)


cyfrowe = load(SOIA / 'analiza' / 'syreny_zasieg_tylko_cyfrowe.geojson')['features'][0]['geometry']
utracony = load(SOIA / 'analiza' / 'syreny_blackout_utracony_zasieg.geojson')['features'][0]['geometry']

podsum = {r['']: float(r['wartosc']) for r in csv.DictReader(open(SOIA / 'analiza' / 'syreny_blackout_podsumowanie.csv', encoding='utf-8'))}
dzielnice = list(csv.DictReader(open(SOIA / 'analiza' / 'syreny_blackout_dzielnice.csv', encoding='utf-8')))
top = sorted(dzielnice, key=lambda r: -float(r['spadek_pp']))[:4]

# środki dzielnic jako średnia punktów adresowych (do podpisów na mapie)
sumy = {}
for r in csv.DictReader(open(ROOT / 'dane' / 'adresy' / 'punkty_adresowe_wgs84.csv', encoding='utf-8')):
    s = sumy.setdefault(r['dzielnica'], [0.0, 0.0, 0])
    s[0] += float(r['lon']); s[1] += float(r['lat']); s[2] += 1
etykiety = []
for r in top:
    lon, lat, n = sumy[r['dzielnica']]
    x, y = proj(lon / n, lat / n)
    etykiety.append({'nazwa': r['dzielnica'], 'x': round(x, 1), 'y': round(y, 1),
                     'przed': float(r['zasieg_wszystkie']), 'po': float(r['zasieg_cyfrowe']), 'spadek': float(r['spadek_pp'])})

mapa = {
    'w': W, 'h': H,
    'granica': path(granica, 0.5),
    'cyfrowe': path(cyfrowe),
    'utracony': path(utracony),
    'przed': podsum['adresy_zasieg_wszystkie_pct'],
    'po': podsum['adresy_zasieg_tylko_cyfrowe_pct'],
    'adresy': int(podsum['adresy_w_granicy']),
    'traci': int(podsum['adresy_traca_zasieg']),
    'dzielnice': etykiety,
}

# --- JTBD: zadania mieszkańców (segment M albo „wszyscy”) z części 6 ---
GRUPY = [
    ('M1', 'Rodzic dojeżdżający do pracy'),
    ('M2', 'Senior lub osoba z niepełnosprawnością'),
    ('M3', 'Osoba przewlekle chora'),
    ('M4', 'Osoba nieznająca polskiego'),
    ('M5', 'Młoda osoba bez zapasów'),
    ('M6', 'Osoba w drodze'),
]
FAZY = [('F0', 'dni przed'), ('F1', '0–15 min'), ('F2', '15–60 min'), ('F3', '1–6 h'),
        ('F4', '6–24 h'), ('F5', '1–3 dni'), ('F6', '3+ dni')]

# Zbiory danych: offline = w paczce w telefonie, live = wymaga sieci.
ZBIORY = {
    'soia': ('Syreny SOIA (PSP)', 'offline'),
    'psp': ('Miejsca schronienia (PSP)', 'offline'),
    'adresy': ('Punkty adresowe (WFS)', 'offline'),
    'metro': ('Wejścia do metra (WFS)', 'offline'),
    'aed': ('Defibrylatory AED', 'offline'),
    'apteki': ('Apteki (WFS)', 'offline'),
    'sor': ('SOR (dane.gov.pl)', 'offline'),
    'toalety': ('Toalety', 'offline'),
    'gtfs': ('Przystanki i linie (GTFS)', 'offline'),
    'place': ('Place i skwery (WFS)', 'offline'),
    'dps': ('Domy pomocy, kluby seniora (WFS)', 'offline'),
    'osm': ('OpenStreetMap', 'offline'),
    'ztm': ('Pozycje autobusów i tramwajów', 'live'),
    'wiatr': ('Pogoda i wiatr (ZOM)', 'live'),
    'powietrze': ('Jakość powietrza', 'live'),
    'utrudnienia': ('Utrudnienia w ruchu', 'live'),
    'veturilo': ('Veturilo', 'live'),
}

# Krótkie nazwy i połączenia z danymi, ułożone ręcznie na podstawie kolumny „Dane”.
# Zadanie 1 przestawione na SOIA, zadanie 2 na dane PSP: analiza JTBD powstała przed pozyskaniem obu źródeł.
ZADANIA = {
    1: ('Czy usłyszę syrenę i co robić', ['soia', 'adresy']),
    2: ('Najbliższe miejsce schronienia', ['psp', 'metro', 'adresy']),
    3: ('Dokąd iść z zatrzymanego pojazdu', ['gtfs', 'psp']),
    4: ('Bezpieczne miejsce w mieszkaniu', []),
    5: ('Alert w moim języku', []),
    6: ('Czy dym idzie w moją stronę', ['wiatr', 'powietrze']),
    7: ('Ominąć miejsce zdarzenia', ['utrudnienia']),
    8: ('Najbliższy defibrylator', ['aed']),
    9: ('Zasilanie sprzętu medycznego', ['sor']),
    11: ('Dotrzeć do dziecka bez tramwaju', ['gtfs', 'ztm', 'veturilo']),
    12: ('Czy u bliskich jest bezpiecznie', ['utrudnienia', 'powietrze']),
    13: ('Czym i jak długo wrócę', ['gtfs', 'ztm', 'utrudnienia']),
    14: ('Co jest prawdą, a co plotką', ['ztm', 'utrudnienia']),
    18: ('Woda i odwiedziny u seniora', ['dps', 'adresy']),
    19: ('Gdzie przechować lub zdobyć lek', ['apteki', 'sor']),
    20: ('Czy schodzić przy nocnym alarmie', []),
    21: ('Gdzie naładować telefon', []),
    23: ('Woda pitna i toaleta', ['toalety', 'osm']),
    24: ('Gotówka i zakupy', ['osm']),
    25: ('Ogrzewany punkt', []),
    26: ('Która apteka jest czynna', ['apteki']),
    28: ('Co już działa', ['ztm']),
    29: ('Wsparcie psychologiczne', []),
    30: ('Plan rodzinny z miejscami spotkań', ['place', 'adresy', 'psp']),
}

md = open(ROOT / 'kontekst' / 'jtbd-kryzys-warszawa.md', encoding='utf-8').read()
zadania = []
for line in md.splitlines():
    m = re.match(r'^\| (\d+) \|', line)
    if not m:
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    nr, seg, faza = int(c[0]), c[2], c[3]
    if not ('M' in seg or 'wszyscy' in seg):
        continue
    grupy = [g for g, _ in GRUPY] if 'wszyscy' in seg else re.findall(r'M\d', seg)
    fazy = re.findall(r'F\d', faza)
    nazwa, zb = ZADANIA[nr]
    zadania.append({'nr': nr, 'nazwa': nazwa, 'grupy': grupy, 'fazy': fazy, 'zbiory': zb})

assert len(zadania) == 24, len(zadania)
assert set(ZADANIA) == {z['nr'] for z in zadania}

dane = {
    'mapa': mapa,
    'grupy': GRUPY,
    'fazy': FAZY,
    'zbiory': [{'id': k, 'nazwa': v[0], 'rodzaj': v[1]} for k, v in ZBIORY.items()],
    'zadania': zadania,
}
OUT.write_text('// Wygenerowane przez build_dane.py. Nie edytuj ręcznie.\nwindow.DANE = '
               + json.dumps(dane, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(OUT, OUT.stat().st_size, 'B; mapa', W, 'x', H, '; zadania', len(zadania))
