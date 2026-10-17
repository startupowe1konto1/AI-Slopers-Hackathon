import json
import math
import re
from pathlib import Path

import numpy as np
import pandas as pd

from transport.build import dodaj_przebiegi, douglas_peucker, przebieg, przytnij, sekundy, wzorce  # pipeline/ w pythonpath

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "public/pack/transport"


def test_przystanki_autobusow_tramwajow_i_metra():
    p = json.loads((PACK / "przystanki.json").read_text(encoding="utf-8"))
    assert len(p) > 4572  # autobusowych było 4572
    assert len({x["id"] for x in p}) == len(p)
    assert all(list(x) == ["id", "nazwa", "lat", "lon", "linie"] and x["nazwa"] for x in p)
    assert all(20.85 <= x["lon"] <= 21.28 and 52.09 <= x["lat"] <= 52.37 for x in p)
    assert sum(1 for x in p if x["linie"]) >= 4500  # przystanki tylko tramwajowe i metra mają linie: []
    assert any(not x["linie"] for x in p)
    linie = {l for x in p for l in x["linie"]}
    assert not any(re.fullmatch(r"[1-7]?[0-9]", l) for l in linie)  # tramwaje
    assert not linie & {"M1", "M2"}  # metro


def metry(a, b):
    """Odległość w metrach między [lon, lat] a [lon, lat] (rzut równoodległościowy, wystarcza w mieście)."""
    return math.hypot((a[0] - b[0]) * math.cos(math.radians(a[1])) * 111320, (a[1] - b[1]) * 110540)


def test_linie_z_kolejnoscia_i_czasami():
    l = json.loads((PACK / "linie.json").read_text(encoding="utf-8"))
    ids = {x["id"] for x in json.loads((PACK / "przystanki.json").read_text(encoding="utf-8"))}
    assert (PACK / "linie.json").stat().st_size < 2_500_000
    assert {x["typ"] for x in l} == {"autobus", "tramwaj", "metro"}
    pola = ["linia", "typ", "kierunek", "przystanki", "czasy"]
    for x in l:
        assert list(x) in (pola, pola + ["ksztalt", "indeksy"])
        assert len(x["przystanki"]) == len(x["czasy"]) >= 2
        assert set(x["przystanki"]) <= ids
        assert x["czasy"][0] == 0 and x["czasy"] == sorted(x["czasy"])
    m1 = next(x for x in l if x["linia"] == "M1" and x["kierunek"] == "Młociny")
    assert 35 <= m1["czasy"][-1] <= 45


def test_linie_z_przebiegiem():
    l = json.loads((PACK / "linie.json").read_text(encoding="utf-8"))
    wsp = {x["id"]: (x["lon"], x["lat"]) for x in json.loads((PACK / "przystanki.json").read_text(encoding="utf-8"))}
    z_ksztaltem = [x for x in l if "ksztalt" in x]
    assert len(z_ksztaltem) >= 0.95 * len(l)
    blisko = wszystkie = 0
    for x in z_ksztaltem:
        k, i = x["ksztalt"], x["indeksy"]
        assert all(len(p) == 2 and 20.7 < p[0] < 21.5 and 52.0 < p[1] < 52.5 for p in k)
        assert len(i) == len(x["przystanki"]) and i == sorted(i) and 0 <= i[0] and i[-1] < len(k)
        for p, j in zip(x["przystanki"], i):
            wszystkie += 1
            blisko += metry(k[j], wsp[p]) < 60
    assert blisko >= 0.99 * wszystkie
    for linia, typ in (("4", "tramwaj"), ("175", "autobus")):
        wpisy = [x for x in l if x["linia"] == linia and x["typ"] == typ]
        assert wpisy and all(len(x.get("ksztalt", [])) > 50 for x in wpisy)


