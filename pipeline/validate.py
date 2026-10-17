import json, sys
from pathlib import Path

LON = (20.85, 21.28)  # bbox Warszawy (SPEC.md §10)
LAT = (52.09, 52.37)


def czytaj(f):
    return json.loads(f.read_text(encoding="utf-8"))


def wspolrzedne(dane):
    """(lon, lat) z pliku paczki: słownik kolumnowy z listami lat/lon albo lista obiektów z lat/lon."""
    if isinstance(dane, dict) and "lat" in dane and "lon" in dane:
        return zip(dane["lon"], dane["lat"])
    if isinstance(dane, list):
        return ((x["lon"], x["lat"]) for x in dane if isinstance(x, dict) and "lat" in x and "lon" in x)
    return ()


def bledy(pack):
    b = []
    wpisy = {p["sciezka"]: p["bajty"] for p in czytaj(pack / "manifest.json")["pliki"]}
    for sciezka, bajty in wpisy.items():
        f = pack / sciezka
        if not f.exists():
            b.append(f"{sciezka}: brak pliku z manifestu")
        elif f.stat().st_size != bajty:
            b.append(f"{sciezka}: rozmiar inny niż w manifeście, uruchom build_manifest.py")
    for katalog in sorted(p for p in pack.iterdir() if p.is_dir()):
        meta = katalog / "meta.json"
        if not meta.exists():
            b.append(f"{katalog.name}: brak meta.json")
        else:
            m = czytaj(meta)
            if not m["zrodla"] or m["rekordy"] <= 0:
                b.append(f"{katalog.name}/meta.json: brak źródła lub rekordów")
        for f in sorted(x for x in katalog.iterdir() if x.is_file()):
            sciezka = f.relative_to(pack).as_posix()
            if sciezka not in wpisy:
                b.append(f"{sciezka}: brak w manifeście, uruchom build_manifest.py")
            if f.suffix == ".json" and f.name != "meta.json":
                poza = sum(1 for lon, lat in wspolrzedne(czytaj(f)) if not (LON[0] <= lon <= LON[1] and LAT[0] <= lat <= LAT[1]))
                if poza:
                    b.append(f"{sciezka}: {poza} punktów poza Warszawą")
    adresy, syreny = pack / "adresy/adresy.json", pack / "syreny/syreny.json"
    if adresy.exists() and syreny.exists():
        n = len(czytaj(adresy)["id"])
        s = czytaj(syreny)
        if not len(s["n"]) == len(s["b"]) == n:
            b.append(f"syreny/syreny.json: {len(s['n'])}/{len(s['b'])} znaków, a adresów jest {n}")
        if set(s["n"] + s["b"]) - set("0123"):
            b.append("syreny/syreny.json: znaki spoza 0-3")
    return b


if __name__ == "__main__":
    wynik = bledy(Path(__file__).resolve().parents[1] / "public/pack")
    print("\n".join(wynik) or "paczka OK")
    sys.exit(1 if wynik else 0)
