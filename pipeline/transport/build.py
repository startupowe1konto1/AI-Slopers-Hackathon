import json
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
GTFS = ROOT / "dane/gtfs/warsaw.zip"  # https://mkuran.pl/gtfs/warsaw.zip, poza gitem
OUT = ROOT / "public/pack/transport"
TYPY = {"3": "autobus", "0": "tramwaj", "1": "metro"}  # route_type GTFS; kolej (2) pomijamy
TOLERANCJA_M = 7.0  # Douglas–Peucker dla przebiegu linii


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
        wpis = {"linia": kurs["linia"], "typ": kurs["typ"], "kierunek": pasujace["trip_headsign"].mode().iloc[0],
                "przystanki": list(wzorzec), "czasy": [round((s - kurs["sek"][0]) / 60) for s in kurs["sek"]]}
        if pd.notna(kurs.get("shape_id")):  # kształt z tego samego kursu co czasy; dodaj_przebiegi() go zamienia
            wpis["shape_id"] = kurs["shape_id"]
        wpisy.append(wpis)
    return wpisy


def douglas_peucker(xy, tol, kotwice=()):
    """Indeksy punktów zostawionych przez Douglasa–Peuckera (xy w metrach, odległość od odcinka).
    Końce i kotwice zostają zawsze; każdy kawałek między kotwicami jest upraszczany osobno."""
    zost = np.zeros(len(xy), bool)
    zost[[0, -1]] = True
    zost[np.asarray(kotwice, int)] = True
    granice = np.flatnonzero(zost)
    stos = list(zip(granice[:-1], granice[1:]))
    while stos:
        i, j = stos.pop()
        if j - i < 2:
            continue
        d, w = xy[j] - xy[i], xy[i + 1:j] - xy[i]
        dl2 = d @ d
        t = np.clip(w @ d / dl2, 0, 1) if dl2 > 0 else np.zeros(len(w))
        odl = np.hypot(*(w - t[:, None] * d).T)
        k = int(np.argmax(odl))
        if odl[k] > tol:
            k += i + 1
            zost[k] = True
            stos += [(i, k), (k, j)]
    return np.flatnonzero(zost)


def pozycje(pm, sm):
    """Rzut przystanków na łamaną (obie w metrach) jako pozycja s + t (odcinek s, ułamek t), niemalejąco.
    Programowanie dynamiczne minimalizuje sumę odległości, więc na pętli i krańcówce przystanek nie trafia wstecz.
    Stan to (odcinek, t): na tym samym odcinku co poprzedni przystanek t nie może być mniejsze niż jego t."""
    a, d = pm[:-1], pm[1:] - pm[:-1]
    dl2 = (d ** 2).sum(1)
    w = sm[:, None, :] - a[None]
    t = np.clip((w * d).sum(2) / np.where(dl2 > 0, dl2, 1), 0, 1)  # przystanek x odcinek

    def odl(k, tk):
        return np.hypot(*(w[k] - tk[:, None] * d).T)

    nr, inf = np.arange(len(a)), np.array([np.inf])
    tk, koszt, wstecz, ts = t[0], odl(0, t[0]), [], [t[0]]
    for k in range(1, len(sm)):
        # z odcinka wcześniejszego niż s: najmniejszy koszt przed s (przy remisie najwcześniejszy odcinek)
        przed = np.concatenate([inf, np.minimum.accumulate(koszt)[:-1]])
        gdzie = np.maximum.accumulate(np.where(koszt < przed, nr, 0))
        z_przed = przed + odl(k, t[k])
        # z tego samego odcinka: nie przed poprzednim przystankiem
        t_ten = np.maximum(t[k], tk)
        z_tego = koszt + odl(k, t_ten)
        ten = z_tego < z_przed
        koszt, tk = np.where(ten, z_tego, z_przed), np.where(ten, t_ten, t[k])
        wstecz.append(np.where(ten, nr, np.concatenate([[0], gdzie[:-1]])))
        ts.append(tk)
    seg = [int(np.argmin(koszt))]
    for skad in reversed(wstecz):
        seg.append(int(skad[seg[-1]]))
    seg = np.array(seg[::-1])
    tt, dl = np.array([ts[k][s] for k, s in enumerate(seg)]), np.sqrt(dl2[seg])
    tt = np.where(tt * dl < 0.5, 0, np.where((1 - tt) * dl < 0.5, 1, tt))  # do 0,5 m od wierzchołka: wierzchołek
    return np.maximum.accumulate(seg + tt)


def przebieg(ksztalt, przystanki, tol=TOLERANCJA_M):
    """Kształt kursu i przystanki ([lon, lat]) -> (ksztalt, indeksy). Rzut każdego przystanku wstawiamy jako punkt,
    przycinamy do odcinka od pierwszego do ostatniego przystanku i upraszczamy z tymi punktami jako kotwicami,
    więc ksztalt[indeksy[k]] to punkt przebiegu najbliższy przystankowi k (przy zachowanej kolejności przystanków)."""
    p = np.asarray(ksztalt, float)
    skala = np.array([np.cos(np.radians(p[:, 1].mean())) * 111320, 110540])  # lokalny rzut równoodległościowy
    poz = pozycje(p * skala, np.asarray(przystanki, float) * skala)
    wszystkie = np.unique(np.concatenate([np.arange(len(p)), poz]))
    wszystkie = wszystkie[(wszystkie >= poz[0]) & (wszystkie <= poz[-1])]
    i = np.minimum(wszystkie.astype(int), len(p) - 2)
    punkty = p[i] + (wszystkie - i)[:, None] * (p[i + 1] - p[i])
    kotwice = np.searchsorted(wszystkie, poz)
    zost = douglas_peucker(punkty * skala, tol, kotwice)
    return punkty[zost].round(5).tolist(), np.searchsorted(zost, kotwice).tolist()


