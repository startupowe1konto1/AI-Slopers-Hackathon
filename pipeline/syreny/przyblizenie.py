"""Przybliżony poziom syren cyfrowych tam, gdzie SOIA pokazuje syrenę analogową.

SOIA (coverage_ranges, raster winner-siren) dzieli miasto według syreny dominującej, więc poziomu
syreny cyfrowej w strefie syreny analogowej nie ma w danych. Szacujemy go z odległości i klasy mocy
(poziom dźwięku 30 m od syreny, spl30): L = A[klasa] + B * log10(odległość), z jednym spadkiem B dla
wszystkich klas, dopasowanym do rastra poziomu dźwięku SOIA blisko syren. Potem jedna poprawka tak,
żeby ta sama metoda dla wszystkich syren dawała taki udział adresów >= 65 dB jak SOIA.
"""
import numpy as np

MIN_ODLEGLOSC_M = 30.0  # spl30: poziom zmierzony 30 m od syreny; bliżej nie ekstrapolujemy


def klasa_db(L):
    """Kody jak w syreny.json: 3 = >=75 dB, 2 = 70-75, 1 = 65-70, 0 = poniżej 65."""
    return np.select([L >= 75, L >= 70, L >= 65], [3, 2, 1], 0)


def dopasuj_spadek(d, L, klasy):
    """Najmniejsze kwadraty: L = A[klasa] + B * log10(d). Zwraca (B, {klasa: A})."""
    nazwy = sorted(np.unique(klasy))
    X = np.column_stack([np.log10(d)] + [(klasy == k).astype(float) for k in nazwy])
    wsp, *_ = np.linalg.lstsq(X, L, rcond=None)
    return float(wsp[0]), {k: float(a) for k, a in zip(nazwy, wsp[1:])}


def poziom_max(px, py, sx, sy, A, B, porcja=20000):
    """Najwyższy szacowany poziom z syren (sx, sy, A) w punktach (px, py); współrzędne w metrach."""
    wynik = np.full(len(px), -np.inf)
    for i in range(0, len(px), porcja):
        d = np.hypot(px[i:i + porcja, None] - sx[None, :], py[i:i + porcja, None] - sy[None, :])
        wynik[i:i + porcja] = (A[None, :] + B * np.log10(np.maximum(d, MIN_ODLEGLOSC_M))).max(axis=1)
    return wynik


def kalibruj_poprawke(L, wzor, krok=0.05, maks=15.0):
    """Najmniejsza poprawka p (dB), przy której udział L - p >= 65 dB jest najbliższy udziałowi w SOIA."""
    cel = np.mean(wzor > 0)
    poprawki = np.arange(0.0, maks + krok / 2, krok)
    bledy = [abs(np.mean(L - p >= 65) - cel) for p in poprawki]
    return float(poprawki[int(np.argmin(bledy))])
