"""Parsery źródeł punktów pomocy.

Każda funkcja czyta zapisaną kopię źródła (dane/probki/, PSP w dane/psp-schronienia/)
i zwraca listę słowników w formacie Punkt z src/contracts.ts.
"""

import csv
import json
import re
import xml.etree.ElementTree as ET
from collections.abc import Iterator
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBKI = ROOT / "dane/probki"
ADRESY = ROOT / "dane/adresy/punkty_adresowe_wgs84.csv"


def _punkt(**pola) -> dict:
    # Pola opcjonalne (adres, dostepnosc) pomijamy zamiast zapisywać null.
    return {k: v for k, v in pola.items() if v}


def _tekst(t: str | None) -> str:
    return " ".join((t or "").split())


def _klucz_ulicy(ulica: str) -> str:
    # „ul. L. Kondratowicza” i „Ludwika Kondratowicza” → „kondratowicza”
    return re.sub(r'[„”"]', "", ulica).split()[-1].lower()


def _indeks_adresow(plik: Path) -> dict[tuple[str, str], list[dict]]:
    idx: dict[tuple[str, str], list[dict]] = {}
    with open(plik, encoding="utf-8") as f:
        for a in csv.DictReader(f):
            idx.setdefault((_klucz_ulicy(a["ulica"]), a["numer"].upper()), []).append(a)
    return idx


# Adres występujący w dwóch dzielnicach: dzielnica według kodu pocztowego z rejestru.
DZIELNICA_SOR = {"00001/14/2020": "Wawer"}  # Międzyleski Szpital Specjalistyczny, 04-749

_FORMA_PRAWNA = re.compile(
    r"\s*(-\s*państwowy instytut badawczy|spółka z ograniczoną odpowiedzialnością|samodzielny publiczny zakład opieki zdrowotnej)\s*$",
    re.IGNORECASE,
)
_MALE = {" I ": " i ", " W ": " w ", " O ": " o ", " Przy ": " przy ", "Im.": "im.", "Ks.": "ks.", "P.W.": "p.w.", "Dr ": "dr "}


def _bez_krzyku(n: str) -> str:
    # „SZPITAL BIELAŃSKI IM.KS. …” → „Szpital Bielański im.ks. …”
    if n.isupper():
        n = n.title()
        for a, b in _MALE.items():
            n = n.replace(a, b)
    return n


def _nazwa_szpitala(n: str) -> str:
    return _bez_krzyku(_FORMA_PRAWNA.sub("", _tekst(n)).strip())


def sor(plik: Path = PROBKI / "rprm-sor.csv", adresy: Path = ADRESY) -> list[dict]:
    """Eksport CSV z rprm.ezdrowie.gov.pl (SOR, Warszawa). Współrzędne z punktu adresowego m.st. Warszawy."""
    idx = _indeks_adresow(adresy)
    with open(plik, encoding="utf-8-sig") as f:
        wiersze = list(csv.reader(f))
    kol = wiersze[0]
    # Kolumna „Jednostka - Ulica” występuje dwa razy: cecha („ul.”) i nazwa ulicy.
    ulica = [i for i, k in enumerate(kol) if k == "Jednostka - Ulica"][1]
    budynek, miasto, rodzaj = (kol.index(k) for k in ("Jednostka - Budynek", "Jednostka - Miejscowość", "Rodzaj specjalności"))
    nr_wpisu, podmiot = kol.index("Numer wpisu"), kol.index("Nazwa podmiotu")

    wynik = []
    for w in wiersze[1:]:
        if w[miasto] != "Warszawa" or not w[rodzaj].startswith("Szpitalny oddział ratunkowy"):
            continue
        kandydaci = idx.get((_klucz_ulicy(w[ulica]), w[budynek].upper()), [])
        if w[nr_wpisu] in DZIELNICA_SOR:
            kandydaci = [a for a in kandydaci if a["dzielnica"] == DZIELNICA_SOR[w[nr_wpisu]]]
        if len(kandydaci) != 1:
            raise ValueError(f"SOR {w[nr_wpisu]} ({w[ulica]} {w[budynek]}): {len(kandydaci)} dopasowań adresu")
        a = kandydaci[0]
        nazwa = _nazwa_szpitala(w[podmiot]) + (" (SOR dla dzieci)" if "dla dzieci" in w[rodzaj] else "")
        wynik.append(_punkt(
            id=f"rprm-sor-{w[nr_wpisu]}", rodzaj="sor", nazwa=nazwa, adres=f"{a['ulica']} {a['numer']}",
            dostepnosc="Całodobowa", lat=float(a["lat"]), lon=float(a["lon"]), zrodlo="rprm-sor",
        ))
    return wynik


NS = {"wfs": "http://fdo.osgeo.org/schemas/feature/wfs", "gml": "http://www.opengis.net/gml"}


def _wfs(plik: Path, warstwa: str) -> Iterator[tuple[dict[str, str], float, float]]:
    """Obiekty warstwy WFS miasta: (pola tekstowe, lat, lon). gml:pos to „lon lat”."""
    for e in ET.parse(plik).getroot().iter(f"{{{NS['wfs']}}}{warstwa}"):
        lon, lat = map(float, e.findtext(".//gml:pos", namespaces=NS).split())
        pola = {c.tag.split("}")[1]: _tekst(c.text) for c in e if c.tag != f"{{{NS['wfs']}}}SHAPE"}
        yield pola, lat, lon


