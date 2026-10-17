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
ZRODLA = {
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
    (WYJSCIE / "punkty.json").write_text(json.dumps(punkty, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (WYJSCIE / "meta.json").write_text(
        json.dumps({"modul": "punkty", "rekordy": len(punkty), "zrodla": meta}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
