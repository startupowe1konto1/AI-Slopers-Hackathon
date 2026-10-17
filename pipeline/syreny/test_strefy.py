import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
PLIK = ROOT / "public/pack/syreny/strefy-analogowe.json"


def wspolrzedne(g):
    if g["type"] == "Polygon":
        return [p for pierscien in g["coordinates"] for p in pierscien]
    return [p for wielokat in g["coordinates"] for pierscien in wielokat for p in pierscien]


def test_strefy_syren_analogowych_w_granicach_warszawy():
    d = json.loads(PLIK.read_text(encoding="utf-8"))
    assert d["type"] == "FeatureCollection" and len(d["features"]) >= 1
    punkty = [p for f in d["features"] for p in wspolrzedne(f["geometry"])]
    assert len(punkty) > 100
    assert all(20.85 <= lon <= 21.28 and 52.09 <= lat <= 52.37 for lon, lat in punkty)
    assert PLIK.stat().st_size < 400_000  # pobierana z paczką offline


def test_strefy_pokrywaja_okolo_czwartej_czesci_miasta():
    # Analiza: zasięg wszystkich syren 93,8% powierzchni miasta, w strefach syren cyfrowych 71,3%.
    udzial = json.loads(PLIK.read_text(encoding="utf-8"))["features"][0]["properties"]["udzial_powierzchni_miasta"]
    assert abs(udzial - (0.938 - 0.713)) < 0.02