def dodaj_przebiegi(wpisy, ksztalty, wsp, tol=TOLERANCJA_M):
    """Zamienia shape_id na ksztalt i indeksy. Bez kształtu wpis zostaje bez nich (klient rysuje po przystankach)."""
    wynik = []
    for w in wpisy:
        w = dict(w)
        p = ksztalty.get(w.pop("shape_id", None))
        if p is not None and len(p) >= 2 and all(x in wsp for x in w["przystanki"]):
            w["ksztalt"], w["indeksy"] = przebieg(p, [wsp[x] for x in w["przystanki"]], tol)
        wynik.append(w)
    return wynik


def przytnij(wpisy, ids):
    """Zostawia tylko przystanki z ids (bbox), czasy liczy od pierwszego z nich; pomija wpisy z < 2 przystankami.
    Kształt przycina do zakresu pozostałych przystanków i liczy indeksy od zera."""
    wynik = []
    for w in wpisy:
        zost = [k for k, p in enumerate(w["przystanki"]) if p in ids]
        if len(zost) < 2:
            continue
        nowy = {**w, "przystanki": [w["przystanki"][k] for k in zost], "czasy": [w["czasy"][k] - w["czasy"][zost[0]] for k in zost]}
        if "ksztalt" in w:
            a, b = w["indeksy"][zost[0]], w["indeksy"][zost[-1]]
            nowy["ksztalt"], nowy["indeksy"] = w["ksztalt"][a:b + 1], [w["indeksy"][k] - a for k in zost]
        wynik.append(nowy)
    return wynik


def main():
    z = zipfile.ZipFile(GTFS)

    def czytaj(plik, **kw):
        return pd.read_csv(z.open(plik), dtype=str, encoding="utf-8-sig", **kw)

    routes = czytaj("routes.txt", usecols=["route_id", "route_short_name", "route_type"])
    routes = routes[routes["route_type"].isin(TYPY)].rename(columns={"route_short_name": "linia"})
    routes["typ"] = routes["route_type"].map(TYPY)
    pola = ["trip_id", "route_id", "direction_id", "trip_headsign", "shape_id"]
    kursy = (czytaj("trips.txt", usecols=lambda c: c in pola).reindex(columns=pola)  # direction_id, shape_id bywają pominięte
             .merge(routes[["route_id", "linia", "typ"]], on="route_id"))
    autobusowe = kursy.loc[kursy["typ"] == "autobus", ["trip_id", "linia"]]
    stops = czytaj("stops.txt", usecols=["stop_id", "stop_name", "stop_code", "stop_lat", "stop_lon"])
    wsp = dict(zip(stops["stop_id"], zip(stops["stop_lon"].astype(float), stops["stop_lat"].astype(float))))

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
    wpisy = wzorce(st, kursy)
    del st

    # shapes.txt ma ok. 45 MB: porcjami, tylko kształty kursów wybranych w wzorce().
    potrzebne, ksztalty = {w["shape_id"] for w in wpisy if "shape_id" in w}, {}
    if "shapes.txt" in z.namelist():
        sh = pd.concat(c[c["shape_id"].isin(potrzebne)] for c in czytaj(
            "shapes.txt", usecols=["shape_id", "shape_pt_sequence", "shape_pt_lat", "shape_pt_lon"], chunksize=500_000))
        sh = sh.astype({"shape_pt_sequence": "int32", "shape_pt_lat": float, "shape_pt_lon": float})
        ksztalty = {sid: g.sort_values("shape_pt_sequence")[["shape_pt_lon", "shape_pt_lat"]].to_numpy()
                    for sid, g in sh.groupby("shape_id")}
    trasy = przytnij(dodaj_przebiegi(wpisy, ksztalty, wsp), set(stops["stop_id"]))
    OUT.mkdir(parents=True, exist_ok=True)
    for plik, dane in (("przystanki.json", przystanki), ("linie.json", trasy)):
        (OUT / plik).write_text(json.dumps(dane, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")

    wersja = czytaj("feed_info.txt")["feed_version"].iloc[0]
    pobrano = datetime.fromtimestamp(GTFS.stat().st_mtime, timezone.utc).astimezone().isoformat(timespec="seconds")
    (OUT / "meta.json").write_text(json.dumps({
        "modul": "transport", "rekordy": len(przystanki) + len(trasy),
        "zrodla": {"gtfs-ztm": {"nazwa": f"GTFS Warszawa (mkuran.pl, wersja {wersja}): przystanki i linie autobusów, tramwajów i metra, "
                                         "źródło nieoficjalne, na podstawie danych ZTM",
                                "licencja": "rozkład: warunki korzystania z danych ZTM Warszawa, przebiegi: ODbL (ZTM Warszawa, Mikołaj Kuranowski, OpenStreetMap contributors)",
                                "url": "https://mkuran.pl/gtfs/", "pobrano": pobrano}},
    }, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    print("przystanki:", len(przystanki), "linie:", dict(Counter(t["typ"] for t in trasy)),
          "z przebiegiem:", sum("ksztalt" in t for t in trasy))


if __name__ == "__main__":
    main()
