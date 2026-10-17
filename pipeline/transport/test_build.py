import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]

def test_przystanki_autobusowe():
    p = json.loads((ROOT / "public/pack/transport/przystanki.json").read_text(encoding="utf-8"))
    assert len(p) > 1000
    assert len({x["id"] for x in p}) == len(p)
    assert all(x["nazwa"] and x["linie"] for x in p)
    assert all(20.85 <= x["lon"] <= 21.28 and 52.09 <= x["lat"] <= 52.37 for x in p)
    linie = {l for x in p for l in x["linie"]}
    assert not any(re.fullmatch(r"[1-7]?[0-9]", l) for l in linie)  # tramwaje
    assert not linie & {"M1", "M2"}  # metro
