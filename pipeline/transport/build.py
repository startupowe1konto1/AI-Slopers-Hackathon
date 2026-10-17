import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
GTFS = ROOT / "dane/gtfs/warsaw.zip"  # https://mkuran.pl/gtfs/warsaw.zip, poza gitem
OUT = ROOT / "public/pack/transport"
OUT.mkdir(parents=True, exist_ok=True)

z = zipfile.ZipFile(GTFS)

def czytaj(plik, **kw):
    return pd.read_csv(z.open(plik), dtype=str, encoding="utf-8-sig", **kw)

routes = czytaj("routes.txt", usecols=["route_id", "route_short_name", "route_type"])
autobusy = routes[routes["route_type"] == "3"].rename(columns={"route_short_name": "linia"})
kursy = czytaj("trips.txt", usecols=["trip_id", "route_id"]).merge(autobusy[["route_id", "linia"]], on="route_id")[["trip_id", "linia"]]

# stop_times.txt ma ok. 500 MB: czytamy z zipa porcjami i tylko dwie kolumny.
pary = pd.concat(
    c.merge(kursy, on="trip_id")[["stop_id", "linia"]].drop_duplicates()
    for c in czytaj("stop_times.txt", usecols=["trip_id", "stop_id"], chunksize=2_000_000)
).drop_duplicates()
linie = pary.groupby("stop_id")["linia"].agg(lambda s: sorted(set(s)))

stops = czytaj("stops.txt", usecols=["stop_id", "stop_name", "stop_code", "stop_lat", "stop_lon"])
stops = stops.merge(linie.rename("linie"), left_on="stop_id", right_index=True)
stops["lat"] = stops["stop_lat"].astype(float).round(6)
stops["lon"] = stops["stop_lon"].astype(float).round(6)
stops = stops[stops["lon"].between(20.85, 21.28) & stops["lat"].between(52.09, 52.37)]

przystanki = [
    {"id": r.stop_id, "nazwa": f"{r.stop_name} {r.stop_code}" if isinstance(r.stop_code, str) else r.stop_name,
     "lat": r.lat, "lon": r.lon, "linie": r.linie}
    for r in stops.itertuples()
]
(OUT / "przystanki.json").write_text(json.dumps(przystanki, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")

wersja = czytaj("feed_info.txt")["feed_version"].iloc[0]
pobrano = datetime.fromtimestamp(GTFS.stat().st_mtime, timezone.utc).astimezone().isoformat(timespec="seconds")
(OUT / "meta.json").write_text(json.dumps({
    "modul": "transport", "rekordy": len(przystanki),
    "zrodla": {"gtfs-ztm": {"nazwa": f"GTFS Warszawa (mkuran.pl, wersja {wersja}), źródło nieoficjalne, na podstawie danych ZTM",
                            "licencja": "do weryfikacji (dane ZTM; GTFS: Mikołaj Kuranowski)",
                            "url": "https://mkuran.pl/gtfs/", "pobrano": pobrano}},
}, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
print("przystanki:", len(przystanki))
