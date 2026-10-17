import json
from pathlib import Path

from syreny.okregi import okregi, promien

ROOT = Path(__file__).resolve().parents[2]
PRZ = {"poziom_A_wg_spl30": {"112": 126.0}, "spadek_db_na_dekade_odleglosci": -18.58, "poprawka_db": 3.85}


def test_promien_z_modelu_przyblizenia():
    # 126 - 3,85 - 65 = 57,15 dB zapasu; 10 ** (57,15 / 18,58) ≈ 1191 m
    assert round(promien(126.0, -18.58, 3.85, 65)) == 1191
    assert promien(126.0, -18.58, 3.85, 75) < promien(126.0, -18.58, 3.85, 70) < promien(126.0, -18.58, 3.85, 65)
    assert promien(100.0, -18.58, 3.85, 75) == 30.0  # nie mniej niż 30 m (spl30 mierzone 30 m od syreny)


def test_okregi_lacza_zasiegi_z_inwentaryzacja():
    zasiegi = [
        {"nr_ref": "A", "typ": "cyfrowa", "spl30": 112.0},
        {"nr_ref": "A", "typ": "cyfrowa", "spl30": 112.0},  # ta sama syrena, inny próg dB
        {"nr_ref": "B", "typ": "analogowa", "spl30": 112.0},
        {"nr_ref": "Z", "typ": "analogowa", "spl30": 112.0},  # poza Warszawą
        {"nr_ref": "X", "typ": "analogowa", "spl30": 112.0},  # brak w inwentaryzacji
    ]
    inw = [{"nr_ref": "A", "lat": "52.23", "lon": "21.01"}, {"nr_ref": "B", "lat": "52.25", "lon": "21.05"}, {"nr_ref": "Z", "lat": "52.40", "lon": "21.0"}]
    o = okregi(zasiegi, inw, PRZ)
    assert [x["nr"] for x in o] == ["A", "B"]
    assert o[0] == {"nr": "A", "typ": "cyfrowa", "lat": 52.23, "lon": 21.01, "r75": 345, "r70": 641, "r65": 1191}


def test_okregi_w_paczce():
    o = json.loads((ROOT / "public/pack/syreny/okregi.json").read_text(encoding="utf-8"))
    assert len(o) > 400
    assert {x["typ"] for x in o} == {"cyfrowa", "analogowa"}
    assert all(30 <= x["r75"] <= x["r70"] <= x["r65"] for x in o)