def gtfs(direction_id=("0", "0", "0", "0", "1")):
    kursy = pd.DataFrame({
        "trip_id": ["t1", "t2", "t3", "t4", "t5"],
        "route_id": "r175", "linia": "175", "typ": "autobus",
        "direction_id": list(direction_id),
        "trip_headsign": ["C", "C", "C", "B", "A"],
    })
    wiersze = [  # trip_id, stop_sequence, stop_id, arrival_time (kolejność w pliku nie musi być po stop_sequence)
        ("t1", 10, "C", "08:05:00"), ("t1", 0, "A", "08:00:00"), ("t1", 5, "B", "08:02:00"),
        ("t2", 0, "A", "23:58:00"), ("t2", 1, "B", "24:03:00"), ("t2", 2, "C", "24:08:00"),
        ("t3", 0, "A", "17:00:00"), ("t3", 1, "B", "17:05:00"), ("t3", 2, "C", "17:15:00"),
        ("t4", 0, "A", "09:00:00"), ("t4", 1, "B", "09:03:00"),
        ("t5", 0, "C", "10:00:00"), ("t5", 1, "B", "10:04:00"), ("t5", 2, "A", "10:06:00"),
    ]
    st = pd.DataFrame(wiersze, columns=["trip_id", "stop_sequence", "stop_id", "arrival_time"])
    st["sek"] = sekundy(st["arrival_time"])
    return st, kursy


def test_sekundy_po_polnocy():
    assert sekundy(pd.Series(["00:00:00", "08:02:30", "24:03:00", "25:10:00"])).tolist() == [0, 28950, 86580, 90600]


def test_najczestszy_wzorzec_i_czasy_ze_srodkowego_kursu():
    st, kursy = gtfs()
    w = wzorce(st, kursy)
    # A-B-C jeździ 3 razy, A-B raz; czasy z kursu o środkowym czasie przejazdu (5, 10, 15 min) = t2 przez północ
    assert w == [
        {"linia": "175", "typ": "autobus", "kierunek": "C", "przystanki": ["A", "B", "C"], "czasy": [0, 5, 10]},
        {"linia": "175", "typ": "autobus", "kierunek": "A", "przystanki": ["C", "B", "A"], "czasy": [0, 4, 6]},
    ]


def test_bez_direction_id_grupuje_po_kierunku():
    st, kursy = gtfs(direction_id=[None] * 5)
    assert sorted((x["kierunek"], tuple(x["przystanki"])) for x in wzorce(st, kursy)) == [
        ("A", ("C", "B", "A")), ("B", ("A", "B")), ("C", ("A", "B", "C"))]


def test_wzorzec_bierze_shape_id_z_kursu_z_czasami():
    st, kursy = gtfs()
    kursy["shape_id"] = ["s1", "s2", "s3", "s4", None]
    # A-B-C: czasy z t2, więc kształt też z t2; C-B-A (t5) nie ma kształtu
    assert [x.get("shape_id") for x in wzorce(st, kursy)] == ["s2", None]


def lonlat(xy):
    """Metry wokół (21.0, 52.23) -> tablica [lon, lat]."""
    xy = np.asarray(xy, float)
    return np.column_stack([21.0 + xy[:, 0] / (math.cos(math.radians(52.23)) * 111320), 52.23 + xy[:, 1] / 110540])


def gesto(*wierzcholki, krok=20):
    """Łamana przez wierzchołki (w metrach) zagęszczona co ok. krok metrów."""
    pkt = [wierzcholki[0]]
    for a, b in zip(wierzcholki, wierzcholki[1:]):
        n = max(1, round(math.dist(a, b) / krok))
        pkt += [(a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n) for s in range(1, n + 1)]
    return np.array(pkt, float)


def test_douglas_peucker_upraszcza_prosta_i_zachowuje_kotwice():
    prosta = gesto((0, 0), (1000, 0), krok=10)
    prosta[1::2, 1] += 1.0  # szum 1 m
    assert douglas_peucker(prosta, 7).tolist() == [0, 100]
    assert douglas_peucker(prosta, 7, kotwice=[30, 70]).tolist() == [0, 30, 70, 100]
    kat = gesto((0, 0), (500, 0), (500, 500), krok=10)
    assert douglas_peucker(kat, 7).tolist() == [0, 50, 100]


