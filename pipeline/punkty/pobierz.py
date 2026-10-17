"""Zapisuje kopie źródeł punktów do dane/probki/ i datę pobrania do punkty_pobrano.json.

Uruchom: uv run --project pipeline python pipeline/punkty/pobierz.py [klucz ...]
WFS i portal miasta odpowiadają tylko z sieci w Polsce. Klucz portalu: WARSAW_API_TOKEN w .env.
PSP (gdziesieukryc.pl) eksportuje się ręcznie: kontekst/TODO-schrony-eksport.md.
"""

import http.cookiejar
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBKI = ROOT / "dane/probki"
POBRANO = PROBKI / "punkty_pobrano.json"

WFS = "https://wfs.um.warszawa.pl/serwis?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=wfs:"
PORTAL = "https://dane.um.warszawa.pl/api/action/"
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


def _pobierz(req: urllib.request.Request, proby: int = 3) -> bytes:
    for i in range(proby):
        try:
            with _otwieracz.open(req, timeout=60) as r:
                return r.read()
        except OSError:
            if i == proby - 1:
                raise
            time.sleep(2 ** i)
    raise AssertionError


def _portal(zbior: str) -> urllib.request.Request:
    return urllib.request.Request(PORTAL + zbior, data=b"{}", method="POST",
                                  headers={"Authorization": _token(), "Content-Type": "application/json"})


ZRODLA = {
    "wfs-metro": ("wfs-metro.xml", lambda: urllib.request.Request(WFS + "METRO_WEJSCIA")),
    "wfs-apteki": ("wfs-apteki.xml", lambda: urllib.request.Request(WFS + "APTEKI")),
    "um-aed": ("um-aed.json", lambda: _portal("get_scb_lokalizacja_defibrylatorow")),
    "um-toalety": ("um-toalety.json", lambda: _portal("get_m_toalety")),
    "rprm-sor": ("rprm-sor.csv", lambda: urllib.request.Request(RPRM)),
}


def main(klucze: list[str]) -> None:
    pobrano = json.loads(POBRANO.read_text(encoding="utf-8")) if POBRANO.exists() else {}
    for k in klucze or ZRODLA:
        plik, zadanie = ZRODLA[k]
        dane = _pobierz(zadanie())
        (PROBKI / plik).write_bytes(dane)
        pobrano[k] = date.today().isoformat()
        print(f"{k}: {len(dane)} B → dane/probki/{plik}")
    POBRANO.write_text(json.dumps(pobrano, indent=1, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
