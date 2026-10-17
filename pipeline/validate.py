import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "public/pack"
m = json.loads((PACK / "manifest.json").read_text(encoding="utf-8"))
bledy = [p["sciezka"] for p in m["pliki"] if not (PACK / p["sciezka"]).exists()]
for p in PACK.glob("*/meta.json"):
    meta = json.loads(p.read_text(encoding="utf-8"))
    if not meta["zrodla"] or meta["rekordy"] <= 0:
        bledy.append(f"{p}: brak źródła lub rekordów")
print("\n".join(bledy) or "paczka OK")
sys.exit(1 if bledy else 0)
