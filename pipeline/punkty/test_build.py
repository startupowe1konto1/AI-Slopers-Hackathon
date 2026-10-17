import json
from collections import Counter
from pathlib import Path

import zrodla

ROOT = Path(__file__).resolve().parents[2]


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


def test_punkty():
    p = json.loads((ROOT / "public/pack/punkty/punkty.json").read_text(encoding="utf-8"))
    c = Counter(x["rodzaj"] for x in p)
    assert c["schronienie_psp"] > 7000 and c["aed"] > 600 and c["toaleta"] > 600
    assert c["metro"] > 50 and c["apteka"] > 300 and c["sor"] >= 5
    assert all(20.85 <= x["lon"] <= 21.28 and 52.09 <= x["lat"] <= 52.37 for x in p)
    assert all(x["zrodlo"] and x["nazwa"] for x in p)
    assert len({x["id"] for x in p}) == len(p)
