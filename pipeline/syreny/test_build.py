import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "public/pack/syreny"


def paczka():
    return json.loads((PACK / "syreny.json").read_text(encoding="utf-8"))


def test_syreny_zgodne_z_analiza():
    s = paczka()
    n = len(s["n"])
    assert n == len(s["b"]) == 126923
    zasieg_n = sum(c != "0" for c in s["n"]) / n
    assert abs(zasieg_n - 0.925) < 0.01
    assert all(b <= a for a, b in zip(s["n"], s["b"]))


def test_blackout_przyblizony_tylko_w_strefach_syren_analogowych():
    s = paczka()
    assert len(s["p"]) == len(s["n"]) and set(s["p"]) <= {"0", "1"}
    # Tam, gdzie dominuje syrena cyfrowa (albo nie ma zasięgu), wynik przy blackoucie to dokładnie SOIA.
    assert all(b == n for n, b, p in zip(s["n"], s["b"], s["p"]) if p == "0")
    # Przybliżamy dokładnie te adresy, które dolne oszacowanie (tylko strefy syren cyfrowych) uznawało za utracone.
    assert sum(p == "1" for p in s["p"]) == 29676
    assert all(n != "0" for n, p in zip(s["n"], s["p"]) if p == "1")
    zasieg_n = sum(c != "0" for c in s["n"]) / len(s["n"])
    zasieg_b = sum(c != "0" for c in s["b"]) / len(s["b"])
    assert 0.691 <= zasieg_b <= zasieg_n


def test_kalibracja_odtwarza_soia_dla_wszystkich_syren():
    m = json.loads((PACK / "meta.json").read_text(encoding="utf-8"))["przyblizenie"]
    assert abs(m["udzial_65_wszystkie_syreny"] - 0.925) < 0.01
    assert m["zgodnosc_65_wszystkie_syreny"] >= 0.9


def test_wrazliwosc_na_poprawke():
    w = json.loads((PACK / "meta.json").read_text(encoding="utf-8"))["przyblizenie"]["wrazliwosc_tylko_cyfrowe"]
    # Większa poprawka = szybszy spadek głośności = mniejszy zasięg samych syren cyfrowych.
    assert [x["poprawka_db"] for x in w] == sorted(x["poprawka_db"] for x in w)
    assert [x["udzial_65"] for x in w] == sorted((x["udzial_65"] for x in w), reverse=True)
    assert all(0.691 <= x["udzial_65"] <= 0.926 for x in w)
