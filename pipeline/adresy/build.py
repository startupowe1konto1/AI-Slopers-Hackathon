import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/pack/adresy"
OUT.mkdir(parents=True, exist_ok=True)

a = pd.read_csv(ROOT / "dane/adresy/punkty_adresowe_wgs84.csv", dtype={"id": str, "numer": str})
ulice = sorted(a["ulica"].unique())
dzielnice = sorted(a["dzielnica"].unique())
ui = {u: i for i, u in enumerate(ulice)}
di = {d: i for i, d in enumerate(dzielnice)}
pack = {
    "ulice": ulice, "dzielnice": dzielnice, "id": a["id"].tolist(),
    "u": [ui[u] for u in a["ulica"]], "nr": a["numer"].tolist(), "dz": [di[d] for d in a["dzielnica"]],
    "lat": a["lat"].round(6).tolist(), "lon": a["lon"].round(6).tolist(),
}
(OUT / "adresy.json").write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
(OUT / "meta.json").write_text(json.dumps({
    "modul": "adresy", "rekordy": len(a),
    "zrodla": {"wfs-adresy": {"nazwa": "m.st. Warszawa, WFS PUNKTY_ADRESOWE_WGS84", "licencja": "CC BY",
                               "url": "https://wfs.um.warszawa.pl/serwis", "pobrano": "2026-10-17T14:28:00+02:00"}},
}, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
print("adresy:", len(a))
