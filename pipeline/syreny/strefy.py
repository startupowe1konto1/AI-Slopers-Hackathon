"""Strefy, w których według SOIA najgłośniejsza jest syrena analogowa (warstwa na mapie w module syreny).

Przy blackoucie syreny analogowe bez zasilania awaryjnego milkną, więc w tych strefach będzie ciszej
(poziom syren cyfrowych to szacunek, zob. przyblizenie.py). Uruchom po build.py:
uv run --project pipeline python pipeline/syreny/strefy.py
"""
import json
from pathlib import Path
import geopandas as gpd
from shapely.geometry import mapping

ROOT = Path(__file__).resolve().parents[2]
GPKG = ROOT / "dane/soia-warszawa/soia-warszawa.gpkg"
OUT = ROOT / "public/pack/syreny/strefy-analogowe.json"

granica = gpd.read_file(GPKG, layer="granica_warszawy").geometry.iloc[0]
cr = gpd.read_file(GPKG, layer="coverage_ranges")  # EPSG:2180
cr["geometry"] = cr.geometry.simplify(10).buffer(0)
strefy = cr[cr["typ"] == "analogowa"].union_all().intersection(granica).simplify(20)
udzial = strefy.area / granica.area

def zaokraglij(x):
    return round(x, 5) if isinstance(x, float) else [zaokraglij(y) for y in x]

g = mapping(gpd.GeoSeries([strefy], crs=cr.crs).to_crs(4326).iloc[0])
OUT.write_text(json.dumps({"type": "FeatureCollection", "features": [{
    "type": "Feature",
    "geometry": {"type": g["type"], "coordinates": zaokraglij(g["coordinates"])},
    "properties": {"udzial_powierzchni_miasta": round(udzial, 4)},
}]}, separators=(",", ":")), encoding="utf-8")
print("strefy syren analogowych:", f"{udzial:.1%} powierzchni miasta,", OUT.stat().st_size, "B")
