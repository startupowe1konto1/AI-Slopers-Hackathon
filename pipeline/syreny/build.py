import json
from pathlib import Path
import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
from przyblizenie import dopasuj_spadek, kalibruj_poprawke, klasa_db, poziom_max

ROOT = Path(__file__).resolve().parents[2]
SOIA = ROOT / "dane/soia-warszawa"
OUT = ROOT / "public/pack/syreny"
OUT.mkdir(parents=True, exist_ok=True)

cr = gpd.read_file(SOIA / "soia-warszawa.gpkg", layer="coverage_ranges")  # EPSG:2180, kolumny db (65/70/75), typ
cr["geometry"] = cr.geometry.simplify(10).buffer(0)
a = pd.read_csv(ROOT / "dane/adresy/punkty_adresowe_wgs84.csv", dtype={"id": str})
pts = gpd.GeoDataFrame(a[["id"]], geometry=gpd.points_from_xy(a.lon, a.lat), crs=4326).to_crs(cr.crs)

def najlepszy_db(zasiegi):
    j = gpd.sjoin(pts[["geometry"]], zasiegi[["geometry", "db"]], predicate="within")
    return j.groupby(level=0)["db"].max().reindex(pts.index).fillna(0).astype(int)

KOD = {75: 3, 70: 2, 65: 1, 0: 0}
n = najlepszy_db(cr).map(KOD).to_numpy()
b = najlepszy_db(cr[cr["typ"] == "cyfrowa"]).map(KOD).to_numpy()

# SOIA dzieli miasto według syreny dominującej, więc w strefie syreny analogowej nie ma poziomu syreny
# cyfrowej. Tam go szacujemy z odległości i mocy (opis metody w przyblizenie.py).
inw = pd.read_csv(SOIA / "tabele/syreny_inwentaryzacja_warszawa.csv").drop_duplicates("nr_ref")
# Syreny spoza Warszawy nie mają współrzędnych w inwentaryzacji: zostają tylko ich dokładne strefy z SOIA.
syreny = cr.drop_duplicates("site_uid")[["site_uid", "nr_ref", "typ", "spl30"]].merge(inw[["nr_ref", "lat", "lon"]], on="nr_ref")
xy = gpd.GeoSeries(gpd.points_from_xy(syreny.lon, syreny.lat), crs=4326).to_crs(cr.crs)
syreny["x"], syreny["y"] = xy.x.to_numpy(), xy.y.to_numpy()

with rasterio.open(SOIA / "rastry/sound-level-v10-warszawa.tif") as r:
    poziom, t = r.read(1), r.transform
with rasterio.open(SOIA / "rastry/winner-siren-v10-warszawa.tif") as r:
    zwyciezca = r.read(1)
w, k = np.nonzero(zwyciezca > 0)
komorki = pd.DataFrame({"site_uid": zwyciezca[w, k], "L": poziom[w, k],
                        "cx": t.c + (k + 0.5) * t.a, "cy": t.f + (w + 0.5) * t.e}).merge(syreny, on="site_uid")
komorki["d"] = np.hypot(komorki.cx - komorki.x, komorki.cy - komorki.y)
blisko = komorki[komorki.d.between(50, 600)]  # blisko syreny prawie zawsze dominuje ona sama
B, A = dopasuj_spadek(blisko.d.to_numpy(), blisko.L.to_numpy(), blisko.spl30.to_numpy())

ax, ay = pts.geometry.x.to_numpy(), pts.geometry.y.to_numpy()
def szacunek(s):
    return poziom_max(ax, ay, s.x.to_numpy(), s.y.to_numpy(), s.spl30.map(A).to_numpy(), B)

L_wszystkie = szacunek(syreny)
L_cyfrowe = szacunek(syreny[syreny.typ == "cyfrowa"])
poprawka = kalibruj_poprawke(L_wszystkie, n)
wszystkie = klasa_db(L_wszystkie - poprawka)
analog = (n > 0) & (b == 0)  # strefa syreny analogowej

def tylko_cyfrowe(p):
    return np.where(analog, np.minimum(n, klasa_db(L_cyfrowe - p)), b)  # wyłączenie syren nie może podnieść poziomu

def wariant(p):
    bb = tylko_cyfrowe(p)
    return {"poprawka_db": round(p, 2), "udzial_65": round(float(np.mean(bb > 0)), 4), "traci_zasieg": int(((n > 0) & (bb == 0)).sum())}

wrazliwosc = [wariant(poprawka + dp) for dp in (-1.0, 0.0, 1.0)]
b = tylko_cyfrowe(poprawka)

znaki = lambda v: "".join(map(str, v))
(OUT / "syreny.json").write_text(json.dumps({"n": znaki(n), "b": znaki(b), "p": znaki(analog.astype(int))}), encoding="utf-8")
(OUT / "meta.json").write_text(json.dumps({
    "modul": "syreny", "rekordy": len(n),
    "zrodla": {"soia": {"nazwa": "KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy",
                        "licencja": "CC BY 4.0", "url": "https://doi.org/10.5281/zenodo.21921103", "pobrano": "2026-10-17T13:02:00+02:00"}},
    "przyblizenie": {
        "opis": "p = 1: w SOIA dominuje tu syrena analogowa, więc poziom przy blackoucie to szacunek. "
                "Najgłośniejsza syrena cyfrowa wg odległości i mocy: L = A[spl30] + B*log10(d) - poprawka, "
                "dopasowane do rastra poziomu dźwięku SOIA 50-600 m od syren; poprawka wyrównuje udział adresów >= 65 dB "
                "dla wszystkich syren z wynikiem SOIA. Bez syren spoza Warszawy (brak współrzędnych).",
        "spadek_db_na_dekade_odleglosci": round(B, 2),
        "poziom_A_wg_spl30": {str(int(s)): round(v, 1) for s, v in A.items()},
        "poprawka_db": poprawka,
        "udzial_65_wszystkie_syreny": round(float(np.mean(wszystkie > 0)), 4),
        "zgodnosc_65_wszystkie_syreny": round(float(np.mean((wszystkie > 0) == (n > 0))), 4),
        "zgodnosc_klasy_wszystkie_syreny": round(float(np.mean(wszystkie == n)), 4),
        "adresy_przyblizone": int(analog.sum()),
        "wrazliwosc_tylko_cyfrowe": wrazliwosc,
    },
}, ensure_ascii=False, indent=1), encoding="utf-8")
print("syreny:", len(n), "przybliżone:", int(analog.sum()), "poprawka:", poprawka)
