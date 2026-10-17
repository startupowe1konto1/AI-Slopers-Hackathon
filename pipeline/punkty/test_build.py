import json
from collections import Counter
from pathlib import Path

import pytest

from punkty import pobierz, zrodla  # pipeline/ jest w pythonpath (pipeline/pyproject.toml)

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.skipif(not zrodla.PSP.exists(), reason="surowy eksport PSP jest poza gitem (dane/psp-schronienia/)")
def test_psp_z_eksportu():
    s = zrodla.psp()
    assert len(s) == 8006
    assert Counter(p["dostepnosc"] for p in s) == {"Na żądanie": 6982, "Określone godziny": 890, "Całodobowa": 134}
    p = next(p for p in s if p["id"] == "psp-OZO-016C2BE32783")
    assert (p["nazwa"], p["lat"], p["lon"], p["zrodlo"]) == ("ul. Wilanowska 8H, Józefosław", 52.09778, 21.04373, "psp")
    assert "adres" not in p  # adres jest nazwą: dane PSP nie mają nazw obiektów
    assert not any(p["nazwa"].startswith("ulica ") for p in s)


def test_sor_z_probki():
    s = zrodla.sor()
    assert len(s) == 12
    assert all(p["rodzaj"] == "sor" and p["zrodlo"] == "rprm-sor" and p["dostepnosc"] == "Całodobowa" for p in s)
    praski = next(p for p in s if p["nazwa"].startswith("Szpital Praski"))
    assert praski["adres"] == "al. „Solidarności” 67"
    assert (praski["lat"], praski["lon"]) == (52.251585, 21.029148)
    # Bursztynowa 2 jest w Wesołej i w Wawrze; szpital Międzyleski to Wawer
    miedzyleski = next(p for p in s if p["nazwa"].startswith("Międzyleski"))
    assert (miedzyleski["lat"], miedzyleski["lon"]) == (52.204311, 21.181959)
    assert sum(p["nazwa"].endswith("(SOR dla dzieci)") for p in s) == 2
    assert not any("SPÓŁKA" in p["nazwa"].upper() for p in s)


def test_metro_z_probki():
    # Wejścia z GTFS (stops.txt, location_type 2); WFS METRO_WEJSCIA nie ma 5 nowych stacji M2.
    m = zrodla.metro()
    assert len(m) == 253
    assert all(p["rodzaj"] == "metro" and p["zrodlo"] == "gtfs-ztm" and p["nazwa"].startswith("Metro ") for p in m)
    p = next(p for p in m if p["id"] == "gtfs-ztm-1003M:E1")
    assert (p["nazwa"], p["lat"], p["lon"]) == ("Metro Dworzec Wileński, wejście 1", 52.2542581, 21.0348509)
    assert sum(p["nazwa"].startswith("Metro Bemowo, wejście") for p in m) == 9
    assert all(p["adres"].startswith("przy ") for p in m)


def test_apteki_z_probki():
    a = zrodla.apteki()
    assert len(a) == 679
    p = next(p for p in a if p["id"] == "wfs-apteki-148")
    assert (p["nazwa"], p["adres"], p["lat"], p["lon"]) == ("Apteka", "Łojewska 6", 52.296258, 21.035113)
    assert next(p for p in a if p["id"] == "wfs-apteki-149")["nazwa"] == "Apteka przy Robercie"
    assert next(p for p in a if p["id"] == "wfs-apteki-592")["adres"] == "lok. nr 1049"  # bez ULICA w WFS


def test_aed_z_probki():
    a = zrodla.aed()
    assert len(a) == 610  # tylko publiczne (100 prywatnych pominiętych)
    p = next(p for p in a if p["id"] == "um-aed-622")
    assert p["nazwa"] == "Urząd Dzielnicy Mokotów m.st. Warszawy"
    assert p["adres"] == "Rakowiecka 25/27, wewnątrz budynku: Przy wejściu na półpiętrze."
    assert p["dostepnosc"] == "Poniedziałek: godz. 8:00-18:00; Wtorek-Piątek: godz. 8:00-16:00"
    assert (p["lat"], p["lon"]) == (52.2086170695684, 21.0148748892902)
    assert sum(p["dostepnosc"] == "Całodobowa" for p in a) == 76  # publiczne z device_availability „Tak”


