import json
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
GTFS = ROOT / "dane/gtfs/warsaw.zip"  # https://mkuran.pl/gtfs/warsaw.zip, poza gitem
OUT = ROOT / "public/pack/transport"
TYPY = {"3": "autobus", "0": "tramwaj", "1": "metro"}  # route_type GTFS; kolej (2) pomijamy


def sekundy(czas):
    """'25:10:00' -> 90600; godziny w GTFS mogą przekraczać 24."""
    hms = czas.str.split(":", expand=True).astype("int32")
    return hms[0] * 3600 + hms[1] * 60 + hms[2]


def wzorce(st, kursy):
    """Jeden wpis na (trasa, direction_id; bez direction_id: trip_headsign): najczęstsza kolejność przystanków
    i czasy w minutach od pierwszego z kursu o środkowym czasie przejazdu wśród kursów o tym wzorcu.
    st: trip_id, stop_sequence, stop_id, sek; kursy: trip_id, route_id, linia, typ, direction_id, trip_headsign."""
    st = st.sort_values(["trip_id", "stop_sequence"])
    przejazdy = st.groupby("trip_id", sort=False, observed=True).agg(przystanki=("stop_id", tuple), sek=("sek", tuple))
    przejazdy.index = przejazdy.index.astype(str)
    k = kursy.merge(przejazdy, left_on="trip_id", right_index=True)
    k["kierunek"] = k["direction_id"].fillna("h:" + k["trip_headsign"])
    wpisy = []
    for _, g in k.groupby(["route_id", "kierunek"]):
        # remis: dłuższy wzorzec, potem porządek krotek (wynik nie zależy od kolejności w pliku)
        wzorzec = max(Counter(g["przystanki"]).items(), key=lambda kv: (kv[1], len(kv[0]), kv[0]))[0]
        pasujace = g[g["przystanki"].map(wzorzec.__eq__)]
        czas = pasujace["sek"].map(lambda s: s[-1] - s[0])
        kurs = pasujace.assign(czas=czas).sort_values(["czas", "trip_id"]).iloc[len(pasujace) // 2]
        wpisy.append({"linia": kurs["linia"], "typ": kurs["typ"], "kierunek": pasujace["trip_headsign"].mode().iloc[0],
                      "przystanki": list(wzorzec), "czasy": [round((s - kurs["sek"][0]) / 60) for s in kurs["sek"]]})
    return wpisy


def przytnij(wpisy, ids):
    """Zostawia tylko przystanki z ids (bbox), czasy liczy od pierwszego z nich; pomija wpisy z < 2 przystankami."""
    wynik = []
    for w in wpisy:
        para = [(p, c) for p, c in zip(w["przystanki"], w["czasy"]) if p in ids]
        if len(para) >= 2:
            wynik.append({**w, "przystanki": [p for p, _ in para], "czasy": [c - para[0][1] for _, c in para]})
    return wynik


def main():
    z = zipfile.ZipFile(GTFS)

    def czytaj(plik, **kw):
        return pd.read_csv(z.open(plik), dtype=str, encoding="utf-8-sig", **kw)

    routes = czytaj("routes.txt", usecols=["route_id", "route_short_name", "route_type"])
    routes = routes[routes["route_type"].isin(TYPY)].rename(columns={"route_short_name": "linia"})
    routes["typ"] = routes["route_type"].map(TYPY)
    pola = ["trip_id", "route_id", "direction_id", "trip_headsign"]
    kursy = (czytaj("trips.txt", usecols=lambda c: c in pola).reindex(columns=pola)  # direction_id bywa pominięte
             .merge(routes[["route_id", "linia", "typ"]], on="route_id"))
    autobusowe = kursy.loc[kursy["typ"] == "autobus", ["trip_id", "linia"]]
    stops = czytaj("stops.txt", usecols=["stop_id", "stop_name", "stop_code", "stop_lat", "stop_lon"])

    # stop_times.txt ma ok. 500 MB: czytamy z zipa porcjami, tylko potrzebne kolumny, id jako kategorie.
    kat_kursu, kat_przyst = pd.CategoricalDtype(kursy["trip_id"]), pd.CategoricalDtype(stops["stop_id"])
    czesci, pary = [], []
    for c in czytaj("stop_times.txt", usecols=["trip_id", "stop_sequence", "stop_id", "arrival_time"], chunksize=2_000_000):
        c = c[c["trip_id"].isin(kursy["trip_id"])]
        pary.append(c.merge(autobusowe, on="trip_id")[["stop_id", "linia"]].drop_duplicates())
        czesci.append(pd.DataFrame({"trip_id": c["trip_id"].astype(kat_kursu), "stop_sequence": c["stop_sequence"].astype("int32"),
                                    "stop_id": c["stop_id"].astype(kat_przyst), "sek": sekundy(c["arrival_time"])}))
    st = pd.concat(czesci, ignore_index=True)
    linie = pd.concat(pary).drop_duplicates().groupby("stop_id")["linia"].agg(lambda s: sorted(set(s)))

    # Przystanki autobusów, tramwajów i metra; linie to dalej tylko autobusowe (karta „Dotarcie do bliskich”).
    stops = stops[stops["stop_id"].isin(set(st["stop_id"].unique()))].copy()
    stops["linie"] = stops["stop_id"].map(linie).map(lambda x: x if isinstance(x, list) else [])
    stops["lat"] = stops["stop_lat"].astype(float).round(6)
    stops["lon"] = stops["stop_lon"].astype(float).round(6)
    stops = stops[stops["lon"].between(20.85, 21.28) & stops["lat"].between(52.09, 52.37)]

    przystanki = [
        {"id": r.stop_id, "nazwa": f"{r.stop_name} {r.stop_code}" if isinstance(r.stop_code, str) else r.stop_name,
         "lat": r.lat, "lon": r.lon, "linie": r.linie}
        for r in stops.itertuples()
    ]
    trasy = przytnij(wzorce(st, kursy), set(stops["stop_id"]))
    OUT.mkdir(parents=True, exist_ok=True)
    for plik, dane in (("przystanki.json", przystanki), ("linie.json", trasy)):
        (OUT / plik).write_text(json.dumps(dane, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")

    wersja = czytaj("feed_info.txt")["feed_version"].iloc[0]
    pobrano = datetime.fromtimestamp(GTFS.stat().st_mtime, timezone.utc).astimezone().isoformat(timespec="seconds")
    (OUT / "meta.json").write_text(json.dumps({
        "modul": "transport", "rekordy": len(przystanki) + len(trasy),
        "zrodla": {"gtfs-ztm": {"nazwa": f"GTFS Warszawa (mkuran.pl, wersja {wersja}): przystanki i linie autobusów, tramwajów i metra, "
                                         "źródło nieoficjalne, na podstawie danych ZTM",
                                "licencja": "do weryfikacji (dane ZTM; GTFS: Mikołaj Kuranowski)",
                                "url": "https://mkuran.pl/gtfs/", "pobrano": pobrano}},
    }, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    print("przystanki:", len(przystanki), "linie:", dict(Counter(t["typ"] for t in trasy)))


if __name__ == "__main__":
    main()