def test_przebieg_na_petli_nie_skacze_wstecz():
    # Pętla: start w (0, 0), koniec 3 m wyżej. Pierwszy przystanek jest odrobinę bliżej końca kształtu niż początku.
    ksztalt = lonlat(gesto((0, 0), (400, 0), (400, 400), (0, 400), (0, 3)))
    przystanki = lonlat([(-6, 2.5), (406, 200), (200, 406), (-6, 4)])
    k, i = przebieg(ksztalt.tolist(), przystanki.tolist())
    assert i == sorted(i) and i[0] == 0 and i[-1] == len(k) - 1
    assert len(k) <= 10  # kwadrat: narożniki + punkty przy przystankach
    assert all(metry(k[j], p) < 7 for j, p in zip(i, przystanki.tolist()))
    assert all(round(v, 5) == v for p in k for v in p)  # 5 miejsc po przecinku


def test_przebieg_na_krancu_tam_i_z_powrotem():
    # Krańcówka: kształt jedzie ulicą w dół i wraca tą samą ulicą (te same odcinki w obie strony, jak tramwaj 4).
    ksztalt = lonlat([(0, 0), (0, -500), (0, -1000), (0, -500)])
    przystanki = lonlat([(5, -100), (5, -700), (0, -1005), (5, -600)])
    k, i = przebieg(ksztalt.tolist(), przystanki.tolist())
    assert i == sorted(i)
    assert [round(metry(k[j], p)) for j, p in zip(i, przystanki.tolist())] == [5, 5, 5, 5]


def test_przebieg_wstawia_punkt_przy_przystanku_na_dlugim_odcinku():
    ksztalt = lonlat([(0, 0), (1000, 0)])
    przystanki = lonlat([(0, 5), (500, 8), (1000, -5)])
    k, i = przebieg(ksztalt.tolist(), przystanki.tolist())
    assert i == [0, 1, 2]
    assert metry(k[1], przystanki[1].tolist()) < 9


def test_dodaj_przebiegi_bez_ksztaltu_zostawia_przystanki():
    pola = ["linia", "typ", "kierunek", "przystanki", "czasy"]
    wpisy = [
        {"linia": "1", "typ": "tramwaj", "kierunek": "B", "przystanki": ["A", "B"], "czasy": [0, 2], "shape_id": "s"},
        {"linia": "2", "typ": "tramwaj", "kierunek": "B", "przystanki": ["A", "B"], "czasy": [0, 2], "shape_id": "brak"},
        {"linia": "3", "typ": "tramwaj", "kierunek": "B", "przystanki": ["A", "B"], "czasy": [0, 2]},
    ]
    wsp = dict(zip("AB", lonlat([(0, 0), (1000, 0)]).tolist()))
    w = dodaj_przebiegi(wpisy, {"s": lonlat([(0, 0), (500, 0), (1000, 0)])}, wsp)
    assert [list(x) for x in w] == [pola + ["ksztalt", "indeksy"], pola, pola]
    assert w[0]["indeksy"] == [0, 1] and len(w[0]["ksztalt"]) == 2


def test_przytnij_z_ksztaltem():
    k = [[21.0 + i / 1000, 52.2] for i in range(8)]
    w = {"linia": "1", "typ": "tramwaj", "kierunek": "C", "przystanki": ["X", "A", "B", "Y", "C"], "czasy": [0, 3, 5, 7, 9],
         "ksztalt": k, "indeksy": [0, 2, 3, 5, 7]}
    assert przytnij([w], {"A", "B", "C"}) == [{**w, "przystanki": ["A", "B", "C"], "czasy": [0, 2, 6],
                                               "ksztalt": k[2:], "indeksy": [0, 1, 5]}]
    assert przytnij([w], {"X", "A", "B"}) == [{**w, "przystanki": ["X", "A", "B"], "czasy": [0, 3, 5],
                                               "ksztalt": k[:4], "indeksy": [0, 2, 3]}]


def test_przytnij_do_przystankow_w_bboxie():
    wpisy = [
        {"linia": "1", "typ": "tramwaj", "kierunek": "C", "przystanki": ["X", "A", "B", "Y", "C"], "czasy": [0, 3, 5, 7, 9]},
        {"linia": "2", "typ": "tramwaj", "kierunek": "X", "przystanki": ["A", "X", "Y"], "czasy": [0, 2, 4]},
    ]
    assert przytnij(wpisy, {"A", "B", "C"}) == [
        {"linia": "1", "typ": "tramwaj", "kierunek": "C", "przystanki": ["A", "B", "C"], "czasy": [0, 2, 6]},
    ]
