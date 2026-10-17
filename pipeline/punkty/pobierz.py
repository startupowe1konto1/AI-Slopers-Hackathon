"""Zapisuje kopie źródeł punktów do dane/probki/ i datę pobrania do punkty_pobrano.json.

Uruchom: uv run --project pipeline python pipeline/punkty/pobierz.py [klucz ...]
WFS i portal miasta odpowiadają tylko z sieci w Polsce. Klucz portalu: WARSAW_API_TOKEN w .env.
PSP (gdziesieukryc.pl) eksportuje się ręcznie: kontekst/TODO-schrony-eksport.md.
"""

import csv
import http.client
import http.cookiejar
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBKI = ROOT / "dane/probki"
POBRANO = PROBKI / "punkty_pobrano.json"

WFS = "https://wfs.um.warszawa.pl/serwis?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=wfs:"
PORTAL = "https://dane.um.warszawa.pl/api/action/"
GTFS = "https://mkuran.pl/gtfs/warsaw.zip"  # ten sam plik co w pipeline O2 (transport)
RPRM = "https://rprm.ezdrowie.gov.pl/Registry/PublicExport?" + urllib.parse.urlencode({
    "UnitType": "Szpitalny oddział ratunkowy",
    "UnitCity": "Warszawa",
    "RegistryStatus": "ACTUAL",
    "ExportType": "Csv",
    "ActionName": "Public",
    "FilterApplied": "True",
})


def _token() -> str:
    env = ROOT / ".env"
    for linia in env.read_text(encoding="utf-8").splitlines() if env.exists() else []:
        if linia.startswith("WARSAW_API_TOKEN="):
            return linia.split("=", 1)[1].strip()
    return os.environ["WARSAW_API_TOKEN"]


# rprm.ezdrowie.gov.pl przekierowuje do skutku, dopóki klient nie odeśle ciasteczka.
_otwieracz = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
# mkuran.pl odpowiada 403 na domyślny „Python-urllib”
_otwieracz.addheaders = [("User-Agent", "warszawa-kryzys-pipeline")]


def _pobierz(req: urllib.request.Request, proby: int = 3) -> bytes:
    for i in range(proby):
        try:
            with _otwieracz.open(req, timeout=60) as r:
                return r.read()
        except (OSError, http.client.HTTPException):  # zerwane połączenie w trakcie pobierania
            if i == proby - 1:
                raise
            time.sleep(2 ** i)
    raise AssertionError


def _portal(zbior: str) -> urllib.request.Request:
    return urllib.request.Request(PORTAL + zbior, data=b"{}", method="POST",
                                  headers={"Authorization": _token(), "Content-Type": "application/json"})


def _metro_z_gtfs(zip_gtfs: bytes) -> bytes:
    # Ze stops.txt tylko stacje metra (location_type 1) i ich wejścia (2); cały GTFS ma ok. 100 MB.
    with zipfile.ZipFile(io.BytesIO(zip_gtfs)) as z:
        wiersze = list(csv.DictReader(io.TextIOWrapper(z.open("stops.txt"), encoding="utf-8-sig")))
    wynik = io.StringIO()
    w = csv.DictWriter(wynik, ["stop_id", "stop_name", "stop_lat", "stop_lon", "location_type", "parent_station"], extrasaction="ignore", lineterminator="\n")
    w.writeheader()
    w.writerows(x for x in wiersze if x["location_type"] in ("1", "2"))
    return wynik.getvalue().encode("utf-8")


# klucz: (plik w dane/probki/, zapytanie, opcjonalne przetworzenie odpowiedzi)
ZRODLA = {
    "gtfs-ztm": ("gtfs-metro.csv", lambda: urllib.request.Request(GTFS), _metro_z_gtfs),
    "wfs-apteki": ("wfs-apteki.xml", lambda: urllib.request.Request(WFS + "APTEKI"), None),
    "um-aed": ("um-aed.json", lambda: _portal("get_scb_lokalizacja_defibrylatorow"), None),
    "um-toalety": ("um-toalety.json", lambda: _portal("get_m_toalety"), None),
    "rprm-sor": ("rprm-sor.csv", lambda: urllib.request.Request(RPRM), None),
}


def main(klucze: list[str]) -> None:
    pobrano = json.loads(POBRANO.read_text(encoding="utf-8")) if POBRANO.exists() else {}
    for k in klucze or ZRODLA:
        plik, zadanie, przetworz = ZRODLA[k]
        dane = _pobierz(zadanie())
        dane = przetworz(dane) if przetworz else dane
        (PROBKI / plik).write_bytes(dane)
        pobrano[k] = date.today().isoformat()
        print(f"{k}: {len(dane)} B → dane/probki/{plik}")
    POBRANO.write_text(json.dumps(pobrano, indent=1, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
