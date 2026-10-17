import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]

def test_adresy_pack():
    d = json.loads((ROOT / "public/pack/adresy/adresy.json").read_text(encoding="utf-8"))
    n = len(d["id"])
    assert n == 126923
    assert all(len(d[k]) == n for k in ("u", "nr", "dz", "lat", "lon"))
    assert all(52.09 <= x <= 52.37 for x in d["lat"])
    assert all(20.85 <= x <= 21.28 for x in d["lon"])