def _najblizszy_adres(adresy: Path):
    """Funkcja (lat, lon) → „ulica numer” najbliższego punktu adresowego w promieniu ok. 500 m."""
    oczko = 0.005
    siatka: dict[tuple[int, int], list[tuple[float, float, str]]] = {}
    with open(adresy, encoding="utf-8") as f:
        for a in csv.DictReader(f):
            lat, lon = float(a["lat"]), float(a["lon"])
            siatka.setdefault((int(lat / oczko), int(lon / oczko)), []).append((lat, lon, f"{a['ulica']} {a['numer']}"))

    def szukaj(lat: float, lon: float) -> str | None:
        i, j = int(lat / oczko), int(lon / oczko)
        kandydaci = [x for di in (-1, 0, 1) for dj in (-1, 0, 1) for x in siatka.get((i + di, j + dj), [])]
        # cos(52,2°) ≈ 0,61: stopień długości jest krótszy niż stopień szerokości
        return min(kandydaci, key=lambda x: (x[0] - lat) ** 2 + ((x[1] - lon) * 0.61) ** 2)[2] if kandydaci else None

    return szukaj


def metro(plik: Path = PROBKI / "gtfs-metro.csv", adresy: Path = ADRESY) -> list[dict]:
    """Wejścia do metra z GTFS (stops.txt: location_type 2, stacja w parent_station)."""
    with open(plik, encoding="utf-8") as f:
        wiersze = list(csv.DictReader(f))
    stacje = {x["stop_id"]: x["stop_name"] for x in wiersze if x["location_type"] == "1"}
    adres = _najblizszy_adres(adresy)
    wynik = []
    for x in wiersze:
        if x["location_type"] != "2":
            continue
        lat, lon = float(x["stop_lat"]), float(x["stop_lon"])
        przy = adres(lat, lon)
        wynik.append(_punkt(
            id=f"gtfs-ztm-{x['stop_id']}", rodzaj="metro", nazwa=f"Metro {stacje[x['parent_station']]}, wejście {x['stop_name']}",
            adres=przy and f"przy {przy}", lat=lat, lon=lon, zrodlo="gtfs-ztm",
        ))
    return wynik


def apteki(plik: Path = PROBKI / "wfs-apteki.xml") -> list[dict]:
    wynik = []
    for pola, lat, lon in _wfs(plik, "APTEKI"):
        nazwa = _bez_krzyku(pola["OPIS"] or "Apteka")
        if "apteka" not in nazwa.lower():
            nazwa = f"Apteka {nazwa}"
        wynik.append(_punkt(
            id=f"wfs-apteki-{pola['OBJECTID']}", rodzaj="apteka", nazwa=nazwa,
            adres=_tekst(f"{pola.get('ULICA', '')} {pola.get('NUMER', '')}"), lat=lat, lon=lon, zrodlo="wfs-apteki",
        ))
    return wynik


def aed(plik: Path = PROBKI / "um-aed.json") -> list[dict]:
    """Portal: get_scb_lokalizacja_defibrylatorow. Tylko publicznie dostępne urządzenia."""
    wynik = []
    for x in json.loads(plik.read_text(encoding="utf-8-sig")):
        p = {k: _tekst(v) for k, v in x["properties"].items()}
        if p["device_public_access"] != "Publiczny":
            continue
        lon, lat = x["geometry"]["coordinates"][0]
        gdzie = p["device_location"][:1].lower() + p["device_location"][1:]
        adres = ", ".join(filter(None, [_tekst(f"{p['location_street']} {p['location_building']}"), gdzie]))
        if p["location_description"]:
            adres += f": {p['location_description']}"
        # device_availability: czy urządzenie jest dostępne 24/7 (dokumentacja portalu)
        dostepnosc = "Całodobowa" if p["device_availability"] == "Tak" else p["device_access_description"] or "Nie całodobowo"
        wynik.append(_punkt(
            id=f"um-aed-{p['defibrillator_id']}", rodzaj="aed", nazwa=p["location_object_name"] or "AED",
            adres=adres, dostepnosc=dostepnosc, lat=lat, lon=lon, zrodlo="um-aed",
        ))
    return wynik


_TYPY_TOALET = {
    "toaleta stacjonarna": "Toaleta stacjonarna",
    "przenośna": "Toaleta przenośna",
    "toaleta METRO": "Toaleta w metrze",
    "stacjonarna automatyczna": "Toaleta automatyczna",
}


def _godziny(g: str) -> str:
    # „Poniedziałek: X; …; Niedziela: X” z tą samą wartością X → „Codziennie X” albo „Całodobowa”
    dni = {d.split(": ", 1)[-1] for d in g.split("; ")} if g else set()
    if len(dni) == 1 and g.count(";") == 6:
        x = dni.pop()
        return "Całodobowa" if x == "Całodobowo" else f"Codziennie {x}"
    return g


def toalety(plik: Path = PROBKI / "um-toalety.json") -> list[dict]:
    """Portal: get_m_toalety. Zbiór nie ma identyfikatora, więc id to numer obiektu w odpowiedzi."""
    wynik = []
    for i, x in enumerate(json.loads(plik.read_text(encoding="utf-8-sig"))):
        p = x["properties"]
        lon, lat = x["geometry"]["coordinates"]
        dostepnosc = ", ".join(filter(None, [_godziny(_tekst(p["godziny"])), "płatna" if p["platnosc"] == 1 else ""]))
        wynik.append(_punkt(
            id=f"um-toalety-{i}", rodzaj="toaleta", nazwa=_TYPY_TOALET.get(p["typ"], "Toaleta"),
            adres=_tekst(p["lokalizacja"]), dostepnosc=dostepnosc, lat=lat, lon=lon, zrodlo="um-toalety",
        ))
    return wynik
