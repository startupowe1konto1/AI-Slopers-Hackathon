"""Buduje dane.js dla prezentacji: paski i mapę głośności syren, macierz JTBD i siatkę zadań z danymi.

Uruchom z katalogu repozytorium:  python -I docs/pitch/prezentacja/build_dane.py
Tylko biblioteka standardowa. Źródła: public/pack/syreny/syreny.json i public/pack/adresy/adresy.json (ta sama
paczka co w aplikacji), dane/soia-warszawa/granica_warszawy.geojson, kontekst/jtbd-kryzys-warszawa.md.
Liczby syren liczymy z paczki i sprawdzamy, że zgadzają się z pipeline/syreny/WYNIKI.md.
"""
import json
import math
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOIA = ROOT / 'dane' / 'soia-warszawa'
PACK = ROOT / 'public' / 'pack'
WYNIKI = ROOT / 'pipeline' / 'syreny' / 'WYNIKI.md'
OUT = Path(__file__).with_name('dane.js')

W = 1000  # szerokość viewBox mapy
KOMORKA_M = 280  # bok kwadratu mapy głośności w metrach


def load(p):
    return json.load(open(p, encoding='utf-8'))


def pl(txt):
    """„92,5%” -> 92.5, „1 230” -> 1230.0 (spacje zwykłe i twarde)."""
    return float(re.sub(r'[^\d,]', '', txt).replace(',', '.'))


def wyniki_syren():
    """Czyta tabelę „Miasto” z pipeline/syreny/WYNIKI.md: udział adresów ≥ 65 dB i ≥ 75 dB."""
    wiersze = [[c.strip() for c in l.strip().strip('|').split('|')]
               for l in WYNIKI.read_text(encoding='utf-8').splitlines() if l.startswith('|')]

    def miasto(prefiks):
        r = next(r for r in wiersze if r[0].startswith(prefiks))
        return {'p65': pl(r[1]), 'p75': pl(r[3])}

    return miasto('Wszystkie syreny'), miasto('Blackout, przybliżenie')


def proc(licznik, mianownik):
    """Procent zaokrąglony do 0,1 w górę od połowy (jak w WYNIKI.md), na liczbach całkowitych."""
    return (licznik * 2000 + mianownik) // (2 * mianownik) / 10


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


# --- Syreny: jedna miara w trzech klasach głośności na zewnątrz budynku (model SOIA, KG PSP) ---
# Kody w syreny.json: '3' = ≥ 75 dB, '2' = 70–75, '1' = 65–70, '0' = poniżej 65 (src/modules/syreny/wynik.ts).
# n = wszystkie syreny, b = jeśli zabraknie prądu (przybliżenie: działają tylko syreny cyfrowe).
# Wiersz i w syreny.json to wiersz i w adresy.json.
syreny = load(PACK / 'syreny' / 'syreny.json')
adresy = load(PACK / 'adresy' / 'adresy.json')
N = len(adresy['lat'])
assert len(syreny['n']) == len(syreny['b']) == len(adresy['lon']) == N, 'paczki syren i adresów rozjechały się'
KLASA = {'3': 0, '2': 1, '1': 1, '0': 2}  # 0 = głośno (≥ 75 dB), 1 = słychać na zewnątrz (65–75), 2 = może nie dotrzeć (< 65)


def udzialy(kody):
    c = Counter(kody)
    p75, p65 = proc(c['3'], N), proc(N - c['0'], N)
    # Środkowa klasa jako różnica zaokrąglonych progów: pasek sumuje się do 100,0 i zgadza z 92,5% / 91,5%.
    return {'p75': p75, 'p65': p65, 'paski': [p75, round(p65 - p75, 1), round(100 - p65, 1)]}


dzis, bez_pradu = udzialy(syreny['n']), udzialy(syreny['b'])
w_wszystkie, w_przyblizenie = wyniki_syren()
assert (dzis['p75'], dzis['p65'], bez_pradu['p75'], bez_pradu['p65']) == \
    (w_wszystkie['p75'], w_wszystkie['p65'], w_przyblizenie['p75'], w_przyblizenie['p65']), \
    ('paczka a WYNIKI.md', dzis, bez_pradu, w_wszystkie, w_przyblizenie)
print('syreny: dziś', dzis['paski'], 'jeśli zabraknie prądu', bez_pradu['paski'])

# Mapa: kwadraty KOMORKA_M × KOMORKA_M w układzie viewBox mapy; kolor = klasa, w której jest najwięcej adresów
# (remis: głośniejsza klasa, żeby nie przesadzać). Wiersze siatki to napisy: '.' = brak adresów,
# inaczej cyfra 3 * klasa_dziś + klasa_bez_prądu.
bok = KOMORKA_M * scale / 111320  # stopień szerokości ≈ 111,32 km; proj() ma tę samą skalę w obu osiach
komorki = {}
for i in range(N):
    x, y = proj(adresy['lon'][i], adresy['lat'][i])
    k = komorki.setdefault((int(y // bok), int(x // bok)), ([0, 0, 0], [0, 0, 0]))
    k[0][KLASA[syreny['n'][i]]] += 1
    k[1][KLASA[syreny['b'][i]]] += 1
wiersze = 1 + max(r for r, _ in komorki)
kolumny = 1 + max(c for _, c in komorki)


def wiekszosc(t):
    return max(range(3), key=lambda j: (t[j], -j))


siatka = [['.'] * kolumny for _ in range(wiersze)]
for (r, c), (tn, tb) in komorki.items():
    siatka[r][c] = str(3 * wiekszosc(tn) + wiekszosc(tb))

# Podpisy: trzy dzielnice z największym spadkiem udziału adresów „głośno” (w punktach procentowych)
dz = {}
for i in range(N):
    d = dz.setdefault(adresy['dz'][i], [0.0, 0.0, 0, 0, 0])
    d[0] += adresy['lon'][i]
    d[1] += adresy['lat'][i]
    d[2] += 1
    d[3] += syreny['n'][i] == '3'
    d[4] += syreny['b'][i] == '3'
podpisy = []
for kod, (lon, lat, n, g_n, g_b) in sorted(dz.items(), key=lambda kv: -(kv[1][3] - kv[1][4]) / kv[1][2])[:3]:
    x, y = proj(lon / n, lat / n)
    podpisy.append({'nazwa': adresy['dzielnice'][kod], 'x': round(x, 1), 'y': round(y, 1),
                    'przed': proc(g_n, n), 'po': proc(g_b, n)})

mapa = {
    'w': W, 'h': H,
    'granica': path(granica, 0.5),
    'bok': round(bok, 3),
    'siatka': [''.join(r) for r in siatka],
    'dzis': dzis['paski'],          # [głośno, słychać na zewnątrz, może nie dotrzeć] w % adresów
    'bez_pradu': bez_pradu['paski'],
    'p65': dzis['p65'],             # syrenę słychać (≥ 65 dB) dziś, do notatki
    'adresy': N,
    'dzielnice': podpisy,
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
