"""Parsery źródeł punktów pomocy.

Każda funkcja czyta zapisaną kopię źródła (dane/probki/, PSP w dane/psp-schronienia/)
i zwraca listę słowników w formacie Punkt z src/contracts.ts.
"""

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBKI = ROOT / "dane/probki"
ADRESY = ROOT / "dane/adresy/punkty_adresowe_wgs84.csv"


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
_MALE = {" I ": " i ", "Im.": "im.", "Ks.": "ks.", "P.W.": "p.w.", "Dr ": "dr ", " W ": " w "}


def _nazwa_szpitala(n: str) -> str:
    n = _FORMA_PRAWNA.sub("", re.sub(r"\s+", " ", n)).strip()
    if n.isupper():
        n = n.title()
        for a, b in _MALE.items():
            n = n.replace(a, b)
    return n


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
        wynik.append({
            "id": f"rprm-sor-{w[nr_wpisu]}",
            "rodzaj": "sor",
            "nazwa": nazwa,
            "adres": f"{a['ulica']} {a['numer']}",
            "dostepnosc": "Całodobowa",
            "lat": float(a["lat"]),
            "lon": float(a["lon"]),
            "zrodlo": "rprm-sor",
        })
    return wynik
