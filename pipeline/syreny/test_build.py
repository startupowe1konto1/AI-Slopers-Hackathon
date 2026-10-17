import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]

def test_syreny_zgodne_z_analiza():
    s = json.loads((ROOT / "public/pack/syreny/syreny.json").read_text())
    n = len(s["n"])
    assert n == len(s["b"]) == 126923
    zasieg_n = sum(c != "0" for c in s["n"]) / n
    zasieg_b = sum(c != "0" for c in s["b"]) / n
    assert abs(zasieg_n - 0.925) < 0.01
    assert abs(zasieg_b - 0.691) < 0.01
    assert all(b <= a for a, b in zip(s["n"], s["b"]))
