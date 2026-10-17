"""Paczka punktów pomocy: public/pack/punkty/punkty.json (Punkt[]) i meta.json.

Uruchom: uv run --project pipeline python pipeline/punkty/build.py
Wejście: kopie źródeł z pipeline/punkty/pobierz.py (dane/probki/, PSP w dane/psp-schronienia/).
"""

import json
from pathlib import Path

import zrodla

ROOT = Path(__file__).resolve().parents[2]
WYJSCIE = ROOT / "public/pack/punkty"
POBRANO = ROOT / "dane/probki/punkty_pobrano.json"
BBOX = (20.85, 52.09, 21.28, 52.37)  # lon_min, lat_min, lon_max, lat_max

# klucz = Punkt.zrodlo = klucz w Manifest.zrodla
WFS = "https://wfs.um.warszawa.pl/serwis?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=wfs:"
KATALOG = "https://dane.um.warszawa.pl/pl/catalogue/"
ZRODLA = {
    # Nazwa jak w stałych atrybucjach stopki (src/app/zrodla.ts, O1), żeby się nie powtarzała.
    "psp": (zrodla.psp, "Miejsca schronienia według PSP (gdziesieukryc.pl)", "za zgodą PSP", "https://gdziesieukryc.pl"),
    # Ten sam klucz i opis co public/pack/transport/meta.json (O2): stopka pokaże jedno źródło.
    "gtfs-ztm": (
        zrodla.metro,
        "GTFS Warszawa (mkuran.pl, wersja 2026-10-17 00:15:22), źródło nieoficjalne, na podstawie danych ZTM",
        "do weryfikacji (dane ZTM; GTFS: Mikołaj Kuranowski)",
        "https://mkuran.pl/gtfs/",
    ),
    "wfs-apteki": (zrodla.apteki, "m.st. Warszawa, apteki (WFS, dane z marca 2017)", "CC BY", WFS + "APTEKI"),
    "um-aed": (zrodla.aed, "m.st. Warszawa, defibrylatory AED", "CC BY", KATALOG + "7bc32ffc-c2ac-4d32-83c9-b6f7a0b38de8"),
    "um-toalety": (zrodla.toalety, "m.st. Warszawa, toalety publiczne", "CC BY", KATALOG + "59485767-5566-4cb6-9545-a9053efca4ff"),
    "rprm-sor": (zrodla.sor, "Rejestr SOR (rprm.ezdrowie.gov.pl)", "CC BY 4.0", "https://rprm.ezdrowie.gov.pl/"),
}


def w_bbox(p: dict) -> bool:
    return BBOX[0] <= p["lon"] <= BBOX[2] and BBOX[1] <= p["lat"] <= BBOX[3]


def main() -> None:
    pobrano = json.loads(POBRANO.read_text(encoding="utf-8"))
    punkty, meta = [], {}
    for klucz, (funkcja, nazwa, licencja, url) in ZRODLA.items():
        z = [p for p in funkcja() if w_bbox(p)]
        print(f"{klucz}: {len(z)}")
        punkty += z
        meta[klucz] = {"nazwa": nazwa, "licencja": licencja, "url": url, "pobrano": pobrano[klucz]}
    if len({p["id"] for p in punkty}) != len(punkty):
        raise ValueError("powtórzone id punktów")

    WYJSCIE.mkdir(parents=True, exist_ok=True)
    (WYJSCIE / "punkty.json").write_text(json.dumps(punkty, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    (WYJSCIE / "meta.json").write_text(
        json.dumps({"modul": "punkty", "rekordy": len(punkty), "zrodla": meta}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
