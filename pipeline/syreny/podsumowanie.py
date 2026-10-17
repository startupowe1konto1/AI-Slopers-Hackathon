"""Liczby do pitchu i dokumentacji: zasięg syren normalnie i przy blackoucie, dla miasta i dzielnic.

Uruchom po build.py: uv run --project pipeline python pipeline/syreny/podsumowanie.py
Wynik: pipeline/syreny/WYNIKI.md
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd

pct = lambda s: round(100 * float(np.mean(s)), 1)


def _wiersz(g):
    return pd.Series({
        "adresy": len(g),
        "normalnie_65": pct(g.n > 0), "blackout_65": pct(g.b > 0), "blackout_65_dolne": pct(g.b_dolne > 0),
        "traci_zasieg": int(((g.n > 0) & (g.b == 0)).sum()), "traci_zasieg_dolne": int(((g.n > 0) & (g.b_dolne == 0)).sum()),
        "normalnie_75": pct(g.n == 3), "blackout_75": pct(g.b == 3),
    })


def podsumuj(n, b, p, dzielnice):
    """n, b, p jak w syreny.json; dolne oszacowanie = 0 wszędzie, gdzie blackout jest przybliżony (p = 1)."""
    df = pd.DataFrame({"n": [int(c) for c in n], "b": [int(c) for c in b], "p": [c == "1" for c in p], "dzielnica": dzielnice})
    df["b_dolne"] = np.where(df.p, 0, df.b)
    t = df.groupby("dzielnica")[["n", "b", "b_dolne"]].apply(_wiersz)
    t.loc["Warszawa"] = _wiersz(df)
    return t


if __name__ == "__main__":
    ROOT = Path(__file__).resolve().parents[2]
    PACK = ROOT / "public/pack"
    s = json.loads((PACK / "syreny/syreny.json").read_text(encoding="utf-8"))
    a = json.loads((PACK / "adresy/adresy.json").read_text(encoding="utf-8"))
    m = json.loads((PACK / "syreny/meta.json").read_text(encoding="utf-8"))["przyblizenie"]
    t = podsumuj(s["n"], s["b"], s["p"], [a["dzielnice"][i] for i in a["dz"]])
    w = t.loc["Warszawa"]
    dz = t.drop("Warszawa").assign(spadek=lambda x: x.normalnie_65 - x.blackout_65).sort_values("spadek", ascending=False)
    liczba = lambda x: f"{int(x):,}".replace(",", " ")
    proc = lambda x: f"{x:.1f}".replace(".", ",") + "%"
    liczba_d = lambda x, k: f"{x:.{k}f}".replace(".", ",")
    wr = m["wrazliwosc_tylko_cyfrowe"]
    linie = [
        "# Syreny przy blackoucie: liczby do pitchu",
        "",
        "Wygenerowane przez `pipeline/syreny/podsumowanie.py` z paczki `public/pack/syreny`. Dane: KG PSP, SOIA 2026.05; punkty adresowe m.st. Warszawy.",
        "",
        "## Miasto",
        "",
        "| | Adresy ≥ 65 dB | Adresy tracące zasięg | Adresy ≥ 75 dB |",
        "|---|---|---|---|",
        f"| Wszystkie syreny (SOIA) | {proc(w.normalnie_65)} | — | {proc(w.normalnie_75)} |",
        f"| Blackout, przybliżenie (syreny cyfrowe, szacunek z odległości i mocy) | {proc(w.blackout_65)} | {liczba(w.traci_zasieg)} | {proc(w.blackout_75)} |",
        f"| Blackout, dolne oszacowanie (tylko strefy, gdzie SOIA pokazuje syrenę cyfrową) | {proc(w.blackout_65_dolne)} | {liczba(w.traci_zasieg_dolne)} | — |",
        "",
        f"Adresów: {liczba(w.adresy)}. Blackout zakłada, że syreny analogowe nie mają zasilania awaryjnego, a cyfrowe działają.",
        "",
        "## Jak liczymy przybliżenie",
        "",
        "SOIA dzieli miasto według syreny dominującej, czyli najgłośniejszej w danym miejscu. Tam, gdzie dominuje syrena analogowa, "
        "SOIA nie podaje poziomu syreny cyfrowej. Dlatego „dolne oszacowanie” traktuje te miejsca tak, jakby przy blackoucie nie było tam "
        "żadnej syreny. To wariant skrajny.",
        "",
        f"Przybliżenie szacuje poziom najgłośniejszej syreny cyfrowej z odległości i mocy: L = A[moc] − {liczba_d(-m['spadek_db_na_dekade_odleglosci'], 1)}·log10(d) − {liczba_d(m['poprawka_db'], 2)} dB. "
        "Spadek głośności dopasowaliśmy do rastra poziomu dźwięku SOIA w promieniu 50–600 m od syren. Poprawkę dobraliśmy tak, żeby ta sama metoda "
        f"liczona dla wszystkich syren dawała tyle adresów ≥ 65 dB, co SOIA ({proc(100 * m['udzial_65_wszystkie_syreny'])} wobec {proc(w.normalnie_65)}). "
        f"Metoda zgadza się z SOIA co do progu 65 dB na {proc(100 * m['zgodnosc_65_wszystkie_syreny'])} adresów, a co do klasy głośności na {proc(100 * m['zgodnosc_klasy_wszystkie_syreny'])}.",
        "",
        "Ograniczenia:",
        "",
        "- Metoda nie widzi budynków w konkretnym kierunku, uśrednia je.",
        "- Pomija syreny cyfrowe z gmin sąsiednich, bo inwentaryzacja nie ma ich współrzędnych (ostrożnie: zaniża zasięg przy granicach miasta).",
        "- Błąd metody na progu 65 dB (około 4% adresów) jest większy niż różnica między wszystkimi syrenami a samymi cyfrowymi. Liczbę adresów tracących zasięg traktujemy więc jako rząd wielkości.",
        "",
        "Wrażliwość (poprawka ±1 dB):",
        "",
        "| Poprawka | Adresy ≥ 65 dB przy blackoucie | Adresy tracące zasięg |",
        "|---|---|---|",
        *[f"| {liczba_d(x['poprawka_db'], 2)} dB | {proc(100 * x['udzial_65'])} | {liczba(x['traci_zasieg'])} |" for x in wr],
        "",
        "## Dzielnice",
        "",
        "Kolejność: największy spadek udziału adresów ≥ 65 dB przy blackoucie (przybliżenie).",
        "",
        "| Dzielnica | Adresy | ≥ 65 dB normalnie | ≥ 65 dB blackout | ≥ 65 dB blackout, dolne oszacowanie | ≥ 75 dB normalnie | ≥ 75 dB blackout |",
        "|---|---|---|---|---|---|---|",
        *[f"| {d} | {liczba(r.adresy)} | {proc(r.normalnie_65)} | {proc(r.blackout_65)} | {proc(r.blackout_65_dolne)} | {proc(r.normalnie_75)} | {proc(r.blackout_75)} |" for d, r in dz.iterrows()],
        "",
    ]
    (Path(__file__).parent / "WYNIKI.md").write_text("\n".join(linie), encoding="utf-8")
    print("\n".join(linie[:14]))
