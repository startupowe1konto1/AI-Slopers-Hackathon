import json
import re
from pathlib import Path

import pandas as pd

from transport.build import przytnij, sekundy, wzorce  # pipeline/ jest w pythonpath (pipeline/pyproject.toml)

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


def test_linie_z_kolejnoscia_i_czasami():
    l = json.loads((PACK / "linie.json").read_text(encoding="utf-8"))
    ids = {x["id"] for x in json.loads((PACK / "przystanki.json").read_text(encoding="utf-8"))}
    assert (PACK / "linie.json").stat().st_size < 1_500_000
    assert {x["typ"] for x in l} == {"autobus", "tramwaj", "metro"}
    for x in l:
        assert list(x) == ["linia", "typ", "kierunek", "przystanki", "czasy"]
        assert len(x["przystanki"]) == len(x["czasy"]) >= 2
        assert set(x["przystanki"]) <= ids
        assert x["czasy"][0] == 0 and x["czasy"] == sorted(x["czasy"])
    m1 = next(x for x in l if x["linia"] == "M1" and x["kierunek"] == "Młociny")
    assert 35 <= m1["czasy"][-1] <= 45


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


def test_przytnij_do_przystankow_w_bboxie():
    wpisy = [
        {"linia": "1", "typ": "tramwaj", "kierunek": "C", "przystanki": ["X", "A", "B", "Y", "C"], "czasy": [0, 3, 5, 7, 9]},
        {"linia": "2", "typ": "tramwaj", "kierunek": "X", "przystanki": ["A", "X", "Y"], "czasy": [0, 2, 4]},
    ]
    assert przytnij(wpisy, {"A", "B", "C"}) == [
        {"linia": "1", "typ": "tramwaj", "kierunek": "C", "przystanki": ["A", "B", "C"], "czasy": [0, 2, 6]},
    ]
