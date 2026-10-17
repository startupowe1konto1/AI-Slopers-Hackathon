"""Clip the SOIA quickstart package (KG PSP, release 2026.05) to Warsaw (TERYT 1465011)."""
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
import rasterio
from rasterio.mask import mask

src = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
gpkg = src / "layers" / "soia-quickstart.gpkg"
TERYT_GMI = "1465011"

gminy = gpd.read_file(gpkg, layer="gminy")
waw = gminy[gminy["teryt_gmi"] == TERYT_GMI]
assert len(waw) == 1, f"expected one Warsaw boundary, got {len(waw)}"
boundary = waw.geometry.iloc[0]
bbox = tuple(waw.total_bounds)

out_gpkg = out / "soia-warszawa.gpkg"
if out_gpkg.exists():
    out_gpkg.unlink()
waw.to_file(out_gpkg, layer="granica_warszawy", driver="GPKG")
summary = {}

for layer in ["coverage_ranges", "priority_gaps", "candidates", "sensitive_objects"]:
    gdf = gpd.read_file(gpkg, layer=layer, bbox=bbox)
    gdf = gdf[gdf.intersects(boundary)]
    summary[layer] = len(gdf)
    gdf.to_file(out_gpkg, layer=layer, driver="GPKG")
    gdf.to_crs(4326).to_file(out / f"{layer}.geojson", driver="GeoJSON")

waw.to_crs(4326).to_file(out / "granica_warszawy.geojson", driver="GeoJSON")

tables = out / "tabele"
tables.mkdir(exist_ok=True)
inv = pd.read_csv(src / "tables" / "inventory-v9.csv")
inv_pts = gpd.GeoDataFrame(inv, geometry=gpd.points_from_xy(inv["lon"], inv["lat"]), crs=4326).to_crs(2180)
inv_waw = inv_pts[inv_pts.within(boundary)].drop(columns="geometry")
inv_waw.to_csv(tables / "syreny_inwentaryzacja_warszawa.csv", index=False)
summary["syreny (inventory-v9)"] = len(inv_waw)

for name in ["critical_sirens_V13", "A04_gminy", "gmi_general_coverage", "A07_luki_priorytetowe", "A08_kandydaci_syreny", "A09_redundancja", "A11_integracja_GSM"]:
    df = pd.read_csv(src / "tables" / f"{name}.csv", low_memory=False)
    # Warsaw is a city county: powiat == "Warszawa", gmina holds district names.
    if "powiat" in df.columns:
        sel = df[df["powiat"].astype(str).str.strip() == "Warszawa"]
    elif "teryt_gmi" in df.columns:
        sel = df[df["teryt_gmi"].astype(str).str.zfill(7) == TERYT_GMI]
    else:
        continue
    sel.to_csv(tables / f"{name}_warszawa.csv", index=False)
    summary[name] = len(sel)

rasters = out / "rastry"
rasters.mkdir(exist_ok=True)
for tif in sorted((src / "rasters").glob("*.tif")):
    with rasterio.open(tif) as r:
        data, transform = mask(r, [boundary], crop=True)
        meta = r.meta.copy()
        meta.update(height=data.shape[1], width=data.shape[2], transform=transform, driver="GTiff", compress="deflate")
        target = rasters / tif.name.replace(".cog.tif", "-warszawa.tif")
        with rasterio.open(target, "w", **meta) as dst:
            dst.write(data)
        summary[target.name] = f"{data.shape[2]}x{data.shape[1]} px"

for k, v in summary.items():
    print(f"{k}: {v}")
