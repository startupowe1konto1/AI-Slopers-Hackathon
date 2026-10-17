"""Siren coverage in Warsaw: all sirens vs digital-only (blackout scenario proxy).

Inputs: SOIA Warsaw cut (KG PSP, 2026.05) and city WFS address points.
Assumption tested: in a power cut analog (electromechanical) sirens stop, digital ones keep working on batteries.
"""
import sys
from pathlib import Path

import geopandas as gpd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

soia = Path(sys.argv[1])
addr_csv = Path(sys.argv[2])
out = Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)

g = soia / "soia-warszawa.gpkg"
boundary = gpd.read_file(g, layer="granica_warszawy")
cr = gpd.read_file(g, layer="coverage_ranges")
poly = boundary.geometry.iloc[0]

# Simplify to 10 m before unioning: the raw rings have very dense vertices and a full union takes too long.
cr["geometry"] = cr.geometry.simplify(10).buffer(0)
all_cov = cr.union_all().intersection(poly)
dig_cov = cr[cr["typ"] == "cyfrowa"].union_all().intersection(poly)
lost = all_cov.difference(dig_cov)

addr = pd.read_csv(addr_csv)
pts = gpd.GeoDataFrame(addr, geometry=gpd.points_from_xy(addr["lon"], addr["lat"]), crs=4326).to_crs(2180)
pts = pts[pts.within(poly)].reset_index(drop=True)
# Spatial join against individual rings (indexed) instead of point-in-giant-polygon tests.
hit_all = gpd.sjoin(pts[["geometry"]], cr[["geometry"]], predicate="within").index.unique()
hit_dig = gpd.sjoin(pts[["geometry"]], cr[cr["typ"] == "cyfrowa"][["geometry"]], predicate="within").index.unique()
pts["all"] = pts.index.isin(hit_all)
pts["digital"] = pts.index.isin(hit_dig)

city_area = poly.area
summary = {
    "adresy_w_granicy": len(pts),
    "adresy_zasieg_wszystkie_pct": round(100 * pts["all"].mean(), 1),
    "adresy_zasieg_tylko_cyfrowe_pct": round(100 * pts["digital"].mean(), 1),
    "adresy_traca_zasieg": int((pts["all"] & ~pts["digital"]).sum()),
    "powierzchnia_zasieg_wszystkie_pct": round(100 * all_cov.area / city_area, 1),
    "powierzchnia_zasieg_tylko_cyfrowe_pct": round(100 * dig_cov.area / city_area, 1),
    "syreny_analogowe_lokalizacje": int(cr[cr.typ == "analogowa"].site_uid.nunique()),
    "syreny_cyfrowe_lokalizacje": int(cr[cr.typ == "cyfrowa"].site_uid.nunique()),
}
for k, v in summary.items():
    print(f"{k}: {v}")

by_d = pts.groupby("dzielnica").agg(adresy=("all", "size"), zasieg_wszystkie=("all", "mean"), zasieg_cyfrowe=("digital", "mean"))
by_d["zasieg_wszystkie"] = (100 * by_d["zasieg_wszystkie"]).round(1)
by_d["zasieg_cyfrowe"] = (100 * by_d["zasieg_cyfrowe"]).round(1)
by_d["spadek_pp"] = (by_d["zasieg_wszystkie"] - by_d["zasieg_cyfrowe"]).round(1)
by_d = by_d.sort_values("spadek_pp", ascending=False)
by_d.to_csv(out / "syreny_blackout_dzielnice.csv")
pd.Series(summary).to_csv(out / "syreny_blackout_podsumowanie.csv", header=["wartosc"])
print(by_d.to_string())

gpd.GeoDataFrame(geometry=[lost], crs=2180).to_crs(4326).to_file(out / "syreny_blackout_utracony_zasieg.geojson", driver="GeoJSON")
gpd.GeoDataFrame(geometry=[dig_cov], crs=2180).to_crs(4326).to_file(out / "syreny_zasieg_tylko_cyfrowe.geojson", driver="GeoJSON")

fig, axes = plt.subplots(1, 2, figsize=(13, 7))
for ax, title, cov in [
    (axes[0], f"Wszystkie syreny: {summary['adresy_zasieg_wszystkie_pct']}% adresów ≥65 dB", all_cov),
    (axes[1], f"Blackout (tylko cyfrowe): {summary['adresy_zasieg_tylko_cyfrowe_pct']}% adresów ≥65 dB", dig_cov),
]:
    boundary.plot(ax=ax, color="#F1EFE8", edgecolor="#5F5E5A", linewidth=0.6)
    gpd.GeoSeries([cov], crs=2180).plot(ax=ax, color="#1D9E75", alpha=0.55, linewidth=0)
    if cov is dig_cov:
        gpd.GeoSeries([lost], crs=2180).plot(ax=ax, color="#D85A30", alpha=0.55, linewidth=0)
    ax.set_title(title, fontsize=11)
    ax.set_axis_off()
fig.text(0.5, 0.03, "Zielony: zasięg ≥65 dB(A) na zewnątrz. Pomarańczowy: obszar tracący zasięg, jeśli syreny analogowe nie działają bez prądu (założenie do weryfikacji).\n"
         "Dane: KG PSP, SOIA 2026.05 (DOI 10.5281/zenodo.21921103), punkty adresowe m.st. Warszawy (WFS).", ha="center", fontsize=8.5)
plt.tight_layout(rect=(0, 0.07, 1, 0.94))
fig.savefig(out / "syreny_blackout_mapa.png", dpi=150)
print("saved", out / "syreny_blackout_mapa.png")
