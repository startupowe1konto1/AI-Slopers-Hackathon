"""Okręgi 75/70/65 dB wokół syren m.st. Warszawy (karta Syreny: „pokaż na mapie”).

Promień z modelu przybliżenia (przyblizenie.py; parametry zapisane przez build.py w public/pack/syreny/meta.json):
L(d) = A[spl30] + B * log10(d) - poprawka, więc d(X) = 10 ** ((A[spl30] - poprawka - X) / -B).
Okrąg nie widzi budynków. Wynik dla adresu (syreny.json) pochodzi z SOIA.
Uruchom po build.py: uv run --project pipeline python pipeline/syreny/okregi.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOIA = ROOT / "dane/soia-warszawa"
PACZKA = ROOT / "public/pack/syreny"
PROGI = (75, 70, 65)
MIN_M = 30.0
LON, LAT = (20.85, 21.28), (52.09, 52.37)  # bbox Warszawy (validate.py)


def promien(A: float, B: float, poprawka: float, prog: int) -> float:
    return max(MIN_M, 10 ** ((A - poprawka - prog) / -B))


def okregi(zasiegi: list[dict], inwentaryzacja: list[dict], przyblizenie: dict) -> list[dict]:
    A = {float(k): v for k, v in przyblizenie["poziom_A_wg_spl30"].items()}
    B, p = przyblizenie["spadek_db_na_dekade_odleglosci"], przyblizenie["poprawka_db"]
    wsp = {r["nr_ref"]: (float(r["lat"]), float(r["lon"])) for r in inwentaryzacja if r["lat"] and r["lon"]}
    wynik, byly = [], set()
    for z in zasiegi:
        nr = z["nr_ref"]
        if nr in byly or nr not in wsp or float(z["spl30"]) not in A:
            continue
        byly.add(nr)
        lat, lon = wsp[nr]
        if not (LON[0] <= lon <= LON[1] and LAT[0] <= lat <= LAT[1]):
            continue
        a = A[float(z["spl30"])]
        wynik.append({"nr": nr, "typ": z["typ"], "lat": round(lat, 6), "lon": round(lon, 6),
                      **{f"r{x}": round(promien(a, B, p, x)) for x in PROGI}})
    return wynik


if __name__ == "__main__":
    zasiegi = [f["properties"] for f in json.loads((SOIA / "coverage_ranges.geojson").read_text(encoding="utf-8"))["features"]]
    with open(SOIA / "tabele/syreny_inwentaryzacja_warszawa.csv", encoding="utf-8-sig") as f:
        inw = list(csv.DictReader(f))
    meta = json.loads((PACZKA / "meta.json").read_text(encoding="utf-8"))
    o = okregi(zasiegi, inw, meta["przyblizenie"])
    (PACZKA / "okregi.json").write_text(json.dumps(o, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    print("okręgi syren:", len(o))
