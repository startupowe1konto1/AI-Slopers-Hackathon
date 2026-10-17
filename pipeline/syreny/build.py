import json
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/pack/syreny"
OUT.mkdir(parents=True, exist_ok=True)

cr = gpd.read_file(ROOT / "dane/soia-warszawa/soia-warszawa.gpkg", layer="coverage_ranges")  # EPSG:2180, kolumny db (65/70/75), typ
cr["geometry"] = cr.geometry.simplify(10).buffer(0)
a = pd.read_csv(ROOT / "dane/adresy/punkty_adresowe_wgs84.csv", dtype={"id": str})
pts = gpd.GeoDataFrame(a[["id"]], geometry=gpd.points_from_xy(a.lon, a.lat), crs=4326).to_crs(cr.crs)

def najlepszy_db(zasiegi):
    j = gpd.sjoin(pts[["geometry"]], zasiegi[["geometry", "db"]], predicate="within")
    return j.groupby(level=0)["db"].max().reindex(pts.index).fillna(0).astype(int)

KOD = {75: "3", 70: "2", 65: "1", 0: "0"}
n = najlepszy_db(cr).map(KOD)
b = najlepszy_db(cr[cr["typ"] == "cyfrowa"]).map(KOD)
(OUT / "syreny.json").write_text(json.dumps({"n": "".join(n), "b": "".join(b)}), encoding="utf-8")
(OUT / "meta.json").write_text(json.dumps({
    "modul": "syreny", "rekordy": len(n),
    "zrodla": {"soia": {"nazwa": "KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy",
                        "licencja": "CC BY 4.0", "url": "https://doi.org/10.5281/zenodo.21921103", "pobrano": "2026-10-17T13:02:00+02:00"}},
}, ensure_ascii=False, indent=1), encoding="utf-8")