def test_toalety_z_probki():
    t = zrodla.toalety()
    assert len(t) == 695
    p = t[0]
    assert (p["nazwa"], p["adres"]) == ("Toaleta stacjonarna", "Inwalidów 3, Biblioteka Publiczna, Czytelnia Naukowa Nr XVI")
    assert p["dostepnosc"].startswith("Poniedziałek: 09:00 - 19:00;")
    assert sum(p["dostepnosc"].startswith("Całodobowa") for p in t) == 260
    assert any(p["dostepnosc"] == "Codziennie 06:00 - 22:00" for p in t)
    assert any(p["dostepnosc"].endswith(", płatna") for p in t)


def test_punkty():
    p = json.loads((ROOT / "public/pack/punkty/punkty.json").read_text(encoding="utf-8"))
    c = Counter(x["rodzaj"] for x in p)
    assert c["schronienie_psp"] > 7000 and c["aed"] > 600 and c["toaleta"] > 600
    assert c["metro"] > 50 and c["apteka"] > 300 and c["sor"] >= 5
    assert c["przychodnia"] > 900
    assert all(20.85 <= x["lon"] <= 21.28 and 52.09 <= x["lat"] <= 52.37 for x in p)
    assert all(x["zrodlo"] and x["nazwa"] for x in p)
    assert len({x["id"] for x in p}) == len(p)


def test_przychodnie_z_osm(tmp_path):
    plik = tmp_path / "osm.json"
    plik.write_text(json.dumps({"elements": [
        {"type": "node", "id": 1, "lat": 52.23, "lon": 21.01, "tags": {
            "amenity": "doctors", "name": "Przychodnia Lekarzy Rodzinnych", "addr:street": "Grochowska",
            "addr:housenumber": "200", "opening_hours": "Mo-Fr 08:00-18:00"}},
        {"type": "way", "id": 2, "center": {"lat": 52.25, "lon": 21.05}, "tags": {"amenity": "hospital", "opening_hours": "24/7"}},
        {"type": "node", "id": 3, "lat": 52.24, "lon": 21.02, "tags": {"healthcare": "pharmacy", "name": "Apteka"}},
        {"type": "relation", "id": 4, "tags": {"amenity": "clinic"}},  # bez współrzędnych
    ]}), encoding="utf-8")
    p = zrodla.przychodnie(plik)
    assert [x["id"] for x in p] == ["osm-node-1", "osm-way-2"]
    assert p[0] == {"id": "osm-node-1", "rodzaj": "przychodnia", "nazwa": "Przychodnia Lekarzy Rodzinnych", "adres": "Grochowska 200",
                    "dostepnosc": "Mo-Fr 08:00-18:00", "lat": 52.23, "lon": 21.01, "zrodlo": "osm-przychodnie"}
    assert (p[1]["nazwa"], p[1]["dostepnosc"], p[1]["lat"], "adres" in p[1]) == ("Szpital", "Całodobowa", 52.25, False)


def test_pobierz_zapasowy_serwer_overpass(tmp_path, monkeypatch):
    # Pierwszy serwer zrywa połączenie, drugi odpowiada; ucięty wynik („remark”) jest błędem.
    adresy = []

    def pobierz_atrapa(req, proby=3):
        adresy.append(req.full_url)
        if req.full_url == pobierz.OVERPASS[0]:
            raise ConnectionResetError("reset")
        return b'{"elements": []}'

    monkeypatch.setattr(pobierz, "_pobierz", pobierz_atrapa)
    monkeypatch.setattr(pobierz, "PROBKI", tmp_path)
    monkeypatch.setattr(pobierz, "POBRANO", tmp_path / "pobrano.json")
    pobierz.main(["osm-przychodnie"])
    assert adresy == list(pobierz.OVERPASS)
    assert json.loads((tmp_path / "osm-przychodnie.json").read_text()) == {"elements": []}
    assert "osm-przychodnie" in json.loads((tmp_path / "pobrano.json").read_text())
    with pytest.raises(ValueError):
        pobierz._caly_wynik_overpass(b'{"elements": [], "remark": "runtime error: Query timed out"}')
